# PBR MVP

A mobile-first app with web admin interface implementing Events, Chat, and Profile features with comprehensive RBAC and real-time capabilities.

## Architecture

- **Mobile App**: Expo React Native (iOS/Android)
- **Web Admin**: Next.js (Vercel deployment)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Build System**: Turborepo monorepo
- **Testing**: Vitest (unit), Playwright (web e2e), Detox (mobile e2e)

## Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Project Structure

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

## Development Workflow

1. **Validate specs**: Read `/docs/*.md`, `/api/openapi.yaml`, `/db/migrations/*`, `/infra/*.*`
2. **Propose plan**: Generate `PLAN.md` with steps and file diffs
3. **Implement**: Small slices with tests first
4. **Test**: Run all checks locally (lint, typecheck, unit, e2e)
5. **Deploy**: Create PR with acceptance criteria mapping

## Roles & Permissions

- **Admin**: Full system access, can create events and chat groups
- **Business**: Manage their organization, events, and members
- **General**: End user with event participation and chat access

## Key Features

- **Events**: Upcoming/My Events, Event Detail, RSVP, Calendar integration
- **Profile**: User/Org profiles, stats, saved events, follow/message
- **Chat**: Groups, DMs, org announcements, real-time delivery
- **Safety**: Report/block/mute, rate limiting, audit logs

## Environment Setup

Copy `.env.example` to `.env.local` and configure:
- Supabase URL and keys
- Expo/EAS configuration
- Vercel deployment settings

## Deployment

- **Mobile**: EAS Build for iOS App Store and Google Play
- **Web**: Vercel automatic deployment from main branch
- **Environments**: dev, staging, prod with separate configurations
