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
  uniqueIndex,
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
  password: varchar("password"), // bcrypt hashed password for traditional auth
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
  youtubeChannelId: varchar("youtube_channel_id"),
  youtubeSubscribers: integer("youtube_subscribers").default(0),
  youtubeTier: integer("youtube_tier").default(1), // 1: 10k-40k, 2: 40k-70k, 3: 70k+
  youtubeVerified: boolean("youtube_verified").default(false),
  youtubeVerificationCode: varchar("youtube_verification_code"),
  youtubeVerificationAttempts: integer("youtube_verification_attempts").default(0),
  youtubeLastUpdated: timestamp("youtube_last_updated"),
  tiktokUrl: varchar("tiktok_url"),
  role: varchar("role").default("traveler"), // traveler, creator, free_creator, stays, promotional, tour_package, publisher, admin, superadmin
  plan: varchar("plan").default("free"), // free, standard, premium
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeConnectAccountId: varchar("stripe_connect_account_id"), // For holding payments until bank account connected
  stripeBankAccountStatus: varchar("stripe_bank_account_status").default("not_connected"), // not_connected, pending, connected
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false),
  // Trial fields (for no-payment trials)
  trialActive: boolean("trial_active").default(false),
  trialEndDate: timestamp("trial_end_date"),
  autoDebitEnabled: boolean("auto_debit_enabled"),
  canDmMe: varchar("can_dm_me").default("all"), // all, followers, none
  // Document verification fields
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, rejected
  documentType: varchar("document_type"), // passport, driving_license
  documentUrl: varchar("document_url"), // uploaded document URL
  documentNumber: varchar("document_number"), // extracted document number
  fullName: varchar("full_name"), // extracted from document
  dateOfBirth: varchar("date_of_birth"), // extracted from document
  nationality: varchar("nationality"), // extracted from document
  expiryDate: varchar("expiry_date"), // document expiry date
  // Password reset fields
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"), // admin notes or AI confidence score
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admins table (completely separate from users for maximum security)
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // bcrypt hashed password
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Settings table (secure storage for API keys - encrypted)
export const apiSettings = pgTable("api_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: varchar("service").unique().notNull(), // stripe, youtube, maps, etc.
  settingsJson: jsonb("settings_json").notNull(), // Encrypted JSON with API keys
  isActive: boolean("is_active").default(true),
  lastTestedAt: timestamp("last_tested_at"),
  updatedBy: varchar("updated_by"), // admin ID who last updated
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
  status: varchar("status").default("active"), // active, paused, completed, pending_payment
  // Publisher-specific fields for tier system
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }),
  tierLevel: integer("tier_level"), // 10 tiers: $125 to $2500 based on follower ranges
  maxInfluencers: integer("max_influencers"),
  reservedInfluencers: integer("reserved_influencers").default(0), // Track reserved count
  completedInfluencers: integer("completed_influencers").default(0), // Track completed count
  numberOfInfluencers: integer("number_of_influencers"), // Target number from form
  adImageUrl: varchar("ad_image_url"), // uploaded ad creative
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ad reservations
export const adReservations = pgTable("ad_reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id").references(() => ads.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  status: varchar("status").default("active"), // active, expired, submitted, cancelled
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate active reservations by same user for same campaign
  uniqueUserAdReservation: uniqueIndex("unique_user_ad_active_reservation").on(table.userId, table.adId).where(sql`status = 'active'`),
}));

// Ad submissions
export const adSubmissions = pgTable("ad_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").references(() => adReservations.id, { onDelete: "cascade" }),
  postId: varchar("post_id").references(() => posts.id),
  rawFileUrl: varchar("raw_file_url"),
  contentLink: varchar("content_link"), // Direct link to creator's content (e.g., YouTube video, Instagram post)
  // Video verification fields
  originalVideoUrl: varchar("original_video_url"), // Creator's full video URL
  clipUrl: varchar("clip_url"), // Extracted clip URL showing the promotion
  clipStartTime: integer("clip_start_time"), // Seconds from video start
  clipEndTime: integer("clip_end_time"), // Seconds from video start
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, failed
  verificationScore: decimal("verification_score", { precision: 3, scale: 2 }), // 0.00-1.00 similarity score
  verificationNotes: text("verification_notes"),
  status: varchar("status").default("pending"), // pending, approved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Boosted posts (user promoting their own posts)
export const boostedPosts = pgTable("boosted_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  targetCountries: text("target_countries").array(), // targeted countries
  targetCities: text("target_cities").array(), // targeted cities
  dailyBudget: decimal("daily_budget", { precision: 10, scale: 2 }).notNull(),
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }).notNull(),
  costPerClick: decimal("cost_per_click", { precision: 10, scale: 2 }).default("0.10"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  spend: decimal("spend", { precision: 10, scale: 2 }).default("0.00"),
  status: varchar("status").default("active"), // active, paused, completed, expired
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feed ad impressions for tracking and analytics 
export const feedAdImpressions = pgTable("feed_ad_impressions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id"), // can be regular ad or boosted post
  adType: varchar("ad_type").notNull(), // 'campaign' or 'boosted_post'
  boostedPostId: varchar("boosted_post_id").references(() => boostedPosts.id),
  campaignAdId: varchar("campaign_ad_id").references(() => ads.id),
  userId: varchar("user_id"), // viewer, can be null for anonymous
  ipAddress: varchar("ip_address").notNull(),
  userAgent: varchar("user_agent"),
  country: varchar("country"), // detected from IP
  city: varchar("city"), // detected from IP
  clicked: boolean("clicked").default(false),
  viewDuration: integer("view_duration"), // seconds viewed
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallets - Enhanced with tax tracking
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  balanceMinor: integer("balance_minor").default(0), // in pence/paisa - available balance after tax
  totalEarnedMinor: integer("total_earned_minor").default(0), // total gross earnings (before tax)
  totalTaxWithheldMinor: integer("total_tax_withheld_minor").default(0), // total tax withheld
  currency: varchar("currency").default("GBP"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("20.00"), // UK: 20%, India: 10% TDS
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payouts - Enhanced with tax tracking
export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  grossAmountMinor: integer("gross_amount_minor").notNull(), // amount before tax
  taxWithheldMinor: integer("tax_withheld_minor").default(0), // tax deducted
  amountMinor: integer("amount_minor").notNull(), // net amount paid (after tax)
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("20.00"), // tax rate applied
  currency: varchar("currency").default("GBP"),
  method: varchar("method").default("stripe"), // stripe, bank-transfer
  reference: varchar("reference"),
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Global Tax Configuration - Per country tax rates (WORLDWIDE SUPPORT)
export const taxConfiguration = pgTable("tax_configuration", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  country: varchar("country").notNull().unique(), // ISO country code (GB, IN, US, FR, DE, etc.)
  countryName: varchar("country_name").notNull(), // Display name (United Kingdom, India, USA, etc.)
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull(), // Tax rate percentage (e.g., 20.00 for 20%)
  taxType: varchar("tax_type").notNull(), // Type: 'income_tax', 'withholding_tax', 'vat', 'gst'
  taxName: varchar("tax_name"), // e.g., "UK Income Tax", "India TDS", "US Federal Tax"
  enabled: boolean("enabled").default(true),
  exemptionThreshold: integer("exemption_threshold"), // Minimum earning before tax applies (in minor units)
  notes: text("notes"), // Additional tax info or requirements
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tax Records - Track all tax withholding transactions (WORLDWIDE)
export const taxRecords = pgTable("tax_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  transactionType: varchar("transaction_type").notNull(), // 'campaign_earning', 'payout', 'booking'
  transactionId: varchar("transaction_id"), // related campaign/payout/booking ID
  grossAmountMinor: integer("gross_amount_minor").notNull(), // amount before tax
  taxWithheldMinor: integer("tax_withheld_minor").notNull(), // tax amount
  netAmountMinor: integer("net_amount_minor").notNull(), // amount after tax
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull(), // tax rate applied (e.g., 20.00 for 20%)
  taxYear: integer("tax_year"), // fiscal year for reporting
  taxQuarter: integer("tax_quarter"), // quarter (1-4) for reporting
  currency: varchar("currency").default("GBP"),
  country: varchar("country"), // User's country (for tax jurisdiction)
  taxConfigId: varchar("tax_config_id").references(() => taxConfiguration.id), // Link to tax config
  description: text("description"), // e.g., "Tax withheld on campaign #123 earnings"
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

// Stay bookings - Enhanced for payment processing
export const stayBookings = pgTable("stay_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stayId: varchar("stay_id").references(() => stays.id, { onDelete: "cascade" }),
  guestId: varchar("guest_id").references(() => users.id, { onDelete: "cascade" }),
  hostId: varchar("host_id").references(() => users.id, { onDelete: "cascade" }),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  nights: integer("nights").notNull(),
  guests: integer("guests").default(1),
  // Pricing breakdown
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }), // price per night
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  fees: decimal("fees", { precision: 10, scale: 2 }).default("0"), // platform fees
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("GBP"),
  // Enhanced status management
  status: varchar("status").default("HOLD"), // HOLD, REQUIRES_PAYMENT, PROCESSING, CONFIRMED, CANCELLED, REFUNDED, EXPIRED
  paymentIntentId: varchar("payment_intent_id"), // Stripe PaymentIntent ID
  // Contact information
  contactInfo: jsonb("contact_info"), // {name, email, phone, emergencyContact}
  specialRequests: text("special_requests"),
  message: text("message"), // guest message to host
  // Cancellation policy
  cancellationPolicy: varchar("cancellation_policy").default("moderate"), // free, moderate, strict
  // Timestamps
  expiresAt: timestamp("expires_at"), // when booking hold expires
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Booking nights - for availability management and preventing double bookings
export const bookingNights = pgTable("booking_nights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => stayBookings.id, { onDelete: "cascade" }),
  stayId: varchar("stay_id").references(() => stays.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(), // the specific night being booked
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Ensure no double booking for the same stay on the same night
  index("unique_stay_date").on(table.stayId, table.date),
]);

// Payments table for Stripe transactions
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => stayBookings.id, { onDelete: "cascade" }),
  provider: varchar("provider").default("stripe"), // stripe, bank, etc
  intentId: varchar("intent_id").notNull(), // Stripe PaymentIntent ID
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull(),
  status: varchar("status").notNull(), // requires_payment_method, requires_confirmation, requires_action, processing, requires_capture, canceled, succeeded
  clientSecret: varchar("client_secret"), // for frontend payment confirmation
  metadata: jsonb("metadata"), // additional payment metadata
  rawData: jsonb("raw_data"), // full Stripe response for debugging
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhook events for idempotency
export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey(), // Stripe event ID for idempotency
  provider: varchar("provider").default("stripe"),
  eventType: varchar("event_type").notNull(),
  processed: boolean("processed").default(false),
  data: jsonb("data").notNull(), // full webhook payload
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

// Discount codes
export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique().notNull(),
  description: text("description"),
  discountType: varchar("discount_type").notNull(), // percentage, fixed_amount, trial
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  applicablePlans: text("applicable_plans").array(), // ['premium', 'free'] etc.
  // Trial-specific fields
  trialPeriodDays: integer("trial_period_days"), // How many days of trial
  trialPlanType: varchar("trial_plan_type"), // 'premium', 'creator' etc.
  autoDebitEnabled: boolean("auto_debit_enabled").default(true), // Auto-charge after trial
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Site settings for branding and configuration
export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar("setting_key").unique().notNull(),
  settingValue: text("setting_value"),
  settingType: varchar("setting_type").default("text"), // text, json, boolean, number, image
  description: text("description"),
  isPublic: boolean("is_public").default(false), // if true, can be accessed without auth
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Discount code usage tracking
export const discountCodeUsage = pgTable("discount_code_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codeId: varchar("code_id").references(() => discountCodes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  // Trial tracking
  trialGranted: boolean("trial_granted").default(false),
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  trialStatus: varchar("trial_status").default("active"), // active, expired, converted, cancelled
  usedAt: timestamp("used_at").defaultNow(),
});

// User trial tracking
export const userTrials = pgTable("user_trials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  codeUsageId: varchar("code_usage_id").references(() => discountCodeUsage.id),
  planType: varchar("plan_type").notNull(), // 'premium', 'creator'
  trialStartDate: timestamp("trial_start_date").defaultNow(),
  trialEndDate: timestamp("trial_end_date").notNull(),
  trialDays: integer("trial_days").notNull(),
  status: varchar("status").default("active"), // active, expired, converted, cancelled
  autoDebitEnabled: boolean("auto_debit_enabled").default(true),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  currency: varchar("currency").default("GBP"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  taxRecords: many(taxRecords),
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

export const taxRecordsRelations = relations(taxRecords, ({ one }) => ({
  user: one(users, { fields: [taxRecords.userId], references: [users.id] }),
  taxConfig: one(taxConfiguration, { fields: [taxRecords.taxConfigId], references: [taxConfiguration.id] }),
}));

export const taxConfigurationRelations = relations(taxConfiguration, ({ many }) => ({
  taxRecords: many(taxRecords),
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
  host: one(users, { fields: [stayBookings.hostId], references: [users.id] }),
  reviews: many(stayReviews),
  bookingNights: many(bookingNights),
  payments: many(payments),
}));

export const bookingNightsRelations = relations(bookingNights, ({ one }) => ({
  booking: one(stayBookings, { fields: [bookingNights.bookingId], references: [stayBookings.id] }),
  stay: one(stays, { fields: [bookingNights.stayId], references: [stays.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(stayBookings, { fields: [payments.bookingId], references: [stayBookings.id] }),
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

// Publisher ad creation schema - FRESH VERSION
export const insertPublisherAdSchema = z.object({
  brand: z.string().min(1, "Brand name is required"),
  title: z.string().min(1, "Campaign title is required"),
  briefMd: z.string().min(1, "Campaign description is required"),
  countries: z.array(z.string()).optional().default([]),
  hashtags: z.array(z.string()).optional().default([]),
  currency: z.string().default("USD"),
  deadlineAt: z.string().or(z.date()).transform((val) => {
    // Handle both string and Date inputs, convert to Date
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  totalBudget: z.number().min(120, "Minimum budget is $120"),
  tierLevel: z.number().min(1).max(15),
  numberOfInfluencers: z.number().min(1, "Must select at least 1 influencer"),
  adImageUrl: z.string().url("Must be a valid image URL"),
});

export const insertBoostedPostSchema = createInsertSchema(boostedPosts).pick({
  postId: true,
  targetCountries: true,
  targetCities: true,
  dailyBudget: true,
  totalBudget: true,
  startDate: true,
  endDate: true,
}).extend({
  targetCountries: z.array(z.string()).optional(),
  targetCities: z.array(z.string()).optional(),
  dailyBudget: z.number().min(1, "Daily budget must be at least $1"),
  totalBudget: z.number().min(5, "Total budget must be at least $5"),
});

export const insertFeedAdImpressionSchema = createInsertSchema(feedAdImpressions).pick({
  adId: true,
  adType: true,
  boostedPostId: true,
  campaignAdId: true,
  userId: true,
  ipAddress: true,
  userAgent: true,
  country: true,
  city: true,
  clicked: true,
  viewDuration: true,
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

// Personal Host tables
export const personalHosts = pgTable("personal_hosts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  location: varchar("location").notNull(),
  country: varchar("country").notNull(),
  city: varchar("city").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  hostType: varchar("host_type").notNull(), // 'accommodation', 'guide', 'experience', 'transport'
  priceType: varchar("price_type").notNull(), // 'free', 'paid'
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).default('0'),
  currency: varchar("currency").default("USD"),
  maxGuests: integer("max_guests").default(1),
  amenities: text("amenities").array(),
  languages: text("languages").array(),
  imageUrls: text("image_urls").array(),
  availability: jsonb("availability"), // {start: date, end: date, blockedDates: []}
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const hostBookings = pgTable("host_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: varchar("host_id").notNull().references(() => personalHosts.id, { onDelete: "cascade" }),
  guestId: varchar("guest_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  guests: integer("guests").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).default('0'),
  status: varchar("status").default("pending"), // pending, confirmed, cancelled, completed
  specialRequests: text("special_requests"),
  contactInfo: jsonb("contact_info"), // phone, email for coordination
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Tour Package Bookings
export const tourPackageBookings = pgTable("tour_package_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packageId: varchar("package_id").notNull(), // Reference to tour package ID
  guestId: varchar("guest_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  departureDate: timestamp("departure_date").notNull(),
  travelers: integer("travelers").default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).default('0'),
  currency: varchar("currency").default("USD"),
  status: varchar("status").default("confirmed"), // pending, confirmed, cancelled, completed
  specialRequests: text("special_requests"),
  contactInfo: jsonb("contact_info"), // phone, email, name for coordination
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Relations for Personal Hosts
export const personalHostsRelations = relations(personalHosts, ({ one, many }) => ({
  host: one(users, {
    fields: [personalHosts.userId],
    references: [users.id],
  }),
  bookings: many(hostBookings),
}));

export const hostBookingsRelations = relations(hostBookings, ({ one }) => ({
  host: one(personalHosts, {
    fields: [hostBookings.hostId],
    references: [personalHosts.id],
  }),
  guest: one(users, {
    fields: [hostBookings.guestId],
    references: [users.id],
  }),
}));

export const tourPackageBookingsRelations = relations(tourPackageBookings, ({ one }) => ({
  guest: one(users, {
    fields: [tourPackageBookings.guestId],
    references: [users.id],
  }),
}));

export const insertPersonalHostSchema = createInsertSchema(personalHosts).pick({
  title: true,
  description: true,
  location: true,
  country: true,
  city: true,
  lat: true,
  lng: true,
  hostType: true,
  priceType: true,
  pricePerDay: true,
  currency: true,
  maxGuests: true,
  amenities: true,
  languages: true,
  imageUrls: true,
  availability: true,
}).extend({
  amenities: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
});

export const insertHostBookingSchema = createInsertSchema(hostBookings).pick({
  hostId: true,
  checkIn: true,
  checkOut: true,
  guests: true,
  specialRequests: true,
  contactInfo: true,
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
export type BoostedPost = typeof boostedPosts.$inferSelect;
export type FeedAdImpression = typeof feedAdImpressions.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Stay = typeof stays.$inferSelect;
export type StayBooking = typeof stayBookings.$inferSelect;
export type BookingNight = typeof bookingNights.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type StayReview = typeof stayReviews.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type TripParticipant = typeof tripParticipants.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type PersonalHost = typeof personalHosts.$inferSelect;
export type HostBooking = typeof hostBookings.$inferSelect;
export type TourPackageBooking = typeof tourPackageBookings.$inferSelect;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type DiscountCodeUsage = typeof discountCodeUsage.$inferSelect;
export type UserTrial = typeof userTrials.$inferSelect;
export type TaxConfiguration = typeof taxConfiguration.$inferSelect;
export type TaxRecord = typeof taxRecords.$inferSelect;
export type ApiSetting = typeof apiSettings.$inferSelect;
