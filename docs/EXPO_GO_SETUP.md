# Expo Go Setup Guide

## 🚀 **Development with Expo Go**

The Trilo project is configured to use **Expo Go exclusively** for fast, reliable development with tunnel QR codes.

### **Quick Start**

```bash
# Start with Expo Go + Tunnel (default)
npm start

# Alternative command
npm run start:go
```

This will:
- ✅ Start the development server with tunnel mode
- ✅ Generate a reliable QR code for Expo Go
- ✅ Work on any device with Expo Go installed
- ✅ No development builds required

### **Available Scripts**

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm start` | **Default**: Expo Go + Tunnel | Daily development |
| `npm run start:go` | Same as `npm start` | Alternative command |
| `npm run start:local` | Local network only | Same network development |
| `npm run start-web` | Web + Tunnel | Web development |

## 📱 **Expo Go Installation**

### **iOS**
1. Open App Store
2. Search for "Expo Go"
3. Install the official Expo Go app

### **Android**
1. Open Google Play Store
2. Search for "Expo Go"
3. Install the official Expo Go app

## 🔗 **Using Tunnel Mode**

Tunnel mode provides:
- **Reliable QR codes** that work from anywhere
- **No network configuration** required
- **Secure connection** through Expo's servers
- **Works behind firewalls** and corporate networks

### **QR Code Scanning**
1. Run `npm start`
2. Scan the QR code with your device's camera (iOS) or Expo Go app (Android)
3. The app will load automatically in Expo Go

## 🎯 **Why Expo Go Only?**

This project is optimized for:
- **Fastest development** - no build time waiting
- **Easy collaboration** - share QR codes instantly
- **Consistent experience** - same environment for all developers
- **No complex setup** - just install Expo Go and scan

## 🔧 **Troubleshooting**

### **QR Code Not Working**
1. Ensure you're using tunnel mode (`--tunnel` flag)
2. Check your internet connection
3. Try restarting the development server
4. Verify Expo Go app is up to date

### **Connection Issues**
1. Clear Expo Go app cache
2. Restart the development server
3. Check firewall settings
4. Try switching to local mode (`npm run start:local`)

### **Performance Issues**
1. Use local mode (`npm run start:local`) for same-network development
2. Ensure stable internet connection for tunnel mode
3. Close other apps to free up device memory

## 📋 **Best Practices**

### **Daily Development**
- ✅ Use `npm start` (Expo Go + Tunnel)
- ✅ Scan QR code with device camera
- ✅ Test on multiple devices easily
- ✅ No build time waiting

### **Team Collaboration**
- ✅ Share tunnel QR codes easily
- ✅ No network configuration needed
- ✅ Works from any location
- ✅ Consistent development environment

## 🎯 **Summary**

- **Default**: `npm start` → Expo Go + Tunnel ✅
- **Local**: `npm run start:local` → Local network only
- **Web**: `npm run start-web` → Web development

The project is optimized for **Expo Go exclusively** with reliable tunnel QR codes, making development faster and more accessible for the entire team!
