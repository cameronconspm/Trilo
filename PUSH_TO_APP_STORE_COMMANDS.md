# Push Build to App Store Connect - Terminal Commands

## Prerequisites

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Verify Project Setup
```bash
# Make sure you're in the project root
cd /Users/cameroncons/Trilo

# Verify EAS is configured
eas whoami
```

---

## Step 1: Configure EAS Build (First Time Only)

If you haven't set up EAS yet:

```bash
# Initialize EAS in your project
eas build:configure

# This will create eas.json if it doesn't exist
```

---

## Step 2: Build for iOS

### Option A: Build and Submit Automatically (Recommended)

```bash
# Build for iOS and automatically submit to App Store Connect
eas build --platform ios --profile production --auto-submit

# Or if you want to build for TestFlight first
eas build --platform ios --profile production
```

### Option B: Build Locally (Faster, but requires macOS)

```bash
# Build locally on your Mac
eas build --platform ios --profile production --local
```

### Option C: Build for Specific Distribution

```bash
# Build for TestFlight (internal testing)
eas build --platform ios --profile production

# Build for App Store (production release)
eas build --platform ios --profile production --auto-submit
```

---

## Step 3: Submit to App Store Connect

### If you built without auto-submit:

```bash
# Submit the latest build to App Store Connect
eas submit --platform ios --latest

# Or submit a specific build
eas submit --platform ios --id <build-id>
```

---

## Step 4: Monitor Build Status

```bash
# Check build status
eas build:list

# View specific build details
eas build:view

# Follow build logs in real-time
eas build:list --platform ios
```

---

## Complete Workflow (Copy & Paste)

### First Time Setup:
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure EAS (if not done)
eas build:configure

# 4. Navigate to project
cd /Users/cameroncons/Trilo
```

### Build and Submit:
```bash
# Build for iOS and submit to App Store Connect
eas build --platform ios --profile production --auto-submit
```

### Monitor:
```bash
# Check build status
eas build:list --platform ios
```

---

## Alternative: Using Expo CLI (Legacy)

If you're using the older Expo CLI instead of EAS:

```bash
# Build for iOS
expo build:ios

# Submit to App Store Connect
expo submit:ios
```

**Note:** Expo CLI is deprecated. Use EAS CLI instead.

---

## Troubleshooting Commands

### Clear Build Cache
```bash
eas build --platform ios --clear-cache
```

### View Build Logs
```bash
eas build:view --latest
```

### Cancel a Build
```bash
eas build:cancel --id <build-id>
```

### Check Credentials
```bash
# iOS credentials
eas credentials

# View all credentials
eas credentials --platform ios
```

### Update Credentials
```bash
eas credentials --platform ios
```

---

## Environment-Specific Builds

### Production Build
```bash
eas build --platform ios --profile production --auto-submit
```

### Development Build (for testing)
```bash
eas build --platform ios --profile development
```

### Preview Build (for TestFlight)
```bash
eas build --platform ios --profile preview
```

---

## Important Notes

### Before Building:

1. **Check app.json/app.config.js:**
   - Verify `version` is incremented
   - Verify `buildNumber` is incremented
   - Check bundle identifier

2. **Verify Environment Variables:**
   - Railway backend is running
   - All environment variables are set
   - Supabase is accessible

3. **Test Locally First:**
   ```bash
   # Test on simulator/device before building
   npx expo start --ios
   ```

### After Building:

1. **Monitor Build:**
   - Check EAS dashboard: https://expo.dev
   - Watch build logs for errors

2. **After Submission:**
   - Check App Store Connect for processing status
   - Wait for Apple's review (if submitting to App Store)
   - TestFlight builds are available immediately

---

## Quick Reference

```bash
# Most common command (build + submit)
eas build --platform ios --profile production --auto-submit

# Check status
eas build:list --platform ios

# View logs
eas build:view --latest
```

---

## Expected Output

After running the build command, you'll see:

```
✔ Linked to project @your-username/trilo
✔ Generated eas.json
✔ Built successfully
✔ Submitted to App Store Connect
```

Build typically takes **10-20 minutes** depending on queue.

---

## Need Help?

```bash
# EAS CLI help
eas build --help

# Expo help
eas --help

# Check your account
eas whoami
```




