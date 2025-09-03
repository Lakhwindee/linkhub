import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertUserProfileSchema, insertConnectRequestSchema, insertMessageSchema, insertPostSchema, insertEventSchema, insertAdSchema, insertReportSchema, insertStaySchema, insertStayBookingSchema, insertStayReviewSchema, adReservations } from "@shared/schema";
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

  // Config routes
  app.get('/api/config/maps-key', async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(404).json({ message: "Google Maps API key not configured" });
      }
      res.json({ apiKey });
    } catch (error) {
      console.error("Error fetching Google Maps API key:", error);
      res.status(500).json({ message: "Failed to fetch API configuration" });
    }
  });

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
      console.log('Discovery API called with params:', { country, city, lat, lng });
      
      // Always return test users for now (demo purposes)
      const users = await storage.getUsersNearby(0, 0, 100);
      console.log('Users from storage:', users.length);
      
      // Filter by country if specified
      let filteredUsers = users;
      if (country && country !== 'all') {
        filteredUsers = users.filter(user => 
          user.country?.toLowerCase().includes(country.toString().toLowerCase()) ||
          (country === 'KR' && user.country === 'South Korea') ||
          (country === 'GB' && user.country === 'United Kingdom') ||
          (country === 'US' && user.country === 'United States')
        );
        console.log('Filtered by country:', filteredUsers.length);
      }
      
      // Filter by city if specified
      if (city && city !== 'all') {
        filteredUsers = filteredUsers.filter(user => 
          user.city?.toLowerCase().includes(city.toString().toLowerCase())
        );
        console.log('Filtered by city:', filteredUsers.length);
      }
      
      console.log('Final result:', filteredUsers.length);
      res.json(filteredUsers);
    } catch (error) {
      console.error("Error in discovery:", error);
      res.status(500).json({ message: "Failed to discover users" });
    }
  });

  // User search route
  app.get('/api/users/search', async (req, res) => {
    try {
      const { q: query } = req.query;
      
      if (!query || query.length < 1) {
        return res.json([]);
      }
      
      // Search users by username, displayName, or first name
      const users = await storage.searchUsers(query.toString());
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
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
      
      // Skip audit log for demo users to avoid foreign key constraints
      const isDemoUser = userId === 'demo-user-1' || userId?.startsWith('test-user-');
      if (!isDemoUser) {
        await storage.createAuditLog({
          actorId: userId,
          action: "connect_request_sent",
          targetType: "user",
          targetId: toUserId,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }
      
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
      
      console.log('Connect request update:', { userId, requestId, status });
      
      // Validate request
      if (!requestId || !status) {
        return res.status(400).json({ message: "Missing requestId or status" });
      }
      
      if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'declined'" });
      }
      
      const request = await storage.updateConnectRequestStatus(requestId, status);
      console.log('Updated request:', request);
      
      // If accepted, create follow relationship and conversation
      if (status === 'accepted') {
        // Skip follow creation for demo users to avoid foreign key constraints
        const isDemoRequest = request.fromUserId?.startsWith('test-user-') || 
                             request.toUserId?.startsWith('test-user-') ||
                             request.fromUserId === 'demo-user-1' ||
                             request.toUserId === 'demo-user-1';
        
        if (!isDemoRequest) {
          await storage.createFollow(request.fromUserId!, request.toUserId!);
          await storage.createFollow(request.toUserId!, request.fromUserId!);
        }
        
        // Always create conversation for messaging (even for demo users)
        await storage.createConversation({
          user1Id: request.fromUserId!,
          user2Id: request.toUserId!,
        });
      }
      
      // Skip audit log for demo users to avoid foreign key constraints  
      const isDemoUser = userId === 'demo-user-1' || userId?.startsWith('test-user-');
      if (!isDemoUser) {
        await storage.createAuditLog({
          actorId: userId,
          action: `connect_request_${status}`,
          targetType: "connect_request",
          targetId: requestId,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }
      
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

  // Follow/unfollow routes
  app.post('/api/follow/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const { userId: followeeId } = req.params;
      
      if (followerId === followeeId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      // Check if already following
      const alreadyFollowing = await storage.isFollowing(followerId, followeeId);
      if (alreadyFollowing) {
        return res.status(400).json({ message: "Already following this user" });
      }
      
      await storage.createFollow(followerId, followeeId);
      res.json({ message: "Successfully followed user", isFollowing: true });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/follow/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const { userId: followeeId } = req.params;
      
      await storage.removeFollow(followerId, followeeId);
      res.json({ message: "Successfully unfollowed user", isFollowing: false });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/follow/status/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const { userId: followeeId } = req.params;
      
      const isFollowing = await storage.isFollowing(followerId, followeeId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.get('/api/followers/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get('/api/following/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // Conversations routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Messaging routes
  app.get('/api/messages/:conversationId', isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages/:conversationId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId } = req.params;
      const data = insertMessageSchema.parse({ conversationId, ...req.body });
      
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
  app.get('/api/feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tab = 'global', country, limit = 20 } = req.query;
      const posts = await storage.getFeedPosts(
        tab as 'global' | 'country' | 'following',
        userId, // Pass userId for following tab
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

  // Stays routes
  app.get('/api/stays', async (req, res) => {
    try {
      const { country, city, type, minPrice, maxPrice, guests = 1, limit = 20 } = req.query;
      const stays = await storage.getStays({
        country: country as string,
        city: city as string,
        type: type as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        guests: parseInt(guests as string),
        limit: parseInt(limit as string)
      });
      res.json(stays);
    } catch (error) {
      console.error("Error fetching stays:", error);
      res.status(500).json({ message: "Failed to fetch stays" });
    }
  });

  app.get('/api/stays/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const stay = await storage.getStayById(id);
      if (!stay) {
        return res.status(404).json({ message: "Stay not found" });
      }
      
      // Get reviews for this stay
      const reviews = await storage.getStayReviews(id);
      res.json({ ...stay, reviews });
    } catch (error) {
      console.error("Error fetching stay:", error);
      res.status(500).json({ message: "Failed to fetch stay" });
    }
  });

  app.post('/api/stays', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertStaySchema.parse(req.body);
      
      const stay = await storage.createStay({
        hostId: userId,
        ...data
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "stay_created",
        targetType: "stay",
        targetId: stay.id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(stay);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating stay:", error);
      res.status(500).json({ message: "Failed to create stay" });
    }
  });

  app.put('/api/stays/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const data = insertStaySchema.parse(req.body);
      
      // Check if user owns this stay
      const stay = await storage.getStayById(id);
      if (!stay || stay.hostId !== userId) {
        return res.status(403).json({ message: "You can only edit your own stays" });
      }
      
      const updatedStay = await storage.updateStay(id, data);
      
      await storage.createAuditLog({
        actorId: userId,
        action: "stay_updated",
        targetType: "stay",
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(updatedStay);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating stay:", error);
      res.status(500).json({ message: "Failed to update stay" });
    }
  });

  app.delete('/api/stays/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Check if user owns this stay
      const stay = await storage.getStayById(id);
      if (!stay || stay.hostId !== userId) {
        return res.status(403).json({ message: "You can only delete your own stays" });
      }
      
      await storage.deleteStay(id);
      
      await storage.createAuditLog({
        actorId: userId,
        action: "stay_deleted",
        targetType: "stay",
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ message: "Stay deleted successfully" });
    } catch (error) {
      console.error("Error deleting stay:", error);
      res.status(500).json({ message: "Failed to delete stay" });
    }
  });

  app.post('/api/stays/:id/book', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const data = insertStayBookingSchema.parse({ ...req.body, stayId: id });
      
      // Check if stay exists and is available
      const stay = await storage.getStayById(id);
      if (!stay) {
        return res.status(404).json({ message: "Stay not found" });
      }
      
      if (stay.status !== 'active') {
        return res.status(400).json({ message: "Stay is not available for booking" });
      }
      
      // Calculate total price
      const checkIn = new Date(data.checkInDate!);
      const checkOut = new Date(data.checkOutDate!);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = (parseFloat(stay.pricePerNight) * nights).toString();
      
      const booking = await storage.createStayBooking({
        guestId: userId,
        totalPrice,
        currency: stay.currency,
        ...data
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "stay_booked",
        targetType: "stay_booking",
        targetId: booking.id,
        metaJson: { stayId: id, nights, totalPrice },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error booking stay:", error);
      res.status(500).json({ message: "Failed to book stay" });
    }
  });

  app.get('/api/stays/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type = 'guest' } = req.query;
      
      let bookings;
      if (type === 'host') {
        bookings = await storage.getHostBookings(userId);
      } else {
        bookings = await storage.getUserBookings(userId);
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.patch('/api/stays/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const booking = await storage.updateStayBookingStatus(id, status);
      
      await storage.createAuditLog({
        actorId: userId,
        action: `booking_${status}`,
        targetType: "stay_booking",
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.post('/api/stays/:id/review', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const data = insertStayReviewSchema.parse({ ...req.body, stayId: id });
      
      // Check if user has a completed booking for this stay
      const userBookings = await storage.getUserBookings(userId);
      const completedBooking = userBookings.find(booking => 
        booking.stayId === id && booking.status === 'completed'
      );
      
      if (!completedBooking) {
        return res.status(400).json({ message: "You can only review stays you have completed" });
      }
      
      const review = await storage.createStayReview({
        reviewerId: userId,
        bookingId: completedBooking.id,
        ...data
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "stay_reviewed",
        targetType: "stay_review",
        targetId: review.id,
        metaJson: { stayId: id, rating: data.rating },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(review);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get('/api/my-stays', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stays = await storage.getUserStays(userId);
      res.json(stays);
    } catch (error) {
      console.error("Error fetching user stays:", error);
      res.status(500).json({ message: "Failed to fetch your stays" });
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
      
      const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days
      const reservation = await storage.createAdReservation(id, userId, expiresAt);
      
      // Skip audit log for demo users to avoid foreign key constraint error
      if (userId !== 'demo-user-1') {
        await storage.createAuditLog({
          actorId: userId,
          action: "ad_reserved",
          targetType: "ad",
          targetId: id,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }
      
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

  // Trips routes
  app.get('/api/trips', async (req, res) => {
    try {
      const { country, city, travelStyle, budget, tags, limit } = req.query;
      
      const filters = {
        country: country as string,
        city: city as string,
        travelStyle: travelStyle as string,
        budget: budget as string,
        tags: tags ? (tags as string).split(',') : undefined,
        limit: limit ? Number(limit) : undefined
      };

      const trips = await storage.getTrips(filters);
      res.json(trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).json({ message: 'Failed to fetch trips' });
    }
  });

  app.get('/api/trips/:id', async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      res.json(trip);
    } catch (error) {
      console.error('Error fetching trip:', error);
      res.status(500).json({ message: 'Failed to fetch trip' });
    }
  });

  app.post('/api/trips', isAuthenticated, async (req: any, res) => {
    try {
      const tripData = { ...req.body, organizerId: req.user.claims.sub };
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error) {
      console.error('Error creating trip:', error);
      res.status(500).json({ message: 'Failed to create trip' });
    }
  });

  app.post('/api/trips/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const { message } = req.body;
      const participant = await storage.joinTrip(req.params.id, req.user.claims.sub, message);
      res.json(participant);
    } catch (error) {
      console.error('Error joining trip:', error);
      res.status(500).json({ message: 'Failed to join trip' });
    }
  });

  app.delete('/api/trips/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      await storage.leaveTrip(req.params.id, req.user.claims.sub);
      res.json({ success: true });
    } catch (error) {
      console.error('Error leaving trip:', error);
      res.status(500).json({ message: 'Failed to leave trip' });
    }
  });

  app.get('/api/trips/:id/participants', async (req, res) => {
    try {
      const participants = await storage.getTripParticipants(req.params.id);
      res.json(participants);
    } catch (error) {
      console.error('Error fetching trip participants:', error);
      res.status(500).json({ message: 'Failed to fetch participants' });
    }
  });

  app.get('/api/users/:userId/trips', async (req, res) => {
    try {
      const { type = 'all' } = req.query;
      const trips = await storage.getUserTrips(req.params.userId, type as 'organized' | 'joined' | 'all');
      res.json(trips);
    } catch (error) {
      console.error('Error fetching user trips:', error);
      res.status(500).json({ message: 'Failed to fetch user trips' });
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
          case 'join_conversation':
            // Join a conversation room
            ws.on('close', () => {
              console.log('WebSocket connection closed');
            });
            break;
          case 'send_message':
            // Broadcast message to conversation participants
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'new_message',
                  conversationId: message.conversationId,
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
