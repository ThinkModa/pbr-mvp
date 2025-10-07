# Architecture Decisions

## Technology Choices

### Frontend Framework
**Decision**: Expo React Native for mobile, Next.js for web admin
**Rationale**: 
- Expo provides excellent developer experience and deployment pipeline
- Next.js offers robust SSR/SSG capabilities for admin interface
- Shared TypeScript types and utilities across platforms

### Backend Services
**Decision**: Supabase as primary backend
**Rationale**:
- Integrated auth, database, real-time, and storage
- PostgreSQL with RLS provides robust security
- Real-time subscriptions work seamlessly with React
- Reduces infrastructure complexity

### State Management
**Decision**: Zustand + React Query
**Rationale**:
- Zustand: Lightweight, TypeScript-friendly state management
- React Query: Excellent caching and synchronization for server state
- Minimal boilerplate compared to Redux

### Database Design
**Decision**: PostgreSQL with Row Level Security
**Rationale**:
- RLS provides database-level security enforcement
- Complex queries and relationships well-supported
- JSON columns for flexible data structures
- Excellent performance with proper indexing

### Real-time Communication
**Decision**: Supabase Realtime with WebSocket fallback
**Rationale**:
- Built-in integration with Supabase
- Automatic reconnection and conflict resolution
- Scales well with connection pooling

### Media Handling
**Decision**: Supabase Storage with CDN
**Rationale**:
- Integrated with authentication and RLS
- Automatic image optimization and resizing
- Global CDN for fast delivery
- Cost-effective for MVP scale

### Testing Strategy
**Decision**: Vitest (unit), Playwright (web e2e), Detox (mobile e2e)
**Rationale**:
- Vitest: Fast, Vite-native testing with excellent TypeScript support
- Playwright: Reliable cross-browser testing for web
- Detox: Industry standard for React Native e2e testing

### Deployment
**Decision**: EAS for mobile, Vercel for web
**Rationale**:
- EAS: Seamless iOS/Android deployment with over-the-air updates
- Vercel: Excellent Next.js integration with automatic deployments
- Both provide staging/production environment management

## Design Patterns

### API Design
**Decision**: RESTful APIs with OpenAPI specification
**Rationale**:
- Clear contract between frontend and backend
- Automatic client generation and validation
- Easy documentation and testing

### Error Handling
**Decision**: Structured error responses with correlation IDs
**Rationale**:
- Consistent error format across all endpoints
- Easy debugging with request tracing
- User-friendly error messages with technical details for admins

### Authentication
**Decision**: JWT tokens with refresh token rotation
**Rationale**:
- Stateless authentication suitable for mobile apps
- Refresh tokens provide security without frequent re-authentication
- Supabase handles token management automatically

### Data Validation
**Decision**: Zod schemas for runtime validation
**Rationale**:
- TypeScript integration for compile-time safety
- Runtime validation for API boundaries
- Single source of truth for data shapes

## Security Decisions

### Row Level Security
**Decision**: Database-level security policies
**Rationale**:
- Security enforced at the data layer
- Prevents data leaks even with application bugs
- Fine-grained access control per user/role

### Rate Limiting
**Decision**: Application-level rate limiting with Redis
**Rationale**:
- Prevents abuse of chat and upload endpoints
- Configurable limits per user role
- Graceful degradation with user feedback

### Content Moderation
**Decision**: Report/block/mute system with admin review
**Rationale**:
- Community-driven moderation reduces admin workload
- Immediate user protection with block/mute
- Audit trail for all moderation actions

## Performance Decisions

### Caching Strategy
**Decision**: Multi-layer caching (CDN, API, Client)
**Rationale**:
- CDN for static assets and images
- API caching for frequently accessed data
- Client-side caching with React Query

### Database Optimization
**Decision**: Proper indexing and query optimization
**Rationale**:
- Composite indexes for common query patterns
- Query analysis and optimization
- Connection pooling for concurrent requests

### Mobile Performance
**Decision**: Code splitting and lazy loading
**Rationale**:
- Route-based splitting reduces initial bundle size
- Lazy loading of non-critical features
- Image optimization and progressive loading
