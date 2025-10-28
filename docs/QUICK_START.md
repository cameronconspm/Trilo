# Quick Start: Test Your App on Device/Simulator

## 🚀 Fastest Path: iOS Simulator

If you have Xcode installed:

```bash
npx expo run:ios
```

**Benefits:**
- ✅ No Apple Developer account needed
- ✅ Builds in 5 minutes
- ✅ Tests RevenueCat subscriptions (sandbox)
- ✅ Full native features work

---

## 📱 For Physical Device

### Option A: EAS Build (Cloud)

**In YOUR terminal** (not here, interactive mode):

```bash
eas build --profile development --platform ios
```

When prompted:
1. "Do you want to log in to your Apple account?" → **Yes**
2. Enter your Apple ID with Developer account
3. Wait 10-15 minutes for build
4. Install via TestFlight or direct download

### Option B: Local Build (If you have Xcode)

```bash
# Connect iPhone via USB
npx expo run:ios --device
```

This builds locally and installs directly on your device.

---

## ⚙️ What You'll Get

After installation, you can:
- ✅ Test all app features
- ✅ See trial banner
- ✅ View paywall UI
- ✅ Test sandbox purchases
- ✅ Restore purchases
- ✅ Everything works!

---

## 📝 Full Guide

See `docs/DEV_BUILD_SETUP.md` for complete instructions.

---

## ⚡ Quick Command

If you have Xcode, just run:

```bash
npx expo run:ios
```

That's it! 🎉

