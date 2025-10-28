# Plaid Testing Checklist

## ✅ Backend Verification (Completed)
- [x] Plaid sandbox connection working
- [x] Link token creation successful
- [x] Test institutions available

## 📱 Mobile App Testing

### 1. Successful Connection Flow
- [ ] Tap "Connect Your Bank" button
- [ ] Select a test institution (Chase, Bank of America, etc.)
- [ ] Enter credentials: `user_good` / `pass_good`
- [ ] Complete MFA if prompted (use `1234`)
- [ ] Verify successful connection message
- [ ] Check that account appears in Banking tab

### 2. Account Data Verification
- [ ] Verify account name displays correctly
- [ ] Check account balance shows (not masked)
- [ ] Verify account type (checking/savings) displays
- [ ] Check account mask (last 4 digits) shows
- [ ] Verify institution name displays

### 3. Transaction Data Verification
- [ ] Check transactions load in "Recent Transactions" section
- [ ] Verify transaction amounts display correctly
- [ ] Check transaction dates format properly
- [ ] Verify merchant names show
- [ ] Check transaction categories display

### 4. Financial Health Summary
- [ ] Verify "Checking Balance" shows correct amount
- [ ] Check "Savings Balance" (if applicable)
- [ ] Verify "Credit Card Debt" calculation
- [ ] Test balance visibility toggle (eye icon)

### 5. Error Scenarios Testing
- [ ] Test with invalid credentials: `user_bad` / `pass_bad`
- [ ] Test connection timeout (airplane mode during connection)
- [ ] Test network interruption during data sync
- [ ] Test with insufficient permissions
- [ ] Verify error messages display properly

### 6. Multiple Account Testing
- [ ] Connect a second test bank account
- [ ] Verify both accounts appear in carousel
- [ ] Test switching between accounts
- [ ] Check page indicators work correctly
- [ ] Verify financial health summary updates

### 7. Edge Cases
- [ ] Test with zero balance accounts
- [ ] Test with negative balance (credit cards)
- [ ] Test with accounts that have no transactions
- [ ] Test refresh functionality
- [ ] Test app restart after connection

## 🔧 Test Credentials Reference

### Successful Connection
- Username: `user_good`
- Password: `pass_good`
- MFA Code: `1234`

### Error Scenarios
- Username: `user_bad`
- Password: `pass_bad`

### Special Test Cases
- Username: `user_good`
- Password: `pass_good`
- Institution: "Chase" (has multiple account types)
- Institution: "Bank of America" (has transactions)

## 📊 Expected Test Results

### Successful Connection Should Show:
- Account name: "Plaid Checking"
- Account type: "checking"
- Balance: $100.00 (sandbox default)
- Transactions: 5-10 test transactions
- Institution: Selected bank name

### Error Handling Should Show:
- Clear error messages
- Retry options
- Fallback to manual entry option
- No app crashes

## 🚀 Pre-TestFlight Checklist

- [ ] All successful connection flows work
- [ ] Error scenarios handled gracefully
- [ ] Data displays correctly
- [ ] No console errors in development
- [ ] Performance is acceptable
- [ ] UI/UX follows design standards
- [ ] All edge cases tested

## 📝 Notes
- Sandbox data resets every few hours
- Test transactions are pre-generated
- Some institutions may require MFA
- Refresh data to see latest sandbox changes
