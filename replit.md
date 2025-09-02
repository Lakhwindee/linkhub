# Overview

HubLink is a tourism-social platform that connects travelers and creators globally. The application enables users to discover each other, follow profiles, send connect requests, chat, post to a global feed, plan events, and earn money through brand advertising campaigns. The platform operates on a freemium model with three tiers: Free (browse-only), Traveler (£25/mo), and Creator/Earner (£45/mo), supporting both UK (£) and India (₹) markets.

# User Preferences

Preferred communication style: Simple, everyday language.

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