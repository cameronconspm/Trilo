# 🚀 Commands to Push MFA Development Update

## Step-by-Step Commands

Run these commands in your terminal from the project root:

### 1. Add All MFA-Related Files

```bash
# Add backend MFA routes
git add backend/src/routes/mfa.js backend/src/server.js

# Add frontend MFA components and services
git add services/mfaService.ts
git add components/auth/MFASetupScreen.tsx
git add components/auth/MFAVerifyScreen.tsx
git add components/forms/PhoneNumberInput.tsx

# Add updated files that use MFA
git add context/AuthContext.tsx
git add app/signin.tsx
git add app/(tabs)/profile.tsx
git add app/(tabs)/banking.tsx

# Add documentation
git add docs/SECURITY_POLICY.md
git add docs/SECURITY_IMPLEMENTATION.md
git add docs/PRIVACY_POLICY_UPDATED.md
git add docs/SMS_MFA_SETUP.md
git add DEPLOY_MFA_ROUTES.md

# Add GitHub workflow for security scanning
git add .github/workflows/security-scan.yml

# Add backend updates
git add backend/README.md backend/env.example backend/package.json
```

### 2. Commit All Changes

```bash
git commit -m "Add SMS-based MFA feature with country code selector and auto-formatting

- Implement SMS-based two-factor authentication
- Add country code dropdown with 25+ countries
- Auto-format phone numbers as (XXX) XXX-XXXX
- Add MFA setup and verification screens
- Update AuthContext to support MFA flow
- Add security policy and implementation docs
- Set up vulnerability scanning in CI/CD
- Add backend MFA routes for SMS verification"
```

### 3. Push to Repository

```bash
git push
```

## Alternative: Add Everything at Once

If you want to commit all changes (including other modified files):

```bash
# Add all modified and new files
git add .

# Commit with message
git commit -m "Add SMS-based MFA feature with security enhancements"

# Push to repository
git push
```

## After Pushing

1. **Railway will auto-deploy** (if connected to GitHub)
2. **Check Railway dashboard** for deployment status
3. **Verify routes** are available after deployment completes

## Quick One-Liner (All Changes)

```bash
git add . && git commit -m "Add SMS-based MFA feature" && git push
```

