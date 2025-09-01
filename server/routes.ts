import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertUserProfileSchema, insertConnectRequestSchema, insertMessageSchema, insertPostSchema, insertEventSchema, insertAdSchema, insertReportSchema, adReservations } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

// Initialize Stripe (only if keys are available)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.get('/api/users/:handle', async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.handle);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information for public profiles
      const { stripeCustomerId, stripeSubscriptionId, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.patch('/api/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertUserProfileSchema.parse(req.body);
      const user = await storage.updateUserProfile(userId, data);
      res.json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Discovery routes
  app.get('/api/discover', async (req, res) => {
    try {
      const { lat, lng, radius = 10, country, city, interests, plan } = req.query;
      
      if (lat && lng) {
        const users = await storage.getUsersNearby(
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseInt(radius as string)
        );
        return res.json(users);
      }

      if (country || city || interests) {
        const query = [country, city, interests].filter(Boolean).join(' ');
        const users = await storage.searchUsers(query);
        return res.json(users);
      }

      res.json([]);
    } catch (error) {
      console.error("Error in discovery:", error);
      res.status(500).json({ message: "Failed to discover users" });
    }
  });

  // Connect request routes
  app.post('/api/connect/:toUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { toUserId } = req.params;
      const data = insertConnectRequestSchema.parse({ toUserId, ...req.body });
      
      // Check if request already exists
      const existing = await storage.getConnectRequest(userId, toUserId);
      if (existing) {
        return res.status(400).json({ message: "Connect request already exists" });
      }
      
      const request = await storage.createConnectRequest({
        fromUserId: userId,
        ...data
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "connect_request_sent",
        targetType: "user",
        targetId: toUserId,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(request);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating connect request:", error);
      res.status(500).json({ message: "Failed to send connect request" });
    }
  });

  app.patch('/api/connect/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { requestId } = req.params;
      const { status } = req.body;
      
      const request = await storage.updateConnectRequestStatus(requestId, status);
      
      // If accepted, create follow relationship
      if (status === 'accepted') {
        await storage.createFollow(request.fromUserId!, request.toUserId!);
        await storage.createFollow(request.toUserId!, request.fromUserId!);
      }
      
      await storage.createAuditLog({
        actorId: userId,
        action: `connect_request_${status}`,
        targetType: "connect_request",
        targetId: requestId,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(request);
    } catch (error) {
      console.error("Error updating connect request:", error);
      res.status(500).json({ message: "Failed to update connect request" });
    }
  });

  app.get('/api/connect-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type = 'received' } = req.query;
      const requests = await storage.getUserConnectRequests(userId, type as 'sent' | 'received');
      res.json(requests);
    } catch (error) {
      console.error("Error fetching connect requests:", error);
      res.status(500).json({ message: "Failed to fetch connect requests" });
    }
  });

  // Messaging routes
  app.get('/api/messages/:threadId', isAuthenticated, async (req: any, res) => {
    try {
      const { threadId } = req.params;
      const messages = await storage.getThreadMessages(threadId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages/:threadId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { threadId } = req.params;
      const data = insertMessageSchema.parse({ threadId, ...req.body });
      
      const message = await storage.createMessage({
        fromUserId: userId,
        ...data
      });
      
      res.json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Feed routes
  app.get('/api/feed', async (req, res) => {
    try {
      const { tab = 'global', country, limit = 20 } = req.query;
      const posts = await storage.getFeedPosts(
        tab as 'global' | 'country' | 'following',
        undefined,
        country as string,
        parseInt(limit as string)
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertPostSchema.parse(req.body);
      
      const post = await storage.createPost({
        userId,
        ...data
      });
      
      res.json(post);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertEventSchema.parse(req.body);
      
      const event = await storage.createEvent({
        hostId: userId,
        ...data
      });
      
      res.json(event);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.post('/api/events/:id/rsvp', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      const rsvp = await storage.createEventRsvp(id, userId, status);
      res.json(rsvp);
    } catch (error) {
      console.error("Error creating RSVP:", error);
      res.status(500).json({ message: "Failed to RSVP" });
    }
  });

  // Ad marketplace routes
  app.get('/api/ads', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.plan !== 'creator') {
        return res.status(403).json({ message: "Creator plan required" });
      }
      
      const ads = await storage.getAds();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  app.post('/api/ads/:id/reserve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const user = await storage.getUser(userId);
      if (user?.plan !== 'creator') {
        return res.status(403).json({ message: "Creator plan required" });
      }
      
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
      const reservation = await storage.createAdReservation(id, userId, expiresAt);
      
      await storage.createAuditLog({
        actorId: userId,
        action: "ad_reserved",
        targetType: "ad",
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(reservation);
    } catch (error) {
      console.error("Error reserving ad:", error);
      res.status(500).json({ message: "Failed to reserve ad" });
    }
  });

  app.post('/api/ads/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { postId, rawFileUrl } = req.body;
      
      // Find active reservation
      const reservations = await storage.getUserActiveReservations(userId);
      const reservation = reservations.find(r => r.adId === id);
      
      if (!reservation) {
        return res.status(400).json({ message: "No active reservation found" });
      }
      
      const submission = await storage.createAdSubmission({
        reservationId: reservation.id,
        postId,
        rawFileUrl
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "ad_submitted",
        targetType: "ad_submission",
        targetId: submission.id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(submission);
    } catch (error) {
      console.error("Error submitting ad:", error);
      res.status(500).json({ message: "Failed to submit ad" });
    }
  });

  // Object storage routes
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/media", isAuthenticated, async (req: any, res) => {
    if (!req.body.mediaUrl) {
      return res.status(400).json({ error: "mediaUrl is required" });
    }

    const userId = req.user?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.mediaUrl,
        {
          owner: userId,
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting media:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Billing routes
  app.post('/api/billing/checkout', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const userId = req.user.claims.sub;
      const { plan } = req.body;
      
      if (!['traveler', 'creator'].includes(plan)) {
        return res.status(400).json({ message: "Invalid plan" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: user.displayName || user.username,
          metadata: { userId }
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }

      // Create checkout session
      const priceId = plan === 'traveler' 
        ? process.env.STRIPE_TRAVELER_PRICE_ID 
        : process.env.STRIPE_CREATOR_PRICE_ID;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/billing?success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/billing?cancelled=true`,
        metadata: { userId, plan }
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Webhook for Stripe
  app.post('/api/billing/webhooks/stripe', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const sig = req.headers['stripe-signature'];
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as any;
          const userId = session.metadata.userId;
          const plan = session.metadata.plan;
          
          await storage.updateUserProfile(userId, { plan });
          await storage.createSubscription({
            userId,
            plan,
            provider: 'stripe',
            providerSubscriptionId: session.subscription,
            status: 'active',
            startedAt: new Date(),
          });
          
          // Create wallet if creator
          if (plan === 'creator') {
            const existing = await storage.getWallet(userId);
            if (!existing) {
              await storage.createWallet(userId);
            }
          }
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  // Wallet routes
  app.get('/api/wallet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallet = await storage.getWallet(userId);
      const payouts = await storage.getUserPayouts(userId);
      
      res.json({ wallet, payouts });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.post('/api/wallet/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amountMinor, method = 'stripe' } = req.body;
      
      const wallet = await storage.getWallet(userId);
      if (!wallet || (wallet.balanceMinor || 0) < amountMinor) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const payout = await storage.createPayout({
        userId,
        amountMinor,
        method
      });
      
      // Deduct from wallet
      await storage.updateWalletBalance(userId, -amountMinor);
      
      await storage.createAuditLog({
        actorId: userId,
        action: "payout_requested",
        targetType: "payout",
        targetId: payout.id,
        metaJson: { amountMinor, method },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(payout);
    } catch (error) {
      console.error("Error creating payout:", error);
      res.status(500).json({ message: "Failed to create payout" });
    }
  });

  // Reports
  app.post('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertReportSchema.parse(req.body);
      
      const report = await storage.createReport({
        reporterId: userId,
        ...data
      });
      
      res.json(report);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Admin routes
  app.get('/api/admin/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!['admin', 'superadmin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Return dashboard stats
      res.json({
        totalUsers: 0, // Implement actual counts
        totalPosts: 0,
        pendingReports: 0,
        pendingSubmissions: 0,
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  });

  app.get('/api/admin/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!['admin', 'superadmin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const submissions = await storage.getAdSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post('/api/admin/submissions/:id/review', isAuthenticated, async (req: any, res) => {
    try {
      const reviewerId = req.user.claims.sub;
      const user = await storage.getUser(reviewerId);
      if (!['admin', 'superadmin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { status, notes } = req.body; // approve or reject
      
      const submission = await storage.updateAdSubmissionStatus(id, status, reviewerId, notes);
      
      // If approved, add funds to creator's wallet
      if (status === 'approved' && submission.reservationId) {
        const reservation = await db.query.adReservations.findFirst({
          where: eq(adReservations.id, submission.reservationId),
          with: { ad: true }
        });
        
        if (reservation?.ad) {
          await storage.updateWalletBalance(
            reservation.userId!, 
            Math.round(parseFloat(reservation.ad.payoutAmount) * 100)
          );
        }
      }
      
      await storage.createAuditLog({
        actorId: reviewerId,
        action: `ad_submission_${status}`,
        targetType: "ad_submission",
        targetId: id,
        metaJson: { notes },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(submission);
    } catch (error) {
      console.error("Error reviewing submission:", error);
      res.status(500).json({ message: "Failed to review submission" });
    }
  });

  app.post('/api/admin/ads', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const data = insertAdSchema.parse(req.body);
      const ad = await storage.createAd(data);
      
      res.json(ad);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating ad:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle different message types
        switch (message.type) {
          case 'join_thread':
            // Join a message thread room
            ws.on('close', () => {
              console.log('WebSocket connection closed');
            });
            break;
          case 'send_message':
            // Broadcast message to thread participants
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'new_message',
                  threadId: message.threadId,
                  message: message.data
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
