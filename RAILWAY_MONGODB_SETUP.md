# ✅ Railway MongoDB Connection Setup

## Your MongoDB Connection String

You have the MongoDB connection string from Railway:
```
mongodb://mongo:pvHzLMQATkvodPLJyLnyWpSrGxyVOdsM@mongodb.railway.internal:27017
```

---

## Step-by-Step: Add to Backend Service

### Step 1: Go to Your Backend Service
1. In Railway dashboard, click on your **backend service** (not the MongoDB service)
2. This should be the service that runs your Node.js backend

### Step 2: Add Environment Variable
1. Click on the **"Variables"** tab
2. Click **"+ New Variable"** button
3. Add:
   - **Name**: `MONGODB_URI`
   - **Value**: `mongodb://mongo:pvHzLMQATkvodPLJyLnyWpSrGxyVOdsM@mongodb.railway.internal:27017/tfireviews`
   
   **Note**: I added `/tfireviews` at the end to specify your database name. If you want a different database name, change it.

4. Click **"Add"** or **"Save"**

### Step 3: Verify
1. Railway will automatically restart your backend service
2. Check the **"Deployments"** tab to see the logs
3. You should see:
   ```
   ✅ Connected to MongoDB
   📊 Database: tfireviews
   ```

---

## Alternative: With Database Name

If you want to specify the database name explicitly, use:

```
mongodb://mongo:pvHzLMQATkvodPLJyLnyWpSrGxyVOdsM@mongodb.railway.internal:27017/tfireviews
```

This will:
- Connect to MongoDB
- Use database named `tfireviews`

---

## Environment Variable Summary

In your backend service, you should have:

| Variable Name | Value |
|---------------|-------|
| `MONGODB_URI` | `mongodb://mongo:pvHzLMQATkvodPLJyLnyWpSrGxyVOdsM@mongodb.railway.internal:27017/tfireviews` |

---

## Other Required Environment Variables

Make sure you also have these in your backend service:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret for JWT tokens | (generate random string) |
| `NODE_ENV` | Environment | `production` |
| `TMDB_API_KEY` | TMDB API key | (your TMDB key) |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Email username | (your email) |
| `SMTP_PASS` | Email password | (your email password) |
| `EMAIL_FROM` | From email | (your email) |

---

## Generate JWT_SECRET

If you need to generate a JWT_SECRET, run this in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add it as `JWT_SECRET` in Railway.

---

## Test Connection

After adding the environment variable:

1. Check backend logs in Railway dashboard
2. Look for: `✅ Connected to MongoDB`
3. If you see errors, check:
   - Variable name is exactly `MONGODB_URI` (case-sensitive)
   - Connection string is correct
   - No extra spaces or quotes

---

## Quick Checklist

- [ ] Backend service created in Railway
- [ ] `MONGODB_URI` environment variable added
- [ ] Value: `mongodb://mongo:pvHzLMQATkvodPLJyLnyWpSrGxyVOdsM@mongodb.railway.internal:27017/tfireviews`
- [ ] Other environment variables added (JWT_SECRET, TMDB_API_KEY, etc.)
- [ ] Backend service restarted
- [ ] Check logs for "✅ Connected to MongoDB"

---

**That's it!** Once you add `MONGODB_URI` to your backend service, it should connect automatically! 🎉
