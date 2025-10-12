# Beta Environment Setup Guide

## 🎯 Overview

This guide walks you through setting up the beta environment for PBR MVP, including creating a separate Supabase project and configuring all necessary components.

## 📋 Prerequisites

- Access to Supabase dashboard
- Access to Vercel dashboard
- EAS CLI installed (`npm install -g @expo/eas-cli`)
- Supabase CLI installed (`npm install -g supabase`)

## 🗄️ Step 1: Create Beta Supabase Project

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Create New Project**:
   - Project Name: `PBR MVP Beta`
   - Organization: [Your existing organization]
   - Database Password: [Generate strong password]
   - Region: [Same as your current project]

3. **Note the new project details**:
   ```
   Project URL: https://[new-project-ref].supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Run migrations on beta project**:
   ```bash
   # Link to beta project
   supabase link --project-ref [new-project-ref]
   
   # Push all existing migrations
   supabase db push
   ```

## 🌐 Step 2: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard** → Your project → Settings → Environment Variables

2. **Add Beta Environment Variables** (for Preview deployments):
   ```
   Environment: Preview
   Git Branch: beta
   
   VITE_SUPABASE_URL = https://[new-project-ref].supabase.co
   VITE_SUPABASE_ANON_KEY = [beta-anon-key]
   VITE_SUPABASE_SERVICE_ROLE_KEY = [beta-service-role-key]
   VITE_APP_ENV = beta
   ```

## 📱 Step 3: Update EAS Configuration

The EAS configuration has already been updated in `apps/mobile/eas.json`. You need to:

1. **Update the beta environment variables** in `eas.json`:
   ```json
   "beta": {
     "env": {
       "EXPO_PUBLIC_SUPABASE_URL": "https://[new-project-ref].supabase.co",
       "EXPO_PUBLIC_SUPABASE_ANON_KEY": "[beta-anon-key]"
     }
   }
   ```

2. **Update environment files**:
   - Edit `.env.beta` with your actual beta project credentials
   - Verify `.env.staging` and `.env.production` are correct

## 🚀 Step 4: Deploy and Test

### **Deploy Web Admin Beta**
```bash
# Push beta branch to trigger Vercel deployment
git push origin beta

# Your beta web admin will be available at:
# https://pbr-admin-git-beta-[your-team].vercel.app
```

### **Build Mobile Beta**
```bash
# Build for beta testing
eas build --platform all --profile beta

# Submit to TestFlight + Google Play Internal Testing
eas submit --platform all --profile beta
```

## 🔄 Step 5: Workflow Commands

### **Daily Development (Staging)**
```bash
git push origin staging
→ EAS build --profile staging (internal distribution)
→ Vercel staging deployment
```

### **Weekly Beta Releases**
```bash
git checkout beta
git merge staging  # when staging is stable
git push origin beta
→ EAS build --profile beta
→ EAS submit --profile beta (TestFlight + Play Internal)
→ Vercel beta deployment
```

### **Monthly Production Releases**
```bash
git checkout main
git merge beta  # when beta is proven stable
git push origin main
→ EAS build --profile production
→ EAS submit --profile production (App Stores)
→ Vercel production deployment
```

## 🎯 Environment Summary

| Environment | Branch | Database | Web Admin URL | Mobile Distribution |
|-------------|--------|----------|---------------|-------------------|
| **Staging** | `staging` | Main Supabase | `staging-pbr-admin.vercel.app` | EAS Internal |
| **Beta** | `beta` | Beta Supabase | `beta-pbr-admin.vercel.app` | TestFlight + Play Internal |
| **Production** | `main` | Main Supabase | `pbr-admin.vercel.app` | App Stores |

## 🔧 Troubleshooting

### **Environment Variables Not Working**
- Check Vercel environment variables are set for correct branch
- Verify EAS build profile has correct environment variables
- Clear Expo cache: `expo start --clear`

### **Database Connection Issues**
- Verify Supabase project URL and keys are correct
- Check RLS policies are properly set up
- Ensure migrations ran successfully on beta project

### **Build Failures**
- Check EAS build logs for specific errors
- Verify bundle identifiers are unique for beta
- Ensure all required secrets are configured

## 📞 Support

If you encounter issues:
1. Check the console logs for specific error messages
2. Verify all environment variables are correctly set
3. Ensure the beta Supabase project has all necessary data seeded
4. Check that bundle identifiers don't conflict with existing apps

## 🎉 Success Criteria

You'll know the beta environment is working when:
- ✅ Beta web admin loads at the Vercel preview URL
- ✅ Beta mobile app builds successfully with EAS
- ✅ Beta apps connect to the separate beta database
- ✅ TestFlight and Google Play Internal Testing receive builds
- ✅ Beta testers can use the app without affecting staging data