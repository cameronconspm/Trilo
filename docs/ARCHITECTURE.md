# Trilo App Architecture

## Current Data Storage Architecture

### ⚠️ **IMPORTANT: Current State**

Right now, **ALL user data is stored locally on the device** using AsyncStorage. This means:

1. **No Cloud Storage**: Data is NOT stored in Supabase tables
2. **Device-Only**: Each user's data lives on their phone
3. **Not User-Isolated**: If multiple users use the same device, they'll see each other's data
4. **No Sync**: Data doesn't sync across devices
5. **Not Persistent**: If the app is uninstalled, data is lost

### Current Storage Implementation

```
User Device (AsyncStorage)
├── finance_transactions_v2 → All transactions
├── settings_user_preferences_v2 → User preferences
├── income_entries → Income data
├── savings_goals → Savings goals
└── Other app data...
```

### What Happens When a User Signs In

1. **Authentication** (Supabase):
   - Email/password authentication
   - Creates auth session
   - Stores session in AsyncStorage

2. **Data Access** (Local):
   - All data is read from device AsyncStorage
   - Transactions are stored with keys like `finance_transactions_v2`
   - **NO user_id is associated with the data**

### The Problem

```
User A creates account → Adds $1000 expense → Data stored locally
User B signs in on same device → Sees User A's $1000 expense ❌
```

### What Needs to Be Done

To properly isolate data per user, we need to:

1. **Add user_id to all data operations**
   ```typescript
   // Current
   const transactions = await AsyncStorage.getItem('finance_transactions_v2');
   
   // Should be
   const transactions = await AsyncStorage.getItem(`finance_transactions_v2_${userId}`);
   ```

2. **Create Supabase tables for user data**
   ```sql
   CREATE TABLE transactions (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     amount DECIMAL,
     date TIMESTAMP,
     ...
   );
   ```

3. **Sync data to Supabase**
   - Save to Supabase when user adds data
   - Load from Supabase when user signs in
   - Handle offline/online sync

## Future Implementation

### Proposed Architecture

```
User Signs In (Supabase Auth)
    ↓
    ↓
User Data (User-Specific Storage)
├── Local: AsyncStorage keys include user_id
├── Cloud: Supabase tables with user_id foreign key
└── Sync: Bidirectional sync (local ↔ cloud)
```

### How to Implement

1. **Modify DataService.ts** to accept userId parameter
2. **Update all storage keys** to include userId
3. **Create Supabase tables** with user_id columns
4. **Add data sync logic** for offline/online scenarios
5. **Update contexts** to filter by user_id

### Files That Need Changes

- `services/DataService.ts` - Add user_id to storage keys
- `context/FinanceContext.tsx` - Pass user_id to DataService
- `context/SettingsContext.tsx` - Store settings per user
- Create Supabase tables for user data
- Add sync service for cloud backup

## Current Limitations

- ❌ Data is NOT user-specific
- ❌ Data is NOT backed up to cloud
- ❌ Data is NOT synced across devices
- ❌ If device is lost, data is lost
- ❌ Multiple users on same device share data

## Answer to User's Question

**Q: Is user data stored in Supabase tables?**
A: **No.** Currently all data is stored locally on the device.

**Q: Is data user-isolated?**
A: **No.** Data is shared across all users on the same device.

**Q: When user adds data, is it only visible to them?**
A: **No.** Currently all data is global to the device, not tied to the authenticated user.

**Solution:** Need to implement user-specific data storage by adding `user_id` to all data operations.

