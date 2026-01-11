# Token Authentication Troubleshooting

## 🔍 Common Issues and Solutions

### Issue: "Invalid or expired token" after login

This error can occur for several reasons. Follow these steps to diagnose:

---

## ✅ Step 1: Verify Token is Saved in Postman

1. **After Login/Register:**
   - Check the response - you should see a `token` field
   - Copy the token value manually

2. **Check Environment Variable:**
   - In Postman, click the eye icon (👁️) next to environment dropdown
   - Look for `auth_token` variable
   - Verify it has a value (should be a long string starting with `eyJ...`)

3. **If Token is Missing:**
   - The auto-save script might have failed
   - Manually copy the token from login response
   - Go to environment variables
   - Set `auth_token` = your token value

---

## ✅ Step 2: Verify Authorization Header Format

The header must be formatted **exactly** like this:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Common Mistakes:**
- ❌ `Authorization: Bearer{{auth_token}}` (no space)
- ❌ `Authorization: {{auth_token}}` (missing "Bearer ")
- ❌ `Authorization: bearer {{auth_token}}` (lowercase "bearer" - should work but not standard)
- ✅ `Authorization: Bearer {{auth_token}}` (correct)

**In Postman:**
1. Go to your request
2. Click "Headers" tab
3. Add header:
   - Key: `Authorization`
   - Value: `Bearer {{auth_token}}`
   - Make sure there's a space between "Bearer" and `{{auth_token}}`

---

## ✅ Step 3: Test Token Manually

### Option A: Use the Test Endpoint

I've added a test endpoint. After starting your server, try:

```bash
# 1. Login and get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Copy the token from response, then test it:
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Option B: Decode Token (for debugging)

Go to https://jwt.io and paste your token to see:
- If token is valid format
- What's inside the token (payload)
- If it's expired

---

## ✅ Step 4: Check JWT_SECRET Consistency

The token is signed and verified using `JWT_SECRET`. Both must match:

1. **Check your .env file:**
   ```bash
   cd backend
   cat .env | grep JWT_SECRET
   ```

2. **Restart your server** after changing .env:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev  # Start again
   ```

3. **If JWT_SECRET changed:**
   - All old tokens become invalid
   - You need to login again to get a new token

---

## ✅ Step 5: Verify Server is Reading .env

Add this temporary test to see if JWT_SECRET is loaded:

```typescript
// In server.ts, add temporarily:
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
```

If it shows "No" or length 0, your .env isn't loading properly.

---

## ✅ Step 6: Check Token Expiration

Tokens expire after 7 days. If you're using an old token:

1. Login again to get a fresh token
2. Update `{{auth_token}}` in Postman environment

---

## 🧪 Quick Test in Postman

1. **Test without token:**
   ```
   POST http://localhost:3000/api/reviews
   (no Authorization header)
   ```
   Expected: `401 Authentication required`

2. **Test with wrong format:**
   ```
   POST http://localhost:3000/api/reviews
   Authorization: {{auth_token}}  (missing "Bearer ")
   ```
   Expected: `401 Invalid authorization format`

3. **Test with invalid token:**
   ```
   POST http://localhost:3000/api/reviews
   Authorization: Bearer invalid_token_123
   ```
   Expected: `401 Invalid token`

4. **Test with valid token:**
   ```
   POST http://localhost:3000/api/reviews
   Authorization: Bearer {{auth_token}}
   ```
   Expected: `201 Created` or `400 Bad Request` (if data is invalid)

---

## 🔧 Fix: Manual Token Setup in Postman

If auto-save isn't working:

1. **Login/Register:**
   ```
   POST http://localhost:3000/api/auth/login
   ```

2. **Copy the token** from response:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {...}
   }
   ```

3. **Set in Postman Environment:**
   - Click environment dropdown (top right)
   - Click "Edit" (pencil icon)
   - Find `auth_token` variable
   - Paste your token
   - Click "Save"

4. **Use in requests:**
   - Header: `Authorization: Bearer {{auth_token}}`

---

## 🐛 Debug Mode

To see what's happening, check server logs when making a request:

```bash
# In your terminal where server is running, you should see:
# Request headers logged (if you add logging)
```

Add this to see the token being received:

```typescript
// In auth.ts middleware, add temporarily:
console.log('Auth header:', req.headers.authorization);
console.log('Token extracted:', token?.substring(0, 20) + '...');
```

---

## ✅ Most Common Fix

**90% of the time, the issue is:**

1. Authorization header missing "Bearer " prefix
2. Token not saved in Postman environment
3. Server restarted but .env not reloaded

**Quick fix:**
1. Login again → Copy token manually
2. Set `auth_token` in Postman environment manually
3. Make sure header is: `Authorization: Bearer {{auth_token}}`
4. Restart your server

---

## 📞 Still Not Working?

Check these:
- [ ] Server is running (`npm run dev`)
- [ ] MongoDB is running
- [ ] .env file exists and has JWT_SECRET
- [ ] Server was restarted after .env changes
- [ ] Token is fresh (login again)
- [ ] Authorization header format is correct
- [ ] No extra spaces in token
- [ ] Postman environment is selected (top right dropdown)
