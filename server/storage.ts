import {
  users,
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
  type Wallet,
  type Payout,
  type Subscription,
  type Invoice,
  type Report,
  type AuditLog,
  type Stay,
  type StayBooking,
  type StayReview,
  insertStaySchema,
  insertStayBookingSchema,
  insertStayReviewSchema,
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
  getStayBookings(stayId: string): Promise<StayBooking[]>;
  getUserBookings(userId: string): Promise<StayBooking[]>;
  getHostBookings(hostId: string): Promise<StayBooking[]>;
  updateStayBookingStatus(id: string, status: string): Promise<StayBooking>;
  
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
}

// Test data for demo/development
const testUsers = [
  { id: 'test-user-1', username: 'alex_traveler', displayName: 'Alex Johnson', email: 'alex@example.com', firstName: 'Alex', lastName: 'Johnson', plan: 'traveler', city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, showOnMap: true, interests: ['photography', 'food'], profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-2', username: 'maria_creator', displayName: 'Maria Santos', email: 'maria@example.com', firstName: 'Maria', lastName: 'Santos', plan: 'creator', city: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734, showOnMap: true, interests: ['culture', 'nightlife'], profileImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-3', username: 'yuki_explorer', displayName: 'Yuki Tanaka', email: 'yuki@example.com', firstName: 'Yuki', lastName: 'Tanaka', plan: 'traveler', city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, showOnMap: true, interests: ['hiking', 'history'], profileImageUrl: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-4', username: 'raj_backpacker', displayName: 'Raj Patel', email: 'raj@example.com', firstName: 'Raj', lastName: 'Patel', plan: 'free', city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, showOnMap: true, interests: ['backpacking', 'adventure'], profileImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-5', username: 'emma_foodie', displayName: 'Emma Thompson', email: 'emma@example.com', firstName: 'Emma', lastName: 'Thompson', plan: 'creator', city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, showOnMap: true, interests: ['food', 'photography'], profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-6', username: 'lucas_surfer', displayName: 'Lucas Silva', email: 'lucas@example.com', firstName: 'Lucas', lastName: 'Silva', plan: 'traveler', city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, showOnMap: true, interests: ['adventure', 'nightlife'], profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-7', username: 'sofia_artist', displayName: 'Sofia Martinez', email: 'sofia@example.com', firstName: 'Sofia', lastName: 'Martinez', plan: 'creator', city: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, showOnMap: true, interests: ['culture', 'history'], profileImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-8', username: 'david_hiker', displayName: 'David Brown', email: 'david@example.com', firstName: 'David', lastName: 'Brown', plan: 'traveler', city: 'Denver', country: 'United States', lat: 39.7392, lng: -104.9903, showOnMap: true, interests: ['hiking', 'adventure'], profileImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-9', username: 'anna_blogger', displayName: 'Anna Kowalski', email: 'anna@example.com', firstName: 'Anna', lastName: 'Kowalski', plan: 'creator', city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050, showOnMap: true, interests: ['photography', 'culture'], profileImageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-10', username: 'tom_wanderer', displayName: 'Tom Wilson', email: 'tom@example.com', firstName: 'Tom', lastName: 'Wilson', plan: 'free', city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, showOnMap: true, interests: ['backpacking', 'food'], profileImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face' },
  // Korean test users
  { id: 'test-user-11', username: 'ji_min_seoul', displayName: 'Ji-Min Park', email: 'jimin@example.com', firstName: 'Ji-Min', lastName: 'Park', plan: 'creator', city: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780, showOnMap: true, interests: ['k-pop', 'food'], profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
  { id: 'test-user-12', username: 'hyun_busan', displayName: 'Hyun-Woo Kim', email: 'hyun@example.com', firstName: 'Hyun-Woo', lastName: 'Kim', plan: 'traveler', city: 'Busan', country: 'South Korea', lat: 35.1796, lng: 129.0756, showOnMap: true, interests: ['beaches', 'photography'], profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }
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

// Test connection requests for demo user
const testConnectRequests = [
  { id: 'req-1', fromUserId: 'test-user-2', toUserId: 'demo-user-1', message: 'Hi! I found you on HubLink and would love to connect! I see we both love photography and food.', status: 'pending', createdAt: new Date('2024-09-02T10:30:00Z') },
  { id: 'req-2', fromUserId: 'test-user-3', toUserId: 'demo-user-1', message: 'Hello! I noticed you on the map and thought we could share travel experiences. I love exploring new cultures!', status: 'pending', createdAt: new Date('2024-09-02T14:15:00Z') },
  { id: 'req-3', fromUserId: 'test-user-5', toUserId: 'demo-user-1', message: 'Bonjour! Fellow food lover here 🍽️ Would love to exchange restaurant recommendations and maybe explore together!', status: 'pending', createdAt: new Date('2024-09-02T16:45:00Z') }
];

const testStays = [
  { 
    id: 'stay-1', 
    hostId: 'test-user-1', 
    title: 'Cozy London Hostel', 
    description: 'Budget-friendly hostel in the heart of London with shared kitchen and common areas.', 
    type: 'hostel', 
    country: 'United Kingdom', 
    city: 'London', 
    lat: 51.4994, 
    lng: -0.1746, 
    pricePerNight: 25.00, 
    currency: 'GBP', 
    maxGuests: 1, 
    bedrooms: 1, 
    bathrooms: 1, 
    amenities: ['wifi', 'kitchen', 'laundry'], 
    status: 'active',
    createdAt: new Date('2024-09-01T10:00:00Z'),
    updatedAt: new Date('2024-09-01T10:00:00Z')
  },
  { 
    id: 'stay-2', 
    hostId: 'test-user-2', 
    title: 'Barcelona Artist Apartment', 
    description: 'Creative space in Gothic Quarter, perfect for artists and photographers.', 
    type: 'apartment', 
    country: 'Spain', 
    city: 'Barcelona', 
    lat: 41.4036, 
    lng: 2.1744, 
    pricePerNight: 45.00, 
    currency: 'EUR', 
    maxGuests: 2, 
    bedrooms: 1, 
    bathrooms: 1, 
    amenities: ['wifi', 'kitchen', 'art_supplies'], 
    status: 'active',
    createdAt: new Date('2024-09-01T11:00:00Z'),
    updatedAt: new Date('2024-09-01T11:00:00Z')
  },
  { 
    id: 'stay-3', 
    hostId: 'test-user-3', 
    title: 'Tokyo Traditional Guesthouse', 
    description: 'Experience authentic Japanese hospitality in traditional tatami rooms.', 
    type: 'guesthouse', 
    country: 'Japan', 
    city: 'Tokyo', 
    lat: 35.6585, 
    lng: 139.7454, 
    pricePerNight: 35.00, 
    currency: 'USD', 
    maxGuests: 2, 
    bedrooms: 1, 
    bathrooms: 1, 
    amenities: ['wifi', 'traditional_bath', 'tea_ceremony'], 
    status: 'active',
    createdAt: new Date('2024-09-01T12:00:00Z'),
    updatedAt: new Date('2024-09-01T12:00:00Z')
  },
  { 
    id: 'stay-4', 
    hostId: 'test-user-4', 
    title: 'Mumbai Backpacker Hostel', 
    description: 'Budget accommodation for backpackers exploring incredible India.', 
    type: 'hostel', 
    country: 'India', 
    city: 'Mumbai', 
    lat: 19.1136, 
    lng: 72.8697, 
    pricePerNight: 12.00, 
    currency: 'USD', 
    maxGuests: 1, 
    bedrooms: 1, 
    bathrooms: 1, 
    amenities: ['wifi', 'common_room', 'local_tours'], 
    status: 'active',
    createdAt: new Date('2024-09-01T13:00:00Z'),
    updatedAt: new Date('2024-09-01T13:00:00Z')
  },
  { 
    id: 'stay-5', 
    hostId: 'test-user-5', 
    title: 'Paris Foodie Studio', 
    description: 'Charming studio near food markets, perfect for culinary enthusiasts.', 
    type: 'studio', 
    country: 'France', 
    city: 'Paris', 
    lat: 48.8738, 
    lng: 2.2950, 
    pricePerNight: 60.00, 
    currency: 'EUR', 
    maxGuests: 2, 
    bedrooms: 1, 
    bathrooms: 1, 
    amenities: ['wifi', 'kitchen', 'food_markets_nearby'], 
    status: 'active',
    createdAt: new Date('2024-09-01T14:00:00Z'),
    updatedAt: new Date('2024-09-01T14:00:00Z')
  },
  { 
    id: 'stay-6', 
    hostId: 'test-user-6', 
    title: 'Sydney Beachside Hostel', 
    description: 'Wake up to ocean views at this beachfront hostel in Sydney.', 
    type: 'hostel', 
    country: 'Australia', 
    city: 'Sydney', 
    lat: -33.9173, 
    lng: 151.2313, 
    pricePerNight: 30.00, 
    currency: 'AUD', 
    maxGuests: 1, 
    bedrooms: 1, 
    bathrooms: 1, 
    amenities: ['wifi', 'beach_access', 'surf_boards'], 
    status: 'active',
    createdAt: new Date('2024-09-01T15:00:00Z'),
    updatedAt: new Date('2024-09-01T15:00:00Z')
  }
];

const testTrips = [
  { 
    id: 'trip-1', 
    organizerId: 'test-user-1', 
    title: 'Europe Photography Tour', 
    description: 'Join me for an amazing photography trip across Europe! We will visit iconic locations in London, Paris, and Barcelona.', 
    fromCountry: 'United Kingdom', 
    fromCity: 'London', 
    toCountry: 'Spain', 
    toCity: 'Barcelona', 
    startDate: new Date('2024-10-15'), 
    endDate: new Date('2024-10-25'), 
    maxTravelers: 6, 
    currentTravelers: 2, 
    budget: 'medium', 
    travelStyle: 'comfort', 
    tags: ['photography', 'culture', 'art'], 
    meetupLocation: 'London Heathrow Terminal 2, Departure Gate',
    requirements: 'Photography equipment and enthusiasm for capturing memories!',
    
    // Professional trip planning data
    itinerary: [
      {
        day: 1,
        date: '2024-10-15',
        city: 'London',
        activities: [
          { time: '08:00', title: 'Meet at Heathrow Terminal 2', type: 'transport' },
          { time: '10:30', title: 'Flight to Paris (EuroStar)', type: 'transport' },
          { time: '14:00', title: 'Check-in at Hotel des Grands Boulevards', type: 'accommodation' },
          { time: '16:00', title: 'Evening photography walk - Louvre & Seine', type: 'activity' }
        ],
        accommodation: { name: 'Hotel des Grands Boulevards', checkIn: '14:00', checkOut: '11:00' },
        notes: 'Bring passport and comfortable walking shoes'
      },
      {
        day: 2,
        date: '2024-10-16',
        city: 'Paris',
        activities: [
          { time: '06:00', title: 'Sunrise at Eiffel Tower', type: 'activity' },
          { time: '09:00', title: 'Photography workshop - Montmartre', type: 'activity' },
          { time: '13:00', title: 'Lunch at local bistro', type: 'meal' },
          { time: '15:00', title: 'Notre-Dame & Latin Quarter photo walk', type: 'activity' }
        ],
        accommodation: { name: 'Hotel des Grands Boulevards', staying: true },
        notes: 'Golden hour photography session at sunset'
      }
    ],
    
    accommodations: {
      'Paris': {
        hotel: 'Hotel des Grands Boulevards',
        checkIn: '2024-10-15',
        checkOut: '2024-10-17',
        nights: 2,
        roomType: 'Twin/Double rooms',
        pricePerNight: 120,
        totalCost: 240
      },
      'Barcelona': {
        hotel: 'Hotel Barcelona Center',
        checkIn: '2024-10-17',
        checkOut: '2024-10-25',
        nights: 8,
        roomType: 'Twin/Double rooms',
        pricePerNight: 95,
        totalCost: 760
      }
    },
    
    transportation: {
      outbound: {
        type: 'flight',
        from: 'London Heathrow',
        to: 'Barcelona El Prat',
        date: '2024-10-15',
        time: '10:30',
        airline: 'British Airways',
        flightNumber: 'BA477',
        cost: 180
      },
      return: {
        type: 'flight',
        from: 'Barcelona El Prat',
        to: 'London Heathrow',
        date: '2024-10-25',
        time: '18:45',
        airline: 'British Airways',
        flightNumber: 'BA478',
        cost: 195
      },
      local: [
        { city: 'Paris', type: 'Metro day pass', cost: 15 },
        { city: 'Barcelona', type: 'Public transport pass', cost: 25 }
      ]
    },
    
    budgetBreakdown: {
      accommodation: 1000,
      transportation: 400,
      meals: 350,
      activities: 200,
      photography: 150,
      misc: 100,
      total: 2200,
      currency: 'GBP',
      perPerson: true
    },
    
    activities: {
      photography: [
        'Golden hour sessions at iconic landmarks',
        'Street photography workshops',
        'Architecture and cityscape photography',
        'Portrait photography with locals'
      ],
      cultural: [
        'Museum visits with photo permissions',
        'Local market photography',
        'Historical district tours',
        'Art gallery visits'
      ]
    },
    
    documents: ['Valid passport', 'Travel insurance', 'Photography permits for certain locations'],
    packingList: ['Camera equipment', 'Tripod', 'Extra batteries', 'Memory cards', 'Comfortable walking shoes', 'Weather-appropriate clothing'],
    
    weatherInfo: {
      'Paris': { temp: '12-18°C', conditions: 'Partly cloudy, light rain possible' },
      'Barcelona': { temp: '16-22°C', conditions: 'Mostly sunny, occasional clouds' }
    },
    
    emergencyContacts: {
      tourLeader: { name: 'Alex Thompson', phone: '+44 7700 900123' },
      localEmergency: { paris: '112', barcelona: '112' }
    },
    
    isPublic: true,
    requiresApproval: false,
    status: 'planning',
    createdAt: new Date('2024-09-01T09:00:00Z'),
    updatedAt: new Date('2024-09-01T09:00:00Z')
  },
  { 
    id: 'trip-2', 
    organizerId: 'test-user-2', 
    title: 'Southeast Asia Food Adventure', 
    description: 'Explore the incredible street food scene across Thailand, Vietnam, and Malaysia!', 
    fromCountry: 'Spain', 
    fromCity: 'Barcelona', 
    toCountry: 'Thailand', 
    toCity: 'Bangkok', 
    startDate: new Date('2024-11-10'), 
    endDate: new Date('2024-11-20'), 
    maxTravelers: 8, 
    currentTravelers: 3, 
    budget: 'low', 
    travelStyle: 'backpacker', 
    tags: ['food', 'culture', 'adventure'], 
    meetupLocation: 'Barcelona Airport, Terminal 1',
    requirements: 'Open mind for spicy food and street food adventures!',
    isPublic: true,
    requiresApproval: false,
    status: 'confirmed',
    createdAt: new Date('2024-09-02T10:00:00Z'),
    updatedAt: new Date('2024-09-02T10:00:00Z')
  },
  { 
    id: 'trip-3', 
    organizerId: 'test-user-3', 
    title: 'Japan Temple & Mountain Hiking', 
    description: 'Spiritual journey through Japan\'s ancient temples and mountain trails.', 
    fromCountry: 'Japan', 
    fromCity: 'Tokyo', 
    toCountry: 'Japan', 
    toCity: 'Kyoto', 
    startDate: new Date('2024-12-05'), 
    endDate: new Date('2024-12-15'), 
    maxTravelers: 5, 
    currentTravelers: 1, 
    budget: 'medium', 
    travelStyle: 'adventure', 
    tags: ['hiking', 'spirituality', 'nature'], 
    meetupLocation: 'Tokyo Station East Exit',
    requirements: 'Good physical fitness for hiking. Hiking boots required.',
    isPublic: true,
    requiresApproval: true,
    status: 'planning',
    createdAt: new Date('2024-09-03T08:00:00Z'),
    updatedAt: new Date('2024-09-03T08:00:00Z')
  }
];

const testTripParticipants = [
  { id: 'participant-1', tripId: 'trip-1', userId: 'test-user-2', joinedAt: new Date('2024-09-01T12:00:00Z'), status: 'confirmed', message: 'Excited to join this photography adventure!', role: 'participant' },
  { id: 'participant-2', tripId: 'trip-2', userId: 'test-user-1', joinedAt: new Date('2024-09-02T14:00:00Z'), status: 'confirmed', message: 'Love food, can\'t wait!', role: 'participant' },
  { id: 'participant-3', tripId: 'trip-2', userId: 'test-user-3', joinedAt: new Date('2024-09-02T16:00:00Z'), status: 'confirmed', message: 'Perfect timing for my travels!', role: 'participant' }
];

export class DatabaseStorage implements IStorage {
  demoConversations: any[] = []; // Store demo conversations in memory
  
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
  
  async updateStayBookingStatus(id: string, status: string): Promise<StayBooking> {
    const [booking] = await db.update(stayBookings).set({ status }).where(eq(stayBookings.id, id)).returning();
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
}

export const storage = new DatabaseStorage();
