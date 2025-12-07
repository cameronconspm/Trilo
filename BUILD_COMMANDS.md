# Build and Submit to App Store Connect - Terminal Commands

## Quick Commands (Copy & Paste)

### Option 1: Build and Auto-Submit (Recommended - One Command)
```bash
cd /Users/cameroncons/Trilo && eas build --platform ios --profile production --auto-submit
```

### Option 2: Build First, Submit Later (Two Commands)
```bash
# Step 1: Build
cd /Users/cameroncons/Trilo && eas build --platform ios --profile production

# Step 2: Submit (after build completes)
cd /Users/cameroncons/Trilo && eas submit --platform ios --latest
```

---

## Step-by-Step Instructions

### 1. Navigate to Project Directory
```bash
cd /Users/cameroncons/Trilo
```

### 2. Verify EAS Login (Optional)
```bash
eas whoami
```
**Expected output**: `cameroncons`

### 3. Build and Submit (Recommended)
```bash
eas build --platform ios --profile production --auto-submit
```

**What this does:**
- ✅ Builds your app on EAS servers (~15-20 minutes)
- ✅ Automatically submits to App Store Connect when build completes
- ✅ Auto-increments build number (will go from 2 → 3)
- ✅ Updates existing TestFlight app (testers see "Update" button)

**During the build:**
- You'll be prompted for Apple credentials (if not already stored)
- Build runs on EAS servers (you can close terminal if needed)
- You'll see progress updates

### 4. Monitor Build Progress (Optional)
```bash
# Check build status
eas build:list

# Or visit dashboard
open https://expo.dev/accounts/cameroncons/projects/trilo/builds
```

---

## What Happens Next

1. **Build Starts** (~15-20 minutes)
   - EAS builds your app
   - Version: 1.0.1
   - Build number: Auto-incremented (likely 3)

2. **Auto-Submit** (after build completes)
   - Uploads to App Store Connect
   - Processes for TestFlight (~10-30 minutes)

3. **TestFlight Ready**
   - New build appears in App Store Connect → TestFlight
   - Testers receive update notification
   - Ready for testing

---

## Alternative: Manual Two-Step Process

If you prefer to build first, then submit later:

### Step 1: Build Only
```bash
cd /Users/cameroncons/Trilo
eas build --platform ios --profile production
```

**Wait for build to complete** (~15-20 minutes)
- Check status: `eas build:list`
- Look for status: "finished"

### Step 2: Submit After Build Completes
```bash
cd /Users/cameroncons/Trilo
eas submit --platform ios --latest
```

This submits the most recent build to App Store Connect.

---

## Troubleshooting

### If prompted for Apple credentials:
- Answer **Yes** to log in
- EAS will guide you through OAuth login
- Credentials stored securely on EAS servers

### If build fails:
```bash
# View build logs
eas build:view [build-id]

# List recent builds
eas build:list
```

### Check EAS CLI version:
```bash
eas --version
# Should be >= 16.15.0
# Upgrade if needed: npm install -g eas-cli
```

---

## Current Configuration

- **Version**: 1.0.1
- **Build Number**: 2 (will auto-increment to 3)
- **Bundle ID**: app.ios-trilo
- **EAS Project**: 75bef967-5779-49d0-bc57-ae4f0621a7d4
- **EAS Account**: cameroncons

---

## Expected Output

When you run the build command, you'll see:
```
✔ Validated Expo config
✔ Resolved credentials
✔ Built iOS app
✔ Submitted to App Store Connect

Build ID: [some-id]
Status: finished
```

---

## Ready to Build?

**Run this command:**
```bash
cd /Users/cameroncons/Trilo && eas build --platform ios --profile production --auto-submit
```

Then follow the prompts! 🚀

