#!/bin/bash

# Comprehensive cleanup script for Trilo app before App Store build
# This script clears all caches and prepares for a clean build

set -e  # Exit on error

echo "🧹 Starting comprehensive cleanup for Trilo app..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Clear Expo cache
print_step "Clearing Expo cache..."
rm -rf .expo
rm -rf .expo-shared
print_step "Expo cache cleared"

# 2. Clear Metro bundler cache
print_step "Clearing Metro bundler cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
print_step "Metro cache cleared"

# 3. Clear Watchman cache (if installed)
if command -v watchman &> /dev/null; then
    print_step "Clearing Watchman cache..."
    watchman watch-del-all 2>/dev/null || true
    print_step "Watchman cache cleared"
else
    print_warning "Watchman not installed, skipping..."
fi

# 4. Clear npm/yarn cache (optional, uncomment if needed)
# print_step "Clearing npm cache..."
# npm cache clean --force

# 5. Clear iOS build artifacts
print_step "Clearing iOS build artifacts..."
cd ios 2>/dev/null || { print_warning "iOS directory not found, skipping..."; cd ..; }
if [ -d "build" ]; then
    rm -rf build
    print_step "iOS build directory cleared"
fi
if [ -d "Pods" ]; then
    rm -rf Pods
    print_step "iOS Pods directory cleared (will need pod install)"
fi
if [ -f "Podfile.lock" ]; then
    rm -f Podfile.lock
    print_step "Podfile.lock removed"
fi
cd ..

# 6. Clear Android build artifacts (if exists)
if [ -d "android" ]; then
    print_step "Clearing Android build artifacts..."
    cd android
    ./gradlew clean 2>/dev/null || print_warning "Gradle clean failed or not available"
    rm -rf .gradle
    rm -rf build
    rm -rf app/build
    cd ..
    print_step "Android build artifacts cleared"
fi

# 7. Clear node_modules and reinstall (optional - uncomment if needed)
# print_step "Removing node_modules..."
# rm -rf node_modules
# print_step "Reinstalling dependencies..."
# npm install

# 8. Clear TypeScript cache
print_step "Clearing TypeScript cache..."
rm -rf .tsbuildinfo
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
print_step "TypeScript cache cleared"

# 9. Clear Jest cache
if [ -d "coverage" ]; then
    print_step "Clearing Jest coverage reports..."
    rm -rf coverage
    print_step "Coverage reports cleared"
fi

# 10. Clear Expo prebuild cache
print_step "Clearing Expo prebuild cache..."
rm -rf ios/.expo
rm -rf android/.expo 2>/dev/null || true
print_step "Expo prebuild cache cleared"

# 11. Clear temporary files
print_step "Clearing temporary files..."
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true
print_step "Temporary files cleared"

# 12. Verify Plaid configuration
print_step "Verifying Plaid configuration..."
if grep -q "plaidlink" app.json expo.config.js 2>/dev/null; then
    print_step "Plaid URL scheme configured"
else
    print_error "Plaid URL scheme may be missing!"
fi

# 13. Verify RevenueCat configuration
print_step "Verifying RevenueCat configuration..."
if grep -q "revenueCatApiKeyIos" app.json expo.config.js 2>/dev/null; then
    print_step "RevenueCat API key configured"
else
    print_error "RevenueCat API key may be missing!"
fi

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Run 'cd ios && pod install && cd ..' to reinstall iOS dependencies"
echo "   2. Run 'npm install' if you removed node_modules"
echo "   3. Run 'npx expo prebuild --clean' if needed"
echo "   4. Run 'eas build --platform ios --profile production' to build"
echo ""

