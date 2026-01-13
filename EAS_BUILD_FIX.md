# Fix: npm ci Build Failure on EAS

## Error
```
iOS build failed:
npm ci --include=dev exited with non-zero code: 1
```

## Quick Fix (Recommended)

### Option 1: Clear Cache and Rebuild
```bash
cd /Users/cameroncons/Trilo
eas build --platform ios --profile production --auto-submit --clear-cache
```

The `--clear-cache` flag forces EAS to:
- Clear npm cache
- Reinstall all dependencies fresh
- Resolve dependencies from scratch

---

## Option 2: Regenerate package-lock.json Locally

If Option 1 doesn't work, regenerate your package-lock.json:

```bash
cd /Users/cameroncons/Trilo

# Remove old lock file
rm package-lock.json

# Regenerate lock file
npm install --package-lock-only

# Commit the updated lock file
git add package-lock.json
git commit -m "Regenerate package-lock.json for EAS build"

# Push to git (if using git-based builds)
git push

# Rebuild with clear cache
eas build --platform ios --profile production --auto-submit --clear-cache
```

---

## Option 3: Check EAS Build Logs

Get the specific error from EAS build logs:

```bash
# List recent builds
eas build:list --platform ios

# View the failed build logs (replace [build-id] with actual ID)
eas build:view [build-id]

# Or view latest build
eas build:view --latest
```

Look for specific error messages like:
- Dependency conflicts
- Version mismatches
- Network/timeout errors
- Missing dependencies

---

## Common Causes

1. **package-lock.json out of sync**
   - Lock file doesn't match package.json
   - Solution: Regenerate package-lock.json (Option 2)

2. **Network/timeout during npm install**
   - EAS build environment network issues
   - Solution: Retry build (Option 1)

3. **npm cache corruption**
   - Corrupted npm cache in EAS build environment
   - Solution: Use --clear-cache flag (Option 1)

4. **Node/npm version mismatch**
   - Different versions between local and EAS
   - Solution: Check EAS build logs, ensure compatibility

---

## Verify Local Installation Works

Before rebuilding, verify locally:

```bash
cd /Users/cameroncons/Trilo

# Clean install
rm -rf node_modules package-lock.json
npm install

# Test clean install (simulates EAS)
npm ci --include=dev

# If this works locally, the issue is likely EAS-specific
# Use --clear-cache flag when rebuilding
```

---

## Recommended Solution

**Start with Option 1 (clear cache):**

```bash
cd /Users/cameroncons/Trilo
eas build --platform ios --profile production --auto-submit --clear-cache
```

This fixes 90% of npm ci failures on EAS builds.

If that doesn't work, try Option 2 (regenerate package-lock.json), then rebuild with --clear-cache.

---

## Additional Troubleshooting

### Check npm version compatibility
```bash
# Local npm version
npm --version

# EAS typically uses latest stable npm
# If you're using an older npm locally, update it:
npm install -g npm@latest
```

### Verify package.json integrity
```bash
# Validate package.json syntax
node -e "JSON.parse(require('fs').readFileSync('package.json'))"

# Check for syntax errors
cat package.json | python -m json.tool
```

### Check for dependency conflicts
```bash
# Check for peer dependency warnings
npm install --dry-run

# Check for security vulnerabilities
npm audit
```

---

## Success Indicators

After rebuilding, you should see in EAS logs:

```
✔ Installing dependencies
✔ npm ci --include=dev completed successfully
✔ Dependencies installed
```

If you see this, the npm ci step succeeded and the build should continue.

