# Quick TestFlight Deployment

## Run These Commands (in order):

```bash
# 1. Install EAS CLI (if you don't have it)
npm install -g eas-cli

# 2. Login to your EAS account
eas login

# 3. Build your app for TestFlight
eas build --platform ios --profile production

# 4. Wait for build to complete (~15-20 minutes)
# Then submit to TestFlight
eas submit --platform ios --latest
```

## That's It! 

The app will:
- Build on Expo's servers
- Upload to TestFlight automatically
- Update your existing TestFlight app
- Notify your testers

## Build Time
Approximately 15-20 minutes for the build, plus processing time.

## What Will Happen
1. Build starts on Expo servers
2. iOS app compiles
3. Build completes
4. Automatically submits to TestFlight
5. App appears in TestFlight
6. Testers can update from TestFlight app

## Notes
- Your existing TestFlight app will be replaced
- Users can update from the TestFlight app
- No App Store review needed (TestFlight only)
- Version 1.0.1, Build 2

## If You Get Errors
Most common issues are credential-related. EAS will guide you through credential setup if needed.

