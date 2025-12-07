# EAS Build Guide - Step by Step

## Your Current Situation

You tried to submit, but the build expired (30-day limit). You need to:
1. **Build first** (creates new build)
2. **Then submit** (uploads to TestFlight)

## Solution: Build with Auto-Submit

The easiest way is to use `--auto-submit` which builds AND submits in one command:

```bash
eas build --platform ios --profile production --auto-submit
```

This will:
- ✅ Build your app (~15-20 minutes)
- ✅ Automatically submit to TestFlight when done
- ✅ Skip the manual submit step

## Alternative: Build First, Submit Later

If you prefer two steps:

### Step 1: Build
```bash
eas build --platform ios --profile production
```

**Note**: When prompted about Apple credentials:
- You can log in to Apple account (EAS will use it)
- Or use existing credentials if you have them saved

### Step 2: Submit (After Build Completes)
```bash
eas submit --platform ios --latest
```

## Handling Apple Credentials

### Option 1: Log In to Apple Account (Recommended)

When EAS asks: "Do you want to log in to your Apple account?"
- Answer: **Yes**
- EAS will guide you through login
- Credentials are stored securely on EAS servers

### Option 2: Use Existing Credentials

If you've already configured credentials:
- EAS will use them automatically
- No prompt needed

### Option 3: Manual Credentials (Advanced)

If you don't want to log in:
- You'll need to provide certificates manually
- More complex setup

## Quick Answer: Use Auto-Submit

**Run this single command:**

```bash
eas build --platform ios --profile production --auto-submit
```

This is the simplest approach - one command does everything!

## What Happens Next

1. **Build Starts**: EAS servers start building (~15-20 minutes)
2. **You Can Wait or Close Terminal**: Build continues on EAS servers
3. **Auto-Submit**: When build completes, automatically submits to TestFlight
4. **TestFlight Processing**: Apple processes (~10-30 minutes)
5. **Done!**: Build appears in TestFlight

## Check Build Status

While building, you can:

```bash
# Check build status
eas build:list

# Or visit
https://expo.dev/accounts/cameroncons/projects/trilo/builds
```

## Troubleshooting

### "Input is required, but stdin is not readable"

This means the command needs interactive input. Solutions:

**Option A**: Run in your terminal directly (not through this tool):
```bash
cd /Users/cameroncons/Trilo
eas build --platform ios --profile production --auto-submit
```

**Option B**: Use non-interactive credentials:
- Make sure you're logged into EAS: `eas login`
- EAS should use saved credentials

### Build Number Already Used

EAS automatically increments (it went from 7 to 8), so this shouldn't happen. If it does:
- Manually set higher build number in `app.json`

## Recommended Next Step

**Run this in your terminal:**

```bash
cd /Users/cameroncons/Trilo
eas build --platform ios --profile production --auto-submit
```

Then follow the prompts for Apple account login (if needed).

---

**Summary**: Use `--auto-submit` flag - it's the easiest way! 🚀

