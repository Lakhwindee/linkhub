# Overview

HubLink is a tourism-social platform that connects travelers and creators globally. The application enables users to discover each other, follow profiles, send connect requests, chat, post to a global feed, plan events, and earn money through brand advertising campaigns. The platform operates on a comprehensive multi-tier role system with 10+ tiers including: STANDARD USER (Free), FREE_CREATOR (Free with campaign viewing), CREATOR (Standard/Premium plans £25-£45/mo), PUBLISHER (Brand campaign management), and 10 YouTube subscriber-based creator tiers (Bronze to Ultimate), supporting both UK (£) and India (₹) markets.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

**September 2025 - Booking System Restructuring**
- **Removed Main "My Bookings" Menu**: Eliminated the standalone "My Bookings" navigation item from the main menu across all user interfaces
- **Integrated Bookings Within Service Pages**: Added dedicated "My Bookings" tabs within both Stays and Tour Packages pages
- **Tab-Based Navigation**: Implemented shadcn/ui tabs component with:
  - Stays page: "Browse Stays" and "My Bookings" tabs for accommodation bookings
  - Tour Packages page: "Browse Tour Packages" and "My Bookings" tabs for trip bookings
- **Enhanced User Experience**: Users now access their bookings directly within the context of each service type
- **API Integration**: Proper connection to existing booking endpoints (`/api/my-bookings/stays` and `/api/my-bookings/tour-packages`)
- **Responsive Design**: Fully responsive tabs interface with loading states and empty state handling for users with no bookings

**September 2025 - Admin Panel Restructure & Financial Enhancement**
- **Removed Redundant Payment Accounts Menu**: Eliminated duplicate payment configuration section that overlapped with API Settings functionality
- **Enhanced Financial Management Section**: Completely rebuilt financial dashboard with comprehensive finance features:
  - Revenue overview with real-time metrics (Total, Platform Fees, Processing Fees, Net Revenue)
  - Revenue breakdown by service (Stays, Trips, Subscriptions, Ads) with percentages  
  - Payment methods analysis (Stripe, PayPal, Bank Transfer) with transaction volumes
  - Recent transactions management with status tracking and export capabilities
  - Creator payouts management with automated scheduling and processing
  - Fee configuration panel for platform and processing fee management
- **Dedicated Ad Review Section**: Created separate "Ad Review" menu for ad submission reviews with:
  - Comprehensive ad submission filtering and status management
  - Enhanced review workflow with detailed submission inspection
  - Review statistics dashboard with approval/rejection metrics
  - Streamlined review process with notes and feedback system
- **Improved Admin Navigation**: Reorganized admin panel structure for better logical flow and reduced redundancy
- **Professional Financial Interface**: Added export functionality, time-period filtering, and detailed financial reporting

**September 2025 - Professional Admin Panel Implementation**
- Completely rebuilt admin panel from basic 3-tab interface to comprehensive professional-grade platform management system
- **Sidebar Navigation**: Modern sidebar with 9 main sections (Dashboard, User Management, Content Moderation, Financial, Reports, Analytics, System Settings, Live Monitoring, Audit Logs)
- **Dashboard Section**: Real-time metrics with quick stats, recent activity feed, and growth analytics
- **User Management**: Advanced user search and filtering, bulk actions (ban/unban/role changes), comprehensive user table with status tracking
- **Analytics Dashboard**: Visual charts for user growth, revenue, and engagement metrics with detailed content performance tracking
- **API Settings Management**: Centralized configuration for all platform integrations (Stripe, PayPal, YouTube, Cloud Storage)
- **Reports & Content Moderation**: Enhanced content reports handling with investigation and action workflows
- **Future-Ready Architecture**: Placeholder sections for Content Management, System Settings, Live Monitoring, and Audit Logs
- **Professional UI/UX**: Online status indicators, refresh controls, role-based access, and responsive design

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