# Local Development (Testing Branch)

## Quick Start

1. Checkout testing branch:
   ```bash
   git checkout testing
   ```

2. Start local Supabase:
   ```bash
   supabase start
   ```
   
   This starts:
   - PostgreSQL on localhost:54322
   - Supabase API on localhost:54321
   - Studio on http://localhost:54323

3. Run mobile app:
   ```bash
   cd apps/mobile
   npm start
   ```

4. Use Expo Go to test

## Features
- MockAuth (no real credentials needed)
- Local Supabase (localhost:54321, localhost:54322)
- Isolated from cloud environments
- Role management testing
- Full app functionality locally

## When to Use
- Developing new features
- Testing database migrations locally
- Experimenting without affecting cloud data
- Quick iteration without building

## Environment Details

**Database**: Local PostgreSQL via Supabase CLI
**API**: Local Supabase API
**Auth**: MockAuth (EnhancedAuthContext with USE_REAL_AUTH = false)
**Mobile**: Expo Go
**Web**: Local development server

## Switching to Real Auth

To test with real Supabase auth locally:
1. Set `USE_REAL_AUTH = true` in `EnhancedAuthContext.tsx`
2. Ensure local Supabase is running
3. Use real email/password credentials

## Troubleshooting

**Supabase not starting**:
```bash
supabase stop
supabase start
```

**Port conflicts**:
- API: 54321
- DB: 54322
- Studio: 54323

**Reset local database**:
```bash
supabase db reset
```
