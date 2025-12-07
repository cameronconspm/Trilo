# TestFlight: Update vs Replace - Explained

## ✅ Good News: EAS Submit Updates Automatically!

When you run `eas submit --platform ios --latest`, it **updates your existing TestFlight app**, not replaces it.

## How TestFlight Updates Work

### What Happens When You Submit a New Build:

1. **Build is Created**: EAS builds your app (version 1.0.1, build 2)
2. **EAS Submit**: Uploads to App Store Connect
3. **TestFlight Processing**: Apple processes the build (~10-30 minutes)
4. **Appears as New Build**: Shows up in TestFlight with new version/build number
5. **Testers Get Update**: Testers see an "Update" button in TestFlight app
6. **Easy Update**: They tap "Update" - done!

### Your Testers Experience:

**First Time (If New Testers):**
- They install from TestFlight app
- Download your app

**Subsequent Updates (Your Current Situation):**
- They open TestFlight app
- See "Update Available" for Trilo
- Tap "Update"
- App updates in place
- No need to reinstall or lose data

## Why This is Better Than Replacement

✅ **Preserves Data**: User's app data stays intact  
✅ **No Reinstall**: Users don't need to delete and reinstall  
✅ **Seamless**: Just an update, like App Store updates  
✅ **Automatic**: EAS handles everything  

## Version & Build Number Management

Your `app.json` controls versions:

```json
{
  "expo": {
    "version": "1.0.1",  // Version shown to users
    "ios": {
      "buildNumber": "2"  // Build number (increments with each build)
    }
  }
}
```

**How it works:**
- Same `version` + higher `buildNumber` = Update
- Higher `version` = Major update (users see new version number)

**For automatic increments**, your `eas.json` has:
```json
{
  "build": {
    "production": {
      "autoIncrement": true  // ✅ Automatically increments build number
    }
  }
}
```

So each time you build, the build number increases automatically!

## Step-by-Step Update Process

### Current State:
- App is in TestFlight
- Version: 1.0.1, Build: 2

### When You Deploy:

```bash
# Build new version
eas build --platform ios --profile production

# This will create:
# - Version: 1.0.1 (same)
# - Build: 3 (auto-incremented)
```

```bash
# Submit update
eas submit --platform ios --latest
```

### Result:
- ✅ Same app in TestFlight
- ✅ New build (3) available
- ✅ Testers see "Update" option
- ✅ No replacement needed!

## Versioning Strategy

### When to Increment Version Number:

**Keep Same Version** (1.0.1 → 1.0.1):
- Bug fixes
- Small improvements
- Performance optimizations
- TestFlight iterations

**Increment Version** (1.0.1 → 1.0.2):
- New features
- Significant changes
- When ready for App Store submission

**Current Recommendation:**
- Keep at 1.0.1 for TestFlight testing
- Increment to 1.0.2+ when ready for App Store

## Troubleshooting

### What if Build Number Conflict?

If EAS says build number already exists:
- This is rare with `autoIncrement: true`
- If it happens, manually increment in `app.json`:
  ```json
  "ios": {
    "buildNumber": "3"  // Change to next number
  }
  ```

### What if Testers Don't See Update?

1. **Check TestFlight**: Verify build is processed (green checkmark)
2. **Check Version**: Make sure build number increased
3. **Tell Testers**: Have them force-refresh TestFlight app
4. **Manual Update**: They can tap your app → "Update" button

## Summary

✅ **Updating is Easy**: `eas submit` handles it automatically  
✅ **No Replacement Needed**: Testers just tap "Update"  
✅ **Data Preserved**: No data loss on update  
✅ **Automatic Versioning**: Build numbers increment automatically  

**Just run the commands and your testers will get an update!** 🚀

