# EAS Development Build Setup

## 🎯 **Manual Steps to Generate Credentials & Build**

Since the interactive prompts don't work in this environment, please run these commands manually in your terminal:

### **Step 1: Generate Android Credentials**
```bash
cd "/Users/kingrah/PBR MVP/apps/mobile"
npx eas credentials --platform android
```
- When prompted, select "development" profile
- When asked to generate keystore, select "Yes"
- This will create the Android keystore for development builds

### **Step 2: Generate iOS Credentials**
```bash
npx eas credentials --platform ios
```
- When prompted, select "development" profile
- When asked about certificates, select "Yes" to generate new ones
- This will create iOS certificates for development builds

### **Step 3: Build Development Clients**
```bash
# Build Android development client
npx eas build --profile development --platform android --non-interactive

# Build iOS development client  
npx eas build --profile development --platform ios --non-interactive
```

### **Step 4: Download & Test**
- Check your EAS dashboard: https://expo.dev/accounts/helprs_dev/projects/pbr-mvp
- Download the development builds to your device
- Test the Supabase Auth implementation

## 🎯 **What This Will Test:**
- ✅ Real Supabase Auth (not MockAuth)
- ✅ AsyncStorage persistence
- ✅ Session management
- ✅ Role-based access control
- ✅ Database triggers for user creation
- ✅ No PlatformConstants errors

## 🚀 **Expected Results:**
- App loads without errors
- Authentication flows work properly
- User profiles created in database
- Sessions persist across app restarts
- Role-based features work correctly

---

**Run these commands in your terminal and let me know the results!**
