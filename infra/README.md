# Infrastructure Configuration

This directory contains infrastructure-as-code configurations for deploying the PBR MVP application.

## Environments

- **Development**: Local development with Supabase local instance
- **Staging**: Staging environment for testing before production
- **Production**: Live environment for end users

## Configuration Files

- `supabase/` - Supabase project configuration
- `vercel/` - Vercel deployment configuration
- `eas/` - EAS build and deployment configuration
- `docker/` - Docker configurations for local development

## Deployment

### Mobile App (EAS)
```bash
# Build for staging
eas build --platform all --profile staging

# Build for production
eas build --platform all --profile production

# Submit to app stores
eas submit --platform all --profile production
```

### Web Admin (Vercel)
```bash
# Deploy to staging
vercel --target staging

# Deploy to production
vercel --prod
```

## Environment Variables

Each environment requires specific environment variables. See `env.example` for the complete list.

### Required for all environments:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Required for production:
- `EXPO_PUBLIC_EAS_PROJECT_ID`
- `EXPO_PUBLIC_FCM_SERVER_KEY`
- `EXPO_PUBLIC_APNS_KEY_ID`
- `EXPO_PUBLIC_APNS_TEAM_ID`
