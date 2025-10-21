# Overview

HubLink is a tourism-social platform that connects travelers and creators globally. It enables users to discover, follow, connect, chat, post to a global feed, plan events, and earn money through brand advertising campaigns. The platform supports a multi-tier role system, including various free and premium creator plans, with specific support for UK (£) and India (₹) markets. The business vision is to become a leading global platform for travel-focused social interaction and content monetization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript (Vite build tool)
- **UI Library**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS (dark/light theme support)
- **State Management**: TanStack Query (server state), React hooks (local state)
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **File Uploads**: Custom ObjectUploader with Uppy integration

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database ORM**: Drizzle ORM (PostgreSQL dialect)
- **Authentication**: Replit OpenID Connect (session management)
- **Real-time**: WebSocket support
- **File Storage**: Google Cloud Storage (custom ACL)
- **API Design**: RESTful with consistent error handling

## Data Storage
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle Kit
- **Session Storage**: PostgreSQL-backed sessions (connect-pg-simple)
- **File Storage**: Google Cloud Storage (custom ACL policies)
- **Tax Management**: tax_configuration (country tax rates) and tax_records (complete audit trail) tables

## Authentication & Authorization
- **Provider**: Replit OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Authorization**: Role-based access control (admin, superadmin, moderator, user)
- **Plan-based Features**: Free, Traveler, Creator subscription tiers

## UI/UX Decisions
- Modern, professional interface with comprehensive admin panel.
- Instagram-like user profiles with tabs for posts, photos, and liked content.
- Tab-based navigation for integrated booking management within service pages (Stays, Tour Packages).
- Plan-specific feature differentiation and upgrade prompts for free users.
- Consistent platform fee breakdown and booking confirmation components.

## Technical Implementations
- 10% platform fee applied across all booking services.
- **Worldwide Tax System** (Implemented October 2025):
  - Automatic tax calculation and withholding for creator campaign earnings based on country of residence
  - Database: tax_configurations table for country tax rates, tax_records table for complete audit trail
  - Wallet tracking: totalEarnedMinor (gross), totalTaxWithheldMinor (tax), balanceMinor (net)
  - Admin features: Add/manage country tax rates, view all tax records, export tax reports
  - Creator features: Tax summary card in billing page showing gross earnings, tax withheld, and net received
  - **Comprehensive Coverage**: 177+ countries pre-configured with accurate tax rates (based on PWC, KPMG, Deloitte 2025 data)
  - Regional breakdown: Europe (38+), Americas (26+), Asia (29+), Middle East (17+), Africa (40+), Oceania (14+)
  - Major economies configured: UK (20%), India (10%), US (30%), Canada (15%), Australia (10%), Germany (26.38%), France (20%), China (10%), Japan (20.42%), Brazil (15%)
  - Tax calculation flow: On campaign approval → calculate tax → update wallet → create tax record
  - Full compliance support with currency handling and detailed audit trail
- Continuous YouTube channel verification with fraud prevention.
- Standardized location data using real-world country/city information.
- Enhanced financial management in admin panel including revenue overview, service breakdown, payout management, and tax reporting.
- Complete removal of OpenAI/ChatGPT and PayPal integrations to streamline functionality and standardize on Stripe.

# External Dependencies

## Payment Processing
- **Stripe**: For subscriptions, invoices, and creator payouts.

## Cloud Services
- **Neon**: PostgreSQL serverless database.
- **Google Cloud Storage**: For media file storage.
- **Replit OpenID Connect**: For authentication.
- **Replit**: Deployment platform.

## Location Services
- **Browser Geolocation API**: For user positioning.

## Development Tools
- **Vite**: Build system.
- **Google Fonts**: For typography (Inter, Geist).