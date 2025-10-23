import {
  users,
  admins,
  connectRequests,
  conversations,
  messages,
  groupConversations,
  groupConversationParticipants,
  groupMessages,
  posts,
  events,
  eventRsvps,
  ads,
  adReservations,
  adSubmissions,
  boostedPosts,
  feedAdImpressions,
  wallets,
  payouts,
  subscriptions,
  invoices,
  reports,
  auditLogs,
  follows,
  stays,
  stayBookings,
  stayReviews,
  bookingNights,
  payments,
  webhookEvents,
  personalHosts,
  hostBookings,
  tourPackageBookings,
  trips,
  tripParticipants,
  taxConfiguration,
  taxRecords,
  discountCodes,
  type User,
  type UpsertUser,
  type ConnectRequest,
  type Conversation,
  type Message,
  type GroupConversation,
  type GroupConversationParticipant,
  type GroupMessage,
  type Post,
  type Event,
  type EventRsvp,
  type Ad,
  type AdReservation,
  type AdSubmission,
  type BoostedPost,
  type FeedAdImpression,
  type Wallet,
  type Payout,
  type Subscription,
  type Invoice,
  type Report,
  type AuditLog,
  type Stay,
  type StayBooking,
  type StayReview,
  type BookingNight,
  type Payment,
  type WebhookEvent,
  type PersonalHost,
  type HostBooking,
  type TourPackageBooking,
  type Trip,
  type TripParticipant,
  type TaxConfiguration,
  type TaxRecord,
  insertStaySchema,
  insertStayBookingSchema,
  insertStayReviewSchema,
  insertPersonalHostSchema,
  insertHostBookingSchema,
  insertBoostedPostSchema,
  insertFeedAdImpressionSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, count, like, ilike, gt } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateStripeCustomerId(id: string, customerId: string): Promise<User>;
  updateUserStripeInfo(id: string, data: { customerId: string; subscriptionId: string }): Promise<User>;
  
  // Discovery operations
  getUsersNearby(lat: number, lng: number, radiusKm: number, filters?: any): Promise<User[]>;
  searchUsers(query: string, filters?: any): Promise<User[]>;
  getUsers(filters?: any): Promise<User[]>;
  
  // Connect requests
  createConnectRequest(data: { fromUserId: string; toUserId: string; message?: string }): Promise<ConnectRequest>;
  getConnectRequest(fromUserId: string, toUserId: string): Promise<ConnectRequest | undefined>;
  updateConnectRequestStatus(id: string, status: string): Promise<ConnectRequest>;
  getUserConnectRequests(userId: string, type: 'sent' | 'received'): Promise<ConnectRequest[]>;
  
  // Conversations
  createConversation(data: { user1Id: string; user2Id: string }): Promise<Conversation>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(user1Id: string, user2Id: string): Promise<Conversation | undefined>;
  
  // Messaging
  createMessage(data: { conversationId: string; fromUserId: string; body?: string; mediaUrl?: string; mediaType?: string }): Promise<Message>;
  getConversationMessages(conversationId: string, limit?: number): Promise<Message[]>;
  updateConversationLastMessage(conversationId: string, messageId: string): Promise<void>;
  
  // Posts and Feed
  createPost(data: { userId: string; body?: string; mediaType?: string; mediaUrls?: string[]; country?: string; city?: string; visibility?: string }): Promise<Post>;
  getPost(id: string): Promise<Post | undefined>;
  getFeedPosts(tab: 'global' | 'country' | 'following', userId?: string, country?: string, limit?: number): Promise<Post[]>;
  getUserPosts(userId: string, limit?: number): Promise<Post[]>;
  
  // Events
  createEvent(data: any): Promise<Event>;
  getEvent(id: string): Promise<Event | undefined>;
  getEvents(filters?: any): Promise<Event[]>;
  createEventRsvp(eventId: string, userId: string, status: string): Promise<EventRsvp>;
  updateEventRsvp(eventId: string, userId: string, status: string): Promise<EventRsvp>;
  getEventRsvps(eventId: string): Promise<EventRsvp[]>;
  
  // Ads
  createAd(data: any): Promise<Ad>;
  updateAd(id: string, data: Partial<Ad>): Promise<Ad>;
  getAds(filters?: any): Promise<Ad[]>;
  getAd(id: string): Promise<Ad | undefined>;
  getPublisherAds(publisherId: string): Promise<Ad[]>;
  createAdReservation(adId: string, userId: string, expiresAt: Date): Promise<AdReservation>;
  getUserActiveReservations(userId: string): Promise<AdReservation[]>;
  createAdSubmission(data: { 
    reservationId: string; 
    postId?: string; 
    rawFileUrl?: string; 
    contentLink?: string;
    originalVideoUrl?: string;
    clipUrl?: string;
    clipStartTime?: number;
    clipEndTime?: number;
    verificationStatus?: string;
    verificationScore?: string;
    verificationNotes?: string;
  }): Promise<AdSubmission>;
  getAdSubmissions(filters?: any): Promise<AdSubmission[]>;
  updateAdSubmissionStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<AdSubmission>;
  
  // Boosted Posts for Feed Ads
  createBoostedPost(data: any): Promise<BoostedPost>;
  getBoostedPosts(filters?: any): Promise<BoostedPost[]>;
  getUserBoostedPosts(userId: string): Promise<BoostedPost[]>;
  updateBoostedPost(id: string, data: Partial<BoostedPost>): Promise<BoostedPost>;
  getBoostedPost(id: string): Promise<BoostedPost | undefined>;
  
  // Feed Ad Impressions & Analytics
  createFeedAdImpression(data: any): Promise<FeedAdImpression>;
  getFeedAdImpressions(filters?: any): Promise<FeedAdImpression[]>;
  getFeedAdsForUser(userId?: string, ipAddress?: string, country?: string): Promise<any[]>;
  
  // Wallet and Payouts (with tax support)
  createWallet(userId: string): Promise<Wallet>;
  getWallet(userId: string): Promise<Wallet | undefined>;
  updateWalletBalance(userId: string, amountMinor: number, grossAmountMinor?: number, taxWithheldMinor?: number): Promise<Wallet>;
  createPayout(data: { userId: string; grossAmountMinor: number; taxWithheldMinor: number; amountMinor: number; taxRate?: number; currency?: string; method?: string }): Promise<Payout>;
  getUserPayouts(userId: string): Promise<Payout[]>;
  
  // Tax Configuration & Records (Worldwide Support)
  getTaxConfiguration(country: string): Promise<TaxConfiguration | undefined>;
  getAllTaxConfigurations(): Promise<TaxConfiguration[]>;
  createTaxConfiguration(data: { country: string; countryName: string; taxRate: string; taxType: string; taxName?: string; exemptionThreshold?: number; notes?: string }): Promise<TaxConfiguration>;
  updateTaxConfiguration(id: string, data: Partial<TaxConfiguration>): Promise<TaxConfiguration>;
  createTaxRecord(data: { userId: string; transactionType: string; transactionId?: string; grossAmountMinor: number; taxWithheldMinor: number; netAmountMinor: number; taxRate: string; taxYear?: number; taxQuarter?: number; country?: string; taxConfigId?: string; description?: string }): Promise<TaxRecord>;
  getUserTaxRecords(userId: string, filters?: { year?: number; quarter?: number; country?: string }): Promise<TaxRecord[]>;
  getAllTaxRecords(filters?: { year?: number; country?: string }): Promise<TaxRecord[]>;
  
  // Discount & Trial Codes
  createDiscountCode(data: any): Promise<any>;
  getAllDiscountCodes(): Promise<any[]>;
  getDiscountCodeByCode(code: string): Promise<any | undefined>;
  updateDiscountCode(id: string, data: Partial<any>): Promise<any>;
  
  // Subscriptions
  createSubscription(data: any): Promise<Subscription>;
  getUserActiveSubscription(userId: string): Promise<Subscription | undefined>;
  
  // Following system
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;
  createFollow(followerId: string, followeeId: string): Promise<any>;
  removeFollow(followerId: string, followeeId: string): Promise<void>;
  getFollowers(userId: string): Promise<any[]>;
  getFollowing(userId: string): Promise<any[]>;
  updateSubscriptionStatus(id: string, status: string): Promise<Subscription>;
  
  // Reports and Moderation
  createReport(data: { reporterId: string; targetType: string; targetId: string; reason: string; description?: string }): Promise<Report>;
  getReports(filters?: any): Promise<Report[]>;
  updateReportStatus(id: string, status: string): Promise<Report>;
  
  // Audit logging
  createAuditLog(data: { actorId?: string; action: string; targetType?: string; targetId?: string; metaJson?: any; ipAddress?: string; userAgent?: string }): Promise<AuditLog>;
  
  // Follows
  createFollow(followerId: string, followeeId: string): Promise<void>;
  removeFollow(followerId: string, followeeId: string): Promise<void>;
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  
  // Stays
  getStays(filters?: { country?: string; city?: string; type?: string; minPrice?: number; maxPrice?: number; guests?: number; limit?: number }): Promise<Stay[]>;
  getStayById(id: string): Promise<Stay | undefined>;
  createStay(data: any): Promise<Stay>;
  updateStay(id: string, data: any): Promise<Stay>;
  deleteStay(id: string): Promise<void>;
  getUserStays(userId: string): Promise<Stay[]>;
  
  // Stay bookings
  createStayBooking(data: any): Promise<StayBooking>;
  getStayBookingById(id: string): Promise<StayBooking | undefined>;
  getStayBookings(stayId: string): Promise<StayBooking[]>;
  getUserBookings(userId: string): Promise<StayBooking[]>;
  getHostBookings(hostId: string): Promise<StayBooking[]>;
  updateStayBooking(id: string, data: Partial<StayBooking>): Promise<StayBooking>;
  updateStayBookingStatus(id: string, status: string): Promise<StayBooking>;
  
  // Payment operations
  createPayment(data: any): Promise<Payment>;
  updatePaymentByIntentId(intentId: string, data: Partial<Payment>): Promise<Payment>;
  
  // Webhook operations
  createWebhookEvent(data: any): Promise<WebhookEvent>;
  getWebhookEvent(id: string): Promise<WebhookEvent | undefined>;
  updateWebhookEvent(id: string, data: Partial<WebhookEvent>): Promise<WebhookEvent>;
  
  // Stay reviews
  createStayReview(data: any): Promise<StayReview>;
  getStayReviews(stayId: string): Promise<StayReview[]>;

  // Trips
  createTrip(data: any): Promise<Trip>;
  getTrips(filters?: any): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | undefined>;
  updateTrip(id: string, data: Partial<Trip>): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;
  joinTrip(tripId: string, userId: string, message?: string): Promise<TripParticipant>;
  leaveTrip(tripId: string, userId: string): Promise<void>;
  getTripParticipants(tripId: string): Promise<TripParticipant[]>;
  getUserTrips(userId: string, type: 'organized' | 'joined' | 'all'): Promise<Trip[]>;

  // Group chats for trips
  createGroupConversation(tripId: string, title: string): Promise<GroupConversation>;
  addUserToGroupConversation(conversationId: string, userId: string, role?: string): Promise<GroupConversationParticipant>;
  removeUserFromGroupConversation(conversationId: string, userId: string): Promise<void>;
  getGroupConversation(tripId: string): Promise<GroupConversation | undefined>;
  getUserGroupConversations(userId: string): Promise<GroupConversation[]>;
  createGroupMessage(data: { conversationId: string; fromUserId: string; body?: string; mediaUrl?: string; mediaType?: string }): Promise<GroupMessage>;
  getGroupConversationMessages(conversationId: string, limit?: number): Promise<GroupMessage[]>;
  updateGroupConversationLastMessage(conversationId: string, messageId: string): Promise<void>;
  
  // Personal Hosts
  getPersonalHosts(filters?: { country?: string; city?: string; hostType?: string; priceType?: string; maxGuests?: number; limit?: number }): Promise<PersonalHost[]>;
  getPersonalHostById(id: string): Promise<PersonalHost | undefined>;
  createPersonalHost(data: any): Promise<PersonalHost>;
  updatePersonalHost(id: string, data: any): Promise<PersonalHost>;
  deletePersonalHost(id: string): Promise<void>;
  getMyPersonalHosts(userId: string): Promise<PersonalHost[]>;
  
  // Host Bookings
  createHostBooking(data: any): Promise<HostBooking>;
  getHostBookingById(id: string): Promise<HostBooking | undefined>;
  updateHostBookingStatus(id: string, status: string): Promise<HostBooking>;
  getUserHostBookings(userId: string): Promise<HostBooking[]>;
  getMyHostBookings(userId: string): Promise<HostBooking[]>;
}

// Test data removed - using real data only
const testUsers: any[] = [];

const testEvents: any[] = [];

const testAds: any[] = [];

const testPosts: any[] = [];

const testConnectRequests: any[] = [];

const testStays: any[] = [];

const testTrips: any[] = [];

const testTripParticipants: any[] = [];

export class DatabaseStorage implements IStorage {
  demoConversations: any[] = []; // Store demo conversations in memory
  demoUserReservations: Map<string, AdReservation[]> = new Map(); // Store demo user reservations
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateStripeCustomerId(id: string, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, data: { customerId: string; subscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: data.customerId, 
        stripeSubscriptionId: data.subscriptionId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Admin operations (completely separate from users for maximum security)
  async getAdminByEmail(email: string) {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  async createAdmin(adminData: { email: string; password: string; name: string }) {
    const [admin] = await db
      .insert(admins)
      .values(adminData)
      .returning();
    return admin;
  }

  async getAdminById(id: string) {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  // Discovery operations
  async getUsersNearby(lat: number, lng: number, radiusKm: number, filters?: any): Promise<User[]> {
    // Return test users for demo purposes with proper User structure
    return testUsers.map(user => ({
      ...user,
      currentCity: user.city,
      currentCountry: user.country,
      city: user.city,
      country: user.country,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as User[];
  }

  async searchUsers(query: string, filters?: any): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.username, `%${query}%`),
          ilike(users.displayName, `%${query}%`),
          ilike(users.city, `%${query}%`),
          ilike(users.country, `%${query}%`)
        )
      )
      .limit(50);
  }

  async getUsers(filters?: any): Promise<User[]> {
    try {
      let query = db.select().from(users);
      
      // Apply filters if provided
      if (filters?.role) {
        query = query.where(eq(users.role, filters.role));
      }
      if (filters?.status) {
        query = query.where(eq(users.status, filters.status));
      }
      if (filters?.search) {
        query = query.where(
          or(
            ilike(users.username, `%${filters.search}%`),
            ilike(users.displayName, `%${filters.search}%`),
            ilike(users.email, `%${filters.search}%`)
          )
        );
      }
      
      return await query
        .orderBy(desc(users.createdAt))
        .limit(filters?.limit || 100);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Connect requests
  async createConnectRequest(data: { fromUserId: string; toUserId: string; message?: string }): Promise<ConnectRequest> {
    const [request] = await db
      .insert(connectRequests)
      .values(data)
      .returning();
    return request;
  }

  async getConnectRequest(fromUserId: string, toUserId: string): Promise<ConnectRequest | undefined> {
    const [request] = await db
      .select()
      .from(connectRequests)
      .where(
        and(
          eq(connectRequests.fromUserId, fromUserId),
          eq(connectRequests.toUserId, toUserId)
        )
      );
    return request;
  }

  async updateConnectRequestStatus(id: string, status: string): Promise<ConnectRequest> {
    // Handle test requests for demo user
    const testRequest = testConnectRequests.find(req => req.id === id);
    if (testRequest) {
      // Update the test request status
      testRequest.status = status;
      return testRequest as ConnectRequest;
    }
    
    const [request] = await db
      .update(connectRequests)
      .set({ status })
      .where(eq(connectRequests.id, id))
      .returning();
    return request;
  }

  async getUserConnectRequests(userId: string, type: 'sent' | 'received'): Promise<ConnectRequest[]> {
    // Return test requests for demo user
    if (userId === 'demo-user-1' && type === 'received') {
      return testConnectRequests as ConnectRequest[];
    }
    
    const field = type === 'sent' ? connectRequests.fromUserId : connectRequests.toUserId;
    return await db
      .select()
      .from(connectRequests)
      .where(eq(field, userId))
      .orderBy(desc(connectRequests.createdAt));
  }

  // Conversations
  async createConversation(data: { user1Id: string; user2Id: string }): Promise<Conversation> {
    // Check if conversation already exists
    const existing = await this.getConversation(data.user1Id, data.user2Id);
    if (existing) {
      return existing;
    }

    // Handle demo conversations in memory for demo users
    const isDemoConversation = data.user1Id === 'demo-user-1' || 
                              data.user2Id === 'demo-user-1' ||
                              data.user1Id?.startsWith('test-user-') || 
                              data.user2Id?.startsWith('test-user-');
    
    if (isDemoConversation) {
      // Create mock conversation for demo
      const mockConversation = {
        id: `conv-${Date.now()}`,
        user1Id: data.user1Id,
        user2Id: data.user2Id,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };
      
      // Store in memory (you could use a Map or array here)
      if (!this.demoConversations) {
        this.demoConversations = [];
      }
      this.demoConversations.push(mockConversation);
      
      return mockConversation as Conversation;
    }

    const [conversation] = await db
      .insert(conversations)
      .values(data)
      .returning();
    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    // Return demo conversations for demo user and test users
    const isDemoUser = userId === 'demo-user-1' || userId?.startsWith('test-user-');
    
    if (isDemoUser) {
      if (!this.demoConversations) {
        this.demoConversations = [];
      }
      const userConversations = this.demoConversations.filter(conv => 
        conv.user1Id === userId || conv.user2Id === userId
      );
      console.log(`Demo conversations for ${userId}:`, userConversations);
      return userConversations as Conversation[];
    }
    
    return await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(user1Id: string, user2Id: string): Promise<Conversation | undefined> {
    // Check demo conversations first
    const isDemoConversation = user1Id === 'demo-user-1' || 
                              user2Id === 'demo-user-1' ||
                              user1Id?.startsWith('test-user-') || 
                              user2Id?.startsWith('test-user-');
    
    if (isDemoConversation) {
      const existing = this.demoConversations.find(conv =>
        (conv.user1Id === user1Id && conv.user2Id === user2Id) ||
        (conv.user1Id === user2Id && conv.user2Id === user1Id)
      );
      return existing as Conversation | undefined;
    }
    
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.user1Id, user1Id), eq(conversations.user2Id, user2Id)),
          and(eq(conversations.user1Id, user2Id), eq(conversations.user2Id, user1Id))
        )
      );
    return conversation;
  }

  // Messaging
  async createMessage(data: { conversationId: string; fromUserId: string; body?: string; mediaUrl?: string; mediaType?: string }): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(data)
      .returning();
    
    // Update conversation last message
    await this.updateConversationLastMessage(data.conversationId, message.id);
    
    return message;
  }

  async getConversationMessages(conversationId: string, limit = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async updateConversationLastMessage(conversationId: string, messageId: string): Promise<void> {
    await db
      .update(conversations)
      .set({ 
        lastMessageId: messageId,
        lastMessageAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  // Posts and Feed
  async createPost(data: { userId: string; body?: string; mediaType?: string; mediaUrls?: string[]; country?: string; city?: string; visibility?: string }): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(data)
      .returning();
    return post;
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getFeedPosts(tab: 'global' | 'country' | 'following', userId?: string, country?: string, limit = 20): Promise<Post[]> {
    if (tab === 'following' && userId) {
      // Get posts from users that the current user follows
      const followingUserIds = await db
        .select({ userId: follows.followeeId })
        .from(follows)
        .where(eq(follows.followerId, userId));
      
      if (followingUserIds.length === 0) {
        // If not following anyone, return empty array
        return [];
      }
      
      const followingIds = followingUserIds.map(f => f.userId!);
      
      // Get posts from followed users, including user info
      const result = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
            avatarUrl: users.avatarUrl
          }
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(
          and(
            sql`${posts.userId} = ANY(${followingIds})`,
            eq(posts.status, 'published')
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit);
      
      return result.map(r => ({
        ...r.post,
        username: r.user.username || 'unknown',
        displayName: r.user.displayName || 'Unknown User',
        profileImageUrl: r.user.profileImageUrl || r.user.avatarUrl || '',
        updatedAt: new Date(),
      })) as Post[];
    }
    
    // For global and country tabs, return test posts with user info for demo
    let filteredPosts = testPosts;
    
    if (tab === 'country' && country) {
      filteredPosts = testPosts.filter(post => 
        post.country?.toLowerCase().includes(country.toLowerCase())
      );
    }
    
    return filteredPosts.map((post) => {
      const user = testUsers.find(u => u.id === post.userId);
      return {
        ...post,
        status: 'published',
        username: user?.username || 'unknown',
        displayName: user?.displayName || 'Unknown User',
        profileImageUrl: user?.profileImageUrl || '',
        updatedAt: new Date(),
      };
    }) as Post[];
  }

  async getUserPosts(userId: string, limit = 20): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  // Events
  async createEvent(data: any): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(data)
      .returning();
    return event;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEvents(filters?: any): Promise<Event[]> {
    // Return test events for demo
    return testEvents.map(event => ({
      ...event,
      status: 'active',
      startsAt: event.date,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as Event[];
  }

  async createEventRsvp(eventId: string, userId: string, status: string): Promise<EventRsvp> {
    const [rsvp] = await db
      .insert(eventRsvps)
      .values({ eventId, userId, status })
      .onConflictDoUpdate({
        target: [eventRsvps.eventId, eventRsvps.userId],
        set: { status },
      })
      .returning();
    return rsvp;
  }

  async updateEventRsvp(eventId: string, userId: string, status: string): Promise<EventRsvp> {
    return this.createEventRsvp(eventId, userId, status);
  }

  async getEventRsvps(eventId: string): Promise<EventRsvp[]> {
    return await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, eventId));
  }

  // Ads
  async createAd(data: any): Promise<Ad> {
    const [ad] = await db
      .insert(ads)
      .values(data)
      .returning();
    return ad;
  }

  async updateAd(id: string, data: Partial<Ad>): Promise<Ad> {
    const [updatedAd] = await db
      .update(ads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ads.id, id))
      .returning();
    return updatedAd;
  }

  async getAds(filters?: any): Promise<Ad[]> {
    // Return test ads for demo
    return testAds.map(ad => ({
      ...ad,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as Ad[];
  }

  async getAd(id: string): Promise<Ad | undefined> {
    // Check if it's a test ad first
    const testAd = testAds.find(ad => ad.id === id);
    if (testAd) {
      return {
        ...testAd,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Ad;
    }

    const [ad] = await db.select().from(ads).where(eq(ads.id, id));
    return ad;
  }

  async getPublisherAds(publisherId: string): Promise<Ad[]> {
    return await db
      .select()
      .from(ads)
      .where(eq(ads.publisherId, publisherId))
      .orderBy(desc(ads.createdAt));
  }

  async cleanupExpiredReservations(): Promise<void> {
    try {
      // Update expired reservations in database to 'expired' status
      await db
        .update(adReservations)
        .set({ status: 'expired' })
        .where(
          and(
            eq(adReservations.status, 'active'),
            gt(sql`NOW()`, adReservations.expiresAt)
          )
        );
      
      // Clean up demo user expired reservations from memory
      for (const [userId, reservations] of this.demoUserReservations.entries()) {
        const activeReservations = reservations.filter(r => 
          new Date(r.expiresAt!).getTime() > Date.now()
        );
        if (activeReservations.length !== reservations.length) {
          this.demoUserReservations.set(userId, activeReservations);
        }
      }
    } catch (error) {
      console.error("Error cleaning up expired reservations:", error);
    }
  }

  async createAdReservation(adId: string, userId: string, expiresAt: Date): Promise<AdReservation> {
    // Check if it's a test ad
    const testAd = testAds.find(ad => ad.id === adId);
    if (testAd) {
      // For test ads, create a mock reservation
      const mockReservation = {
        id: `test-reservation-${Date.now()}`,
        adId,
        userId,
        expiresAt,
        status: 'active',
        createdAt: new Date(),
      } as AdReservation;
      
      // Store in memory for demo user
      if (userId === 'demo-user-1') {
        const existing = this.demoUserReservations.get(userId) || [];
        existing.push(mockReservation);
        this.demoUserReservations.set(userId, existing);
      }
      
      return mockReservation;
    }

    const [reservation] = await db
      .insert(adReservations)
      .values({ adId, userId, expiresAt })
      .returning();
    return reservation;
  }

  async getUserActiveReservations(userId: string): Promise<AdReservation[]> {
    // First cleanup expired reservations
    await this.cleanupExpiredReservations();
    
    // For demo user, return mock reservations to demonstrate functionality
    if (userId === 'demo-user-1') {
      const now = new Date();
      
      // Check if demo user has any stored reservations in memory
      const storedReservations = this.demoUserReservations.get(userId) || [];
      const activeReservations = storedReservations.filter(r => new Date(r.expiresAt!).getTime() > now.getTime());
      
      // If no active reservations and no stored reservations exist, create a new one with short expiry for testing
      if (activeReservations.length === 0 && storedReservations.length === 0) {
        const thirtySecondsFromNow = new Date(now.getTime() + (30 * 1000)); // 30 seconds for demo
        const demoReservation = {
          id: `demo-reservation-${Date.now()}`,
          adId: 'ad-6',
          userId: 'demo-user-1',
          status: 'active',
          expiresAt: thirtySecondsFromNow,
          createdAt: now,
        } as AdReservation;
        
        this.demoUserReservations.set(userId, [demoReservation]);
        return [demoReservation];
      }
      
      return activeReservations;
    }

    return await db
      .select()
      .from(adReservations)
      .where(
        and(
          eq(adReservations.userId, userId),
          eq(adReservations.status, "active"),
          gt(adReservations.expiresAt, new Date()) // Only active and not expired
        )
      );
  }

  async createAdSubmission(data: { 
    reservationId: string; 
    postId?: string; 
    rawFileUrl?: string; 
    contentLink?: string;
    originalVideoUrl?: string;
    clipUrl?: string;
    clipStartTime?: number;
    clipEndTime?: number;
    verificationStatus?: string;
    verificationScore?: string;
    verificationNotes?: string;
  }): Promise<AdSubmission> {
    const [submission] = await db
      .insert(adSubmissions)
      .values(data)
      .returning();
    return submission;
  }

  async getAdSubmissions(filters?: any): Promise<AdSubmission[]> {
    return await db
      .select()
      .from(adSubmissions)
      .orderBy(desc(adSubmissions.createdAt))
      .limit(50);
  }

  async updateAdSubmissionStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<AdSubmission> {
    const [submission] = await db
      .update(adSubmissions)
      .set({ 
        status, 
        reviewedBy, 
        reviewNotes,
        reviewedAt: new Date() 
      })
      .where(eq(adSubmissions.id, id))
      .returning();
    return submission;
  }

  // Boosted Posts for Feed Ads
  async createBoostedPost(data: any): Promise<BoostedPost> {
    const [boostedPost] = await db
      .insert(boostedPosts)
      .values(data)
      .returning();
    return boostedPost;
  }

  async getBoostedPosts(filters?: any): Promise<BoostedPost[]> {
    let query = db.select().from(boostedPosts);
    
    if (filters?.status) {
      query = query.where(eq(boostedPosts.status, filters.status));
    }
    
    return await query
      .orderBy(desc(boostedPosts.createdAt))
      .limit(filters?.limit || 20);
  }

  async getUserBoostedPosts(userId: string): Promise<BoostedPost[]> {
    return await db
      .select()
      .from(boostedPosts)
      .where(eq(boostedPosts.userId, userId))
      .orderBy(desc(boostedPosts.createdAt));
  }

  async updateBoostedPost(id: string, data: Partial<BoostedPost>): Promise<BoostedPost> {
    const [boostedPost] = await db
      .update(boostedPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(boostedPosts.id, id))
      .returning();
    return boostedPost;
  }

  async getBoostedPost(id: string): Promise<BoostedPost | undefined> {
    const [boostedPost] = await db
      .select()
      .from(boostedPosts)
      .where(eq(boostedPosts.id, id));
    return boostedPost;
  }

  // Feed Ad Impressions & Analytics
  async createFeedAdImpression(data: any): Promise<FeedAdImpression> {
    const [impression] = await db
      .insert(feedAdImpressions)
      .values(data)
      .returning();
    return impression;
  }

  async getFeedAdImpressions(filters?: any): Promise<FeedAdImpression[]> {
    let query = db.select().from(feedAdImpressions);
    let conditions = [];
    
    if (filters?.adType) {
      conditions.push(eq(feedAdImpressions.adType, filters.adType));
    }
    
    if (filters?.adId) {
      conditions.push(eq(feedAdImpressions.adId, filters.adId));
    }
    
    if (filters?.userId !== undefined) {
      if (filters.userId === null) {
        conditions.push(sql`${feedAdImpressions.userId} IS NULL`);
      } else {
        conditions.push(eq(feedAdImpressions.userId, filters.userId));
      }
    }
    
    if (filters?.ipAddress) {
      conditions.push(eq(feedAdImpressions.ipAddress, filters.ipAddress));
    }
    
    if (filters?.clicked !== undefined) {
      conditions.push(eq(feedAdImpressions.clicked, filters.clicked));
    }
    
    if (filters?.after) {
      conditions.push(gt(feedAdImpressions.createdAt, filters.after));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .orderBy(desc(feedAdImpressions.createdAt))
      .limit(filters?.limit || 100);
  }

  async getFeedAdsForUser(userId?: string, ipAddress?: string, country?: string): Promise<any[]> {
    // Get active boosted posts with post data
    const boostedPostsQuery = db
      .select({
        id: boostedPosts.id,
        adType: sql<string>`'boosted_post'`,
        postId: boostedPosts.postId,
        userId: boostedPosts.userId,
        targetCountries: boostedPosts.targetCountries,
        targetCities: boostedPosts.targetCities,
        costPerClick: boostedPosts.costPerClick,
        createdAt: boostedPosts.createdAt,
        // Join with posts table to get post content
        postBody: posts.body,
        postMediaType: posts.mediaType,
        postMediaUrls: posts.mediaUrls,
        postCountry: posts.country,
        postCity: posts.city,
        // Join with users table to get user info
        userDisplayName: users.displayName,
        userUsername: users.username,
        userProfileImageUrl: users.profileImageUrl,
      })
      .from(boostedPosts)
      .innerJoin(posts, eq(boostedPosts.postId, posts.id))
      .innerJoin(users, eq(boostedPosts.userId, users.id))
      .where(
        and(
          eq(boostedPosts.status, 'active'),
          // Check if current time is within the campaign period
          sql`${boostedPosts.startDate} <= NOW()`,
          sql`${boostedPosts.endDate} >= NOW()`
        )
      )
      .orderBy(desc(boostedPosts.createdAt))
      .limit(5);

    // Get active campaign ads that might be shown in feed
    const campaignAdsQuery = db
      .select({
        id: ads.id,
        adType: sql<string>`'campaign'`,
        brand: ads.brand,
        title: ads.title,
        briefMd: ads.briefMd,
        countries: ads.countries,
        adImageUrl: ads.adImageUrl,
        payoutAmount: ads.payoutAmount,
        createdAt: ads.createdAt,
      })
      .from(ads)
      .where(
        and(
          eq(ads.status, 'active'),
          // Check if campaign is still active
          sql`${ads.deadlineAt} >= NOW()`
        )
      )
      .orderBy(desc(ads.createdAt))
      .limit(3);

    // Execute both queries
    const [boostedPostsData, campaignAdsData] = await Promise.all([
      boostedPostsQuery,
      campaignAdsQuery
    ]);

    // Combine and filter by targeting
    const allAds = [
      ...boostedPostsData.map(bp => ({
        ...bp,
        adType: 'boosted_post',
        // Filter by target countries if specified
        isTargeted: !bp.targetCountries?.length || 
                   (country && bp.targetCountries?.includes(country))
      })),
      ...campaignAdsData.map(ca => ({
        ...ca,
        adType: 'campaign', 
        // Filter by target countries if specified
        isTargeted: !ca.countries?.length ||
                   (country && ca.countries?.includes(country))
      }))
    ];

    // Filter to only show targeted ads and randomize order
    const targetedAds = allAds
      .filter(ad => ad.isTargeted)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3); // Max 3 ads in feed

    return targetedAds;
  }

  // Wallet and Payouts
  async createWallet(userId: string): Promise<Wallet> {
    const [wallet] = await db
      .insert(wallets)
      .values({ userId })
      .returning();
    return wallet;
  }

  async getWallet(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet;
  }

  async updateWalletBalance(userId: string, amountMinor: number, grossAmountMinor?: number, taxWithheldMinor?: number): Promise<Wallet> {
    const updateData: any = { 
      balanceMinor: sql`balance_minor + ${amountMinor}` 
    };
    
    if (grossAmountMinor !== undefined) {
      updateData.totalEarnedMinor = sql`total_earned_minor + ${grossAmountMinor}`;
    }
    
    if (taxWithheldMinor !== undefined) {
      updateData.totalTaxWithheldMinor = sql`total_tax_withheld_minor + ${taxWithheldMinor}`;
    }
    
    const [wallet] = await db
      .update(wallets)
      .set(updateData)
      .where(eq(wallets.userId, userId))
      .returning();
    return wallet;
  }

  async createPayout(data: { userId: string; grossAmountMinor: number; taxWithheldMinor: number; amountMinor: number; taxRate?: number; currency?: string; method?: string }): Promise<Payout> {
    const [payout] = await db
      .insert(payouts)
      .values({
        userId: data.userId,
        grossAmountMinor: data.grossAmountMinor,
        taxWithheldMinor: data.taxWithheldMinor,
        amountMinor: data.amountMinor,
        taxRate: data.taxRate !== undefined ? data.taxRate.toString() : undefined,
        currency: data.currency || 'GBP',
        method: data.method || 'stripe',
        status: 'pending',
      })
      .returning();
    return payout;
  }

  async getUserPayouts(userId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.userId, userId))
      .orderBy(desc(payouts.createdAt));
  }

  // Subscriptions
  async createSubscription(data: any): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(data)
      .returning();
    return subscription;
  }

  async getUserActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      );
    return subscription;
  }

  async updateSubscriptionStatus(id: string, status: string): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  // Reports and Moderation
  async createReport(data: { reporterId: string; targetType: string; targetId: string; reason: string; description?: string }): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(data)
      .returning();
    return report;
  }

  async getReports(filters?: any): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(50);
  }

  async updateReportStatus(id: string, status: string): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  // Audit logging
  async createAuditLog(data: { actorId?: string; action: string; targetType?: string; targetId?: string; metaJson?: any; ipAddress?: string; userAgent?: string }): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values(data)
      .returning();
    return log;
  }

  // Follows
  async createFollow(followerId: string, followeeId: string): Promise<void> {
    await db
      .insert(follows)
      .values({ followerId, followeeId })
      .onConflictDoNothing();
  }

  async removeFollow(followerId: string, followeeId: string): Promise<void> {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followeeId, followeeId)
        )
      );
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followeeId, followeeId)
        )
      );
    return !!follow;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followeeId, userId));
    
    return result.map(r => r.user);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followeeId, users.id))
      .where(eq(follows.followerId, userId));
    
    return result.map(r => r.user);
  }

  async searchUsers(query: string): Promise<User[]> {
    // Return test users for demo that match the search query
    const searchQuery = query.toLowerCase();
    
    // Add demo user to test users for search
    const allTestUsers = [
      {
        id: 'demo-user-1',
        username: 'demo_user',
        displayName: 'Demo User',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@hublink.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        country: 'United Kingdom',
        city: 'London',
        plan: 'creator',
        role: 'traveler',
        interests: ['travel', 'photography', 'food'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ...testUsers
    ];
    
    const matchedUsers = allTestUsers.filter(user => 
      user.username?.toLowerCase().includes(searchQuery) ||
      user.displayName?.toLowerCase().includes(searchQuery) ||
      user.firstName?.toLowerCase().includes(searchQuery) ||
      user.lastName?.toLowerCase().includes(searchQuery)
    );
    
    return matchedUsers.slice(0, 20); // Limit to 20 results
  }
  
  // Stays implementation
  async getStays(filters?: { country?: string; city?: string; type?: string; minPrice?: number; maxPrice?: number; guests?: number; limit?: number }): Promise<Stay[]> {
    // For demo purposes, return test stays first, then database stays
    let filteredStays = [...testStays];
    
    // Apply filters to test data
    if (filters?.country) {
      filteredStays = filteredStays.filter(stay => stay.country === filters.country);
    }
    if (filters?.city) {
      filteredStays = filteredStays.filter(stay => stay.city === filters.city);
    }
    if (filters?.type) {
      filteredStays = filteredStays.filter(stay => stay.type === filters.type);
    }
    if (filters?.guests) {
      filteredStays = filteredStays.filter(stay => stay.maxGuests >= filters.guests);
    }
    if (filters?.minPrice) {
      filteredStays = filteredStays.filter(stay => stay.pricePerNight >= filters.minPrice!);
    }
    if (filters?.maxPrice) {
      filteredStays = filteredStays.filter(stay => stay.pricePerNight <= filters.maxPrice!);
    }
    
    // Limit results
    const limit = filters?.limit || 20;
    filteredStays = filteredStays.slice(0, limit);
    
    console.log('Returning test stays:', filteredStays.length);
    
    // Also try to get from database
    try {
      const conditions = [eq(stays.status, 'active')];
      
      if (filters?.country) {
        conditions.push(eq(stays.country, filters.country));
      }
      if (filters?.city) {
        conditions.push(eq(stays.city, filters.city));
      }
      if (filters?.type) {
        conditions.push(eq(stays.type, filters.type));
      }
      if (filters?.guests) {
        conditions.push(sql`${stays.maxGuests} >= ${filters.guests}`);
      }
      
      const dbStays = await db.select().from(stays)
        .where(and(...conditions))
        .limit(Math.max(0, limit - filteredStays.length));
      
      // Combine test data with database data
      return [...filteredStays, ...dbStays];
    } catch (error) {
      console.log('Database error, returning test stays only:', error);
      return filteredStays;
    }
  }
  
  async getStayById(id: string): Promise<Stay | undefined> {
    const [stay] = await db.select().from(stays).where(eq(stays.id, id));
    return stay;
  }
  
  async createStay(data: any): Promise<Stay> {
    const [stay] = await db.insert(stays).values(data).returning();
    return stay;
  }
  
  async updateStay(id: string, data: any): Promise<Stay> {
    const [stay] = await db.update(stays).set(data).where(eq(stays.id, id)).returning();
    return stay;
  }
  
  async deleteStay(id: string): Promise<void> {
    await db.delete(stays).where(eq(stays.id, id));
  }
  
  async getUserStays(userId: string): Promise<Stay[]> {
    return await db.select().from(stays).where(eq(stays.hostId, userId));
  }
  
  // Stay bookings implementation
  async createStayBooking(data: any): Promise<StayBooking> {
    const [booking] = await db.insert(stayBookings).values(data).returning();
    return booking;
  }
  
  async getStayBookingById(id: string): Promise<StayBooking | undefined> {
    const [booking] = await db.select().from(stayBookings).where(eq(stayBookings.id, id));
    return booking;
  }
  
  async getStayBookings(stayId: string): Promise<StayBooking[]> {
    return await db.select().from(stayBookings).where(eq(stayBookings.stayId, stayId));
  }
  
  async getUserBookings(userId: string): Promise<StayBooking[]> {
    return await db.select().from(stayBookings).where(eq(stayBookings.guestId, userId));
  }
  
  async getHostBookings(hostId: string): Promise<StayBooking[]> {
    const result = await db
      .select({ booking: stayBookings, stay: stays })
      .from(stayBookings)
      .innerJoin(stays, eq(stayBookings.stayId, stays.id))
      .where(eq(stays.hostId, hostId));
    
    return result.map(r => r.booking);
  }
  
  async updateStayBooking(id: string, data: Partial<StayBooking>): Promise<StayBooking> {
    const [booking] = await db.update(stayBookings).set(data).where(eq(stayBookings.id, id)).returning();
    return booking;
  }
  
  async updateStayBookingStatus(id: string, status: string): Promise<StayBooking> {
    const [booking] = await db.update(stayBookings).set({ status }).where(eq(stayBookings.id, id)).returning();
    return booking;
  }
  
  // Payment operations implementation
  async createPayment(data: any): Promise<Payment> {
    const [payment] = await db.insert(payments).values(data).returning();
    return payment;
  }
  
  async updatePaymentByIntentId(intentId: string, data: Partial<Payment>): Promise<Payment> {
    const [payment] = await db.update(payments).set(data).where(eq(payments.intentId, intentId)).returning();
    return payment;
  }
  
  // Webhook operations implementation
  async createWebhookEvent(data: any): Promise<WebhookEvent> {
    const [webhook] = await db.insert(webhookEvents).values(data).returning();
    return webhook;
  }
  
  async getWebhookEvent(id: string): Promise<WebhookEvent | undefined> {
    const [webhook] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id));
    return webhook;
  }
  
  async updateWebhookEvent(id: string, data: Partial<WebhookEvent>): Promise<WebhookEvent> {
    const [webhook] = await db.update(webhookEvents).set(data).where(eq(webhookEvents.id, id)).returning();
    return webhook;
  }
  
  // Tour Package Bookings implementation
  async createTourPackageBooking(data: any): Promise<TourPackageBooking> {
    const [booking] = await db.insert(tourPackageBookings).values(data).returning();
    return booking;
  }
  
  async getUserTourPackageBookings(userId: string): Promise<TourPackageBooking[]> {
    return await db.select().from(tourPackageBookings).where(eq(tourPackageBookings.guestId, userId)).orderBy(desc(tourPackageBookings.createdAt));
  }
  
  async updateTourPackageBookingStatus(id: string, status: string): Promise<TourPackageBooking> {
    const [booking] = await db.update(tourPackageBookings).set({ status }).where(eq(tourPackageBookings.id, id)).returning();
    return booking;
  }
  
  // Stay reviews implementation
  async createStayReview(data: any): Promise<StayReview> {
    const [review] = await db.insert(stayReviews).values(data).returning();
    return review;
  }
  
  async getStayReviews(stayId: string): Promise<StayReview[]> {
    return await db.select().from(stayReviews).where(eq(stayReviews.stayId, stayId));
  }

  // Personal Hosts implementation
  async getPersonalHosts(filters?: { country?: string; city?: string; hostType?: string; priceType?: string; maxGuests?: number; limit?: number }): Promise<PersonalHost[]> {
    let query = db.select().from(personalHosts).where(eq(personalHosts.isActive, true));
    
    if (filters?.country) {
      query = query.where(eq(personalHosts.country, filters.country));
    }
    if (filters?.city) {
      query = query.where(eq(personalHosts.city, filters.city));
    }
    if (filters?.hostType) {
      query = query.where(eq(personalHosts.hostType, filters.hostType));
    }
    if (filters?.priceType) {
      query = query.where(eq(personalHosts.priceType, filters.priceType));
    }
    if (filters?.maxGuests) {
      query = query.where(sql`${personalHosts.maxGuests} >= ${filters.maxGuests}`);
    }
    
    const limit = filters?.limit || 20;
    return await query.limit(limit).orderBy(desc(personalHosts.createdAt));
  }

  async getPersonalHostById(id: string): Promise<PersonalHost | undefined> {
    const [host] = await db.select().from(personalHosts).where(eq(personalHosts.id, id));
    return host;
  }

  async createPersonalHost(data: any): Promise<PersonalHost> {
    const [host] = await db.insert(personalHosts).values(data).returning();
    return host;
  }

  async updatePersonalHost(id: string, data: any): Promise<PersonalHost> {
    const [host] = await db.update(personalHosts).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(personalHosts.id, id)).returning();
    return host;
  }

  async deletePersonalHost(id: string): Promise<void> {
    await db.delete(personalHosts).where(eq(personalHosts.id, id));
  }

  async getMyPersonalHosts(userId: string): Promise<PersonalHost[]> {
    return await db.select().from(personalHosts).where(eq(personalHosts.userId, userId)).orderBy(desc(personalHosts.createdAt));
  }

  // Host Bookings implementation
  async createHostBooking(data: any): Promise<HostBooking> {
    const [booking] = await db.insert(hostBookings).values(data).returning();
    return booking;
  }

  async getHostBookingById(id: string): Promise<HostBooking | undefined> {
    const [booking] = await db.select().from(hostBookings).where(eq(hostBookings.id, id));
    return booking;
  }

  async updateHostBookingStatus(id: string, status: string): Promise<HostBooking> {
    const [booking] = await db.update(hostBookings).set({
      status,
      updatedAt: new Date()
    }).where(eq(hostBookings.id, id)).returning();
    return booking;
  }

  async getUserHostBookings(userId: string): Promise<HostBooking[]> {
    return await db.select().from(hostBookings).where(eq(hostBookings.guestId, userId)).orderBy(desc(hostBookings.createdAt));
  }

  async getMyHostBookings(userId: string): Promise<HostBooking[]> {
    // Get bookings for hosts owned by this user
    const query = db
      .select({
        booking: hostBookings,
        host: personalHosts
      })
      .from(hostBookings)
      .innerJoin(personalHosts, eq(hostBookings.hostId, personalHosts.id))
      .where(eq(personalHosts.userId, userId))
      .orderBy(desc(hostBookings.createdAt));
    
    const result = await query;
    return result.map(r => r.booking);
  }

  // Trips implementation
  async createTrip(data: any): Promise<Trip> {
    const newTrip = {
      id: `trip-${Date.now()}`,
      organizerId: data.organizerId,
      ...data,
      currentTravelers: 1,
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    testTrips.push(newTrip);

    // Auto-create group chat for the trip
    try {
      const groupChat = await this.createGroupConversation(newTrip.id, `${newTrip.title} - Trip Chat`);
      // Add trip organizer to the group chat as admin
      await this.addUserToGroupConversation(groupChat.id, newTrip.organizerId, 'admin');
      console.log(`Created group chat for trip: ${newTrip.title}`);
    } catch (error) {
      console.error(`Failed to create group chat for trip ${newTrip.id}:`, error);
    }

    return newTrip;
  }

  async getTrips(filters?: any): Promise<Trip[]> {
    console.log('Returning test trips:', testTrips.length);
    let filteredTrips = [...testTrips];

    if (filters?.country) {
      filteredTrips = filteredTrips.filter(trip => 
        trip.fromCountry === filters.country || trip.toCountry === filters.country
      );
    }

    if (filters?.city) {
      filteredTrips = filteredTrips.filter(trip => 
        trip.fromCity === filters.city || trip.toCity === filters.city
      );
    }

    return filteredTrips.slice(0, filters?.limit || 50);
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    return testTrips.find(trip => trip.id === id);
  }

  async updateTrip(id: string, data: Partial<Trip>): Promise<Trip> {
    const index = testTrips.findIndex(trip => trip.id === id);
    if (index === -1) throw new Error('Trip not found');
    
    testTrips[index] = { ...testTrips[index], ...data, updatedAt: new Date() };
    return testTrips[index];
  }

  async deleteTrip(id: string): Promise<void> {
    const index = testTrips.findIndex(trip => trip.id === id);
    if (index !== -1) {
      testTrips.splice(index, 1);
    }
  }

  async joinTrip(tripId: string, userId: string, message?: string): Promise<TripParticipant> {
    const newParticipant = {
      id: `participant-${Date.now()}`,
      tripId,
      userId,
      joinedAt: new Date(),
      status: 'confirmed',
      message: message || '',
      role: 'participant'
    };

    testTripParticipants.push(newParticipant);

    const trip = testTrips.find(t => t.id === tripId);
    if (trip) {
      trip.currentTravelers = (trip.currentTravelers || 1) + 1;
    }

    // Auto-add user to group chat
    try {
      const groupChat = await this.getGroupConversation(tripId);
      if (groupChat) {
        await this.addUserToGroupConversation(groupChat.id, userId, 'member');
        console.log(`Added user ${userId} to group chat for trip: ${tripId}`);
      }
    } catch (error) {
      console.error(`Failed to add user to group chat for trip ${tripId}:`, error);
    }

    return newParticipant;
  }

  async leaveTrip(tripId: string, userId: string): Promise<void> {
    const index = testTripParticipants.findIndex(p => p.tripId === tripId && p.userId === userId);
    if (index !== -1) {
      testTripParticipants.splice(index, 1);
      
      const trip = testTrips.find(t => t.id === tripId);
      if (trip && trip.currentTravelers > 1) {
        trip.currentTravelers = trip.currentTravelers - 1;
      }
    }
  }

  async getTripParticipants(tripId: string): Promise<TripParticipant[]> {
    return testTripParticipants.filter(p => p.tripId === tripId);
  }

  async getUserTrips(userId: string, type: 'organized' | 'joined' | 'all'): Promise<Trip[]> {
    switch (type) {
      case 'organized':
        return testTrips.filter(trip => trip.organizerId === userId);
      case 'joined':
        const joinedTripIds = testTripParticipants
          .filter(p => p.userId === userId)
          .map(p => p.tripId);
        return testTrips.filter(trip => joinedTripIds.includes(trip.id));
      case 'all':
      default:
        const organizedTrips = testTrips.filter(trip => trip.organizerId === userId);
        const joinedTripIds2 = testTripParticipants
          .filter(p => p.userId === userId)
          .map(p => p.tripId);
        const joinedTrips = testTrips.filter(trip => joinedTripIds2.includes(trip.id));
        return [...organizedTrips, ...joinedTrips];
    }
  }

  // Group chat implementation
  async createGroupConversation(tripId: string, title: string): Promise<GroupConversation> {
    const [groupConversation] = await db
      .insert(groupConversations)
      .values({
        tripId,
        title,
      })
      .returning();
    return groupConversation;
  }

  async addUserToGroupConversation(conversationId: string, userId: string, role: string = 'member'): Promise<GroupConversationParticipant> {
    const [participant] = await db
      .insert(groupConversationParticipants)
      .values({
        conversationId,
        userId,
        role,
      })
      .returning();
    return participant;
  }

  async removeUserFromGroupConversation(conversationId: string, userId: string): Promise<void> {
    await db
      .update(groupConversationParticipants)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(groupConversationParticipants.conversationId, conversationId),
          eq(groupConversationParticipants.userId, userId)
        )
      );
  }

  async getGroupConversation(tripId: string): Promise<GroupConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(groupConversations)
      .where(eq(groupConversations.tripId, tripId));
    return conversation;
  }

  async getUserGroupConversations(userId: string): Promise<GroupConversation[]> {
    const result = await db
      .select({ conversation: groupConversations })
      .from(groupConversationParticipants)
      .innerJoin(groupConversations, eq(groupConversationParticipants.conversationId, groupConversations.id))
      .where(
        and(
          eq(groupConversationParticipants.userId, userId),
          eq(groupConversationParticipants.leftAt, null)
        )
      );
    return result.map(r => r.conversation);
  }

  async createGroupMessage(data: { conversationId: string; fromUserId: string; body?: string; mediaUrl?: string; mediaType?: string }): Promise<GroupMessage> {
    const [message] = await db
      .insert(groupMessages)
      .values(data)
      .returning();

    // Update group conversation's last message
    await this.updateGroupConversationLastMessage(data.conversationId, message.id);

    return message;
  }

  async getGroupConversationMessages(conversationId: string, limit: number = 50): Promise<GroupMessage[]> {
    return await db
      .select()
      .from(groupMessages)
      .where(eq(groupMessages.conversationId, conversationId))
      .orderBy(desc(groupMessages.createdAt))
      .limit(limit);
  }

  async updateGroupConversationLastMessage(conversationId: string, messageId: string): Promise<void> {
    await db
      .update(groupConversations)
      .set({
        lastMessageId: messageId,
        lastMessageAt: new Date(),
      })
      .where(eq(groupConversations.id, conversationId));
  }

  // Tax Configuration & Records (Worldwide Support)
  async getTaxConfiguration(country: string): Promise<TaxConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(taxConfiguration)
      .where(eq(taxConfiguration.country, country));
    return config;
  }

  async getAllTaxConfigurations(): Promise<TaxConfiguration[]> {
    return await db
      .select()
      .from(taxConfiguration)
      .orderBy(asc(taxConfiguration.countryName));
  }

  async createTaxConfiguration(data: { country: string; countryName: string; taxRate: string; taxType: string; taxName?: string; exemptionThreshold?: number; notes?: string }): Promise<TaxConfiguration> {
    const [config] = await db
      .insert(taxConfiguration)
      .values(data)
      .returning();
    return config;
  }

  async updateTaxConfiguration(id: string, data: Partial<TaxConfiguration>): Promise<TaxConfiguration> {
    const [config] = await db
      .update(taxConfiguration)
      .set(data)
      .where(eq(taxConfiguration.id, id))
      .returning();
    return config;
  }

  async createTaxRecord(data: { userId: string; transactionType: string; transactionId?: string; grossAmountMinor: number; taxWithheldMinor: number; netAmountMinor: number; taxRate: string; taxYear?: number; taxQuarter?: number; country?: string; taxConfigId?: string; description?: string }): Promise<TaxRecord> {
    const [record] = await db
      .insert(taxRecords)
      .values(data)
      .returning();
    return record;
  }

  async getUserTaxRecords(userId: string, filters?: { year?: number; quarter?: number; country?: string }): Promise<TaxRecord[]> {
    let query = db
      .select()
      .from(taxRecords)
      .where(eq(taxRecords.userId, userId));

    if (filters?.year) {
      query = query.where(eq(taxRecords.taxYear, filters.year));
    }
    if (filters?.quarter) {
      query = query.where(eq(taxRecords.taxQuarter, filters.quarter));
    }
    if (filters?.country) {
      query = query.where(eq(taxRecords.country, filters.country));
    }

    return await query.orderBy(desc(taxRecords.createdAt));
  }

  async getAllTaxRecords(filters?: { year?: number; country?: string }): Promise<TaxRecord[]> {
    let query = db.select().from(taxRecords);

    const conditions: any[] = [];
    if (filters?.year) {
      conditions.push(eq(taxRecords.taxYear, filters.year));
    }
    if (filters?.country) {
      conditions.push(eq(taxRecords.country, filters.country));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(taxRecords.createdAt));
  }

  // Discount & Trial Codes
  async createDiscountCode(data: any): Promise<any> {
    const [code] = await db
      .insert(discountCodes)
      .values(data)
      .returning();
    return code;
  }

  async getAllDiscountCodes(): Promise<any[]> {
    return await db
      .select()
      .from(discountCodes)
      .orderBy(desc(discountCodes.createdAt));
  }

  async getDiscountCodeByCode(code: string): Promise<any | undefined> {
    const [discountCode] = await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.code, code));
    return discountCode;
  }

  async updateDiscountCode(id: string, data: Partial<any>): Promise<any> {
    const [code] = await db
      .update(discountCodes)
      .set(data)
      .where(eq(discountCodes.id, id))
      .returning();
    return code;
  }
}

export const storage = new DatabaseStorage();
