#!/bin/bash

# Quick script to push MFA updates
# Run: bash PUSH_COMMANDS.sh

echo "🚀 Adding MFA files..."
git add backend/src/routes/mfa.js backend/src/server.js
git add services/mfaService.ts
git add components/auth/
git add components/forms/PhoneNumberInput.tsx
git add context/AuthContext.tsx
git add app/signin.tsx app/(tabs)/profile.tsx app/(tabs)/banking.tsx
git add docs/SECURITY_POLICY.md docs/SECURITY_IMPLEMENTATION.md docs/PRIVACY_POLICY_UPDATED.md docs/SMS_MFA_SETUP.md
git add DEPLOY_MFA_ROUTES.md
git add .github/workflows/security-scan.yml

echo "📝 Committing changes..."
git commit -m "Add SMS-based MFA feature with country code selector and auto-formatting

- Implement SMS-based two-factor authentication
- Add country code dropdown with 25+ countries  
- Auto-format phone numbers as (XXX) XXX-XXXX
- Add MFA setup and verification screens
- Update AuthContext to support MFA flow
- Add security policy and implementation docs
- Set up vulnerability scanning in CI/CD
- Add backend MFA routes for SMS verification"

echo "⬆️  Pushing to repository..."
git push

echo "✅ Done! Railway will auto-deploy if connected to GitHub."

