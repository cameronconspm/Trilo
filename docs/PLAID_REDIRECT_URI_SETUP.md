# Plaid Redirect URI Setup

## Issue
Plaid now requires a `redirect_uri` to be included in all link token requests, even for sandbox testing. The redirect URI must be registered in your Plaid Dashboard.

## Current Configuration

The backend is configured to use:
```
https://trilo-production.up.railway.app/plaid/redirect
```

## Steps to Register Redirect URI in Plaid Dashboard

1. **Log in to Plaid Dashboard**
   - Go to https://dashboard.plaid.com/
   - Sign in with your Plaid account

2. **Navigate to API Settings**
   - Click on your app in the dashboard
   - Go to the "API" or "Settings" section
   - Look for "Allowed redirect URIs" or "OAuth redirect URIs"

3. **Add the Redirect URI**
   - Click "Add redirect URI" or "+" button
   - Enter: `https://trilo-production.up.railway.app/plaid/redirect`
   - Save the changes

4. **Verify**
   - The redirect URI should appear in your allowed list
   - Make sure there are no typos (must match exactly)

## Testing

After registering the redirect URI:
1. Wait 1-2 minutes for changes to propagate
2. Try connecting a bank account again
3. The OAuth warning should disappear
4. The connection should complete successfully

## Alternative: Use Environment Variable

If you want to use a different redirect URI, you can set it in Railway:

1. Go to Railway Dashboard → Your Service → Variables
2. Add: `PLAID_REDIRECT_URI` = `https://your-custom-url.com/plaid/redirect`
3. Make sure to register this custom URI in Plaid Dashboard as well

## Notes

- The redirect URI must use `https://` (not `http://`)
- The redirect URI cannot contain query parameters
- The redirect URI must match exactly what's registered in the dashboard
- Changes in the Plaid Dashboard may take a few minutes to propagate

