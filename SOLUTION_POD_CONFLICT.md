# Fix: CocoaPods Dependency Conflict

## Error
```
iOS build failed:
Compatible versions of some pods could not be resolved.
```

## Quick Fixes

### Option 1: Clear Cache and Rebuild (Recommended)

Run in terminal:
```bash
eas build --profile development --platform ios --clear-cache
```

This clears the cached dependencies and rebuilds fresh.

### Option 2: Update Podfile.lock Locally

If that doesn't work, update dependencies locally:

```bash
cd ios
pod deintegrate
pod cache clean --all
pod install
cd ..
```

Then rebuild:
```bash
eas build --profile development --platform ios
```

### Option 3: Remove Conflicting Package Temporarily

If the issue persists, temporarily remove one of the packages causing conflicts:

In `package.json`, comment out either:
- `react-native-purchases` (if not testing RevenueCat yet)
- `react-native-plaid-link-sdk` (if not using banking)

Then rebuild.

---

## Most Likely Cause

The conflict is between:
- `react-native-purchases` (v9.6.0)
- `react-native-plaid-link-sdk` (v12.5.1)

Both require the same underlying iOS native dependencies but at different versions.

---

## Recommended Solution

**Just use the `--clear-cache` flag:**

```bash
eas build --profile development --platform ios --clear-cache
```

This forces EAS to resolve all dependencies fresh and should fix the conflict.

---

## If Issues Persist

Check the actual conflict in the build logs:
1. Go to your EAS build page
2. Click on the failed build
3. Check the detailed logs
4. Look for specific pod version conflicts

The error message should tell you which pods conflict.

