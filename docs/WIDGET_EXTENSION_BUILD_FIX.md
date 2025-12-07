# Widget Extension Build Fix

## Issue

EAS build fails with error:
```
unable to resolve product type 'com.apple.product-type.widgetkit-extension' for platform 'iOS'
```

## Root Cause

The widget extension target (`UpcomingExpensesWidgetExtension`) was missing required build settings:
- `SDKROOT = iphoneos`
- `SUPPORTED_PLATFORMS = "iphoneos iphonesimulator"`

## Solution Applied

Added the missing build settings to the widget extension target in `ios/Trilo.xcodeproj/project.pbxproj`:

### Debug Configuration
- Added `SDKROOT = iphoneos`
- Added `SUPPORTED_PLATFORMS = "iphoneos iphonesimulator"`

### Release Configuration
- Added `SDKROOT = iphoneos`
- Added `SUPPORTED_PLATFORMS = "iphoneos iphonesimulator"`

## Verification

The widget extension target now has:
- ✅ `IPHONEOS_DEPLOYMENT_TARGET = 15.1` (WidgetKit requires iOS 14.0+)
- ✅ `SDKROOT = iphoneos`
- ✅ `SUPPORTED_PLATFORMS = "iphoneos iphonesimulator"`
- ✅ `productType = "com.apple.product-type.widgetkit-extension"`

## Testing

1. Build with EAS:
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```

2. Verify the build succeeds without widget extension errors

## If Issue Persists

If EAS build still fails (because it regenerates the project), you may need to:

1. **Option 1**: Temporarily remove the widget extension if it's not critical:
   - Remove the widget extension target from the Xcode project
   - Remove widget files from `ios/UpcomingExpensesWidget/`
   - Rebuild

2. **Option 2**: Add a post-build script to fix the widget extension target after prebuild

3. **Option 3**: Use a config plugin to ensure widget extension is properly configured (see `plugins/withWidgetExtension.js`)

## Files Modified

- `ios/Trilo.xcodeproj/project.pbxproj` - Added missing build settings to widget extension target

