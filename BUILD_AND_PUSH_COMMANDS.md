# Build and Push to App Store Connect - Commands

**Current Version**: 1.0.1  
**Current Build Number**: 2  
**Next Build Number**: 3 (auto-incremented by EAS)

---

## 🚀 Quick Start (Recommended - One Command)

### Build and Auto-Submit to App Store Connect
```bash
cd /Users/cameroncons/Trilo && eas build --platform ios --profile production --auto-submit
```

**This command will:**
- ✅ Build your app (~15-20 minutes)
- ✅ Auto-increment build number (2 → 3)
- ✅ Submit to App Store Connect automatically
- ✅ Replace/update the existing build

---

## 📋 Step-by-Step Process

### Option 1: Build and Submit Together (Recommended)

```bash
# 1. Navigate to project
cd /Users/cameroncons/Trilo

# 2. Verify you're logged in (optional)
eas whoami

# 3. Build and submit in one command
eas build --platform ios --profile production --auto-submit
```

**Expected Output:**
```
✔ Validated Expo config
✔ Resolved credentials  
✔ Built iOS app
✔ Submitted to App Store Connect

Build ID: [build-id]
Status: finished
```

---

### Option 2: Build First, Submit Later (Two Steps)

```bash
# Step 1: Build only
cd /Users/cameroncons/Trilo
eas build --platform ios --profile production

# Wait for build to complete (~15-20 minutes)
# Check status: eas build:list

# Step 2: Submit after build completes
eas submit --platform ios --latest
```

---

## 🔍 Pre-Build Checks (Optional but Recommended)

```bash
# 1. Navigate to project
cd /Users/cameroncons/Trilo

# 2. Check TypeScript (should have 4 non-critical warnings)
npx tsc --noEmit --skipLibCheck

# 3. Check linter (should pass)
npm run lint

# 4. Verify EAS login
eas whoami

# 5. Verify app.json version/build number
cat app.json | grep -A 5 '"ios"'
```

---

## 📊 Monitor Build Progress

### Check Build Status
```bash
# List all builds
eas build:list --platform ios

# View latest build details
eas build:view --latest

# Check build logs (if failed)
eas build:view [build-id]
```

### View Online Dashboard
```bash
# Open EAS dashboard in browser
open https://expo.dev/accounts/cameroncons/projects/trilo/builds
```

---

## 🔄 Update Existing Build

**To push a new build that replaces the existing one:**

The build number will be auto-incremented from 2 → 3. The new build will:
- ✅ Update the existing TestFlight app
- ✅ Replace the previous build (build #2)
- ✅ Be available to testers as an update
- ✅ Same version (1.0.1) but higher build number

**No manual version/build number changes needed** - EAS handles this automatically.

---

## ⚙️ Troubleshooting

### Clear Build Cache
```bash
eas build --platform ios --profile production --clear-cache --auto-submit
```

### Check Credentials
```bash
# View iOS credentials
eas credentials --platform ios
```

### View Build Logs
```bash
# Latest build
eas build:view --latest

# Specific build
eas build:view [build-id]
```

### Cancel a Build
```bash
eas build:cancel [build-id]
```

---

## 📝 What Happens After Submission

1. **Build Completes** (~15-20 minutes)
   - EAS servers build your app
   - Build number increments (2 → 3)

2. **Auto-Submit** (automatic with --auto-submit)
   - Uploads to App Store Connect
   - Processing time: ~10-30 minutes

3. **TestFlight Ready**
   - Build appears in App Store Connect
   - Available for TestFlight testing
   - Testers see "Update Available"

4. **App Store Review** (if submitting to production)
   - Goes through Apple's review process
   - Typically 1-3 days

---

## 🎯 Complete Workflow (Copy & Paste)

```bash
# 1. Navigate to project
cd /Users/cameroncons/Trilo

# 2. Build and submit (one command)
eas build --platform ios --profile production --auto-submit

# 3. Monitor progress (optional)
eas build:list --platform ios
```

---

## ✅ Pre-Build Checklist

Before running the build command:

- [x] Code audit completed ✅
- [x] Critical TypeScript errors fixed ✅
- [x] Linter passes ✅
- [x] No console.log in production ✅
- [x] No debug fetch statements ✅
- [ ] Test locally (optional): `npx expo start --ios`
- [ ] Verify EAS login: `eas whoami`

---

## 🚨 Important Notes

1. **Build Number**: Auto-increments (no manual change needed)
2. **Version**: Stays at 1.0.1 (only increment for new releases)
3. **Build Time**: ~15-20 minutes on EAS servers
4. **Processing**: Additional 10-30 minutes in App Store Connect
5. **TestFlight**: Builds available immediately after processing
6. **Production**: Requires App Store review (1-3 days)

---

## 📞 Quick Reference

```bash
# Build + Submit (most common)
eas build --platform ios --profile production --auto-submit

# Check status
eas build:list --platform ios

# View logs
eas build:view --latest

# Verify login
eas whoami
```

---

**Ready to build?** Run:
```bash
cd /Users/cameroncons/Trilo && eas build --platform ios --profile production --auto-submit
```

