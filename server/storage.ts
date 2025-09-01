import {
  users,
  connectRequests,
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
  
  // Messaging
  createMessage(data: { threadId: string; fromUserId: string; toUserId: string; body?: string; mediaUrl?: string; mediaType?: string }): Promise<Message>;
  getThreadMessages(threadId: string, limit?: number): Promise<Message[]>;
  getUserThreads(userId: string): Promise<Array<{ threadId: string; otherUser: User; lastMessage: Message }>>;
  
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
    const query = db
      .select()
      .from(users)
      .where(
        and(
          eq(users.showOnMap, true),
          sql`ST_DWithin(ST_MakePoint(${lng}, ${lat})::geography, ST_MakePoint(lng, lat)::geography, ${radiusKm * 1000})`
        )
      )
      .limit(100);
    
    return await query;
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

  // Messaging
  async createMessage(data: { threadId: string; fromUserId: string; toUserId: string; body?: string; mediaUrl?: string; mediaType?: string }): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(data)
      .returning();
    return message;
  }

  async getThreadMessages(threadId: string, limit = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async getUserThreads(userId: string): Promise<Array<{ threadId: string; otherUser: User; lastMessage: Message }>> {
    // This is a complex query that would need proper implementation
    // For now, return empty array
    return [];
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
    let query = db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"));

    if (tab === 'country' && country) {
      query = query.where(eq(posts.country, country));
    }

    return await query
      .orderBy(desc(posts.createdAt))
      .limit(limit);
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
    return await db
      .select()
      .from(events)
      .where(eq(events.status, "active"))
      .orderBy(asc(events.startsAt))
      .limit(50);
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
    return await db
      .select()
      .from(ads)
      .where(eq(ads.status, "active"))
      .orderBy(desc(ads.createdAt))
      .limit(50);
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
