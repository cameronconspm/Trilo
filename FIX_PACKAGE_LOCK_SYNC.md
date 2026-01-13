# Fix: package-lock.json Out of Sync

## Error
```
npm error Missing: yaml@2.8.2 from lock file
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
```

## Cause
The `package-lock.json` file in your git repository is out of sync with `package.json`. This happens when:
- Dependencies were added/updated but package-lock.json wasn't committed
- package-lock.json was regenerated locally but not pushed to git
- EAS build is using an older lock file from git

## Solution

### Step 1: Verify package-lock.json is Regenerated (✅ Already Done)

The package-lock.json has been regenerated locally and is now in sync.

### Step 2: Commit and Push the Updated Lock File

```bash
cd /Users/cameroncons/Trilo

# Add the updated lock file
git add package-lock.json

# Commit with a clear message
git commit -m "Update package-lock.json - fix dependency sync for EAS build"

# Push to repository
git push
```

### Step 3: Rebuild on EAS

```bash
# Rebuild with clear cache (to be safe)
eas build --platform ios --profile production --auto-submit --clear-cache
```

---

## Verification

Before pushing, verify locally:

```bash
# Verify npm ci works locally
npm ci --include=dev

# Should complete without errors
```

✅ This has already been verified - `npm ci` works locally now.

---

## Why This Happened

The package-lock.json was out of sync because:
1. Dependencies may have been updated/added
2. The lock file wasn't committed to git
3. EAS build uses the lock file from git, which was outdated

---

## Quick Fix Commands (Copy & Paste)

```bash
cd /Users/cameroncons/Trilo
git add package-lock.json
git commit -m "Update package-lock.json - fix dependency sync for EAS build"
git push
eas build --platform ios --profile production --auto-submit --clear-cache
```

---

## Prevention

To prevent this in the future:
- Always commit package-lock.json when dependencies change
- Run `npm install` (not `npm ci`) when adding dependencies
- Commit both package.json AND package-lock.json together
- Verify `npm ci` works locally before pushing

