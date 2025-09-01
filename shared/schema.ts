import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  real,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique().notNull(),
  displayName: varchar("display_name"),
  bio: text("bio"),
  country: varchar("country"),
  city: varchar("city"),
  homeCountry: varchar("home_country"),
  homeCity: varchar("home_city"),
  lat: real("lat"),
  lng: real("lng"),
  showOnMap: boolean("show_on_map").default(true),
  locationRadius: integer("location_radius").default(5), // km
  languages: text("languages").array(),
  interests: text("interests").array(),
  avatarUrl: varchar("avatar_url"),
  coverUrl: varchar("cover_url"),
  instagramUrl: varchar("instagram_url"),
  youtubeUrl: varchar("youtube_url"),
  tiktokUrl: varchar("tiktok_url"),
  role: varchar("role").default("user"), // user, creator, moderator, admin, superadmin
  plan: varchar("plan").default("free"), // free, traveler, creator
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  canDmMe: varchar("can_dm_me").default("all"), // all, followers, none
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auth providers
export const authProviders = pgTable("auth_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider").notNull(), // replit, google, apple
  providerId: varchar("provider_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Follows
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id, { onDelete: "cascade" }),
  followeeId: varchar("followee_id").references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status").default("active"), // active, blocked
  createdAt: timestamp("created_at").defaultNow(),
});

// Connect requests
export const connectRequests = pgTable("connect_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id").references(() => users.id, { onDelete: "cascade" }),
  message: varchar("message", { length: 140 }),
  status: varchar("status").default("pending"), // pending, accepted, rejected, blocked
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  fromUserId: varchar("from_user_id").references(() => users.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id").references(() => users.id, { onDelete: "cascade" }),
  body: text("body"),
  mediaUrl: varchar("media_url"),
  mediaType: varchar("media_type"), // image, video, file
  createdAt: timestamp("created_at").defaultNow(),
});

// Posts
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  body: text("body"),
  mediaType: varchar("media_type"), // text, image, video
  mediaUrls: text("media_urls").array(),
  country: varchar("country"),
  city: varchar("city"),
  visibility: varchar("visibility").default("public"), // public, followers, private
  status: varchar("status").default("published"), // draft, published, moderated, banned
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").references(() => users.id, { onDelete: "cascade" }),
  targetType: varchar("target_type").notNull(), // user, post, message
  targetId: varchar("target_id").notNull(),
  reason: varchar("reason").notNull(),
  description: text("description"),
  status: varchar("status").default("pending"), // pending, reviewing, resolved, dismissed
  createdAt: timestamp("created_at").defaultNow(),
});

// Events
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: varchar("host_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // meetup, tour, collab, party, other
  country: varchar("country"),
  city: varchar("city"),
  venue: varchar("venue"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  capacity: integer("capacity"),
  visibility: varchar("visibility").default("public"), // public, followers, invite-only
  status: varchar("status").default("active"), // active, cancelled, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Event RSVPs
export const eventRsvps = pgTable("event_rsvps", {
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status").default("going"), // going, maybe, not-going
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.eventId, table.userId] }),
}));

// Ads
export const ads = pgTable("ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brand: varchar("brand").notNull(),
  title: varchar("title").notNull(),
  briefMd: text("brief_md").notNull(),
  countries: text("countries").array(),
  hashtags: text("hashtags").array(),
  payoutAmount: decimal("payout_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("GBP"),
  deadlineAt: timestamp("deadline_at").notNull(),
  quota: integer("quota").default(1),
  currentReservations: integer("current_reservations").default(0),
  status: varchar("status").default("active"), // active, paused, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Ad reservations
export const adReservations = pgTable("ad_reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id").references(() => ads.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  status: varchar("status").default("active"), // active, expired, submitted, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Ad submissions
export const adSubmissions = pgTable("ad_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").references(() => adReservations.id, { onDelete: "cascade" }),
  postId: varchar("post_id").references(() => posts.id),
  rawFileUrl: varchar("raw_file_url"),
  status: varchar("status").default("pending"), // pending, approved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallets
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  balanceMinor: integer("balance_minor").default(0), // in pence/paisa
  currency: varchar("currency").default("GBP"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payouts
export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  amountMinor: integer("amount_minor").notNull(),
  currency: varchar("currency").default("GBP"),
  method: varchar("method").default("stripe"), // stripe, bank-transfer
  reference: varchar("reference"),
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  plan: varchar("plan").notNull(), // traveler, creator
  provider: varchar("provider").default("stripe"),
  providerSubscriptionId: varchar("provider_subscription_id"),
  status: varchar("status").default("active"), // active, cancelled, past-due
  startedAt: timestamp("started_at").defaultNow(),
  renewsAt: timestamp("renews_at"),
  cancelledAt: timestamp("cancelled_at"),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  amountMinor: integer("amount_minor").notNull(),
  currency: varchar("currency").default("GBP"),
  pdfUrl: varchar("pdf_url"),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  status: varchar("status").default("pending"), // pending, paid, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").references(() => users.id),
  action: varchar("action").notNull(),
  targetType: varchar("target_type"),
  targetId: varchar("target_id"),
  metaJson: jsonb("meta_json"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  authProviders: many(authProviders),
  following: many(follows, { relationName: "follower" }),
  followers: many(follows, { relationName: "followee" }),
  sentConnectRequests: many(connectRequests, { relationName: "fromUser" }),
  receivedConnectRequests: many(connectRequests, { relationName: "toUser" }),
  sentMessages: many(messages, { relationName: "fromUser" }),
  receivedMessages: many(messages, { relationName: "toUser" }),
  posts: many(posts),
  reports: many(reports),
  hostedEvents: many(events),
  eventRsvps: many(eventRsvps),
  adReservations: many(adReservations),
  wallet: one(wallets),
  payouts: many(payouts),
  subscriptions: many(subscriptions),
  invoices: many(invoices),
}));

export const authProvidersRelations = relations(authProviders, ({ one }) => ({
  user: one(users, { fields: [authProviders.userId], references: [users.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "follower" }),
  followee: one(users, { fields: [follows.followeeId], references: [users.id], relationName: "followee" }),
}));

export const connectRequestsRelations = relations(connectRequests, ({ one }) => ({
  fromUser: one(users, { fields: [connectRequests.fromUserId], references: [users.id], relationName: "fromUser" }),
  toUser: one(users, { fields: [connectRequests.toUserId], references: [users.id], relationName: "toUser" }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  fromUser: one(users, { fields: [messages.fromUserId], references: [users.id], relationName: "fromUser" }),
  toUser: one(users, { fields: [messages.toUserId], references: [users.id], relationName: "toUser" }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, { fields: [reports.reporterId], references: [users.id] }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, { fields: [events.hostId], references: [users.id] }),
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, { fields: [eventRsvps.eventId], references: [events.id] }),
  user: one(users, { fields: [eventRsvps.userId], references: [users.id] }),
}));

export const adReservationsRelations = relations(adReservations, ({ one, many }) => ({
  ad: one(ads, { fields: [adReservations.adId], references: [ads.id] }),
  user: one(users, { fields: [adReservations.userId], references: [users.id] }),
  submissions: many(adSubmissions),
}));

export const adSubmissionsRelations = relations(adSubmissions, ({ one }) => ({
  reservation: one(adReservations, { fields: [adSubmissions.reservationId], references: [adReservations.id] }),
  post: one(posts, { fields: [adSubmissions.postId], references: [posts.id] }),
  reviewer: one(users, { fields: [adSubmissions.reviewedBy], references: [users.id] }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  user: one(users, { fields: [payouts.userId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
  subscription: one(subscriptions, { fields: [invoices.subscriptionId], references: [subscriptions.id] }),
}));

// Insert schemas
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertUserProfileSchema = createInsertSchema(users).pick({
  username: true,
  displayName: true,
  bio: true,
  country: true,
  city: true,
  homeCountry: true,
  homeCity: true,
  lat: true,
  lng: true,
  showOnMap: true,
  locationRadius: true,
  languages: true,
  interests: true,
  instagramUrl: true,
  youtubeUrl: true,
  tiktokUrl: true,
  canDmMe: true,
}).extend({
  languages: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

export const insertConnectRequestSchema = createInsertSchema(connectRequests).pick({
  toUserId: true,
  message: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  threadId: true,
  toUserId: true,
  body: true,
  mediaUrl: true,
  mediaType: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  body: true,
  mediaType: true,
  mediaUrls: true,
  country: true,
  city: true,
  visibility: true,
}).extend({
  mediaUrls: z.array(z.string()).optional(),
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  type: true,
  country: true,
  city: true,
  venue: true,
  startsAt: true,
  endsAt: true,
  capacity: true,
  visibility: true,
});

export const insertAdSchema = createInsertSchema(ads).pick({
  brand: true,
  title: true,
  briefMd: true,
  countries: true,
  hashtags: true,
  payoutAmount: true,
  currency: true,
  deadlineAt: true,
  quota: true,
}).extend({
  countries: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
});

export const insertReportSchema = createInsertSchema(reports).pick({
  targetType: true,
  targetId: true,
  reason: true,
  description: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type ConnectRequest = typeof connectRequests.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type Ad = typeof ads.$inferSelect;
export type AdReservation = typeof adReservations.$inferSelect;
export type AdSubmission = typeof adSubmissions.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
