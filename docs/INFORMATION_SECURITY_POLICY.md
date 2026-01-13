# Information Security Policy

**Effective Date:** January 2025  
**Last Updated:** January 2025  
**Version:** 1.0  
**Document Owner:** Trilo Security Team  
**Approval Authority:** Trilo Leadership

## 1. Policy Overview

### 1.1 Purpose
This Information Security Policy establishes the framework for protecting the security, confidentiality, integrity, and availability of Trilo user data and financial information. This policy defines security objectives, controls, and procedures to ensure comprehensive protection of information assets.

### 1.2 Scope
This policy applies to:
- All Trilo employees and contractors (currently 1-5 person team)
- All systems, networks, and applications used by Trilo
- All third-party service providers processing Trilo user data
- All user data collected, stored, and processed by Trilo
- All infrastructure components (Supabase, Railway, Plaid, RevenueCat, Twilio)

### 1.3 Applicability
This policy is mandatory for all personnel with access to Trilo systems, data, or infrastructure. Compliance with this policy is a condition of employment and contractor agreements.

## 2. Security Objectives

Trilo is committed to:
- Protecting user financial data from unauthorized access, disclosure, alteration, or destruction
- Ensuring compliance with applicable privacy and data protection regulations (GDPR, CCPA, PCI DSS, SOC 2)
- Maintaining the confidentiality and integrity of user information
- Providing secure access to Trilo services
- Implementing security controls appropriate to the risk level
- Continuously improving security posture through regular assessments and updates

## 3. Data Classification

### 3.1 Data Categories

**Personal Information (Confidential)**
- User email addresses
- User names and profile information
- Authentication credentials (encrypted and hashed)
- Profile pictures

**Financial Information (Highly Confidential)**
- Bank account information (account names, types, balances)
- Transaction history and details
- Account routing numbers (masked)
- Financial institution information
- Plaid access tokens (encrypted)

**Authentication and Security Data (Confidential)**
- Multi-factor authentication (MFA) phone numbers (stored securely, masked for display)
- SMS verification codes and timestamps
- MFA verification attempts and timestamps
- Authentication logs (login attempts, device information)
- Session tokens and access tokens (encrypted)
- Security-related metadata

**Analytics and Usage Data (Internal)**
- App usage data and analytics
- Crash reports and error logs
- IP addresses
- Device type and operating system
- Pages viewed and time spent

### 3.2 Data Handling Requirements
- All data must be handled according to its classification level
- Highly confidential data requires additional encryption and access controls
- Data must not be shared with unauthorized parties
- Data must be disposed of securely when no longer needed

## 4. Encryption Standards

### 4.1 Encryption in Transit
- **TLS 1.2+**: All data transmitted between clients and servers must be encrypted using TLS 1.2 or higher
- **API Security**: All API communications secured with HTTPS
- **Certificate Management**: Regular certificate renewal and management
- **Implementation**: All API endpoints enforce HTTPS, and mobile app communications use secure protocols

### 4.2 Encryption at Rest
- **Database Encryption**: All user data stored in Supabase is encrypted at rest (Supabase managed encryption)
- **Access Token Security**: Plaid access tokens encrypted in database storage
- **Backup Encryption**: All backups encrypted using industry-standard encryption
- **Local Storage**: Sensitive data in mobile app local storage (AsyncStorage) is isolated per user with user-specific keys

### 4.3 Key Management
- **Secret Storage**: Environment variables and secrets stored securely (not in code)
- **Key Rotation**: Regular rotation of encryption keys and API secrets (see `docs/KEY_ROTATION_PROCEDURE.md`)
- **Secret Management**: Use of secure secret management practices
- **Implementation**: All secrets stored in Railway environment variables, never committed to version control

## 5. Security Controls

### 5.1 Multi-Factor Authentication (MFA)
- **User MFA**: Required for all users before accessing Plaid banking features
- **Implementation**: SMS-based verification codes sent to registered phone numbers via Twilio
- **Code Expiration**: Verification codes expire after 10 minutes
- **Phone Number Security**: Phone numbers stored securely and masked for display
- **Service**: Implemented via `services/mfaService.ts` and backend MFA routes

### 5.2 Row Level Security (RLS)
- **Database-Level Security**: Supabase RLS policies ensure users can only access their own data
- **Implementation**: All user data tables have RLS enabled with policies enforcing `auth.uid() = user_id`
- **Tables Protected**:
  - `user_transactions` - Users can only view/manage their own transactions
  - `user_income` - Users can only view/manage their own income entries
  - `user_savings_goals` - Users can only view/manage their own savings goals
  - `user_settings` - Users can only view/manage their own settings
  - `user_tutorial_status` - Users can only view/manage their own tutorial status
  - `user_subscriptions` - Users can only view their own subscription data
- **Schema**: Defined in `supabase_schema.sql` with ON DELETE CASCADE for data isolation

### 5.3 Authentication and Authorization
- **User Authentication**: Supabase Auth with email/password authentication
- **JWT Tokens**: Secure JWT-based authentication for API access
- **Session Management**: Automatic session timeout and secure session handling
- **Backend Authentication**: Implemented via `backend/src/middleware/auth.js` with Supabase token verification
- **Account Lockout**: Temporary account lockout after multiple failed login attempts (tracked via security alerts)

### 5.4 Access Controls
- **Principle of Least Privilege**: Access granted only to data and systems necessary for job functions
- **Role-Based Access**: Service role vs authenticated user roles enforced at database level
- **API Authorization**: Token-based authorization for all API endpoints
- **Resource-Based Permissions**: Fine-grained permissions for accessing resources

## 6. Third-Party Service Security

### 6.1 Service Provider Security Requirements
All third-party service providers must:
- Comply with security requirements specified in service agreements
- Maintain appropriate security certifications (SOC 2, PCI DSS, etc.)
- Provide security documentation and audit reports
- Notify Trilo of security incidents affecting Trilo data
- Comply with data processing agreements (GDPR requirements)

### 6.2 Key Service Providers

**Supabase** (Database and Authentication)
- **Role**: Primary database, authentication, and backend services
- **Security**: SOC 2 Type II compliant
- **Data Encryption**: Encryption at rest and in transit
- **Backup**: Automated daily backups with 7-30 day retention
- **Access**: Row Level Security (RLS) enabled on all tables

**Plaid** (Financial Data Aggregation)
- **Role**: Secure bank account connections and transaction data
- **Security**: Bank-level security, PCI DSS compliant
- **Data Handling**: We do not store bank account credentials; all authentication handled securely through Plaid
- **Access Tokens**: Stored encrypted in Supabase database

**Railway** (Hosting Infrastructure)
- **Role**: Application hosting and deployment platform
- **Security**: Security best practices, secure environment variable management
- **Deployment**: Automated deployments with secure CI/CD

**RevenueCat** (Subscription Management)
- **Role**: Subscription and in-app purchase management
- **Security**: PCI DSS compliant
- **Data**: Subscription data synced to Supabase (backed up automatically)

**Twilio** (SMS MFA Services)
- **Role**: SMS verification code delivery for MFA
- **Security**: Secure API, encrypted communications
- **Data**: No persistent user data stored; codes are temporary

## 7. Vulnerability Management

### 7.1 Vulnerability Scanning
- **Automated Scanning**: Regular automated vulnerability scans via:
  - `npm audit` for dependency vulnerabilities (run via `npm run security:audit`)
  - GitHub Actions for automated security scanning
  - Production infrastructure monitoring
- **Frequency**: 
  - Dependency scans: Before each deployment
  - Infrastructure scans: Weekly
  - Full security audits: Quarterly

### 7.2 Vulnerability Remediation
- **Patch Management**: Timely application of security patches
- **Critical Vulnerabilities**: Immediate remediation of critical vulnerabilities (within 24 hours)
- **High Vulnerabilities**: Remediation within 7 days
- **Medium/Low Vulnerabilities**: Remediation within 30 days
- **Vulnerability Tracking**: Tracking and management of identified vulnerabilities

### 7.3 Code Security
- **Code Reviews**: Security-focused code reviews before deployment
- **Dependency Updates**: Regular updates of dependencies with known vulnerabilities
- **Secure Coding Practices**: Following secure coding best practices
- **SQL Injection Prevention**: Parameterized queries and RLS policies (see `docs/SQL_INJECTION_SECURITY.md`)

## 8. Security Monitoring and Alerting

### 8.1 Security Alerting System
- **Implementation**: `backend/src/utils/securityAlerts.js`
- **Alert Thresholds**:
  - Failed authentication attempts: Alert after 5 failed attempts
  - Quota violations: Alert after 10 violations per hour
  - Suspicious API patterns: Alert after 3 occurrences
  - Critical errors: Alert after 20 critical errors per hour
- **Alert Channels**: Logged to audit logs and notifications sent via configured channels

### 8.2 Logging and Monitoring
- **Comprehensive Logging**: All security-relevant events logged via `backend/src/utils/logger.js`
- **Audit Logs**: Security events logged to Supabase audit_logs table
- **Monitoring**: Continuous monitoring of systems for security incidents
- **Log Retention**: Security logs retained for 12 months (see Data Retention Policy)

## 9. Compliance Requirements

### 9.1 GDPR (General Data Protection Regulation)
- **Data Processing**: Lawful basis for processing personal data (consent, contract, legal obligation, legitimate interests)
- **Data Subject Rights**: Right to access, rectification, erasure, data portability, objection
- **Data Breach Notification**: Notification to supervisory authority within 72 hours
- **Data Processing Agreements**: DPAs in place with all processors
- **Privacy Policy**: Comprehensive privacy policy available at `docs/PRIVACY_POLICY_UPDATED.md`

### 9.2 CCPA (California Consumer Privacy Act)
- **Consumer Rights**: Right to know, delete, opt-out (we do not sell data)
- **Disclosure**: Clear disclosure of data collection and use
- **Non-Discrimination**: No discrimination for exercising privacy rights
- **Request Handling**: Process for handling CCPA requests

### 9.3 PCI DSS (Payment Card Industry Data Security Standard)
- **Compliance**: Where applicable for payment processing
- **Third-Party Compliance**: RevenueCat and Plaid maintain PCI DSS compliance
- **Data Handling**: No direct storage of payment card data

### 9.4 SOC 2
- **Third-Party Compliance**: Supabase maintains SOC 2 Type II compliance
- **Controls**: Security controls aligned with SOC 2 requirements
- **Documentation**: Security documentation maintained for audits

## 10. Employee and Contractor Security Requirements

### 10.1 Security Training
- **Onboarding Training**: Security training for new employees and contractors
- **Ongoing Training**: Regular security awareness training (quarterly)
- **Incident Response Training**: Training on incident response procedures
- **Policy Acknowledgment**: All personnel must acknowledge receipt and understanding of security policies

### 10.2 Access Management
- **Principle of Least Privilege**: Access granted only to data and systems necessary for job functions
- **Access Reviews**: Quarterly review and audit of access permissions (for 1-5 person team)
- **Termination Procedures**: Immediate revocation of access upon termination or role change
- **Role-Based Access Control**: Access permissions based on job role and responsibilities

### 10.3 Device Security
- **Device Management**: Requirements for company and personal devices accessing Trilo systems
- **Endpoint Security**: Antivirus and security software requirements
- **Device Encryption**: Encryption requirements for devices storing sensitive data
- **Remote Access**: Secure remote access guidelines

## 11. Incident Response

### 11.1 Incident Detection and Reporting
- **Detection**: Continuous monitoring for security incidents
- **Reporting**: Immediate reporting of security incidents to security@thetriloapp.com
- **Classification**: Incidents classified as Critical, High, Medium, or Low
- **Response**: See `docs/INCIDENT_RESPONSE_POLICY.md` for detailed procedures

### 11.2 Security Incident Types
- Data breaches
- Unauthorized access
- System compromises
- Malware infections
- Denial of service attacks
- Phishing attacks

## 12. Review and Update Procedures

### 12.1 Policy Review
- **Annual Review**: Annual review of this security policy
- **Change Management**: Process for updating security policies
- **Stakeholder Approval**: Approval process for policy changes
- **Version Control**: All policy changes tracked with version numbers

### 12.2 Continuous Improvement
- **Security Metrics**: Tracking of security metrics and KPIs
- **Lessons Learned**: Incorporating lessons learned from incidents
- **Best Practices**: Staying current with security best practices
- **Technology Updates**: Regular review and update of security technologies

## 13. Responsibilities

### 13.1 Security Team Responsibilities
- Maintain and update security policies
- Conduct security assessments and audits
- Respond to security incidents
- Provide security training
- Monitor security controls

### 13.2 Employee/Contractor Responsibilities
- Comply with all security policies
- Report security incidents immediately
- Use strong passwords and enable MFA
- Protect sensitive data
- Complete security training

### 13.3 Management Responsibilities
- Approve security policies
- Allocate resources for security
- Ensure compliance with policies
- Support security initiatives

## 14. Contact Information

For security-related inquiries or to report security incidents:

**Security Email:** security@thetriloapp.com  
**Privacy Email:** privacy@thetriloapp.com  
**Support Email:** support@thetriloapp.com

## 15. Document Control

**Document Owner:** Trilo Security Team  
**Approval Authority:** Trilo Leadership  
**Review Frequency:** Annual or as needed  
**Next Review Date:** January 2026

## 16. References

- [Security Policy](./SECURITY_POLICY.md) - Existing security documentation
- [Security Implementation Guide](./SECURITY_IMPLEMENTATION.md) - Security setup instructions
- [Privacy Policy](./PRIVACY_POLICY_UPDATED.md) - Privacy and data protection
- [Key Rotation Procedure](./KEY_ROTATION_PROCEDURE.md) - Key rotation procedures
- [SQL Injection Security](./SQL_INJECTION_SECURITY.md) - SQL injection prevention
- [Incident Response Policy](./INCIDENT_RESPONSE_POLICY.md) - Incident response procedures

---

*This document is confidential and proprietary to Trilo. Unauthorized distribution is prohibited.*
