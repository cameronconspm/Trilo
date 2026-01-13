#!/bin/bash

# Clean iOS build script for Trilo app
# This clears all build caches and rebuilds the app

set -e

echo "🧹 Cleaning iOS build artifacts..."

# Clear local build directories
rm -rf ios/build
rm -rf ios/DerivedData

# Clear Xcode derived data (if exists)
rm -rf ~/Library/Developer/Xcode/DerivedData/Trilo-* 2>/dev/null || true

echo "✅ Build artifacts cleared"
echo ""
echo "🚀 Rebuilding iOS app..."
echo ""

# Rebuild via Expo
npx expo run:ios

