# User Data Migration Guide

## Step-by-Step Implementation Plan

### ✅ STEP 1: Supabase is Currently Down
- Your Supabase instance is returning 503 errors
- The test account fallback is working for development
- We'll create a hybrid system that works with/without Supabase

### ✅ STEP 2: SQL Schema Created
The SQL to create tables is in `docs/SUPABASE_SETUP.md`

**When Supabase is back online:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the SQL from `docs/SUPABASE_SETUP.md`
4. Verify tables created in Table Editor

### ✅ STEP 3: Services Created
- `services/SupabaseDataService.ts` - Supabase-only service
- `services/HybridDataService.ts` - Fallback service

### ⏳ STEP 4: Update FinanceContext to Use User-Specific Storage

**File: `context/FinanceContext.tsx`**

Current: Stores data globally
```typescript
const storedTransactions = await AsyncStorage.getItem('finance_transactions_v2');
```

Should be: Store per user
```typescript
const storageKey = `finance_transactions_v2_${userId}`;
const storedTransactions = await AsyncStorage.getItem(storageKey);
```

### ⏳ STEP 5: Add User Context to FinanceContext

```typescript
import { useAuth } from '@/context/AuthContext';

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  
  // Use userId in all storage operations
  // ...
}
```

### ⏳ STEP 6: Sync Local Data to Supabase

When user signs in:
1. Check if they have local data
2. If Supabase is available, upload local data
3. Merge with any existing Supabase data
4. Clear local data

## Current Status

✅ Test account works (local fallback)
✅ SQL schema prepared
✅ Services created
⏳ Need to update contexts to use userId
⏳ Need to implement sync logic

## Next Actions

1. **Wait for Supabase to come back online**
2. **Run SQL in Supabase dashboard**
3. **Update FinanceContext to include userId in storage keys**
4. **Implement sync service**
5. **Test with real Supabase**

## How Data Will Work

### Before (Current)
```
Device Storage
├── finance_transactions_v2 (ALL users share this)
└── settings (ALL users share this)
```

### After (With User Isolation)
```
Device Storage (temporary)
├── finance_transactions_v2_${userId} (per user)
└── Supabase (permanent, synced)
    ├── user_transactions (filtered by user_id)
    └── user_settings (filtered by user_id)
```

## Benefits

✅ User A only sees their data
✅ User B only sees their data
✅ Data syncs across devices
✅ Data backed up in cloud
✅ Survives app uninstall/reinstall
✅ Can be accessed from web dashboard

