# Fix: Metro Bundler Module Resolution Errors

## Issue
After converting `package-lock.json` to version 2, Metro bundler is showing module resolution errors for:
- `@expo/metro-runtime` and related modules
- `@supabase/postgrest-js`
- `@babel/runtime/helpers`
- `@nkzw/create-context-hook`

## Root Cause
These are **Metro bundler cache issues**, not missing dependencies. All packages are correctly installed.

## ✅ Fix Applied

1. **Cleared Metro cache:**
   ```bash
   rm -rf .expo node_modules/.cache .metro
   ```

2. **Reinstalled dependencies:**
   ```bash
   rm -rf node_modules && npm install
   ```

## 🚀 Next Steps

**Restart Metro bundler with `--clear` flag:**

```bash
cd /Users/cameroncons/Trilo
npx expo start --clear
```

Or if using npm scripts:
```bash
npm start -- --clear
```

The `--clear` flag will:
- Clear Metro's cache
- Reset module resolution
- Rebuild the dependency graph

## 📋 Verification

After restarting with `--clear`, the errors should disappear. The modules are all installed correctly:
- ✅ `@expo/metro-runtime@6.1.2`
- ✅ `@supabase/postgrest-js@2.89.0`
- ✅ `@babel/runtime@7.28.4`
- ✅ `@nkzw/create-context-hook@1.1.0`

## 🔄 If Errors Persist

If errors continue after `--clear`:

1. **Kill all Metro processes:**
   ```bash
   pkill -f "expo start" || pkill -f "metro"
   ```

2. **Clear all caches:**
   ```bash
   rm -rf .expo .expo-shared node_modules/.cache $TMPDIR/metro-* $TMPDIR/haste-*
   ```

3. **Restart with clean cache:**
   ```bash
   npx expo start --clear
   ```

---

**The dependencies are correct - just need to restart Metro with `--clear`!** 🎯

