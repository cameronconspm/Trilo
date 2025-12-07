# Security Implementation Guide

This guide provides step-by-step instructions for implementing the security measures required for Trilo's production deployment, particularly for Plaid production access.

## Manual Steps Required

The following steps must be completed manually as they involve external service configurations that cannot be automated through code.

## 1. Enable MFA on Supabase Account

### Steps:
1. Log in to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: **raictkrsnejvfvpgqzcq**
3. Go to **Account Settings** (click on your profile icon in the top right)
4. Navigate to **Security** or **Two-Factor Authentication** section
5. Click **Enable Two-Factor Authentication**
6. Follow the setup wizard:
   - Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
   - Enter verification code to confirm
   - Save backup codes securely
7. Verify MFA is enabled (should see "2FA Enabled" status)

### Verification:
- Log out and log back in - you should be prompted for MFA code
- Try accessing the Supabase dashboard - should require MFA

## 2. Enable MFA on Railway Account

### Steps:
1. Log in to Railway: https://railway.app
2. Click on your profile icon in the top right
3. Navigate to **Account Settings** or **Security Settings**
4. Look for **Two-Factor Authentication** or **2FA** option
5. Click **Enable 2FA**
6. Follow the setup process:
   - Scan QR code with authenticator app
   - Enter verification code
   - Save backup codes
7. Verify MFA is enabled

### Verification:
- Log out and log back in - should require MFA
- Try deploying or accessing project settings - should require MFA

## 3. Enable MFA on GitHub Repository

### Steps:
1. Log in to GitHub: https://github.com
2. Click on your profile icon → **Settings**
3. Navigate to **Password and authentication**
4. Under **Two-factor authentication**, click **Enable two-factor authentication**
5. Choose authentication method:
   - **Authenticator app** (recommended)
   - **SMS** (alternative)
6. Follow the setup wizard:
   - Scan QR code with authenticator app
   - Enter verification code
   - Save recovery codes (store securely!)
7. Verify MFA is enabled

### Additional Steps for Repository:
1. Go to your repository settings
2. Navigate to **Settings** → **General**
3. Scroll to **Security**
4. Under **Two-factor authentication requirement**, configure:
   - Require two-factor authentication for collaborators (if you have team members)
   - Configure organization 2FA requirements (if applicable)

### Verification:
- Log out and log back in - should require MFA
- Try pushing code or accessing repository settings - should require MFA

## 4. Running Vulnerability Scans

### Automated (GitHub Actions)
Vulnerability scans run automatically:
- On every push to main/master branch
- On every pull request
- Weekly on Mondays at 9 AM UTC
- Can be triggered manually via GitHub Actions

**View Results:**
- Go to your GitHub repository
- Click **Actions** tab
- Find **Security Scan** workflow
- View results and download audit reports

### Manual Scanning

#### Frontend Dependencies:
```bash
# Check for vulnerabilities
npm run security:audit

# Try to automatically fix issues
npm run security:audit:fix

# Check backend dependencies
npm run security:audit:backend
```

#### Backend Dependencies:
```bash
cd backend
npm run security:audit
```

#### Full Audit (Both):
```bash
# Frontend
npm run security:audit

# Backend
cd backend && npm run security:audit
```

### Interpreting Results:
- **Critical**: Fix immediately - blocks deployment
- **High**: Fix as soon as possible
- **Moderate**: Fix when convenient
- **Low**: Consider fixing

## 5. Security Best Practices

### Code Security:
- Never commit secrets or API keys to git
- Use environment variables for sensitive data
- Review code before merging pull requests
- Keep dependencies up to date
- Follow secure coding practices

### Access Management:
- Use strong, unique passwords
- Enable MFA on all accounts
- Review access permissions regularly
- Remove access for former team members immediately
- Use principle of least privilege

### Data Protection:
- Encrypt sensitive data at rest and in transit
- Use secure authentication methods
- Implement proper access controls
- Regular backups (encrypted)
- Secure deletion of sensitive data

### Monitoring:
- Monitor for suspicious activity
- Review logs regularly
- Set up alerts for security events
- Keep security tools up to date

## 6. Verification Checklist

Before requesting Plaid production access, verify:

- [ ] MFA enabled on Supabase account
- [ ] MFA enabled on Railway account
- [ ] MFA enabled on GitHub account
- [ ] Vulnerability scanning configured and running
- [ ] Security policy document created
- [ ] Privacy policy updated
- [ ] User MFA implemented in application
- [ ] All critical vulnerabilities resolved
- [ ] Security scripts working (npm run security:audit)
- [ ] GitHub Actions workflow configured
- [ ] Documentation complete

## 7. Troubleshooting

### MFA Setup Issues:
- **QR code not scanning**: Try manual entry option
- **Lost authenticator device**: Use backup codes or recovery options
- **Code not working**: Check device time is synchronized
- **Account locked**: Contact service support

### Vulnerability Scanning Issues:
- **npm audit fails**: Check internet connection
- **False positives**: Review and verify reported vulnerabilities
- **Cannot fix automatically**: Manual fix required - review dependency documentation

### GitHub Actions Issues:
- **Workflow not running**: Check workflow file syntax
- **Permission errors**: Verify GitHub Actions are enabled
- **Node version issues**: Update Node.js version in workflow

## 8. Additional Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/platform/security)
- [Railway Security Best Practices](https://docs.railway.app/deploy/security)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [npm Security Documentation](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)

## 9. Support

For security-related questions or issues:
- **Email**: security@thetriloapp.com
- **Privacy**: privacy@thetriloapp.com
- **Support**: support@thetriloapp.com

---

**Last Updated:** January 2025  
**Document Version:** 1.0

