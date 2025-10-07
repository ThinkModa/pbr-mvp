# PBR MVP Development Plan

## Project Overview
Mobile-first app (Expo React Native) with lightweight web admin (Next.js) implementing Events, Chat, and Profile pillars with RBAC, real-time features, and comprehensive testing.

## Architecture
- **Mobile**: Expo React Native (iOS/Android via EAS)
- **Web Admin**: Next.js (deployed on Vercel)
- **Database**: Supabase (PostgreSQL with RLS)
- **Real-time**: WebSocket/Supabase Realtime
- **Notifications**: APNs/FCM via expo-notifications
- **Media**: Object storage with thumbnailing
- **CI/CD**: GitHub Actions with Detox (mobile) and Playwright (web)

## Development Phases

### Phase 1: Foundation Setup
1. Create monorepo structure with workspaces
2. Set up database schema and migrations
3. Implement API with OpenAPI specification
4. Configure development environments

### Phase 2: Core Features
1. Implement RBAC system (admin, business, general roles)
2. Build Events module (CRUD, RSVP, calendar integration)
3. Build Profile module (user/org profiles, stats)
4. Build Chat module (groups, DMs, real-time messaging)

### Phase 3: Advanced Features
1. Real-time updates and notifications
2. Media pipeline with upload/processing
3. Audit logging system
4. Safety features (report/block/mute)

### Phase 4: Testing & Deployment
1. Comprehensive test suite (unit, integration, e2e)
2. CI/CD pipeline setup
3. EAS configuration for mobile deployment
4. Vercel configuration for web deployment

## File Structure
```
/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── web-admin/       # Next.js admin interface
├── packages/
│   ├── api/             # Shared API client
│   ├── database/        # Database schema and migrations
│   ├── shared/          # Shared types and utilities
│   └── ui/              # Shared UI components
├── docs/                # Documentation
├── infra/               # Infrastructure configs
└── .github/workflows/   # CI/CD pipelines
```

## Key Decisions
- Using Supabase for backend services (auth, database, real-time, storage)
- Monorepo structure with Turborepo for build optimization
- TypeScript throughout for type safety
- Expo Router for mobile navigation
- Next.js App Router for web admin
- Tailwind CSS for styling consistency
