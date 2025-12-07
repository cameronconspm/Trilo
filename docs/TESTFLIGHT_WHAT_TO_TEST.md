# TestFlight: What to Test

**Copy this into App Store Connect → TestFlight → "What to Test" field:**

---

## What to Test

### 🔑 Test Account (Quick Access)
**Email:** `test@trilo.app`  
**Password:** `test123456`

Tap "🧪 Use Test Account" on sign-in screen for auto-fill.

### ✅ Priority Testing Areas

**1. Core Functionality**
- Sign up with new account (gets 7-day free trial)
- Sign in with test account
- Add income transaction
- Add expense transaction
- View Overview dashboard (balance, utilization)
- Check Insights tab (spending trends)
- Navigate Calendar view
- Edit/delete transactions

**2. Data Synchronization**
- Add transaction → Close app → Reopen (should persist)
- Sign out → Sign back in (data should remain)
- Create account on Device A → Sign in on Device B (data syncs)
- Test offline: Add transaction without internet → Go online (syncs automatically)

**3. User Isolation**
- Sign in as User A → Add transactions
- Sign out → Create new account (User B)
- Verify User B sees empty data (no mixing)
- Sign back in as User A → Verify original data intact

**4. Bank Integration (Sandbox)**
- Tap "Connect Your Bank" in Banking tab
- Select test institution (Chase, Bank of America)
- Use credentials: `user_good` / `pass_good`
- Complete MFA with code: `1234`
- Verify account appears with balance
- Check transactions load
- Test balance visibility toggle

**5. Subscriptions (Sandbox)**
- Create new account (auto 7-day trial)
- Wait or manually trigger paywall
- View subscription options (Monthly/Annual)
- Test purchase (sandbox - no real charge)
- Verify subscription activates
- Test "Restore Purchases"

**6. UI/UX**
- Switch between light/dark theme (Profile → Settings)
- Navigate all tabs smoothly
- Test swipe actions on transactions
- Verify error handling (graceful failures)
- Check loading states display properly
- Test modals open/close smoothly

**7. Edge Cases**
- Add very large amounts ($999,999)
- Add future-dated transactions
- Add past-dated transactions
- Test empty states (no transactions)
- Test with zero balance
- Test with negative balance

### 🐛 Report Issues

Please report:
- Crashes or freezes
- Data not syncing
- Transactions not saving
- UI glitches or layout issues
- Confusing user flows
- Performance problems
- Any unexpected behavior

### 💡 Feedback Welcome

We want to hear:
- What works well
- What's confusing
- Feature requests
- UI/UX suggestions
- Performance observations

### 📝 Testing Tips

- **Multiple Accounts**: Test with 2-3 different accounts to verify isolation
- **Theme Testing**: Try both light and dark modes
- **Offline Testing**: Disable WiFi, add data, reconnect (should sync)
- **Navigation**: Test all tabs and screens
- **Bank Connection**: Uses Plaid sandbox (test credentials only)
- **Subscriptions**: All purchases are sandbox (no real charges)

Thank you for testing Trilo! Your feedback is invaluable. 🚀

---

**Character Count: ~1,850 / 4,000** ✅

