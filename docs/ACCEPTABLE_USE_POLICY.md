# Acceptable Use Policy

**Effective Date:** January 2025  
**Last Updated:** January 2025  
**Version:** 1.0  
**Document Owner:** Trilo Security Team  
**Approval Authority:** Trilo Leadership

## 1. Policy Overview

### 1.1 Purpose
This Acceptable Use Policy establishes the rules and guidelines for acceptable use of Trilo systems, services, and resources. This policy ensures that all users and personnel use Trilo resources responsibly and in compliance with applicable laws and regulations.

### 1.2 Scope
This policy applies to:
- All users of the Trilo application
- All Trilo employees and contractors (currently 1-5 person team)
- All systems, networks, and services provided by Trilo
- All data and information resources
- All third-party service providers with access to Trilo systems

### 1.3 Applicability
This policy is mandatory for all users and personnel. Violation of this policy may result in termination of access, disciplinary action, or legal action.

## 2. Acceptable Use of Trilo Systems

### 2.1 Authorized Use
Trilo systems and services may be used only for:
- Legitimate business purposes
- Personal financial management (for end users)
- Development and testing (for employees/contractors)
- Authorized administrative tasks
- Compliance with terms of service

### 2.2 User Responsibilities
Users are responsible for:
- Maintaining the confidentiality of account credentials
- Using strong, unique passwords
- Enabling multi-factor authentication (MFA) when required
- Reporting security incidents immediately
- Complying with all applicable laws and regulations
- Complying with Trilo terms of service

### 2.3 Employee/Contractor Responsibilities
Employees and contractors are responsible for:
- Using Trilo systems only for authorized business purposes
- Protecting sensitive data and information
- Complying with all security policies
- Reporting security incidents immediately
- Completing required security training
- Maintaining professional conduct

## 3. Prohibited Activities

### 3.1 Unauthorized Access
Prohibited activities include:
- Attempting to gain unauthorized access to systems or data
- Accessing data outside authorized scope
- Sharing credentials or access tokens
- Bypassing security controls
- Using unauthorized access methods

### 3.2 System Abuse
Prohibited activities include:
- Excessive API usage beyond rate limits
- Attempting to overload or disrupt systems
- Using automated tools to abuse services
- Attempting to circumvent rate limiting
- Engaging in denial of service attacks

### 3.3 Data Misuse
Prohibited activities include:
- Accessing data without authorization
- Sharing data with unauthorized parties
- Using data for unauthorized purposes
- Modifying data without authorization
- Deleting data without authorization

### 3.4 Illegal Activities
Prohibited activities include:
- Any illegal activities
- Fraud or financial crimes
- Money laundering
- Identity theft
- Violation of applicable laws and regulations

### 3.5 Malicious Activities
Prohibited activities include:
- Introducing malware, viruses, or malicious code
- Phishing or social engineering attacks
- Spam or unsolicited communications
- Harassment or abusive behavior
- Violation of others' rights

## 4. System Resource Usage

### 4.1 Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Plaid Operations**: 20 requests per 15 minutes per IP
- **Account Operations**: 30 requests per 15 minutes per IP
- **MFA Operations**: 10 requests per 15 minutes per IP
- **Per-User Plaid**: 15 requests per 15 minutes per user
- **Implementation**: `backend/src/middleware/rateLimit.js`

### 4.2 Quota Management
- **Quota Types**: 
  - Plaid link tokens: 5 per hour, 20 per day
  - Plaid connections: 10 lifetime, 3 per day
  - Plaid syncs: 10 per day
  - Plaid balance queries: 20 per hour, 100 per day
  - Plaid deletions: 10 per day
  - SMS codes: 10 per day
- **Implementation**: `backend/src/utils/quotaManager.js`
- **Enforcement**: Quota violations trigger alerts and may result in temporary restrictions

### 4.3 Account Sync Limits
- **Per Account**: 4 syncs per day per account
- **Minimum Interval**: 1 hour between syncs for same account
- **Implementation**: `backend/database/user-quotas-schema.sql`
- **Enforcement**: Sync requests exceeding limits are rejected

### 4.4 Resource Monitoring
- **Monitoring**: System resource usage is monitored
- **Alerts**: Excessive usage triggers security alerts
- **Review**: Resource usage reviewed regularly
- **Action**: Appropriate action taken for excessive usage

## 5. Data Handling Requirements

### 5.1 Data Access
- **Authorized Access Only**: Access data only when authorized
- **Need-to-Know**: Access only data necessary for job functions
- **User Data**: Users can only access their own data (enforced by RLS)
- **Employee Data**: Employees access data only for authorized purposes

### 5.2 Data Protection
- **Confidentiality**: Protect confidential data
- **Integrity**: Maintain data integrity
- **Availability**: Ensure data availability for authorized users
- **Encryption**: Use encryption for sensitive data in transit and at rest

### 5.3 Data Sharing
- **Authorized Sharing Only**: Share data only with authorized parties
- **User Consent**: Obtain user consent before sharing data
- **Third-Party Sharing**: Share with third parties only per agreements
- **Documentation**: Document all data sharing activities

### 5.4 Data Disposal
- **Secure Disposal**: Dispose of data securely when no longer needed
- **Retention Policies**: Comply with data retention policies
- **User Requests**: Honor user requests for data deletion
- **Documentation**: Document data disposal activities

## 6. Remote Access Guidelines

### 6.1 Remote Access Requirements
- **Secure Connection**: Use secure connections (VPN, encrypted connections)
- **Authentication**: Use strong authentication for remote access
- **Authorization**: Remote access requires authorization
- **Monitoring**: Remote access is monitored

### 6.2 Device Security
- **Device Management**: Secure device management required
- **Encryption**: Device encryption required for sensitive data
- **Security Software**: Antivirus and security software required
- **Updates**: Keep devices updated with security patches

### 6.3 Remote Work Security
- **Secure Environment**: Work in secure environment
- **Network Security**: Use secure networks
- **Data Protection**: Protect data on remote devices
- **Compliance**: Comply with all security policies

## 7. Communication Guidelines

### 7.1 Professional Conduct
- **Respectful Communication**: Communicate respectfully
- **Appropriate Language**: Use appropriate language
- **Professional Tone**: Maintain professional tone
- **Compliance**: Comply with communication policies

### 7.2 User Communications
- **User Support**: Provide helpful user support
- **Privacy**: Respect user privacy
- **Confidentiality**: Maintain confidentiality of user data
- **Documentation**: Document user communications as needed

### 7.3 Internal Communications
- **Secure Channels**: Use secure communication channels
- **Sensitive Information**: Protect sensitive information in communications
- **Documentation**: Document important communications
- **Compliance**: Comply with communication policies

## 8. Monitoring and Enforcement

### 8.1 Monitoring
- **System Monitoring**: Systems are monitored for compliance
- **Access Logging**: All access is logged
- **Activity Monitoring**: User and system activity is monitored
- **Security Alerts**: Security alerts triggered for violations

### 8.2 Violation Detection
- **Automated Detection**: Automated systems detect violations
- **Manual Review**: Manual review of suspicious activity
- **User Reports**: User reports of violations
- **Security Alerts**: Security alerts indicate potential violations

### 8.3 Enforcement Actions
Violations may result in:
- **Warning**: Warning for minor violations
- **Temporary Restriction**: Temporary restriction of access
- **Account Suspension**: Suspension of account
- **Account Termination**: Termination of account
- **Legal Action**: Legal action for serious violations
- **Disciplinary Action**: Disciplinary action for employees/contractors

## 9. Violation Procedures

### 9.1 Violation Reporting
- **Immediate Reporting**: Report violations immediately
- **Reporting Channels**: 
  - Email: security@thetriloapp.com
  - Support: support@thetriloapp.com
  - Internal channels for employees/contractors
- **Documentation**: All violations documented

### 9.2 Violation Investigation
- **Investigation**: Violations are investigated
- **Evidence Collection**: Evidence collected and preserved
- **Documentation**: Investigation documented
- **Timeline**: Investigation completed in timely manner

### 9.3 Violation Response
- **Appropriate Action**: Appropriate action taken based on severity
- **User Notification**: Users notified of violations and actions
- **Documentation**: All actions documented
- **Follow-Up**: Follow-up actions as needed

## 10. Compliance Requirements

### 10.1 Legal Compliance
- **Applicable Laws**: Comply with all applicable laws and regulations
- **GDPR**: Comply with GDPR requirements
- **CCPA**: Comply with CCPA requirements
- **Other Regulations**: Comply with other applicable regulations

### 10.2 Terms of Service
- **User Agreement**: Users must comply with terms of service
- **Employee Agreement**: Employees must comply with employment agreements
- **Contractor Agreement**: Contractors must comply with contractor agreements
- **Enforcement**: Terms enforced per this policy

### 10.3 Privacy Requirements
- **Privacy Policy**: Comply with privacy policy
- **Data Protection**: Protect user data per privacy policy
- **User Rights**: Honor user rights per privacy policy
- **Documentation**: Document compliance activities

## 11. Responsibilities

### 11.1 User Responsibilities
- Read and understand this policy
- Comply with all policy requirements
- Report violations immediately
- Use systems responsibly
- Protect account credentials

### 11.2 Employee/Contractor Responsibilities
- Read and understand this policy
- Comply with all policy requirements
- Complete required training
- Report violations immediately
- Use systems only for authorized purposes

### 11.3 Management Responsibilities
- Ensure policy compliance
- Provide training and awareness
- Enforce policy violations
- Review and update policy
- Support policy initiatives

## 12. Training and Awareness

### 12.1 User Education
- **Policy Availability**: Policy available to all users
- **Clear Communication**: Policy communicated clearly
- **Updates**: Users notified of policy updates
- **Support**: Support available for questions

### 12.2 Employee/Contractor Training
- **Onboarding**: Training during onboarding
- **Regular Training**: Regular training updates
- **Awareness**: Security awareness programs
- **Documentation**: Training attendance documented

## 13. Review and Update Procedures

### 13.1 Policy Review
- **Annual Review**: Annual review of acceptable use policy
- **Change Management**: Process for updating policy
- **Stakeholder Approval**: Approval process for policy changes
- **Version Control**: All policy changes tracked with version numbers

### 13.2 Continuous Improvement
- **Feedback**: Collect feedback from users and personnel
- **Best Practices**: Stay current with best practices
- **Technology Updates**: Update policy based on technology changes
- **Lessons Learned**: Incorporate lessons learned from incidents

## 14. Contact Information

For questions about acceptable use or to report violations:

**Security Email:** security@thetriloapp.com  
**Privacy Email:** privacy@thetriloapp.com  
**Support Email:** support@thetriloapp.com

## 15. Document Control

**Document Owner:** Trilo Security Team  
**Approval Authority:** Trilo Leadership  
**Review Frequency:** Annual or as needed  
**Next Review Date:** January 2026

## 16. References

- [Information Security Policy](./INFORMATION_SECURITY_POLICY.md) - Overall security policy
- [Access Controls Policy](./ACCESS_CONTROLS_POLICY.md) - Access control procedures
- [Privacy Policy](./PRIVACY_POLICY_UPDATED.md) - Privacy and data protection
- [Terms of Service](./TERMS_OF_SERVICE.md) - Terms of service (if available)

---

*This document is confidential and proprietary to Trilo. Unauthorized distribution is prohibited.*
