# 🚀 Deploy Backend & Get Production API URL

## Quick Overview

You need to deploy your backend to a cloud service to get a public URL. Here are the **easiest options**:

1. **Railway** (Recommended - Free tier, easiest setup)
2. **Render** (Free tier, good for Node.js)
3. **Heroku** (Paid, but reliable)

---

## 🎯 **Option 1: Railway (RECOMMENDED - Easiest)**

### Why Railway?
- ✅ Free tier available ($5 credit/month)
- ✅ Automatic deployments from GitHub
- ✅ Built-in MongoDB (or use MongoDB Atlas)
- ✅ Simple setup
- ✅ HTTPS included

### Step-by-Step:

#### 1. Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (easiest)
3. Click "New Project"

#### 2. Add MongoDB Database
1. Click "+ New"
2. Select "Database" → "MongoDB"
3. Railway will create a MongoDB instance
4. Copy the `MONGODB_URI` (you'll need this)

#### 3. Deploy Backend
1. Click "+ New" → "GitHub Repo"
2. Select your `TFIReviews` repository
3. Railway will detect it's a Node.js app
4. Set root directory to `backend`

#### 4. Configure Environment Variables
In Railway dashboard, go to your backend service → "Variables" tab, add:

```
PORT=3000
MONGODB_URI=<paste the MongoDB URI from step 2>
JWT_SECRET=<generate a random string>
NODE_ENV=production
TMDB_API_KEY=<your TMDB API key>
SMTP_HOST=<your email SMTP host>
SMTP_PORT=587
SMTP_USER=<your email>
SMTP_PASS=<your email password>
EMAIL_FROM=<your email>
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 5. Get Your Production URL
1. After deployment, Railway gives you a URL like:
   - `https://your-app-name.up.railway.app`
2. Your API URL will be: `https://your-app-name.up.railway.app/api`

#### 6. Test It
Open in browser:
```
https://your-app-name.up.railway.app/api/health
```

Should return: `{"status":"OK","message":"TFI Reviews API is running"}`

---

## 🎯 **Option 2: Render (Free Tier)**

### Step-by-Step:

#### 1. Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

#### 2. Create MongoDB Database
1. Go to "New" → "MongoDB"
2. Create database (free tier available)
3. Copy the "Internal Database URL"

#### 3. Deploy Backend
1. Go to "New" → "Web Service"
2. Connect your GitHub repo
3. Settings:
   - **Name**: `tfi-reviews-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### 4. Add Environment Variables
In Render dashboard → "Environment" tab:

```
PORT=3000
MONGODB_URI=<paste MongoDB URL>
JWT_SECRET=<generate random string>
NODE_ENV=production
TMDB_API_KEY=<your TMDB key>
SMTP_HOST=<your SMTP host>
SMTP_PORT=587
SMTP_USER=<your email>
SMTP_PASS=<your email password>
EMAIL_FROM=<your email>
```

#### 5. Get Production URL
After deployment, Render gives you:
- `https://tfi-reviews-backend.onrender.com`
- API URL: `https://tfi-reviews-backend.onrender.com/api`

---

## 🎯 **Option 3: MongoDB Atlas (Cloud Database) + Any Hosting**

If you want to use MongoDB Atlas (free tier):

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a cluster (free M0 tier)
4. Create database user
5. Whitelist IP: `0.0.0.0/0` (allow all IPs)
6. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

### Step 2: Deploy Backend
Use Railway or Render (steps above), but use MongoDB Atlas connection string instead.

---

## 📝 **After Deployment - Update Mobile App**

Once you have your production URL (e.g., `https://your-app.up.railway.app/api`):

### Update `mobile/src/config/api.ts`:

```typescript
// API Configuration
export const API_BASE_URL = 'https://your-app.up.railway.app/api';

// ... rest of the file
```

### OR Update `mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-app.up.railway.app/api",
      "eas": {
        "projectId": "9a633804-6eac-47be-8004-4e6cf789e091"
      }
    }
  }
}
```

**Note**: If you update `app.json`, also update `mobile/src/config/api.ts` to use:
```typescript
import Constants from 'expo-constants';
export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://your-app.up.railway.app/api';
```

---

## 🔧 **Required Environment Variables**

Make sure you have these in your deployment platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT tokens | Random 32+ char string |
| `NODE_ENV` | Environment | `production` |
| `TMDB_API_KEY` | TMDB API key | Your TMDB key |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Email username | `your-email@gmail.com` |
| `SMTP_PASS` | Email password | Your email password |
| `EMAIL_FROM` | From email address | `your-email@gmail.com` |

---

## ✅ **Testing Your Production API**

After deployment, test these endpoints:

1. **Health Check:**
   ```
   https://your-app.up.railway.app/api/health
   ```
   Should return: `{"status":"OK","message":"TFI Reviews API is running"}`

2. **Test Registration:**
   ```bash
   curl -X POST https://your-app.up.railway.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@test.com","password":"test123"}'
   ```

---

## 🚨 **Common Issues**

### Issue: CORS Errors
**Fix**: Your backend already has CORS enabled, but make sure it's allowing your mobile app origin.

### Issue: MongoDB Connection Failed
**Fix**: 
- Check `MONGODB_URI` is correct
- If using MongoDB Atlas, whitelist all IPs (`0.0.0.0/0`)
- Check database user credentials

### Issue: Build Fails
**Fix**: 
- Make sure `backend/package.json` has `build` script
- Check that TypeScript compiles: `cd backend && npm run build`

---

## 📋 **Quick Checklist**

- [ ] Deploy backend to Railway/Render
- [ ] Set up MongoDB (Railway MongoDB or MongoDB Atlas)
- [ ] Add all environment variables
- [ ] Test health endpoint
- [ ] Get production URL
- [ ] Update `mobile/src/config/api.ts` with production URL
- [ ] Test mobile app with production URL

---

## 🎯 **Recommended: Railway (Fastest Setup)**

**Time**: ~15-20 minutes

1. Sign up at railway.app
2. Create MongoDB database
3. Deploy from GitHub
4. Add environment variables
5. Get URL: `https://your-app.up.railway.app/api`

**That's it!** Railway handles everything automatically.

---

**Need help?** Let me know which platform you want to use and I can guide you through it step-by-step!
