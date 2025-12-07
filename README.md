# Trilo - Personal Finance App

A modern, responsive personal finance application built with React Native and Expo.

## 🚀 **Quick Start (Recommended)**

The project is configured to use **Expo Go by default** for fast, reliable development.

```bash
# Install dependencies
npm install

# Start with Expo Go + Tunnel (default)
npm start
```

This will:
- ✅ Start the development server with tunnel mode
- ✅ Generate a reliable QR code for Expo Go
- ✅ Work on any device with Expo Go installed
- ✅ No need for development builds

## 📱 **Expo Go Setup**

### **Install Expo Go**
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### **Connect Your Device**
1. Run `npm start`
2. Scan the QR code with your device's camera (iOS) or Expo Go app (Android)
3. The app will load automatically in Expo Go

## 🛠️ **Available Scripts**

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm start` | **Default**: Expo Go + Tunnel | Daily development |
| `npm run start:go` | Same as `npm start` | Alternative command |
| `npm run start:local` | Local network only | Same network development |
| `npm run start-web` | Web + Tunnel | Web development |

## 🔧 **Development with Expo Go**

The project is optimized for **Expo Go exclusively**:

- **Fastest development** - no build time waiting
- **Reliable tunnel QR codes** - work from anywhere
- **Easy device testing** - scan and go
- **Team collaboration** - share QR codes easily
- **No complex setup** - just install Expo Go and scan

### **Why Expo Go Only?**
- **Consistent experience** for all developers
- **No native build complexity** 
- **Instant testing** on any device
- **Easy onboarding** for new team members

## 📋 **Project Features**

- **Responsive Design**: Automatically adapts to different screen sizes
- **Modern UI/UX**: Follows Apple HIG and Material Design guidelines
- **Type Safety**: Full TypeScript support
- **Error Boundaries**: Graceful error handling and recovery
- **Theme Support**: Light/dark mode with automatic detection
- **Accessibility**: Screen reader support and proper touch targets
- **Security**: Multi-factor authentication (MFA) required for bank account access

## 🏗️ **Architecture**

- **React Native**: Cross-platform mobile development
- **Expo Router**: File-based navigation
- **Context API**: Global state management
- **Custom Hooks**: Reusable logic and responsive design
- **TypeScript**: Type-safe development

## 📁 **Project Structure**

```
Trilo/
├── app/                    # Expo Router screens
├── components/            # Reusable UI components
├── constants/             # Design tokens and configuration
├── context/               # Global state providers
├── hooks/                 # Custom React hooks
├── services/              # Business logic and API calls
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── docs/                  # Documentation
```

## 🔗 **Tunnel Mode Benefits**

- **Reliable QR codes** that work from anywhere
- **No network configuration** required
- **Secure connection** through Expo's servers
- **Works behind firewalls** and corporate networks
- **Consistent development environment** for team

## 🚨 **Troubleshooting**

### **QR Code Not Working**
1. Ensure you're using tunnel mode (`--tunnel` flag)
2. Check your internet connection
3. Try restarting the development server
4. Verify Expo Go app is up to date

### **Connection Issues**
1. Clear Expo Go app cache
2. Restart the development server
3. Check firewall settings
4. Try switching between tunnel and local modes

## 🔒 **Security**

Trilo implements comprehensive security measures to protect user data:

- **Multi-Factor Authentication (MFA)**: Required before accessing Plaid bank account features
- **Encryption**: All data encrypted in transit (TLS 1.2+) and at rest (Supabase)
- **Access Controls**: Row Level Security (RLS) ensures users can only access their own data
- **Vulnerability Scanning**: Automated security scans via GitHub Actions
- **Security Policy**: Comprehensive security policy document (see [Security Policy](./docs/SECURITY_POLICY.md))

For detailed security information, see:
- [Security Policy](./docs/SECURITY_POLICY.md)
- [Security Implementation Guide](./docs/SECURITY_IMPLEMENTATION.md)
- [Updated Privacy Policy](./docs/PRIVACY_POLICY_UPDATED.md)

**Note**: Multi-factor authentication is required for Plaid production access to ensure the highest level of security for financial data.

## 📚 **Documentation**

- [Expo Go Setup Guide](./docs/EXPO_GO_SETUP.md) - Detailed development setup
- [Error Boundary Guide](./docs/ERROR_BOUNDARY.md) - Error handling documentation
- [Security Policy](./docs/SECURITY_POLICY.md) - Security policies and procedures
- [Security Implementation Guide](./docs/SECURITY_IMPLEMENTATION.md) - Security setup instructions

## �� **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm start` (Expo Go)
5. Submit a pull request

## 📄 **License**

Created by Rork

---

**Happy coding! 🎉**
