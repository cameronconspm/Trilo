# Pre-Build Checklist: Railway & Supabase Setup

Before pushing your new build, you need to configure Railway (backend) and Supabase (database). Here's what needs to be done:

---

## 🚂 Railway Configuration (Backend)

### Required Environment Variables

Go to your Railway project dashboard → **Variables** tab and set these:

#### 1. **Plaid Configuration** (Required)
```env
PLAID_CLIENT_ID=687bd346551e1a0025da2915
PLAID_SECRET=your_sandbox_or_production_secret
PLAID_ENV=sandbox  # or 'production' when ready
PLAID_REDIRECT_URI=https://trilo-production.up.railway.app/api/plaid/redirect
```

**Action Required:**
- ✅ Verify `PLAID_CLIENT_ID` is set
- ⚠️ **Set `PLAID_SECRET`** - Use your Sandbox secret for testing, Production secret for live
- ✅ `PLAID_ENV` defaults to 'sandbox' if not set (good for testing)

#### 2. **Supabase Configuration** (Required)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Action Required:**
- ⚠️ **Set all three Supabase variables** - Get these from Supabase Dashboard → Settings → API

#### 3. **RevenueCat Webhook** (Required for Subscriptions)
```env
REVENUECAT_WEBHOOK_SECRET=your_secret_token_here
```

**Action Required:**
- ⚠️ **Set this secret** - Generate a secure random string (e.g., `openssl rand -hex 32`)
- ⚠️ **Use the SAME secret in RevenueCat dashboard** (see RevenueCat setup below)

#### 4. **Server Configuration** (Optional - has defaults)
```env
PORT=3001  # Defaults to 3001 if not set
NODE_ENV=production  # Set to 'production' for live
CORS_ORIGIN=*  # or your specific frontend URL
```

**Action Required:**
- ✅ These are optional (have defaults)
- Consider setting `NODE_ENV=production` for live deployment

#### 5. **JWT Secret** (If using JWT auth)
```env
JWT_SECRET=your_secure_random_string_here
```

**Action Required:**
- ⚠️ **Set if using JWT authentication** - Generate secure random string

---

## 🗄️ Supabase Configuration (Database)

### Step 1: Create Required Tables

Go to Supabase Dashboard → **SQL Editor** → **New Query** and run these SQL scripts:

#### A. Bank Accounts & Transactions Tables

```sql
-- Enable Row Level Security
ALTER TABLE IF EXISTS bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

-- Bank Accounts Table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  institution_id TEXT,
  institution_name TEXT,
  current_balance DECIMAL(15,2) DEFAULT 0,
  available_balance DECIMAL(15,2) DEFAULT 0,
  currency_code TEXT DEFAULT 'USD',
  mask TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  merchant_name TEXT,
  category TEXT,
  subcategory TEXT,
  account_owner TEXT,
  pending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, transaction_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_access_token ON bank_accounts(access_token);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);

-- Row Level Security Policies
CREATE POLICY "Users can view their own bank accounts" ON bank_accounts
  FOR SELECT USING (true);  -- Adjust based on your auth setup

CREATE POLICY "Users can insert their own bank accounts" ON bank_accounts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own bank accounts" ON bank_accounts
  FOR UPDATE USING (true);

CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (true);
```

#### B. User Subscriptions Table (For RevenueCat)

**⚠️ IMPORTANT**: The webhook expects `user_id` as UUID, and looks up by `revenuecat_user_id`. Use this schema:

```sql
-- User Subscriptions Table (Matches webhook expectations)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  revenuecat_user_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive',  -- 'active', 'expired', 'inactive'
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes (Required for webhook lookup)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_revenuecat_user_id ON user_subscriptions(revenuecat_user_id);

-- Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for backend/webhook to manage subscriptions (REQUIRED for webhook to work)
CREATE POLICY "Backend can manage subscriptions" ON user_subscriptions
  FOR ALL USING (true);
```

**Note**: The webhook looks up subscriptions by `revenuecat_user_id`, so the index on that column is critical.

**Action Required:**
- ⚠️ **Run these SQL scripts in Supabase SQL Editor**
- ⚠️ **Verify tables are created** - Check Supabase Dashboard → Table Editor

---

## 🎯 RevenueCat Webhook Configuration

### Step 1: Generate Webhook Secret

Generate a secure secret token:
```bash
openssl rand -hex 32
```

### Step 2: Set in Railway
Add to Railway environment variables:
```env
REVENUECAT_WEBHOOK_SECRET=your_generated_secret_here
```

### Step 3: Configure in RevenueCat Dashboard

1. Go to RevenueCat Dashboard → **Project Settings** → **Integrations** → **Webhooks**
2. Click **Add Webhook**
3. Set **Webhook URL**: `https://trilo-production.up.railway.app/api/webhooks/revenuecat`
   - Replace with your actual Railway URL if different
4. Set **Authorization Header**: Use the SAME secret as `REVENUECAT_WEBHOOK_SECRET`
   - Format: `Bearer your_secret_here` or just `your_secret_here`
5. Enable these events:
   - ✅ `INITIAL_PURCHASE`
   - ✅ `RENEWAL`
   - ✅ `CANCELLATION`
   - ✅ `UNSUBSCRIBE`

**Action Required:**
- ⚠️ **Set webhook URL in RevenueCat dashboard**
- ⚠️ **Set authorization header** (must match Railway secret)
- ⚠️ **Enable required events**

---

## ✅ Verification Checklist

### Railway Verification
- [ ] All environment variables are set in Railway
- [ ] Railway deployment is running successfully
- [ ] Backend health check works: `https://trilo-production.up.railway.app/health`
- [ ] Plaid API keys are configured (test with sandbox)
- [ ] Supabase credentials are set correctly

### Supabase Verification
- [ ] `bank_accounts` table exists
- [ ] `transactions` table exists
- [ ] `user_subscriptions` table exists
- [ ] Row Level Security (RLS) is enabled on all tables
- [ ] Indexes are created
- [ ] Can connect to Supabase from Railway backend

### RevenueCat Verification
- [ ] Webhook URL is configured in RevenueCat dashboard
- [ ] Authorization header is set in RevenueCat dashboard
- [ ] Webhook secret matches between Railway and RevenueCat
- [ ] Required events are enabled
- [ ] Test webhook by making a test purchase (optional)

---

## 🧪 Testing Before Build

### Test Backend Connection
```bash
# Test health endpoint
curl https://trilo-production.up.railway.app/health

# Should return:
# {"status":"OK","timestamp":"...","environment":"production"}
```

### Test Plaid Integration
1. Open your app
2. Navigate to Banking tab
3. Try to connect a bank account
4. Use Sandbox credentials: `user_good` / `pass_good`
5. Verify connection succeeds

### Test RevenueCat Integration
1. Open your app
2. Try to view subscription plans
3. Verify packages load correctly
4. Test purchase flow (use Sandbox/TestFlight)

---

## 🚨 Common Issues

### Issue: "Missing Supabase configuration"
**Solution**: Verify all three Supabase environment variables are set in Railway

### Issue: "Webhook signature verification failed"
**Solution**: 
- Ensure `REVENUECAT_WEBHOOK_SECRET` is set in Railway
- Ensure Authorization header in RevenueCat matches the secret
- Check webhook URL is correct

### Issue: "Plaid API error"
**Solution**:
- Verify `PLAID_CLIENT_ID` and `PLAID_SECRET` are set
- Check `PLAID_ENV` is set to 'sandbox' for testing
- Verify Plaid credentials are valid in Plaid Dashboard

### Issue: "Table does not exist"
**Solution**:
- Run the SQL scripts in Supabase SQL Editor
- Verify tables are created in Supabase Dashboard → Table Editor

---

## 📝 Quick Reference

### Railway Environment Variables (All Required)
```
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
REVENUECAT_WEBHOOK_SECRET=xxx
NODE_ENV=production
```

### Supabase Tables Required
- `bank_accounts` - For Plaid bank accounts
- `transactions` - For Plaid transactions
- `user_subscriptions` - For RevenueCat subscriptions

### RevenueCat Webhook URL
```
https://trilo-production.up.railway.app/api/webhooks/revenuecat
```

---

## ✅ Ready to Build?

Once you've completed all the items above:
- ✅ Railway is configured with all environment variables
- ✅ Supabase tables are created
- ✅ RevenueCat webhook is configured
- ✅ All services are tested and working

**You're ready to push your build!** 🚀

