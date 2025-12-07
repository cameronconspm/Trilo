# TestFlight Beta App Description

Use this in App Store Connect → TestFlight → Beta App Description:

---

## Beta App Description

**Trilo - Personal Finance Management**

Trilo helps you take control of your finances by tracking income, expenses, and savings goals in one simple app. Plan your spending, stay within budget, and build better financial habits.

### What to Test

**Core Features:**
- 📊 **Overview Dashboard**: See your pay period income, remaining balance, and expense breakdown at a glance
- 💰 **Transaction Tracking**: Add and manage income and expenses with categories (bills, subscriptions, savings, etc.)
- 📅 **Calendar View**: Visualize your expenses by date and plan ahead
- 🎯 **Budget Insights**: Get personalized insights about your spending patterns and trends
- 🏦 **Bank Integration** (TestFlight only): Connect bank accounts via Plaid to automatically sync transactions (sandbox mode)
- 💳 **Subscriptions**: Premium features available via in-app purchase (sandbox testing)

**Test Scenarios:**
1. **Sign Up/Sign In**: Create an account or sign in with existing credentials
2. **Add Transactions**: Add income and expenses manually
3. **View Insights**: Check the Insights tab for spending analysis
4. **Calendar Navigation**: Use the Calendar view to see expenses by date
5. **Profile Settings**: Customize theme, notifications, and preferences

### Important Notes

**TestFlight Testing:**
- This build uses **sandbox mode** for all integrations (Plaid, RevenueCat)
- Test subscriptions will use sandbox accounts - no real charges
- For bank connection testing, Plaid sandbox credentials are used
- All data syncs to cloud automatically

**What's New:**
- Improved error handling and app stability
- Enhanced data synchronization
- Better initial load performance
- Fixed display issues on app launch
- Optimized for production readiness

### Known Limitations (TestFlight)

- Bank integration uses sandbox/test data only
- Subscription purchases are sandbox transactions
- Some features may require internet connection

### Feedback

Please report:
- Any crashes or app freezes
- Issues with data syncing
- Problems with adding/editing transactions
- UI/UX concerns
- Feature requests

### Testing Tips

1. **Multiple Users**: Test with different accounts to verify data isolation
2. **Offline Mode**: Test adding transactions without internet, then sync when online
3. **Theme Switching**: Try both light and dark modes
4. **Navigation**: Test all tabs (Overview, Budget, Banking, Insights, Profile)
5. **Edge Cases**: Add very large amounts, future dates, etc.

Thank you for testing Trilo! Your feedback helps us improve the app.

---

**Character Count**: ~1,850 characters (well under 4,000 limit)

