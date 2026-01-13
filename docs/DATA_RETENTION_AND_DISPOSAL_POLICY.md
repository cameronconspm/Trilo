# Data Retention and Disposal Policy

**Effective Date:** January 2025  
**Last Updated:** January 2025  
**Version:** 1.0  
**Document Owner:** Trilo Security Team  
**Approval Authority:** Trilo Leadership

## 1. Policy Overview

### 1.1 Purpose
This Data Retention and Disposal Policy establishes the framework for retaining and disposing of Trilo user data in a secure and compliant manner. This policy ensures data is retained only as long as necessary and disposed of securely when no longer needed.

### 1.2 Scope
This policy applies to:
- All user data collected, stored, and processed by Trilo
- All data stored in Supabase database
- All data stored in local device storage (AsyncStorage)
- All backup data
- All audit logs and security logs
- All employee and contractor data

### 1.3 Applicability
This policy is mandatory for all personnel involved in data management, retention, or disposal. Compliance with this policy is required for GDPR, CCPA, and other applicable regulations.

## 2. Data Retention Principles

### 2.1 General Principles
- **Minimal Retention**: Data is retained only as long as necessary for business purposes
- **Legal Compliance**: Retention periods comply with applicable laws and regulations
- **Purpose Limitation**: Data is retained only for the purposes for which it was collected
- **User Rights**: Users have the right to request deletion of their data (GDPR, CCPA)

### 2.2 Retention Period Determination
Retention periods are determined based on:
- Legal and regulatory requirements
- Business operational needs
- User consent and preferences
- Data sensitivity and risk
- Contractual obligations

## 3. Data Retention Periods by Data Type

### 3.1 Authentication Data
- **Retention Period**: While account is active
- **Data Types**:
  - User email addresses
  - Password hashes (never stored in plain text)
  - Authentication session tokens
  - MFA phone numbers (masked for display)
- **Disposal**: Deleted immediately upon account deletion
- **Implementation**: Account deletion triggers cascade deletion (see Section 5)

### 3.2 Financial Data
- **Retention Period**: While account is active and bank accounts are connected
- **Data Types**:
  - Transaction history and details
  - Bank account information (account names, types, balances)
  - Account routing numbers (masked)
  - Financial institution information
  - Plaid access tokens
- **Disposal**: 
  - Deleted immediately when user disconnects bank account
  - Deleted immediately upon account deletion
- **Implementation**: Cascade deletion via `ON DELETE CASCADE` in database schema

### 3.3 Income and Savings Data
- **Retention Period**: While account is active
- **Data Types**:
  - Income entries (`user_income` table)
  - Savings goals (`user_savings_goals` table)
- **Disposal**: Deleted immediately upon account deletion
- **Implementation**: Cascade deletion via `ON DELETE CASCADE` in database schema

### 3.4 User Settings and Preferences
- **Retention Period**: While account is active
- **Data Types**:
  - User settings (`user_settings` table)
  - Theme preferences
  - Notification preferences
  - Profile information (nickname, avatar)
- **Disposal**: Deleted immediately upon account deletion
- **Implementation**: Cascade deletion via `ON DELETE CASCADE` in database schema

### 3.5 Security and Authentication Logs
- **Retention Period**: 12 months
- **Data Types**:
  - Authentication logs (login attempts, device information)
  - Security-related metadata
  - Failed authentication attempts
  - MFA verification attempts and timestamps
- **Disposal**: Automatically deleted after 12 months
- **Purpose**: Retained for security and fraud prevention purposes
- **Legal Basis**: Legitimate interest in security and fraud prevention

### 3.6 Backup Data
- **Retention Period**: 7-30 days (depending on Supabase plan)
- **Data Types**:
  - Database backups
  - Point-in-time recovery backups
- **Disposal**: Automatically deleted by Supabase after retention period
- **Backup Frequency**: Daily automated backups
- **Backup Location**: Supabase managed backups

### 3.7 Quota and Analytics Data
- **Retention Period**: 90 days
- **Data Types**:
  - User quota tracking (`user_quotas` table)
  - Account sync tracking (`account_sync_tracking` table)
  - API usage analytics
- **Disposal**: Automatically deleted after 90 days via cleanup function
- **Implementation**: `cleanup_old_quotas(retention_days)` function in `backend/database/user-quotas-schema.sql`
- **Purpose**: Retained for cost control and usage analytics

### 3.8 Audit Logs
- **Retention Period**: 12 months
- **Data Types**:
  - Security events
  - Access logs
  - Administrative actions
  - Security alerts
- **Disposal**: Automatically deleted after 12 months
- **Purpose**: Retained for security monitoring and compliance

### 3.9 Subscription Data
- **Retention Period**: While account is active, plus 7 years for financial records (if applicable)
- **Data Types**:
  - Subscription status
  - Trial periods
  - Subscription expiration dates
  - RevenueCat user IDs
- **Disposal**: Deleted upon account deletion (unless legal retention required)
- **Legal Retention**: May be retained longer if required by financial regulations

## 4. Account Deletion Process

### 4.1 User-Initiated Account Deletion
- **User Request**: Users can request account deletion through the app
- **Implementation**: `context/AuthContext.tsx` - `deleteAccount()` function
- **Process**:
  1. User initiates account deletion
  2. System verifies user identity
  3. System deletes user from Supabase Auth (`supabase.auth.admin.deleteUser()`)
  4. Cascade deletion removes all user data (via `ON DELETE CASCADE`)
  5. Local storage cleared (`AsyncStorage.multiRemove()`)
  6. User signed out
  7. Confirmation sent to user

### 4.2 Cascade Deletion
- **Database Schema**: All user data tables have `ON DELETE CASCADE` foreign key constraints
- **Tables Affected**:
  - `user_transactions` - All user transactions deleted
  - `user_income` - All user income entries deleted
  - `user_savings_goals` - All user savings goals deleted
  - `user_settings` - User settings deleted
  - `user_tutorial_status` - Tutorial status deleted
  - `user_subscriptions` - Subscription data deleted
- **Implementation**: Defined in `supabase_schema.sql`
- **Verification**: Cascade deletion verified during account deletion process

### 4.3 Local Storage Deletion
- **Storage Keys Cleared**:
  - `@trilo:transactions`
  - `@trilo:income`
  - `@trilo:savings_goals`
  - `@trilo:settings`
  - Session storage key
- **Implementation**: `AsyncStorage.multiRemove()` in `deleteAccount()` function
- **User-Specific Keys**: All user-specific storage keys are cleared

## 5. Secure Data Disposal Methods

### 5.1 Database Deletion
- **Method**: SQL DELETE statements with cascade deletion
- **Verification**: Verify deletion by querying for user data
- **Backup Consideration**: Data may exist in backups for retention period
- **Implementation**: Supabase database deletion with RLS policies

### 5.2 Local Storage Deletion
- **Method**: `AsyncStorage.removeItem()` or `AsyncStorage.multiRemove()`
- **Verification**: Verify deletion by attempting to read deleted keys
- **Platform**: React Native AsyncStorage on mobile devices
- **Implementation**: User-specific keys cleared during account deletion

### 5.3 Backup Disposal
- **Automatic Disposal**: Supabase automatically deletes backups after retention period
- **Retention Period**: 7-30 days (depending on plan)
- **Manual Disposal**: Manual backup deletion available in Supabase Dashboard
- **Verification**: Backup deletion verified in Supabase Dashboard

### 5.4 Log Disposal
- **Automatic Disposal**: Logs automatically deleted after retention period
- **Retention Period**: 12 months for security logs, 90 days for quota/analytics
- **Implementation**: Automated cleanup functions
- **Verification**: Log deletion verified through log queries

## 6. Data Disposal Procedures

### 6.1 Regular Disposal Procedures
- **Automated Cleanup**: Automated cleanup functions run periodically
- **Quota Cleanup**: `cleanup_old_quotas(retention_days)` function removes old quota records
- **Frequency**: Weekly or monthly cleanup runs
- **Implementation**: `backend/database/user-quotas-schema.sql`

### 6.2 Account Deletion Disposal
- **Immediate Deletion**: User data deleted immediately upon account deletion
- **Cascade Deletion**: All related data deleted via cascade
- **Verification**: Deletion verified through database queries
- **Confirmation**: User receives confirmation of deletion

### 6.3 Backup Disposal
- **Automatic**: Backups automatically deleted after retention period
- **Manual**: Manual backup deletion available if needed
- **Verification**: Backup deletion verified in Supabase Dashboard
- **Documentation**: Backup disposal documented

## 7. Legal Hold Procedures

### 7.1 Legal Hold Triggers
- **Litigation**: Pending or anticipated litigation
- **Regulatory Investigation**: Regulatory investigation or inquiry
- **Legal Request**: Legal request to preserve data
- **Internal Investigation**: Internal investigation requiring data preservation

### 7.2 Legal Hold Process
- **Identification**: Identify data subject to legal hold
- **Preservation**: Preserve data and suspend normal disposal
- **Documentation**: Document legal hold and scope
- **Notification**: Notify relevant personnel of legal hold
- **Monitoring**: Monitor and maintain legal hold until release

### 7.3 Legal Hold Release
- **Release Criteria**: Legal hold released when:
  - Litigation resolved
  - Investigation completed
  - Legal requirement satisfied
- **Process**: 
  1. Obtain authorization to release hold
  2. Resume normal disposal procedures
  3. Document release
  4. Notify relevant personnel

## 8. Data Disposal Documentation

### 8.1 Disposal Records
- **Documentation**: All data disposal activities are documented
- **Records Include**:
  - Date and time of disposal
  - Data type and scope
  - Disposal method
  - Verification of disposal
  - Personnel involved
- **Retention**: Disposal records retained for 7 years

### 8.2 Audit Trail
- **Logging**: All data disposal activities logged in audit logs
- **Audit Log Contents**:
  - User ID (if applicable)
  - Data type
  - Disposal method
  - Timestamp
  - Success/failure status
- **Retention**: Audit logs retained for 12 months

## 9. Compliance Requirements

### 9.1 GDPR Requirements
- **Right to Erasure**: Users have right to request deletion of personal data (Article 17)
- **Data Minimization**: Data retained only as long as necessary (Article 5)
- **Purpose Limitation**: Data retained only for specified purposes (Article 5)
- **Documentation**: Data retention and disposal documented

### 9.2 CCPA Requirements
- **Right to Delete**: California residents have right to request deletion
- **Verification**: Verify identity before deletion
- **Confirmation**: Confirm deletion to user
- **Third-Party Deletion**: Request deletion from service providers if applicable

### 9.3 Other Regulatory Requirements
- **Financial Records**: May require longer retention for financial records (7 years)
- **Tax Records**: Tax-related records may require longer retention
- **Legal Requirements**: Comply with all applicable legal retention requirements

## 10. Data Retention Exceptions

### 10.1 Legal Requirements
- **Extended Retention**: Data may be retained longer if required by law
- **Examples**: Financial records, tax records, legal proceedings
- **Documentation**: Extended retention documented with legal basis

### 10.2 Business Requirements
- **Operational Needs**: Data may be retained for operational needs
- **Examples**: Active accounts, pending transactions, customer support
- **Review**: Business retention needs reviewed regularly

### 10.3 User Consent
- **Extended Retention**: Users may consent to extended retention
- **Documentation**: User consent documented
- **Revocation**: Users can revoke consent at any time

## 11. Responsibilities

### 11.1 Security Team Responsibilities
- Maintain data retention and disposal policies
- Monitor data retention compliance
- Conduct data disposal procedures
- Document data disposal activities
- Respond to data deletion requests

### 11.2 Employee/Contractor Responsibilities
- Comply with data retention policies
- Follow data disposal procedures
- Report data retention issues
- Complete data retention training

### 11.3 Management Responsibilities
- Approve data retention policies
- Ensure compliance with policies
- Allocate resources for data management
- Support data retention initiatives

## 12. Review and Update Procedures

### 12.1 Policy Review
- **Annual Review**: Annual review of data retention and disposal policy
- **Change Management**: Process for updating policies
- **Stakeholder Approval**: Approval process for policy changes
- **Version Control**: All policy changes tracked with version numbers

### 12.2 Retention Period Review
- **Regular Review**: Retention periods reviewed regularly
- **Legal Updates**: Retention periods updated based on legal changes
- **Business Needs**: Retention periods adjusted based on business needs
- **Documentation**: Retention period changes documented

## 13. Contact Information

For data retention or disposal inquiries:

**Security Email:** security@thetriloapp.com  
**Privacy Email:** privacy@thetriloapp.com  
**Support Email:** support@thetriloapp.com

## 14. Document Control

**Document Owner:** Trilo Security Team  
**Approval Authority:** Trilo Leadership  
**Review Frequency:** Annual or as needed  
**Next Review Date:** January 2026

## 15. References

- [Privacy Policy](./PRIVACY_POLICY_UPDATED.md) - Privacy and data protection policy
- [Information Security Policy](./INFORMATION_SECURITY_POLICY.md) - Overall security policy
- [Access Controls Policy](./ACCESS_CONTROLS_POLICY.md) - Access control procedures
- [supabase_schema.sql](../supabase_schema.sql) - Database schema with cascade deletion
- [user-quotas-schema.sql](../backend/database/user-quotas-schema.sql) - Quota cleanup functions

---

*This document is confidential and proprietary to Trilo. Unauthorized distribution is prohibited.*
