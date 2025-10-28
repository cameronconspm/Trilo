# How to Run Development Build on Test Device

## Overview

RevenueCat subscriptions **don't work in Expo Go** because they require native modules.

You need a **development build** that you can install on your test device.

---

## Option 1: EAS Build (Recommended - Cloud)

### Step 1: Create Development Build

```bash
eas build --profile development --platform ios
```

**What happens:**
- ✅ Builds your app in the cloud
- ✅ Takes 10-15 minutes
- ✅ No local machine setup needed
- ✅ Works even without Apple Developer account

### Step 2: Install on Device

After build completes:

**Option A: Direct Install**
1. Go to https://expo.dev/accounts/[your-username]/projects/trilo/builds
2. Click on the completed build
3. Download the `.ipa` file
4. Install via Xcode or Apple Configurator

**Option B: TestFlight**
1. Run: `eas submit --platform ios`
2. Install from TestFlight app
3. Much easier for repeated testing

**Option C: iOS Simulator**
1. Build URL will be shown in terminal
2. Open in simulator

---

## Option 2: Local Build (Requires Xcode)

If you have Xcode installed locally:

### Step 1: Install Dependencies

```bash
cd ios
pod install
cd ..
```

### Step 2: Run on Device

```bash
npx expo run:ios --device
```

**What happens:**
- ✅ Builds locally on your Mac
- ✅ Installs directly on connected iPhone
- ✅ Much faster than cloud build
- ⚠️ Requires USB connection to device

---

## Current Status

### ✅ What's Ready
- `expo-dev-client` installed
- All subscription code implemented
- Database tables created
- API keys configured

### ⚠️ What You Need
- Apple Developer account for real device testing
- OR use simulator if you have Xcode

---

## Quick Start Guide

### For Real Device (Apple Developer Account Needed)

```bash
# 1. Build on EAS
eas build --profile development --platform ios

# 2. After build completes, install via TestFlight or direct download
```

### For Simulator (No Account Needed)

```bash
# If you have Xcode
npx expo run:ios

# This builds locally and runs in iOS Simulator
```

---

## Troubleshooting

### "No team associated with your Apple account"
You need:
- Paid Apple Developer account ($99/year)
- OR use simulator (free)

### "Pod install failed"
Try:
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### "Could not find app"
The development client is separate from Expo Go. After installing the dev build, you:
1. Open the dev build (not Expo Go)
2. Scan QR code from terminal
3. App loads in dev client

---

## Expected Timeline

- **EAS Build**: 10-15 minutes
- **TestFlight Upload**: 5 minutes
- **Approve TestFlight**: 10-30 minutes (first time)
- **Total**: 30-60 minutes

---

## What Happens After Installation

1. Open the dev client app (not Expo Go)
2. App automatically connects to dev server
3. RevenueCat initializes properly
4. Full subscription features work
5. Can test real sandbox purchases

---

## Next Steps After Installation

1. **Test Signup**: Create new user → Gets 7-day trial
2. **Test Paywall**: See paywall UI
3. **Test Purchase**: Sandbox purchases work
4. **Test Restore**: Restore purchases works

All subscription features will be fully functional!

---

## Alternative: Use iOS Simulator (Fastest)

If you have Xcode:

```bash
npx expo run:ios
```

This builds and runs in simulator (5-10 minutes). Simulator can test purchases with sandbox accounts.

---

## Need Help?

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Development Builds: https://docs.expo.dev/development/introduction/
- Your project: https://expo.dev/accounts/cameroncons/projects/trilo

