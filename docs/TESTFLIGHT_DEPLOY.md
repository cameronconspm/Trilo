# TestFlight Deployment Guide

## What's Been Updated

Your app now includes:
✅ User authentication with Supabase
✅ User-specific data storage (no data mixing)
✅ Cloud sync to database
✅ Dark mode without white flashes
✅ Smooth animations
✅ Fixed placeholder bank accounts
✅ All critical features working

Version: 1.0.1
Build Number: 2

## Step-by-Step Deployment

### Prerequisites
1. You have an Apple Developer account
2. EAS CLI is installed (or will install it)
3. You're logged into your Apple account

### Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to EAS
```bash
eas login
```

### Step 3: Build for TestFlight
```bash
eas build --platform ios --profile production
```

This will:
- Build your app on EAS servers
- Take approximately 15-20 minutes
- Generate a .ipa file

### Step 4: Submit to TestFlight
Once the build completes:
```bash
eas submit --platform ios --latest
```

This automatically:
- Uploads your build to App Store Connect
- Processes it for TestFlight
- Makes it available to your testers

### Alternative: Manual TestFlight Upload

If you prefer to upload manually:
1. Download the build from: https://expo.dev/accounts/cameroncons/projects/trilo/builds
2. Go to App Store Connect
3. Navigate to TestFlight
4. Upload the build manually

## What Changed Since Last Version

### Version 1.0.0 → 1.0.1

**New Features:**
- ✅ User authentication system
- ✅ Sign up/Sign in flow
- ✅ User-specific data isolation
- ✅ Cloud storage with Supabase

**Improvements:**
- ✅ Fixed white flash in dark mode
- ✅ Smoother animations and transitions
- ✅ Better theme consistency
- ✅ Fixed placeholder bank accounts
- ✅ Improved performance

**Bug Fixes:**
- ✅ User data no longer mixes between accounts
- ✅ All components respect theme preferences
- ✅ No more grey color inconsistencies
- ✅ Banking tab shows correct empty state

## Build Profiles

Your `eas.json` has these profiles:
- **production**: TestFlight/App Store builds (what we're using)
- **preview**: Internal testing
- **development**: Development client

## After Submission

1. **Processing Time**: Apple takes 10-60 minutes to process
2. **TestFlight**: You'll get an email when it's ready
3. **Notify Testers**: TestFlight will notify your testers automatically
4. **Update Existing Users**: The app will update like a normal update

## Version History

- **1.0.1**: Authentication, cloud storage, bug fixes
- **1.0.0**: Initial release

## Quick Commands Reference

```bash
# Build for production
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --latest

# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

## Important Notes

- Your app version: **1.0.1**
- Build number: **2**
- Bundle ID: com.trilo.app
- EAS Project ID: 75bef967-5779-49d0-bc57-ae4f0621a7d4

## Need Help?

If anything fails during the build process, the EAS CLI will provide specific error messages. Common issues:
- Missing credentials
- Build quota exceeded (check EAS plan)
- Code signing issues

The commands above will walk you through any setup needed.

