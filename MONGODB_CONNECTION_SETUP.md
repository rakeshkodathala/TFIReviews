# 🔌 MongoDB Connection Setup Guide

## Quick Answer

When MongoDB asks for connection, you need to provide a **connection string** (URI).

---

## 🎯 **Option 1: Railway MongoDB (Easiest)**

If you're using Railway:

### Step 1: Get MongoDB URI from Railway
1. Go to Railway dashboard
2. Click on your **MongoDB** service
3. Go to **"Variables"** tab
4. Look for `MONGO_URL` or `MONGODB_URI`
5. Copy the entire string (looks like: `mongodb://mongo:27017/railway`)

### Step 2: Add to Backend Environment Variables
1. Click on your **backend** service in Railway
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add:
   - **Name**: `MONGODB_URI`
   - **Value**: Paste the MongoDB URI you copied
5. Save

**That's it!** Railway handles the connection automatically.

---

## 🎯 **Option 2: MongoDB Atlas (Cloud Database)**

If you're using MongoDB Atlas (free cloud database):

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a **free cluster** (M0 tier)

### Step 2: Create Database User
1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter username and password (save these!)
5. Set privileges: **"Atlas admin"** or **"Read and write to any database"**
6. Click **"Add User"**

### Step 3: Whitelist IP Address
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. For development/testing: Click **"Allow Access from Anywhere"** → `0.0.0.0/0`
4. Click **"Confirm"**

### Step 4: Get Connection String
1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Complete the Connection String
Replace `<username>` and `<password>` with your database user credentials:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/tfireviews?retryWrites=true&w=majority
```

**⚠️ SECURITY NOTE**: Never commit real credentials to Git! Always use environment variables.

**Note**: Add your database name (`tfireviews`) before the `?` if you want a specific database.

### Step 6: Add to Railway/Render
1. In your backend service → **"Variables"** tab
2. Add:
   - **Name**: `MONGODB_URI`
   - **Value**: Your complete connection string from Step 5

---

## 🎯 **Option 3: Local MongoDB (For Testing Only)**

If you're running MongoDB locally:

### Connection String Format:
```
mongodb://localhost:27017/tfireviews
```

**Note**: This won't work for production deployment - only for local testing.

---

## ✅ **Environment Variable Format**

In Railway/Render, add this variable:

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/tfireviews?retryWrites=true&w=majority` |

**⚠️ Replace `<username>` and `<password>` with your actual credentials**

**Or for Railway MongoDB:**
| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb://mongo:27017/railway` |

---

## 🔍 **How Your Backend Uses It**

Your backend (`backend/src/server.ts`) reads it like this:

```typescript
const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/tfireviews';
```

So you just need to set `MONGODB_URI` environment variable!

---

## 🚨 **Common Issues**

### Issue: "Authentication failed"
**Fix**: 
- Check username and password in connection string
- Make sure you replaced `<username>` and `<password>` with actual values
- Verify database user exists in MongoDB Atlas

### Issue: "Connection timeout"
**Fix**:
- Check IP whitelist in MongoDB Atlas (should allow `0.0.0.0/0` for testing)
- Verify connection string is correct
- Check if MongoDB service is running (Railway)

### Issue: "Invalid connection string"
**Fix**:
- Make sure connection string starts with `mongodb://` or `mongodb+srv://`
- Check for special characters in password (may need URL encoding)
- Verify no extra spaces or quotes

---

## 📝 **Quick Checklist**

- [ ] MongoDB service created (Railway or Atlas)
- [ ] Database user created (if using Atlas)
- [ ] IP whitelisted (if using Atlas)
- [ ] Connection string copied
- [ ] `MONGODB_URI` environment variable added to backend
- [ ] Backend service restarted (Railway auto-restarts)

---

## 🎯 **Recommended: Railway MongoDB**

**Easiest option:**
1. Railway creates MongoDB automatically
2. Copy `MONGO_URL` from MongoDB service variables
3. Add as `MONGODB_URI` to backend service
4. Done!

**No setup needed - Railway handles everything!**

---

## 💡 **Test Connection**

After setting up, check your backend logs. You should see:
```
✅ Connected to MongoDB
📊 Database: tfireviews
```

If you see errors, check:
1. Connection string is correct
2. Environment variable name is `MONGODB_URI`
3. MongoDB service is running
4. IP is whitelisted (if using Atlas)

---

**Need more help?** Let me know what error message you're seeing!
