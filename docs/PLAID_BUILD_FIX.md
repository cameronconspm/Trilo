# Plaid SDK Build Fix - TestFlight

## Issue
Plaid connection shows "Connection Error" in TestFlight because the native module isn't being linked during the build.

## Root Cause
The `react-native-plaid-link-sdk` native module requires proper configuration in both `expo.config.js` and the native iOS project. React Native autolinking should handle the native module, but the plugin must ensure Info.plist configuration is correct.

## Solution

### Step 1: Verify Plugin Configuration

Ensure `expo.config.js` includes the plugin:

```javascript
const withPlaidLink = require('./plugins/withPlaidLink');

module.exports = {
  expo: {
    plugins: [
      // ... other plugins
      withPlaidLink
    ]
  }
};
```

### Step 2: Verify Dependency is Installed

Verify `package.json` has:
```json
{
  "dependencies": {
    "react-native-plaid-link-sdk": "^12.5.1"
  }
}
```

### Step 3: EAS Build Process

When building for TestFlight with EAS, the build process automatically:
1. Installs dependencies (`npm install`)
2. Runs `npx expo prebuild` to generate native projects
3. Executes config plugins (including `withPlaidLink`)
4. Runs `pod install` (for iOS)
5. React Native autolinking links native modules

**Important**: The plugin only configures Info.plist. Native module linking is handled automatically by React Native autolinking when `react-native-plaid-link-sdk` is in `package.json`.

### Step 4: Rebuild with Clean Cache

If the native module isn't found after a build, try a clean build:

```bash
# Clean build - forces fresh dependency installation
eas build --platform ios --profile production --clear-cache

# Or for preview builds
eas build --platform ios --profile preview --clear-cache
```

### Step 5: Verify Build Logs

After building, check EAS build logs for:

**✅ Success Indicators:**
- `Installing dependencies...` completed
- `Running "npx expo prebuild"...` completed
- `Config plugins:`
  - `withPlaidLink` appears in plugin list
  - `✅ Added plaidlink URL scheme to Info.plist` (if plugin logs are visible)
- `Installing CocoaPods dependencies...` completed
- `Pod installation complete`
- No errors about missing `react-native-plaid-link-sdk`

**❌ Error Indicators:**
- `Module not found: react-native-plaid-link-sdk`
- `pod install` failures
- Plugin execution errors
- Missing Info.plist configuration

### Step 6: Verify Native Module Linking

The plugin verifies that `react-native-plaid-link-sdk` is in dependencies during build. If it's missing, you'll see a warning:

```
⚠️  react-native-plaid-link-sdk not found in dependencies.
   The native module will not be available. Add it to package.json:
   npm install react-native-plaid-link-sdk
```

### Step 7: Check Runtime Diagnostics

After installing the TestFlight build, check console logs when tapping "Connect Your Bank":

**✅ Native Module Loaded:**
```
✅ Plaid SDK native module loaded successfully
📊 Plaid SDK Diagnostics:
   Platform: ios
   Execution Environment: standalone
   App Ownership: standalone
   Native Module Available: ✅ Yes
```

**❌ Native Module Missing:**
```
⚠️ Plaid SDK not available in current environment
❌ Plaid SDK native module not found in production build
   Possible causes:
   1. Plugin not properly configured in expo.config.js
   2. Native module not linked during build
   3. Pod installation failed
   4. Missing react-native-plaid-link-sdk dependency
   5. EAS build may need to be rebuilt with --clear-cache
```

## EAS-Specific Troubleshooting

### Issue: Plugin Not Executing

**Symptoms**: Info.plist doesn't have `plaidlink` URL scheme

**Solution**:
1. Verify plugin is in `expo.config.js` plugins array
2. Check EAS build logs for plugin execution
3. Ensure plugin file exists at `plugins/withPlaidLink.js`
4. Try rebuilding with `--clear-cache`

### Issue: Pod Installation Fails

**Symptoms**: Build fails during `pod install` step

**Solution**:
1. Check iOS deployment target compatibility (should be 15.1+)
2. Verify `ios/Podfile` is properly configured
3. Check for CocoaPods version conflicts
4. Review EAS build logs for specific pod errors

### Issue: Native Module Not Found at Runtime

**Symptoms**: Error dialog appears when trying to connect

**Solution**:
1. **Most Common**: Rebuild with `--clear-cache` flag
2. Verify dependency version: `react-native-plaid-link-sdk@^12.5.1`
3. Check if new architecture is causing issues (try disabling `newArchEnabled: false` temporarily)
4. Verify build logs show successful pod installation
5. Check runtime diagnostics logs (see Step 7)

### Issue: New Architecture Compatibility

**Symptoms**: Native module loads but crashes or behaves unexpectedly

**Solution**:
- `react-native-plaid-link-sdk` v12.5.1+ supports new architecture
- If issues persist, temporarily disable in `expo.config.js`:
  ```javascript
  newArchEnabled: false
  ```

## Testing

After rebuilding:

1. **Install TestFlight build**
2. **Open app → Banking tab**
3. **Tap "Connect Your Bank"**
4. **Check console logs** for:
   - ✅ `✅ Plaid SDK native module loaded successfully`
   - ✅ `📊 Plaid SDK Diagnostics:` (should show Native Module Available: ✅ Yes)
   - ✅ `🚀 Opening Plaid Link...`
   - ✅ `✅ Plaid Link modal opened successfully`
   - ❌ NOT `❌ Plaid SDK not available`

5. **If modal opens**: Test with sandbox credentials (see `PLAID_SANDBOX_TESTING.md`)

## Diagnostic Code Added

The updated `PlaidLinkComponent.tsx` now logs comprehensive diagnostic information:

- ✅ SDK load status
- 📊 Build environment details (platform, execution environment, app ownership)
- 🔗 Link token creation process
- 🚀 Plaid Link modal opening process
- ❌ Detailed error information with stack traces

This helps identify the exact issue in TestFlight builds.

## Backend Verification

Before testing, ensure backend is configured:

1. **Environment Variables** (Railway/Hosting):
   - `PLAID_CLIENT_ID` - Your Plaid client ID
   - `PLAID_SECRET` - Your Plaid secret key
   - `PLAID_ENV=sandbox` - Use sandbox for testing

2. **API Endpoints**:
   - `POST /api/plaid/link/token` - Creates link token
   - `POST /api/plaid/link/exchange` - Exchanges public token

3. **Test Connectivity**:
   - Check backend logs when creating link token
   - Verify API URL is accessible from mobile app

## Next Steps

Once the native module is loading correctly:
1. Test sandbox connection flow (see `PLAID_SANDBOX_TESTING.md`)
2. Verify accounts and transactions sync correctly
3. Test error handling and edge cases
4. Prepare for production Plaid environment

## If Still Not Working

If the native module still isn't found after rebuilding:

1. **Verify EAS Build Configuration**:
   - Check `eas.json` for correct build profiles
   - Verify iOS SDK version compatibility

2. **Check Plugin Execution**:
   - Review EAS build logs for plugin execution
   - Verify plugin console output

3. **Try Development Build**:
   - Build development client: `eas build --profile development`
   - Test locally to isolate EAS-specific issues

4. **Contact Support**:
   - Share EAS build logs
   - Share runtime diagnostic logs
   - Include error messages and stack traces
