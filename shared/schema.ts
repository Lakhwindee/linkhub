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
  role: varchar("role").default("traveler"), // traveler, stays, promotional, tour_package, publisher, admin, superadmin
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

// Conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").references(() => users.id, { onDelete: "cascade" }),
  user2Id: varchar("user2_id").references(() => users.id, { onDelete: "cascade" }),
  lastMessageId: varchar("last_message_id"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  fromUserId: varchar("from_user_id").references(() => users.id, { onDelete: "cascade" }),
  body: text("body"),
  mediaUrl: varchar("media_url"),
  mediaType: varchar("media_type"), // image, video, file
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group conversations for trips
export const groupConversations = pgTable("group_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  lastMessageId: varchar("last_message_id"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group conversation participants
export const groupConversationParticipants = pgTable("group_conversation_participants", {
  conversationId: varchar("conversation_id").references(() => groupConversations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  role: varchar("role").default("member"), // admin, member
}, (table) => ({
  pk: primaryKey({ columns: [table.conversationId, table.userId] }),
}));

// Group messages
export const groupMessages = pgTable("group_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => groupConversations.id, { onDelete: "cascade" }),
  fromUserId: varchar("from_user_id").references(() => users.id, { onDelete: "cascade" }),
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
  publisherId: varchar("publisher_id").references(() => users.id), // null for admin-created, user ID for publisher-created
  brand: varchar("brand").notNull(),
  title: varchar("title").notNull(),
  briefMd: text("brief_md").notNull(),
  countries: text("countries").array(),
  hashtags: text("hashtags").array(),
  payoutAmount: decimal("payout_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  deadlineAt: timestamp("deadline_at").notNull(),
  quota: integer("quota").default(1),
  currentReservations: integer("current_reservations").default(0),
  status: varchar("status").default("active"), // active, paused, completed
  // Publisher-specific fields for tier system
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }),
  tierLevel: integer("tier_level"), // 1: $120, 2: $240, 3: $360
  maxInfluencers: integer("max_influencers"),
  adImageUrl: varchar("ad_image_url"), // uploaded ad creative
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

// Stays
export const stays = pgTable("stays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: varchar("host_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // room, apartment, house, villa, etc
  country: varchar("country").notNull(),
  city: varchar("city").notNull(),
  address: text("address"),
  lat: real("lat"),
  lng: real("lng"),
  pricePerNight: decimal("price_per_night", { precision: 10, scale: 2 }), // Nullable for free stays
  currency: varchar("currency").default("GBP"),
  maxGuests: integer("max_guests").default(1),
  bedrooms: integer("bedrooms").default(1),
  bathrooms: integer("bathrooms").default(1),
  amenities: text("amenities").array(), // wifi, kitchen, parking, pool, etc
  imageUrls: text("image_urls").array(),
  houseRules: text("house_rules"),
  checkInTime: varchar("check_in_time").default("15:00"),
  checkOutTime: varchar("check_out_time").default("11:00"),
  minimumStay: integer("minimum_stay").default(1), // minimum nights
  maximumStay: integer("maximum_stay"), // maximum nights (null for unlimited)
  instantBooking: boolean("instant_booking").default(false),
  contactInfo: text("contact_info"), // phone, whatsapp, etc
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
  status: varchar("status").default("active"), // active, paused, archived
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stay bookings
export const stayBookings = pgTable("stay_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stayId: varchar("stay_id").references(() => stays.id, { onDelete: "cascade" }),
  guestId: varchar("guest_id").references(() => users.id, { onDelete: "cascade" }),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  guests: integer("guests").default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("GBP"),
  message: text("message"), // guest message to host
  status: varchar("status").default("pending"), // pending, confirmed, cancelled, completed
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, refunded
  createdAt: timestamp("created_at").defaultNow(),
});

// Stay reviews
export const stayReviews = pgTable("stay_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stayId: varchar("stay_id").references(() => stays.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").references(() => stayBookings.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  cleanliness: integer("cleanliness"), // 1-5
  communication: integer("communication"), // 1-5
  location: integer("location"), // 1-5
  value: integer("value"), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
});

// Trips for travel planning and group travel
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizerId: varchar("organizer_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  fromCountry: varchar("from_country").notNull(),
  fromCity: varchar("from_city").notNull(),
  toCountry: varchar("to_country").notNull(),
  toCity: varchar("to_city").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxTravelers: integer("max_travelers").default(10),
  currentTravelers: integer("current_travelers").default(1), // organizer is included
  budget: varchar("budget"), // "low", "medium", "high" or specific amount
  travelStyle: varchar("travel_style"), // "backpacker", "comfort", "luxury", "adventure"
  tags: text("tags").array(), // "photography", "food", "culture", "nightlife", etc
  meetupLocation: text("meetup_location"), // where to meet before trip
  itinerary: jsonb("itinerary"), // detailed day-by-day plan
  accommodations: jsonb("accommodations"), // planned stays per city/day
  transportation: jsonb("transportation"), // flight/transport details
  budgetBreakdown: jsonb("budget_breakdown"), // detailed budget planning
  activities: jsonb("activities"), // planned activities per day
  documents: text("documents").array(), // required documents/visas
  packingList: text("packing_list").array(), // suggested packing items
  weatherInfo: jsonb("weather_info"), // expected weather conditions
  emergencyContacts: jsonb("emergency_contacts"), // emergency contact info
  travelInsurance: jsonb("travel_insurance"), // insurance details
  requirements: text("requirements"), // age, experience, etc
  isPublic: boolean("is_public").default(true),
  requiresApproval: boolean("requires_approval").default(false),
  status: varchar("status").default("planning"), // planning, confirmed, ongoing, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trip participants/joiners
export const tripParticipants = pgTable("trip_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
  status: varchar("status").default("confirmed"), // pending, confirmed, declined, removed
  message: text("message"), // join request message
  role: varchar("role").default("participant"), // organizer, co-organizer, participant
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
  conversations1: many(conversations, { relationName: "user1" }),
  conversations2: many(conversations, { relationName: "user2" }),
  sentMessages: many(messages, { relationName: "fromUser" }),
  posts: many(posts),
  reports: many(reports),
  hostedEvents: many(events),
  eventRsvps: many(eventRsvps),
  adReservations: many(adReservations),
  wallet: one(wallets),
  payouts: many(payouts),
  subscriptions: many(subscriptions),
  invoices: many(invoices),
  hostedStays: many(stays),
  stayBookings: many(stayBookings),
  stayReviews: many(stayReviews),
  organizedTrips: many(trips),
  tripParticipations: many(tripParticipants),
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

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user1: one(users, { fields: [conversations.user1Id], references: [users.id], relationName: "user1" }),
  user2: one(users, { fields: [conversations.user2Id], references: [users.id], relationName: "user2" }),
  messages: many(messages),
  lastMessage: one(messages, { fields: [conversations.lastMessageId], references: [messages.id], relationName: "lastMessage" }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  fromUser: one(users, { fields: [messages.fromUserId], references: [users.id], relationName: "fromUser" }),
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

export const staysRelations = relations(stays, ({ one, many }) => ({
  host: one(users, { fields: [stays.hostId], references: [users.id] }),
  bookings: many(stayBookings),
  reviews: many(stayReviews),
}));

export const stayBookingsRelations = relations(stayBookings, ({ one, many }) => ({
  stay: one(stays, { fields: [stayBookings.stayId], references: [stays.id] }),
  guest: one(users, { fields: [stayBookings.guestId], references: [users.id] }),
  reviews: many(stayReviews),
}));

export const stayReviewsRelations = relations(stayReviews, ({ one }) => ({
  stay: one(stays, { fields: [stayReviews.stayId], references: [stays.id] }),
  booking: one(stayBookings, { fields: [stayReviews.bookingId], references: [stayBookings.id] }),
  reviewer: one(users, { fields: [stayReviews.reviewerId], references: [users.id] }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  organizer: one(users, { fields: [trips.organizerId], references: [users.id] }),
  participants: many(tripParticipants),
}));

export const tripParticipantsRelations = relations(tripParticipants, ({ one }) => ({
  trip: one(trips, { fields: [tripParticipants.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripParticipants.userId], references: [users.id] }),
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

export const insertConversationSchema = createInsertSchema(conversations).pick({
  user1Id: true,
  user2Id: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
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

// Publisher ad creation schema
export const insertPublisherAdSchema = createInsertSchema(ads).pick({
  brand: true,
  title: true,
  briefMd: true,
  countries: true,
  hashtags: true,
  currency: true,
  deadlineAt: true,
  totalBudget: true,
  tierLevel: true,
  adImageUrl: true,
}).extend({
  countries: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  totalBudget: z.coerce.number().min(120, "Minimum budget is $120"),
  tierLevel: z.number().min(1).max(3),
});

export const insertReportSchema = createInsertSchema(reports).pick({
  targetType: true,
  targetId: true,
  reason: true,
  description: true,
});

export const insertStaySchema = createInsertSchema(stays).pick({
  title: true,
  description: true,
  type: true,
  country: true,
  city: true,
  address: true,
  lat: true,
  lng: true,
  pricePerNight: true,
  currency: true,
  maxGuests: true,
  bedrooms: true,
  bathrooms: true,
  amenities: true,
  imageUrls: true,
  houseRules: true,
  checkInTime: true,
  checkOutTime: true,
  minimumStay: true,
  maximumStay: true,
  instantBooking: true,
  contactInfo: true,
  availableFrom: true,
  availableTo: true,
}).extend({
  amenities: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
});

export const insertStayBookingSchema = createInsertSchema(stayBookings).pick({
  stayId: true,
  checkInDate: true,
  checkOutDate: true,
  guests: true,
  message: true,
});

export const insertStayReviewSchema = createInsertSchema(stayReviews).pick({
  stayId: true,
  bookingId: true,
  rating: true,
  comment: true,
  cleanliness: true,
  communication: true,
  location: true,
  value: true,
});

export const insertTripSchema = createInsertSchema(trips).pick({
  title: true,
  description: true,
  fromCountry: true,
  fromCity: true,
  toCountry: true,
  toCity: true,
  startDate: true,
  endDate: true,
  maxTravelers: true,
  budget: true,
  travelStyle: true,
  tags: true,
  meetupLocation: true,
  itinerary: true,
  requirements: true,
  isPublic: true,
  requiresApproval: true,
}).extend({
  tags: z.array(z.string()).optional(),
});

export const insertTripParticipantSchema = createInsertSchema(tripParticipants).pick({
  tripId: true,
  message: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type ConnectRequest = typeof connectRequests.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type GroupConversation = typeof groupConversations.$inferSelect;
export type GroupConversationParticipant = typeof groupConversationParticipants.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
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
export type Stay = typeof stays.$inferSelect;
export type StayBooking = typeof stayBookings.$inferSelect;
export type StayReview = typeof stayReviews.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type TripParticipant = typeof tripParticipants.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
