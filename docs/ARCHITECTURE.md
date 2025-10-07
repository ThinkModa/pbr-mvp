# Architecture Overview

## System Architecture

### Frontend Applications
- **Mobile App** (Expo React Native)
  - Target: iOS App Store, Google Play Store
  - Navigation: Expo Router
  - State: Zustand + React Query
  - UI: NativeBase/Tamagui with custom components

- **Web Admin** (Next.js)
  - Target: Vercel deployment
  - Framework: Next.js 14 with App Router
  - Styling: Tailwind CSS
  - State: Zustand + React Query

### Backend Services
- **Supabase** (Primary Backend)
  - Database: PostgreSQL with Row Level Security (RLS)
  - Authentication: Supabase Auth with custom claims
  - Real-time: WebSocket connections for chat and RSVP updates
  - Storage: Object storage for media with CDN
  - Edge Functions: Serverless functions for complex operations

### Data Flow
1. **Authentication**: Supabase Auth → JWT tokens → RLS policies
2. **Real-time**: WebSocket → Supabase Realtime → Client state updates
3. **Media**: Upload → Supabase Storage → Thumbnail generation → CDN
4. **Notifications**: APNs/FCM → Expo Notifications → Device push

## Database Schema

### Core Entities
- **Users**: Authentication, profile, preferences
- **Organizations**: Business entities with admin users
- **Events**: Event details, scheduling, location
- **Activities**: Event sub-items (sessions, workshops)
- **RSVPs**: User event participation tracking
- **ChatThreads**: Chat groups and DMs
- **ChatMessages**: Real-time messaging
- **ChatMemberships**: User thread participation
- **AuditLog**: Admin action tracking
- **MediaObjects**: File uploads and metadata

### Relationships
- Users belong to Organizations (many-to-many)
- Events belong to Organizations (many-to-one)
- Activities belong to Events (many-to-one)
- RSVPs link Users to Events/Activities (many-to-many)
- ChatThreads can be Event-specific or general
- ChatMessages belong to ChatThreads (many-to-one)

## Security Model

### Row Level Security (RLS)
- **Users**: Can only access their own data
- **Organizations**: Members can view, admins can edit
- **Events**: Public read, org admins can edit
- **Chat**: Members can access their threads
- **AuditLog**: Admin-only access

### Role-Based Access Control (RBAC)
- **Admin**: System-wide access, can create events/chat groups
- **Business**: Organization management, event creation
- **General**: Event participation, chat access

## Real-time Features

### WebSocket Connections
- **Chat Messages**: Instant delivery with typing indicators
- **RSVP Updates**: Live attendance counts
- **Event Updates**: Real-time event modifications
- **Notifications**: Push notification triggers

### State Management
- **Optimistic Updates**: Immediate UI feedback
- **Conflict Resolution**: Last-write-wins with timestamps
- **Offline Support**: Local storage with sync on reconnect

## Performance Considerations

### Caching Strategy
- **API Responses**: React Query with stale-while-revalidate
- **Images**: CDN with automatic optimization
- **Database**: Connection pooling and query optimization

### Mobile Optimization
- **Bundle Splitting**: Route-based code splitting
- **Image Optimization**: Automatic resizing and WebP conversion
- **Background Sync**: Queue operations when offline

## Monitoring & Observability

### Logging
- **Application Logs**: Structured logging with correlation IDs
- **Audit Logs**: All admin actions with before/after snapshots
- **Error Tracking**: Sentry integration for crash reporting

### Metrics
- **Performance**: Core Web Vitals for web, app performance for mobile
- **Business**: Event attendance, chat engagement, user retention
- **Infrastructure**: Database performance, API response times
