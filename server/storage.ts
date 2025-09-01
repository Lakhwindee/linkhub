import {
  users,
  connectRequests,
  conversations,
  messages,
  posts,
  events,
  eventRsvps,
  ads,
  adReservations,
  adSubmissions,
  wallets,
  payouts,
  subscriptions,
  invoices,
  reports,
  auditLogs,
  follows,
  type User,
  type UpsertUser,
  type ConnectRequest,
  type Conversation,
  type Message,
  type Post,
  type Event,
  type EventRsvp,
  type Ad,
  type AdReservation,
  type AdSubmission,
  type Wallet,
  type Payout,
  type Subscription,
  type Invoice,
  type Report,
  type AuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, count, like, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  updateStripeCustomerId(id: string, customerId: string): Promise<User>;
  updateUserStripeInfo(id: string, data: { customerId: string; subscriptionId: string }): Promise<User>;
  
  // Discovery operations
  getUsersNearby(lat: number, lng: number, radiusKm: number, filters?: any): Promise<User[]>;
  searchUsers(query: string, filters?: any): Promise<User[]>;
  
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
  getAds(filters?: any): Promise<Ad[]>;
  getAd(id: string): Promise<Ad | undefined>;
  createAdReservation(adId: string, userId: string, expiresAt: Date): Promise<AdReservation>;
  getUserActiveReservations(userId: string): Promise<AdReservation[]>;
  createAdSubmission(data: { reservationId: string; postId?: string; rawFileUrl?: string }): Promise<AdSubmission>;
  getAdSubmissions(filters?: any): Promise<AdSubmission[]>;
  updateAdSubmissionStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<AdSubmission>;
  
  // Wallet and Payouts
  createWallet(userId: string): Promise<Wallet>;
  getWallet(userId: string): Promise<Wallet | undefined>;
  updateWalletBalance(userId: string, amountMinor: number): Promise<Wallet>;
  createPayout(data: { userId: string; amountMinor: number; currency?: string; method?: string }): Promise<Payout>;
  getUserPayouts(userId: string): Promise<Payout[]>;
  
  // Subscriptions
  createSubscription(data: any): Promise<Subscription>;
  getUserActiveSubscription(userId: string): Promise<Subscription | undefined>;
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
}

// Test data for demo/development
const testUsers = [
  { id: 'test-user-1', username: 'alex_traveler', displayName: 'Alex Johnson', email: 'alex@example.com', firstName: 'Alex', lastName: 'Johnson', plan: 'traveler', currentCity: 'London', currentCountry: 'United Kingdom', lat: 51.5074, lng: -0.1278, showOnMap: true, interests: ['photography', 'food'], profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-2', username: 'maria_creator', displayName: 'Maria Santos', email: 'maria@example.com', firstName: 'Maria', lastName: 'Santos', plan: 'creator', currentCity: 'Barcelona', currentCountry: 'Spain', lat: 41.3851, lng: 2.1734, showOnMap: true, interests: ['culture', 'nightlife'], profileImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-3', username: 'yuki_explorer', displayName: 'Yuki Tanaka', email: 'yuki@example.com', firstName: 'Yuki', lastName: 'Tanaka', plan: 'traveler', currentCity: 'Tokyo', currentCountry: 'Japan', lat: 35.6762, lng: 139.6503, showOnMap: true, interests: ['hiking', 'history'], profileImageUrl: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-4', username: 'raj_backpacker', displayName: 'Raj Patel', email: 'raj@example.com', firstName: 'Raj', lastName: 'Patel', plan: 'free', currentCity: 'Mumbai', currentCountry: 'India', lat: 19.0760, lng: 72.8777, showOnMap: true, interests: ['backpacking', 'adventure'], profileImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-5', username: 'emma_foodie', displayName: 'Emma Thompson', email: 'emma@example.com', firstName: 'Emma', lastName: 'Thompson', plan: 'creator', currentCity: 'Paris', currentCountry: 'France', lat: 48.8566, lng: 2.3522, showOnMap: true, interests: ['food', 'photography'], profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-6', username: 'lucas_surfer', displayName: 'Lucas Silva', email: 'lucas@example.com', firstName: 'Lucas', lastName: 'Silva', plan: 'traveler', currentCity: 'Sydney', currentCountry: 'Australia', lat: -33.8688, lng: 151.2093, showOnMap: true, interests: ['adventure', 'nightlife'], profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-7', username: 'sofia_artist', displayName: 'Sofia Martinez', email: 'sofia@example.com', firstName: 'Sofia', lastName: 'Martinez', plan: 'creator', currentCity: 'Mexico City', currentCountry: 'Mexico', lat: 19.4326, lng: -99.1332, showOnMap: true, interests: ['culture', 'history'], profileImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-8', username: 'david_hiker', displayName: 'David Brown', email: 'david@example.com', firstName: 'David', lastName: 'Brown', plan: 'traveler', currentCity: 'Denver', currentCountry: 'United States', lat: 39.7392, lng: -104.9903, showOnMap: true, interests: ['hiking', 'adventure'], profileImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-9', username: 'anna_blogger', displayName: 'Anna Kowalski', email: 'anna@example.com', firstName: 'Anna', lastName: 'Kowalski', plan: 'creator', currentCity: 'Berlin', currentCountry: 'Germany', lat: 52.5200, lng: 13.4050, showOnMap: true, interests: ['photography', 'culture'], profileImageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-10', username: 'tom_wanderer', displayName: 'Tom Wilson', email: 'tom@example.com', firstName: 'Tom', lastName: 'Wilson', plan: 'free', currentCity: 'Toronto', currentCountry: 'Canada', lat: 43.6532, lng: -79.3832, showOnMap: true, interests: ['backpacking', 'food'], profileImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face' }
];

const testEvents = [
  { id: 'event-1', title: 'London Photography Walk', description: 'Join us for an evening photography walk through central London, capturing the city at golden hour.', type: 'meetup', date: new Date('2024-10-15'), time: '18:00', location: 'Tower Bridge, London', country: 'United Kingdom', city: 'London', capacity: 15, hostId: 'test-user-1' },
  { id: 'event-2', title: 'Barcelona Food Tour', description: 'Explore the best tapas bars and local cuisine in the Gothic Quarter.', type: 'tour', date: new Date('2024-10-20'), time: '19:00', location: 'Gothic Quarter, Barcelona', country: 'Spain', city: 'Barcelona', capacity: 20, hostId: 'test-user-2' },
  { id: 'event-3', title: 'Tokyo Temple Hopping', description: 'Visit historic temples and shrines across Tokyo with a local guide.', type: 'tour', date: new Date('2024-10-25'), time: '09:00', location: 'Senso-ji Temple, Tokyo', country: 'Japan', city: 'Tokyo', capacity: 12, hostId: 'test-user-3' },
  { id: 'event-4', title: 'Mumbai Street Art Collaboration', description: 'Create a collaborative mural in the heart of Mumbai with local artists.', type: 'collab', date: new Date('2024-11-01'), time: '14:00', location: 'Bandra, Mumbai', country: 'India', city: 'Mumbai', capacity: 8, hostId: 'test-user-4' }
];

const testAds = [
  { id: 'ad-1', title: 'Travel Photography Campaign', brand: 'Canon', description: 'Showcase your travel photography skills with our latest mirrorless camera. Perfect for creators who love capturing adventures.', budget: 500, campaignType: 'photography', targetCountries: ['GB', 'US', 'AU'], requirements: 'Min 1K followers, travel content focus', deadline: new Date('2024-11-30'), status: 'active' },
  { id: 'ad-2', title: 'Street Food Adventures', brand: 'FoodieApp', description: 'Document your local street food experiences and share authentic cultural dining moments.', budget: 300, campaignType: 'food', targetCountries: ['IN', 'TH', 'MX'], requirements: 'Food content creators, 500+ followers', deadline: new Date('2024-12-15'), status: 'active' },
  { id: 'ad-3', title: 'Sustainable Travel Gear', brand: 'EcoTravel', description: 'Promote eco-friendly travel gear and sustainable tourism practices to conscious travelers.', budget: 750, campaignType: 'lifestyle', targetCountries: ['DE', 'NL', 'SE'], requirements: 'Sustainability focus, 2K+ followers', deadline: new Date('2024-12-01'), status: 'active' }
];

const testPosts = [
  { id: 'post-1', userId: 'test-user-1', body: 'Amazing sunrise over London this morning! The city never fails to surprise me with its hidden beauty spots. 📸✨', mediaUrls: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop'], visibility: 'public', country: 'United Kingdom', city: 'London', createdAt: new Date('2024-09-01T08:00:00Z') },
  { id: 'post-2', userId: 'test-user-2', body: 'Just finished an incredible flamenco workshop in Barcelona! The passion and energy of this dance is absolutely captivating. 💃🔥', mediaUrls: ['https://images.unsplash.com/photo-1504609813442-a8c73c66ea25?w=600&h=400&fit=crop'], visibility: 'public', country: 'Spain', city: 'Barcelona', createdAt: new Date('2024-09-01T19:30:00Z') },
  { id: 'post-3', userId: 'test-user-3', body: 'Peaceful morning meditation at Senso-ji Temple. Tokyo has the most beautiful blend of traditional and modern culture. 🏯⛩️', mediaUrls: ['https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&h=400&fit=crop'], visibility: 'public', country: 'Japan', city: 'Tokyo', createdAt: new Date('2024-09-01T06:00:00Z') }
];

export class DatabaseStorage implements IStorage {
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

  // Discovery operations
  async getUsersNearby(lat: number, lng: number, radiusKm: number, filters?: any): Promise<User[]> {
    // Return test users for demo purposes with proper User structure
    return testUsers.map(user => ({
      ...user,
      currentCity: user.currentCity,
      currentCountry: user.currentCountry,
      city: user.currentCity,
      country: user.currentCountry,
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
    const [request] = await db
      .update(connectRequests)
      .set({ status })
      .where(eq(connectRequests.id, id))
      .returning();
    return request;
  }

  async getUserConnectRequests(userId: string, type: 'sent' | 'received'): Promise<ConnectRequest[]> {
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

    const [conversation] = await db
      .insert(conversations)
      .values(data)
      .returning();
    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
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

  async getFeedPosts(tab: 'global' | 'country' | 'following', userId?: string, country?: string, limit = 20): Promise<Post[]> {
    // Return test posts with user info for demo
    return testPosts.map((post) => {
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

  async getAds(filters?: any): Promise<Ad[]> {
    // Return test ads for demo
    return testAds.map(ad => ({
      ...ad,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as Ad[];
  }

  async getAd(id: string): Promise<Ad | undefined> {
    const [ad] = await db.select().from(ads).where(eq(ads.id, id));
    return ad;
  }

  async createAdReservation(adId: string, userId: string, expiresAt: Date): Promise<AdReservation> {
    const [reservation] = await db
      .insert(adReservations)
      .values({ adId, userId, expiresAt })
      .returning();
    return reservation;
  }

  async getUserActiveReservations(userId: string): Promise<AdReservation[]> {
    return await db
      .select()
      .from(adReservations)
      .where(
        and(
          eq(adReservations.userId, userId),
          eq(adReservations.status, "active")
        )
      );
  }

  async createAdSubmission(data: { reservationId: string; postId?: string; rawFileUrl?: string }): Promise<AdSubmission> {
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

  async updateWalletBalance(userId: string, amountMinor: number): Promise<Wallet> {
    const [wallet] = await db
      .update(wallets)
      .set({ balanceMinor: sql`balance_minor + ${amountMinor}` })
      .where(eq(wallets.userId, userId))
      .returning();
    return wallet;
  }

  async createPayout(data: { userId: string; amountMinor: number; currency?: string; method?: string }): Promise<Payout> {
    const [payout] = await db
      .insert(payouts)
      .values(data)
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
}

export const storage = new DatabaseStorage();
