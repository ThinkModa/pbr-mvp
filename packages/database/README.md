# Database Package

This package contains the database schema, migrations, and utilities for the PBR MVP application.

## Overview

- **ORM**: Drizzle ORM with PostgreSQL
- **Database**: Supabase (PostgreSQL with RLS)
- **Type Safety**: Full TypeScript support with generated types
- **Migrations**: SQL-based migrations with version control

## Structure

```
packages/database/
├── src/
│   ├── schema/           # Drizzle schema definitions
│   │   ├── users.ts
│   │   ├── organizations.ts
│   │   ├── events.ts
│   │   ├── rsvps.ts
│   │   ├── chat.ts
│   │   ├── audit.ts
│   │   ├── media.ts
│   │   └── index.ts
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Database utilities
│   ├── db.ts             # Database connection
│   └── index.ts          # Main exports
├── migrations/           # SQL migration files
│   ├── 001_initial_schema.sql
│   ├── 002_add_rls_policies.sql
│   └── 003_seed_dev_data.sql
├── scripts/              # Database management scripts
│   ├── setup.sh
│   └── reset.sh
└── drizzle.config.ts     # Drizzle configuration
```

## Database Schema

### Core Entities

- **Users**: Authentication, profiles, roles (admin, business, general)
- **Organizations**: Business entities with admin users
- **Events**: Event details, scheduling, location
- **Activities**: Event sub-items (sessions, workshops)
- **RSVPs**: User event participation tracking
- **Chat**: Real-time messaging system
- **Media**: File uploads and metadata
- **Audit**: Admin action tracking

### Relationships

- Users belong to Organizations (many-to-many)
- Events belong to Organizations (many-to-one)
- Activities belong to Events (many-to-one)
- RSVPs link Users to Events/Activities (many-to-many)
- Chat threads can be Event-specific or general

## Setup

### Prerequisites

- PostgreSQL database (Supabase recommended)
- Node.js 18+
- Environment variables configured

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@host:port/database
# or
SUPABASE_DATABASE_URL=postgresql://user:password@host:port/database

# Optional
NODE_ENV=development
```

### Installation

```bash
# Install dependencies
npm install

# Set up database
./scripts/setup.sh

# Generate types (when drizzle-kit is available)
npm run generate
```

## Usage

### Basic Database Connection

```typescript
import { db } from '@pbr/database';

// Query users
const users = await db.select().from(users);

// Insert new user
const newUser = await db.insert(users).values({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'general'
});
```

### Type-Safe Queries

```typescript
import { db, users, events } from '@pbr/database';
import { eq, gte } from 'drizzle-orm';

// Get upcoming events
const upcomingEvents = await db
  .select()
  .from(events)
  .where(gte(events.startTime, new Date()))
  .orderBy(asc(events.startTime));
```

### Validation

```typescript
import { insertUserSchema } from '@pbr/database';

// Validate data before insertion
const userData = insertUserSchema.parse({
  email: 'user@example.com',
  name: 'John Doe'
});
```

## Row Level Security (RLS)

Simple and flexible RLS policies are enabled on all tables:

- **Users**: Can only access their own data, admins can see all
- **Organizations**: Public read, members can update
- **Events**: Public read, organization members can manage
- **Chat**: Members can access their threads
- **Audit Logs**: Admin-only access
- **Media**: Users manage their own uploads, public media viewable by all

## Scripts

### Setup Database
```bash
./scripts/setup.sh
```
Runs all migrations and optionally seeds development data.

### Reset Database
```bash
./scripts/reset.sh
```
⚠️ **WARNING**: Drops all tables and data. Use with caution.

### Generate Types
```bash
npm run generate
```
Generates TypeScript types from the database schema.

### Database Studio
```bash
npm run studio
```
Opens Drizzle Studio for database exploration.

## Development

### Adding New Tables

1. Create schema file in `src/schema/`
2. Export from `src/schema/index.ts`
3. Create migration SQL file
4. Update RLS policies if needed
5. Generate types: `npm run generate`

### Migration Best Practices

- Use descriptive names: `001_initial_schema.sql`
- Make migrations idempotent (can run multiple times)
- Test migrations on development data
- Always backup production data before running migrations

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check DATABASE_URL format
2. **RLS Policy Errors**: Policies are simple - check user roles
3. **Type Errors**: Regenerate types after schema changes
4. **Migration Failures**: Check for foreign key constraints

### Debug Mode

Set `NODE_ENV=development` for verbose logging and better error messages.

## Production Considerations

- Use connection pooling for high traffic
- Monitor query performance
- Regular database backups
- Test RLS policies thoroughly
- Use read replicas for heavy read workloads
