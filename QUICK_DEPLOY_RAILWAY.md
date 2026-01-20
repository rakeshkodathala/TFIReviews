# ⚡ Quick Deploy to Railway (5 Minutes)

## Step 1: Sign Up
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (one click)

## Step 2: Create MongoDB
1. Click "+ New" → "Database" → "MongoDB"
2. Wait 30 seconds for it to create
3. Click on the MongoDB service
4. Go to "Variables" tab
5. Copy the `MONGO_URL` value (starts with `mongodb://`)

## Step 3: Deploy Backend
1. Click "+ New" → "GitHub Repo"
2. Select your `TFIReviews` repository
3. Railway will auto-detect it
4. Click on the new service
5. Go to "Settings" → "Root Directory"
6. Set to: `backend`
7. Click "Deploy"

## Step 4: Add Environment Variables
1. In your backend service, go to "Variables" tab
2. Click "+ New Variable" and add:

```
MONGODB_URI=<paste the MONGO_URL from step 2>
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
NODE_ENV=production
PORT=3000
TMDB_API_KEY=<your TMDB API key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your email>
SMTP_PASS=<your email app password>
EMAIL_FROM=<your email>
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Get Your URL
1. Wait for deployment to finish (2-3 minutes)
2. Click on your backend service
3. Go to "Settings" → "Generate Domain"
4. Railway gives you: `https://your-app-name.up.railway.app`
5. Your API URL: `https://your-app-name.up.railway.app/api`

## Step 6: Test It
Open in browser:
```
https://your-app-name.up.railway.app/api/health
```

Should see: `{"status":"OK","message":"TFI Reviews API is running"}`

## Step 7: Update Mobile App
Update `mobile/src/config/api.ts`:

```typescript
export const API_BASE_URL = 'https://your-app-name.up.railway.app/api';
```

**Done!** 🎉

---

## Troubleshooting

**Build fails?**
- Make sure root directory is set to `backend`
- Check that `backend/package.json` exists

**MongoDB connection fails?**
- Make sure you copied the full `MONGO_URL` from MongoDB service
- Check it starts with `mongodb://`

**Need help?** Railway has great docs: https://docs.railway.app
