# 🚀 Backend Deployment Guide

## Option 1: Railway (Recommended)

Railway is the easiest way to deploy your Node.js backend with a generous free tier.

### Step 1: Prepare for Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

### Step 2: Deploy to Railway

1. **Initialize Railway project**:
   ```bash
   cd backend
   railway init
   ```

2. **Deploy**:
   ```bash
   railway up
   ```

### Step 3: Set Environment Variables

In Railway dashboard, add these environment variables:

```
PLAID_CLIENT_ID=687bd346551e1a0025da2915
PLAID_SECRET=1d09cc06a8c066444d370f53bd62e2
PLAID_ENV=sandbox
SUPABASE_URL=https://aputbauyuhhcsrnpwacb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXRiYXV5dWhoY3NybnB3YWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNzcyMjUsImV4cCI6MjA3Mjk1MzIyNX0.ARh33PgOprcnh0UgrYPEfrnCeOytI7f5i2_Q7bSEU9E
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXRiYXV5dWhoY3NybnB3YWNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM3NzIyNSwiZXhwIjoyMDcyOTUzMjI1fQ.IyE-cqVAhKzhWuPa1Jthw4trX9Bhi5ENw4MMNjQogKk
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 4: Get Your Production URL

Railway will give you a URL like: `https://your-app-name.railway.app`

---

## Option 2: Render

### Step 1: Connect GitHub

1. Go to [render.com](https://render.com)
2. Connect your GitHub account
3. Select your Trilo repository

### Step 2: Create Web Service

1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Root Directory**: `backend`

### Step 3: Set Environment Variables

Same as Railway above.

---

## Option 3: Heroku

### Step 1: Install Heroku CLI

```bash
brew install heroku/brew/heroku
```

### Step 2: Deploy

```bash
cd backend
heroku create your-app-name
git add .
git commit -m "Deploy backend"
git push heroku main
```

### Step 3: Set Environment Variables

```bash
heroku config:set PLAID_CLIENT_ID=687bd346551e1a0025da2915
heroku config:set PLAID_SECRET=1d09cc06a8c066444d370f53bd62e2
# ... (set all other variables)
```

---

## Update Frontend

Once deployed, update your frontend to use the production URL:

```typescript
// In app/(tabs)/banking.tsx
const API_BASE_URL = 'https://your-app-name.railway.app'; // or your deployed URL
```

---

## Testing Production

1. **Health Check**: Visit `https://your-app-name.railway.app/health`
2. **Test from Mobile**: Update the API_BASE_URL in your app
3. **Test Plaid Flow**: Try connecting a bank account

---

## Monitoring

- **Railway**: Built-in logs and metrics
- **Render**: Dashboard with logs
- **Heroku**: `heroku logs --tail`

---

## Free Tier Limits

- **Railway**: $5 credit monthly (usually enough for small apps)
- **Render**: 750 hours/month free
- **Heroku**: No free tier (paid only)

**Recommendation**: Start with Railway - it's the most developer-friendly!
