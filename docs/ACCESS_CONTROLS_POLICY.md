# Access Controls Policy

**Effective Date:** January 2025  
**Last Updated:** January 2025  
**Version:** 1.0  
**Document Owner:** Trilo Security Team  
**Approval Authority:** Trilo Leadership

## 1. Policy Overview

### 1.1 Purpose
This Access Controls Policy establishes the framework for managing access to Trilo systems, data, and resources. This policy ensures that access is granted based on the principle of least privilege, properly authenticated, and regularly reviewed.

### 1.2 Scope
This policy applies to:
- All Trilo employees and contractors (currently 1-5 person team)
- All users of the Trilo application
- All systems, databases, and applications used by Trilo
- All third-party service providers with system access
- All data and information resources

### 1.3 Applicability
This policy is mandatory for all personnel with access to Trilo systems, data, or infrastructure. Compliance with this policy is a condition of employment, contractor agreements, and user terms of service.

## 2. Access Control Principles

### 2.1 Principle of Least Privilege
- Access is granted only to data and systems necessary for job functions or user needs
- Users receive the minimum level of access required to perform their duties
- Access is reviewed regularly to ensure it remains appropriate
- Unnecessary access is revoked promptly

### 2.2 Need-to-Know Basis
- Access to sensitive data is granted only to personnel who need it for legitimate business purposes
- Access is limited to specific data sets required for job functions
- Data sharing is restricted to authorized personnel only

### 2.3 Separation of Duties
- Critical functions are separated to prevent single points of failure
- No single individual has complete control over critical processes
- Approval and execution of sensitive operations are separated

## 3. User Authentication

### 3.1 User Account Authentication
- **Authentication Method**: Supabase Auth with email/password authentication
- **Implementation**: `context/AuthContext.tsx` handles user authentication flows
- **Password Requirements**: 
  - Minimum 8 characters
  - Complexity requirements enforced by Supabase
  - Passwords are hashed and never stored in plain text
- **Session Management**: 
  - Secure session tokens (JWT) stored in AsyncStorage
  - Automatic session timeout
  - Session restoration on app restart
- **Account Lockout**: Temporary account lockout after multiple failed login attempts (tracked via security alerts)

### 3.2 Multi-Factor Authentication (MFA)
- **Requirement**: MFA is required for all users before accessing Plaid banking features
- **Implementation**: SMS-based verification via Twilio, managed by `services/mfaService.ts`
- **MFA Flow**:
  1. User attempts to access Plaid features
  2. System checks if MFA is enabled for user
  3. If not enabled, user must set up MFA
  4. SMS verification code sent to registered phone number
  5. Code expires after 10 minutes
  6. User enters code to verify
  7. Upon successful verification, access granted
- **Phone Number Security**: Phone numbers stored securely and masked for display
- **MFA Status**: Stored in AsyncStorage and Supabase user metadata

### 3.3 Authentication Logging
- All authentication attempts are logged
- Failed authentication attempts trigger security alerts
- Authentication logs include:
  - User ID
  - IP address
  - Timestamp
  - Success/failure status
  - Device information

## 4. System Access Controls

### 4.1 Production Environment Access
- **Restricted Access**: Production systems and databases have restricted access
- **Access Methods**: 
  - Supabase Dashboard (with MFA required)
  - Railway deployment platform (with secure authentication)
  - Source code repository (GitHub with 2FA)
- **Access Approval**: Production access requires management approval
- **Access Logging**: All production access is logged and monitored

### 4.2 Development and Staging Environments
- **Separation**: Development, staging, and production environments are separated
- **Access Controls**: Development environments have appropriate access controls
- **Data**: No production data in development environments
- **Testing**: Security testing performed in staging before production deployment

### 4.3 Network Access Controls
- **Secure Authentication**: Strong authentication required for all system access
- **VPN/Network Access**: Secure network access controls for remote access
- **Firewall Rules**: Appropriate firewall rules and network segmentation
- **Monitoring**: Network access is monitored for suspicious activity

## 5. Database Access Controls

### 5.1 Row Level Security (RLS)
- **Implementation**: Supabase Row Level Security (RLS) enabled on all user data tables
- **Schema**: Defined in `supabase_schema.sql`
- **Policy Enforcement**: All policies enforce `auth.uid() = user_id` to ensure users can only access their own data

### 5.2 RLS Policies by Table

**user_transactions**
- Users can view own transactions: `USING (auth.uid() = user_id)`
- Users can insert own transactions: `WITH CHECK (auth.uid() = user_id)`
- Users can update own transactions: `USING (auth.uid() = user_id)`
- Users can delete own transactions: `USING (auth.uid() = user_id)`

**user_income**
- Users can view own income: `USING (auth.uid() = user_id)`
- Users can insert own income: `WITH CHECK (auth.uid() = user_id)`
- Users can update own income: `USING (auth.uid() = user_id)`
- Users can delete own income: `USING (auth.uid() = user_id)`

**user_savings_goals**
- Users can view own savings goals: `USING (auth.uid() = user_id)`
- Users can manage own savings goals: `USING (auth.uid() = user_id)` (ALL operations)

**user_settings**
- Users can manage own settings: `USING (auth.uid() = user_id)` (ALL operations)

**user_tutorial_status**
- Users can manage own tutorial status: `USING (auth.uid() = user_id)` (ALL operations)

**user_subscriptions**
- Users can view own subscription: `USING (auth.uid() = user_id)`
- Users can insert own subscription: `WITH CHECK (auth.uid() = user_id)`
- Users can update own subscription: `USING (auth.uid() = user_id)`
- Server can update subscription via RevenueCat: `USING (true)` (restricted via service role key)

### 5.3 Database Roles
- **authenticated**: Standard user role with RLS policies applied
- **service_role**: Backend service role with elevated privileges (used for backend operations)
- **anon**: Anonymous role with no data access (for public endpoints only)

### 5.4 Cascade Deletion
- **ON DELETE CASCADE**: All user data tables have `ON DELETE CASCADE` to ensure data is deleted when user account is deleted
- **Data Isolation**: Ensures complete data removal when user deletes account
- **Implementation**: Defined in `supabase_schema.sql`

## 6. API Access Controls

### 6.1 JWT Token Authentication
- **Token Type**: Supabase JWT tokens for API authentication
- **Implementation**: `backend/src/middleware/auth.js` verifies JWT tokens
- **Token Verification**: 
  - Tokens verified using Supabase client
  - Invalid or expired tokens rejected
  - User information extracted from verified tokens
- **Token Storage**: Tokens stored securely in mobile app AsyncStorage

### 6.2 Rate Limiting
- **Implementation**: `backend/src/middleware/rateLimit.js`
- **Rate Limits**:
  - General API: 100 requests per 15 minutes per IP
  - Plaid operations: 20 requests per 15 minutes per IP
  - Account operations: 30 requests per 15 minutes per IP
  - MFA operations: 10 requests per 15 minutes per IP
  - Per-user Plaid operations: 15 requests per 15 minutes per user
- **Rate Limit Headers**: Standard rate limit headers returned in responses
- **Enforcement**: Rate limit violations return 429 status code

### 6.3 API Authorization
- **Resource-Based Permissions**: Fine-grained permissions for accessing resources
- **User Verification**: Backend verifies user owns resource before allowing access
- **Implementation**: `backend/src/utils/authorization.js` provides authorization helpers
- **Account Ownership**: `verifyAccountOwnership()` ensures users can only access their own accounts

## 7. Employee and Contractor Access Management

### 7.1 Access Request Process
- **Request**: Access requests must be submitted with business justification
- **Approval**: Access requires management approval
- **Provisioning**: Access is provisioned only after approval
- **Documentation**: All access grants are documented

### 7.2 Access Reviews
- **Frequency**: Quarterly access reviews for all personnel (appropriate for 1-5 person team)
- **Scope**: Review of all system, database, and application access
- **Process**:
  1. Generate access report
  2. Review with managers
  3. Identify unnecessary access
  4. Revoke unnecessary access
  5. Document review results
- **Documentation**: Access review results are documented and retained

### 7.3 Access Termination
- **Immediate Revocation**: Access is immediately revoked upon:
  - Employee termination
  - Contractor contract end
  - Role change requiring different access
  - Security incident
- **Process**:
  1. Disable user accounts
  2. Revoke API keys and tokens
  3. Remove from access groups
  4. Verify access removal
  5. Document termination
- **Verification**: Access removal is verified and documented

### 7.4 Role-Based Access Control (RBAC)
- **Roles**: Access permissions based on job role and responsibilities
- **Current Roles**:
  - **Developer**: Full access to development systems, limited production access
  - **Admin**: Full access to all systems (management only)
  - **Contractor**: Limited access based on project needs
- **Role Assignment**: Roles assigned based on job function and responsibilities
- **Role Reviews**: Roles reviewed quarterly to ensure appropriateness

## 8. Third-Party Access Controls

### 8.1 Service Provider Access
- **Service Provider Agreements**: All third-party service providers must comply with security requirements
- **Access Monitoring**: Monitoring of third-party access to Trilo systems
- **Vendor Risk Assessment**: Security assessment of third-party vendors before onboarding
- **Access Limits**: Third-party access limited to necessary systems only

### 8.2 API Key Management
- **Key Storage**: API keys stored securely in environment variables (Railway)
- **Key Rotation**: Regular rotation of API keys (see `docs/KEY_ROTATION_PROCEDURE.md`)
- **Key Access**: API keys accessible only to authorized personnel
- **Key Monitoring**: API key usage is monitored for suspicious activity

## 9. Local Storage Access Controls

### 9.1 User-Specific Storage Keys
- **Implementation**: All local storage keys include user ID to ensure data isolation
- **Storage Keys**: 
  - `finance_transactions_v2_${userId}`
  - `settings_user_preferences_v2_${userId}`
  - `savings_goals_${userId}`
  - `@trilo:mfa_phone_${userId}`
- **Data Isolation**: Each user's data is completely isolated from other users
- **Implementation**: `context/FinanceContext.tsx`, `context/SettingsContext.tsx`, `context/SavingsContext.tsx`

### 9.2 Session Storage
- **Session Key**: `@trilo:session_${userId}` (or similar)
- **Session Security**: Sessions stored securely in AsyncStorage
- **Session Validation**: Sessions validated on app startup
- **Session Expiration**: Sessions expire and require re-authentication

## 10. Access Control Monitoring

### 10.1 Access Logging
- **Comprehensive Logging**: All access attempts are logged
- **Log Contents**: User ID, resource accessed, timestamp, success/failure
- **Log Retention**: Access logs retained for 12 months
- **Log Review**: Access logs reviewed regularly for suspicious activity

### 10.2 Security Alerts
- **Failed Authentication**: Alerts after 5 failed authentication attempts
- **Suspicious Access**: Alerts for suspicious access patterns
- **Unauthorized Access**: Immediate alerts for unauthorized access attempts
- **Implementation**: `backend/src/utils/securityAlerts.js`

### 10.3 Audit Trails
- **Audit Logs**: All security-relevant events logged to Supabase audit_logs table
- **Audit Review**: Audit logs reviewed regularly
- **Compliance**: Audit trails maintained for compliance requirements

## 11. Access Control Violations

### 11.1 Violation Types
- Unauthorized access attempts
- Accessing data outside authorized scope
- Sharing credentials
- Bypassing security controls
- Violating access policies

### 11.2 Violation Response
- **Immediate Action**: Revoke access immediately upon violation detection
- **Investigation**: Investigate violation to determine scope
- **Documentation**: Document violation and response
- **Disciplinary Action**: Appropriate disciplinary action based on severity
- **Legal Action**: Legal action if violation involves criminal activity

## 12. Compliance Requirements

### 12.1 GDPR Requirements
- **Access Rights**: Users have right to access their personal data
- **Data Portability**: Users can export their data
- **Right to Erasure**: Users can request account deletion
- **Access Logs**: Access to personal data is logged

### 12.2 CCPA Requirements
- **Access Rights**: California residents have right to know what data is accessed
- **Deletion Rights**: Right to request deletion of personal data
- **Non-Discrimination**: No discrimination for exercising access rights

### 12.3 SOC 2 Requirements
- **Access Controls**: Access controls documented and tested
- **Access Reviews**: Regular access reviews performed
- **Audit Trails**: Comprehensive audit trails maintained

## 13. Responsibilities

### 13.1 Security Team Responsibilities
- Maintain access control policies
- Conduct access reviews
- Monitor access controls
- Respond to access violations
- Provide access control training

### 13.2 Employee/Contractor Responsibilities
- Use strong passwords and enable MFA
- Protect credentials
- Report access violations
- Comply with access policies
- Complete access control training

### 13.3 Management Responsibilities
- Approve access requests
- Review access regularly
- Ensure compliance with policies
- Support access control initiatives

## 14. Review and Update Procedures

### 14.1 Policy Review
- **Annual Review**: Annual review of this access controls policy
- **Change Management**: Process for updating access control policies
- **Stakeholder Approval**: Approval process for policy changes
- **Version Control**: All policy changes tracked with version numbers

### 14.2 Continuous Improvement
- **Access Control Metrics**: Tracking of access control metrics
- **Lessons Learned**: Incorporating lessons learned from incidents
- **Best Practices**: Staying current with access control best practices
- **Technology Updates**: Regular review and update of access control technologies

## 15. Contact Information

For access control inquiries or to report access violations:

**Security Email:** security@thetriloapp.com  
**Privacy Email:** privacy@thetriloapp.com  
**Support Email:** support@thetriloapp.com

## 16. Document Control

**Document Owner:** Trilo Security Team  
**Approval Authority:** Trilo Leadership  
**Review Frequency:** Annual or as needed  
**Next Review Date:** January 2026

## 17. References

- [Information Security Policy](./INFORMATION_SECURITY_POLICY.md) - Overall security policy
- [Data Retention and Disposal Policy](./DATA_RETENTION_AND_DISPOSAL_POLICY.md) - Data retention procedures
- [Incident Response Policy](./INCIDENT_RESPONSE_POLICY.md) - Incident response procedures
- [supabase_schema.sql](../supabase_schema.sql) - Database schema and RLS policies

---

*This document is confidential and proprietary to Trilo. Unauthorized distribution is prohibited.*
