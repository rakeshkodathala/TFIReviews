# Quick Fix: "Invalid or expired token" Error

## 🚨 Immediate Steps to Fix

### Step 1: Check Your Authorization Header in Postman

1. Open your request in Postman
2. Go to **Headers** tab
3. Look for `Authorization` header
4. It should be **exactly**: `Bearer {{auth_token}}`
   - ✅ Correct: `Bearer {{auth_token}}`
   - ❌ Wrong: `{{auth_token}}` (missing "Bearer ")
   - ❌ Wrong: `Bearer{{auth_token}}` (no space)

### Step 2: Verify Token is Saved

1. After login, check the response:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {...}
   }
   ```

2. In Postman, click the **eye icon** 👁️ next to environment dropdown
3. Check if `auth_token` has a value
4. If empty, manually copy the token and set it

### Step 3: Test Token with Verify Endpoint

Use the new verify endpoint to test your token:

```
GET http://localhost:3000/api/auth/verify
Headers: Authorization: Bearer {{auth_token}}
```

**Expected responses:**
- ✅ `200 OK` with `{"valid": true, "userId": "..."}` = Token is valid!
- ❌ `401 Invalid token` = Token format is wrong
- ❌ `401 Token expired` = Need to login again
- ❌ `401 Invalid authorization format` = Missing "Bearer " prefix

### Step 4: Manual Token Setup (If Auto-Save Failed)

1. **Login again:**
   ```
   POST http://localhost:3000/api/auth/login
   Body: {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

2. **Copy the token** from response (the long string starting with `eyJ...`)

3. **Set in Postman:**
   - Click environment dropdown (top right)
   - Click "Edit" (pencil icon)
   - Find `auth_token`
   - Paste your token
   - Save

4. **Test again** with your protected endpoint

---

## 🔍 Common Causes

| Issue | Solution |
|-------|----------|
| Missing "Bearer " prefix | Change header to: `Bearer {{auth_token}}` |
| Token not saved | Manually set `auth_token` in environment |
| Token expired | Login again to get fresh token |
| Server restarted | Login again (if JWT_SECRET changed) |
| Wrong environment selected | Select correct environment (top right) |

---

## ✅ Quick Test

1. **Login:**
   ```
   POST /api/auth/login
   ```

2. **Verify Token:**
   ```
   GET /api/auth/verify
   Headers: Authorization: Bearer {{auth_token}}
   ```

3. **If verify works, try your protected endpoint again**

---

## 🎯 Most Likely Fix

**90% of cases:** The Authorization header is missing "Bearer " prefix

**Fix:** Change from:
```
Authorization: {{auth_token}}
```

To:
```
Authorization: Bearer {{auth_token}}
```

Make sure there's a **space** between "Bearer" and `{{auth_token}}`!
