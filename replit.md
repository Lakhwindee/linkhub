# Overview

HubLink is a tourism-social platform that connects travelers and creators globally. The application enables users to discover each other, follow profiles, send connect requests, chat, post to a global feed, plan events, and earn money through brand advertising campaigns. The platform operates on a freemium model with three tiers: Free (browse-only), Traveler (£25/mo), and Creator/Earner (£45/mo), supporting both UK (£) and India (₹) markets.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

**September 2025 - Plan-Based Feature Differentiation**
- Updated Dashboard.tsx to properly show features based on user's subscription plan:
  - **Free Plan Users**: See limited features with upgrade prompts for premium content
  - **Premium Plan Users**: Access to full feature set including Creator Dashboard, events, messaging, and map
- Implemented plan-specific welcome messages and feature descriptions
- Added visual indicators (🔒) and upgrade buttons for locked features on free plan
- Creator Dashboard now only shows for premium users, replaced with upgrade prompt for free users
- Quick Actions section differentiates between free (locked features) and premium (full access)
- Top action buttons include locked state for Discover Map feature on free plan

**September 2025 - Instagram-like User Profile Feature**
- Implemented Instagram-style user profile pages accessible via clickable usernames in the feed
- Created comprehensive UserProfile.tsx component with responsive design featuring:
  - User stats (posts, followers, following) displayed prominently
  - Instagram-like tabs for Posts, Photos, and Liked content  
  - Clickable usernames in both compact and full PostCard layouts
  - Social media links integration (Instagram, YouTube)
  - Follow/unfollow functionality and messaging buttons
  - Bio, location, interests, and languages display
  - Grid layout for photo gallery view with hover effects
- Enhanced social discovery by making all usernames in feed clickable to navigate to profiles
- Added new route `/profile/:userId` to support dynamic user profile viewing

**September 2025 - Platform Fee System Implementation**
- Implemented 10% platform fee across all booking services:
  - Stays bookings: 10% fee on accommodation prices  
  - Tour packages (trips): 10% fee on trip booking prices
  - Ads: 10% fee already existed and maintained in publisher campaigns
- Created reusable PlatformFeeBreakdown.tsx component for consistent fee display
- Created BookingConfirmation.tsx component for unified booking confirmations
- Enhanced server-side audit logging to track platform fees for all services
- All fees calculated server-side with proper validation and error handling

**September 2025 - Location Data Standardization**  
- Replaced all hardcoded country/city dropdowns with real-world data (250+ countries)
- Updated Map.tsx, Stays.tsx, AdMarketplace.tsx, Feed.tsx, DiscoverTravelers.tsx with comprehensive global coverage
- Integrated worldCountries data from locationData.ts across all location-based features

**September 2025 - Ad Creation & Display Consistency**
- Enhanced Publisher ad creation form with missing fields:
  - Countries/locations selection with real-world data
  - Campaign hashtags with live preview
  - Campaign deadline date picker  
- Perfect consistency between publisher ad creation and creator ad viewing experience

**September 2025 - Critical Security Enhancement**
- Implemented continuous YouTube channel verification system
- Added fraud prevention for campaign access - prevents "friend's channel" verification abuse
- Real-time verification code checking during campaign reservation and submission
- Automatic user de-verification if verification code is removed from channel description

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark/light theme support
- **State Management**: TanStack Query (React Query) for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **File Uploads**: Custom ObjectUploader component with Uppy integration

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit-based OpenID Connect with session management
- **Real-time**: WebSocket support for live messaging
- **File Storage**: Google Cloud Storage with custom ACL system
- **API Design**: RESTful endpoints with consistent error handling

## Data Storage
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle Kit for migrations and schema definitions
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **File Storage**: Google Cloud Storage with custom object access control policies
- **Caching**: TanStack Query for client-side caching with infinite stale time

## Authentication & Authorization
- **Provider**: Replit OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage
- **Authorization**: Role-based access control (admin, superadmin, moderator, user)
- **Plan-based Features**: Free, Traveler, Creator subscription tiers
- **Security**: HTTPS-only cookies, CSRF protection, secure session configuration

# External Dependencies

## Payment Processing
- **Stripe**: Complete payment infrastructure for subscriptions, invoices, and creator payouts
- **Integration**: @stripe/stripe-js and @stripe/react-stripe-js for client-side payments
- **Webhooks**: Server-side webhook handling for payment status updates

## Cloud Services
- **Database**: Neon PostgreSQL serverless for primary data storage
- **File Storage**: Google Cloud Storage via Replit sidecar for media files
- **Authentication**: Replit OpenID Connect service
- **Hosting**: Replit deployment platform with development tooling

## Location Services
- **Geolocation**: Browser geolocation API for user positioning

## Development Tools
- **Build System**: Vite with React plugin and custom development middleware
- **Code Quality**: TypeScript strict mode, ESLint configuration
- **Development**: Replit-specific tooling including cartographer and runtime error overlay
- **Font Loading**: Google Fonts for Inter, Geist, and custom typography