# Trilo Security Policy

**Effective Date:** January 2025  
**Last Updated:** January 2025  
**Version:** 1.0

## 1. Information Security Policy Overview

Trilo is committed to protecting the security, confidentiality, integrity, and availability of user data and financial information. This security policy establishes the framework for identifying, mitigating, and monitoring information security risks relevant to our business operations.

### 1.1 Scope
This policy applies to:
- All Trilo employees and contractors
- All systems, networks, and applications used by Trilo
- All third-party service providers processing Trilo user data
- All user data collected, stored, and processed by Trilo

### 1.2 Security Objectives
- Protect user financial data from unauthorized access, disclosure, alteration, or destruction
- Ensure compliance with applicable privacy and data protection regulations
- Maintain the confidentiality and integrity of user information
- Provide secure access to Trilo services
- Implement security controls appropriate to the risk level

## 2. Access Controls and Procedures

### 2.1 User Authentication
- **Multi-Factor Authentication (MFA)**: All users must enable MFA before accessing Plaid banking features
- **Password Requirements**: Strong password policies enforced (minimum 8 characters, complexity requirements)
- **Session Management**: Automatic session timeout and secure session handling
- **Account Lockout**: Temporary account lockout after multiple failed login attempts

### 2.2 Employee and Contractor Access
- **Principle of Least Privilege**: Access granted only to data and systems necessary for job functions
- **Access Reviews**: Regular review and audit of access permissions
- **Termination Procedures**: Immediate revocation of access upon termination or role change
- **Role-Based Access Control (RBAC)**: Access permissions based on job role and responsibilities

### 2.3 System Access Controls
- **Production Environment**: Restricted access to production systems and databases
- **Secure Authentication**: Strong authentication required for all system access
- **Network Segmentation**: Separation of production, staging, and development environments
- **VPN/Network Access**: Secure network access controls for remote access

### 2.4 Third-Party Access
- **Service Provider Agreements**: All third-party service providers must comply with security requirements
- **Access Monitoring**: Monitoring of third-party access to Trilo systems
- **Vendor Risk Assessment**: Security assessment of third-party vendors before onboarding

## 3. Data Protection and Encryption

### 3.1 Encryption in Transit
- **TLS 1.2+**: All data transmitted between clients and servers encrypted using TLS 1.2 or higher
- **API Security**: All API communications secured with HTTPS
- **Certificate Management**: Regular certificate renewal and management

### 3.2 Encryption at Rest
- **Database Encryption**: All user data stored in Supabase is encrypted at rest
- **Access Token Security**: Plaid access tokens encrypted in database storage
- **Backup Encryption**: All backups encrypted using industry-standard encryption

### 3.3 Key Management
- **Secret Storage**: Environment variables and secrets stored securely (not in code)
- **Key Rotation**: Regular rotation of encryption keys and API secrets
- **Secret Management**: Use of secure secret management practices

## 4. Authentication and Authorization

### 4.1 User Authentication
- **Multi-Factor Authentication**: Required for all users accessing bank account features
- **SMS Verification**: SMS-based verification codes sent to registered phone numbers
- **Code Expiration**: Verification codes expire after 10 minutes
- **Authentication Logging**: Logging of authentication attempts and failures

### 4.2 System Authentication
- **MFA for Critical Systems**: Multi-factor authentication required for:
  - Supabase dashboard access
  - Railway deployment access
  - Source code repository access
  - Other critical system access

### 4.3 Authorization
- **Row Level Security (RLS)**: Database-level security ensuring users can only access their own data
- **API Authorization**: Token-based authorization for API access
- **Resource-Based Permissions**: Fine-grained permissions for accessing resources

## 5. Incident Response Procedures

### 5.1 Incident Detection
- **Monitoring**: Continuous monitoring of systems for security incidents
- **Alerting**: Automated alerts for suspicious activities
- **Logging**: Comprehensive logging of security-relevant events

### 5.2 Incident Response
- **Response Team**: Designated security incident response team
- **Escalation Procedures**: Defined escalation paths for security incidents
- **Containment**: Procedures for containing security incidents
- **Investigation**: Process for investigating security incidents

### 5.3 Incident Reporting
- **User Notification**: Notification of affected users in case of data breaches (as required by law)
- **Regulatory Reporting**: Compliance with breach notification requirements
- **Documentation**: Documentation of incidents and response actions

## 6. Vulnerability Management

### 6.1 Vulnerability Scanning
- **Automated Scanning**: Regular automated vulnerability scans of:
  - Application dependencies (npm audit)
  - Production infrastructure
  - Employee and contractor devices (as applicable)

### 6.2 Vulnerability Remediation
- **Patch Management**: Timely application of security patches
- **Critical Vulnerabilities**: Immediate remediation of critical vulnerabilities
- **Vulnerability Tracking**: Tracking and management of identified vulnerabilities

### 6.3 Code Security
- **Code Reviews**: Security-focused code reviews before deployment
- **Dependency Updates**: Regular updates of dependencies with known vulnerabilities
- **Secure Coding Practices**: Following secure coding best practices

## 7. Third-Party Service Security

### 7.1 Service Provider Security
- **Security Assessments**: Assessment of third-party service providers
- **Contractual Requirements**: Security requirements in service provider contracts
- **Compliance Verification**: Verification of third-party compliance with security requirements

### 7.2 Key Service Providers
- **Supabase**: Database and authentication service - SOC 2 compliant
- **Railway**: Hosting infrastructure - Security best practices
- **Plaid**: Financial data aggregation - Bank-level security and compliance
- **RevenueCat**: Subscription management - PCI DSS compliant

## 8. Compliance and Auditing

### 8.1 Compliance Requirements
- **GDPR**: Compliance with General Data Protection Regulation (EU)
- **CCPA**: Compliance with California Consumer Privacy Act
- **PCI DSS**: Compliance where applicable for payment processing
- **Financial Regulations**: Compliance with applicable financial regulations

### 8.2 Security Audits
- **Regular Audits**: Periodic security audits and assessments
- **External Audits**: Third-party security audits as needed
- **Audit Trail**: Maintaining audit logs of security-relevant events

### 8.3 Documentation
- **Security Documentation**: Maintaining up-to-date security documentation
- **Policy Reviews**: Regular review and update of security policies
- **Training Records**: Documentation of security training

## 9. Employee and Contractor Security Requirements

### 9.1 Security Training
- **Onboarding Training**: Security training for new employees and contractors
- **Ongoing Training**: Regular security awareness training
- **Incident Response Training**: Training on incident response procedures

### 9.2 Device Security
- **Device Management**: Requirements for company and personal devices accessing Trilo systems
- **Endpoint Security**: Antivirus and security software requirements
- **Device Encryption**: Encryption requirements for devices storing sensitive data

### 9.3 Acceptable Use
- **Acceptable Use Policy**: Clear guidelines on acceptable use of Trilo systems
- **Data Handling**: Procedures for handling sensitive data
- **Remote Work Security**: Security requirements for remote work

## 10. Review and Update Procedures

### 10.1 Policy Review
- **Annual Review**: Annual review of this security policy
- **Change Management**: Process for updating security policies
- **Stakeholder Approval**: Approval process for policy changes

### 10.2 Continuous Improvement
- **Security Metrics**: Tracking of security metrics and KPIs
- **Lessons Learned**: Incorporating lessons learned from incidents
- **Best Practices**: Staying current with security best practices

## 11. Contact

For security-related inquiries or to report security incidents:

**Email:** security@thetriloapp.com  
**Privacy Email:** privacy@thetriloapp.com  
**Support Email:** support@thetriloapp.com

## 12. Document Control

**Document Owner:** Trilo Security Team  
**Approval Authority:** Trilo Leadership  
**Review Frequency:** Annual or as needed  
**Next Review Date:** January 2026

---

*This document is confidential and proprietary to Trilo. Unauthorized distribution is prohibited.*

