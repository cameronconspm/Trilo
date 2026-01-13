# Transaction Sync Optimization Notes

## Current Implementation

Currently, transaction syncing uses Plaid's `transactionsGet` API, which fetches up to 500 transactions per call for a date range (currently 90 days). This is a straightforward approach but can be costly for accounts with many transactions.

## Optimization Opportunity

Plaid provides a `transactionsSync` API that uses cursors for incremental syncing. This would:

1. **Reduce API calls**: Only fetch new/updated transactions since the last sync
2. **Reduce costs**: Fewer API calls mean lower costs
3. **Improve performance**: Faster syncs since less data is transferred
4. **Better scalability**: More efficient for accounts with many transactions

## Infrastructure Already in Place

The following infrastructure is already implemented to support incremental syncing:

1. **Database Schema**: `account_sync_tracking` table has a `last_sync_cursor` field to store Plaid sync cursors
2. **Quota Management**: Sync frequency limits are enforced (4 syncs per account per day, 1 hour minimum between syncs)
3. **Sync Tracking**: `recordAccountSync` function accepts and stores sync cursors

## Implementation Steps (Future Enhancement)

To implement incremental syncing:

1. **Update PlaidService.syncTransactions()**:
   - Check if a cursor exists in `account_sync_tracking` for the account
   - If cursor exists, use `transactionsSync` API with the cursor
   - If no cursor, use `transactionsGet` for initial sync (reduce window to 30 days for new accounts)
   - Store the returned cursor for next sync

2. **Handle Sync Responses**:
   - `transactionsSync` returns: `added`, `modified`, `removed` transaction arrays
   - Update database accordingly (insert new, update modified, delete removed)
   - Handle `has_more` flag for pagination

3. **Error Handling**:
   - If cursor is invalid, fall back to `transactionsGet`
   - Handle cursor expiration (Plaid cursors expire after some time)

## Benefits

- **Cost Reduction**: Estimated 50-80% reduction in API calls for accounts synced regularly
- **Performance**: Faster syncs for incremental updates
- **Better User Experience**: Less waiting time for sync completion

## Current Mitigation

While incremental sync is not yet implemented, the following measures are in place to control costs:

- Sync frequency limits (4 per account per day, 1 hour minimum)
- User-level sync quotas (10 total syncs per user per day)
- Cost tracking and monitoring
- Rate limiting on all endpoints

## Priority

This optimization is marked as LOW priority because:
- Cost controls are already in place
- Sync limits prevent excessive API usage
- Most users don't sync multiple times per day
- Implementation requires significant testing with Plaid's sync API

## References

- [Plaid Transactions Sync API Documentation](https://plaid.com/docs/api/products/transactions/#transactionssync)
- Current implementation: `backend/src/services/plaidService.js` - `syncTransactions()` method

