# Disaster Recovery Plan

**Last Updated:** January 2025  
**Version:** 1.0

## Overview

This document outlines the disaster recovery procedures for the Trilo application, including backup verification, recovery procedures, and recovery objectives.

## Recovery Objectives

### Recovery Time Objective (RTO)
- **Critical Systems**: 4 hours
- **Non-Critical Systems**: 24 hours

### Recovery Point Objective (RPO)
- **User Data**: 1 hour (data loss window)
- **Configuration Data**: 24 hours

## Backup Strategy

### Database Backups (Supabase)

**Automatic Backups:**
- Supabase automatically creates daily backups
- Backups are retained for 7 days (free tier) or 30 days (paid tier)
- Point-in-time recovery (PITR) available on paid plans

**Backup Verification:**
1. **Weekly Verification:**
   - Check backup status in Supabase Dashboard
   - Verify backup retention period
   - Test restore to staging environment (monthly)

2. **Backup Locations:**
   - Primary: Supabase managed backups
   - Backup Retention: 7-30 days (depending on plan)

**Manual Backup (Recommended for Critical Data):**
```sql
-- Export critical tables (run weekly or before major changes)
-- Use Supabase Dashboard → Database → Export
-- Or use pg_dump via Supabase CLI
```

### Application Code Backups

**Git Repository:**
- Primary backup: GitHub repository
- Backup frequency: Continuous (on every push)
- Retention: Permanent (unless explicitly deleted)

**Environment Variables:**
- Stored in: Railway environment variables
- Backup: Manual export (recommended quarterly)
- **Critical:** Export all environment variables to secure location

### Third-Party Service Backups

**Plaid:**
- Access tokens stored in Supabase database (backed up automatically)
- Configuration: Environment variables (backed up manually)

**RevenueCat:**
- Subscription data synced to Supabase (backed up automatically)
- Configuration: Environment variables (backed up manually)

**Twilio (MFA):**
- Configuration: Environment variables (backed up manually)
- No user data stored (codes are temporary)

## Recovery Procedures

### Scenario 1: Database Corruption/Loss

**Symptoms:**
- Database queries failing
- Data inconsistency
- Supabase dashboard showing errors

**Recovery Steps:**

1. **Assess Damage:**
   ```sql
   -- Check database connectivity
   -- Verify table integrity
   -- Identify affected tables
   ```

2. **Restore from Backup:**
   - Go to Supabase Dashboard → Database → Backups
   - Select most recent backup before corruption
   - Restore to staging environment first (verify)
   - Restore to production if verification successful

3. **Verify Data Integrity:**
   - Check critical tables (users, bank_accounts, transactions)
   - Verify data counts match expected values
   - Test application functionality

4. **Communicate:**
   - Notify users if data loss occurred (within RPO window)
   - Document incident and recovery time

**Recovery Time:** 2-4 hours  
**Data Loss:** Up to 1 hour (depending on backup frequency)

### Scenario 2: Application Code Loss

**Symptoms:**
- Application not responding
- Deployment failures
- Code repository inaccessible

**Recovery Steps:**

1. **Restore from Git:**
   ```bash
   # Clone repository from GitHub
   git clone https://github.com/your-org/trilo.git
   cd trilo
   
   # Deploy to Railway
   railway up
   ```

2. **Restore Environment Variables:**
   - Import from backup (secure storage)
   - Verify all required variables are set
   - Test application functionality

3. **Verify Deployment:**
   - Check health endpoint: `/health`
   - Test critical API endpoints
   - Monitor logs for errors

**Recovery Time:** 1-2 hours  
**Data Loss:** None (code only)

### Scenario 3: Complete Infrastructure Loss

**Symptoms:**
- Supabase inaccessible
- Railway deployment down
- All services unavailable

**Recovery Steps:**

1. **Assess Situation:**
   - Check service status pages
   - Verify if regional outage
   - Contact service providers

2. **Restore Infrastructure:**
   - Create new Supabase project (if necessary)
   - Restore database from backup
   - Redeploy application to Railway
   - Restore environment variables

3. **Verify Services:**
   - Test database connectivity
   - Test API endpoints
   - Test Plaid integration
   - Test RevenueCat webhooks

4. **Update DNS/Configuration:**
   - Update any hardcoded URLs if infrastructure changed
   - Verify CORS settings
   - Test end-to-end functionality

**Recovery Time:** 4-8 hours  
**Data Loss:** Up to 1 hour (database backup)

### Scenario 4: Security Breach

**Symptoms:**
- Unusual API activity
- Unauthorized access detected
- Data exfiltration suspected

**Recovery Steps:**

1. **Immediate Actions:**
   - Rotate all API keys and secrets
   - Revoke compromised tokens
   - Enable additional security measures
   - Block suspicious IP addresses

2. **Assessment:**
   - Identify scope of breach
   - Determine affected users/data
   - Document timeline of events

3. **Recovery:**
   - Restore from pre-breach backup (if data compromised)
   - Force password resets for affected users
   - Review and strengthen security measures

4. **Communication:**
   - Notify affected users (if required by law)
   - Document incident
   - Report to authorities if necessary

**Recovery Time:** 4-24 hours (depending on severity)  
**Data Loss:** Varies (may need to restore from backup)

## Backup Verification Checklist

### Weekly Tasks
- [ ] Verify Supabase backups are being created
- [ ] Check backup retention period
- [ ] Review backup storage usage
- [ ] Export environment variables (if changed)

### Monthly Tasks
- [ ] Test database restore to staging
- [ ] Verify backup integrity
- [ ] Review disaster recovery plan
- [ ] Update documentation if procedures changed

### Quarterly Tasks
- [ ] Full disaster recovery drill
- [ ] Review and update RTO/RPO objectives
- [ ] Verify all backups are accessible
- [ ] Test complete infrastructure recovery

## Backup Locations

| Data Type | Primary Backup | Backup Location | Retention |
|-----------|---------------|-----------------|-----------|
| Database | Supabase Automated | Supabase Cloud | 7-30 days |
| Application Code | GitHub | GitHub Cloud | Permanent |
| Environment Variables | Manual Export | Secure Storage | Quarterly |
| Audit Logs | Supabase Database | Supabase Cloud | 7-30 days |
| User Data | Supabase Database | Supabase Cloud | 7-30 days |

## Recovery Testing

### Test Frequency
- **Monthly**: Database restore test
- **Quarterly**: Full disaster recovery drill
- **Annually**: Complete infrastructure recovery test

### Test Procedure
1. Create staging environment
2. Restore from backup
3. Verify data integrity
4. Test application functionality
5. Document results and issues
6. Update procedures if needed

## Contact Information

### Service Providers
- **Supabase Support**: support@supabase.io
- **Railway Support**: team@railway.app
- **Plaid Support**: support@plaid.com

### Internal Contacts
- **Primary Contact**: [Your Name/Email]
- **Backup Contact**: [Backup Name/Email]

## Incident Communication

### User Notification
- Notify users if data loss exceeds RPO (1 hour)
- Notify users of security breaches (as required by law)
- Provide status updates during recovery

### Internal Communication
- Document all incidents
- Post-mortem analysis for major incidents
- Update procedures based on lessons learned

## Revision History

- **v1.0** (January 2025): Initial disaster recovery plan

## References

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [Railway Disaster Recovery](https://docs.railway.app/deploy/backups)
- [Plaid Security Best Practices](https://plaid.com/docs/security/)

