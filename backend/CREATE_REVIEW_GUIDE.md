# How to Create a Review - Step by Step

## 🎯 Quick Steps

### Step 1: Login/Register to Get Token

**Request:** `POST /api/auth/login`

**Body:**
```json
{
    "email": "test@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWExYjJjM2Q0ZTVmNmc3aDh..."
}
```

**✅ IMPORTANT:** Copy the ENTIRE token (it's a long string starting with `eyJ...`)

---

### Step 2: Set Token in Postman Environment

1. **Copy the token** from the login response
2. In Postman, click the **eye icon** 👁️ next to environment dropdown
3. Click **Edit** (pencil icon)
4. Find `auth_token` variable
5. **Paste the complete token** (make sure no extra spaces or quotes)
6. Click **Save**

**⚠️ Common Mistakes:**
- ❌ Adding quotes around token: `"eyJ..."`
- ❌ Adding extra spaces
- ❌ Copying only part of the token
- ❌ Token should be ONE continuous string

---

### Step 3: Create Review

**Request:** `POST /api/reviews`

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Body (Option 1 - Using TMDB ID - Recommended):**
```json
{
    "tmdbId": 1511417,
    "rating": 9,
    "title": "Amazing Movie!",
    "review": "This is one of the best Tollywood movies I've ever seen. The cinematography, acting, and story are all exceptional."
}
```

**Body (Option 2 - Using MongoDB Movie ID):**
```json
{
    "movieId": "65a1b2c3d4e5f6g7h8i9j0k3",
    "rating": 9,
    "title": "Amazing Movie!",
    "review": "This is one of the best Tollywood movies I've ever seen."
}
```

**✅ Note:** 
- `tmdbId` will auto-import the movie if it doesn't exist
- `movieId` requires the movie to already exist in your database
- `userId` is NOT needed - it's taken from your token automatically

---

## 🔍 Troubleshooting "jwt malformed" Error

### Problem: Token is malformed

**Causes:**
1. Token has extra characters (quotes, spaces)
2. Token is incomplete (only part copied)
3. Token variable not replaced correctly in Postman

### Solution:

**Step 1: Verify Token Format**
- Token should look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWExYjJjM2Q0ZTVmNmc3aDh...`
- Should have **3 parts** separated by dots (`.`)
- Should be **one continuous string** with no spaces

**Step 2: Check Postman Environment Variable**

1. Click environment dropdown (top right)
2. Click **eye icon** 👁️ to view variables
3. Check `auth_token` value:
   - ✅ Should be: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ❌ Should NOT be: `"eyJ..."` (no quotes)
   - ❌ Should NOT be: `Bearer eyJ...` (no "Bearer " prefix in variable)
   - ❌ Should NOT have spaces or line breaks

**Step 3: Verify Authorization Header**

In your request, the header should be:
```
Key: Authorization
Value: Bearer {{auth_token}}
```

**NOT:**
- ❌ `Bearer "{{auth_token}}"` (no quotes)
- ❌ `{{auth_token}}` (missing "Bearer ")
- ❌ `Bearer{{auth_token}}` (no space)

**Step 4: Test Token First**

Before creating review, test your token:

```
GET /api/auth/verify
Headers: Authorization: Bearer {{auth_token}}
```

If this works, your token is valid. If not, you'll see the specific error.

---

## 📝 Complete Example in Postman

### 1. Login Request

**Method:** `POST`  
**URL:** `http://localhost:3000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "email": "test@example.com",
    "password": "password123"
}
```

**Response:** Copy the `token` value

---

### 2. Set Environment Variable

1. Click environment dropdown → Edit
2. Set `auth_token` = (paste token here, no quotes)
3. Save

---

### 3. Create Review Request

**Method:** `POST`  
**URL:** `http://localhost:3000/api/reviews`

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "tmdbId": 1511417,
    "rating": 9,
    "title": "Amazing Movie!",
    "review": "This is one of the best Tollywood movies I've ever seen. The cinematography, acting, and story are all exceptional."
}
```

**Expected Response (201 Created):**
```json
{
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "movieId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "title": "Baahubali: The Beginning",
        "posterUrl": "...",
        "tmdbId": 1511417
    },
    "userId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "username": "testuser",
        "name": "Test User"
    },
    "rating": 9,
    "title": "Amazing Movie!",
    "review": "...",
    "likes": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

## ✅ Checklist

Before creating review, make sure:

- [ ] You've logged in successfully
- [ ] Token is saved in `auth_token` environment variable
- [ ] Token has no quotes or extra spaces
- [ ] Token is complete (long string with 3 parts separated by dots)
- [ ] Authorization header is: `Bearer {{auth_token}}`
- [ ] There's a space between "Bearer" and `{{auth_token}}`
- [ ] Request body has `tmdbId` OR `movieId`
- [ ] Request body has `rating` (1-10)
- [ ] Request body has `review` (text)

---

## 🎯 Quick Fix for "jwt malformed"

1. **Login again** → Get fresh token
2. **Copy entire token** (from `"token":` to the end, but don't include quotes)
3. **Set in environment:**
   - Edit environment
   - `auth_token` = paste token (no quotes, no spaces)
   - Save
4. **Test with verify endpoint:**
   ```
   GET /api/auth/verify
   Headers: Authorization: Bearer {{auth_token}}
   ```
5. **If verify works, try create review again**

---

## 💡 Pro Tip

Use the **Verify Token** endpoint first to test your token before trying to create a review. This will tell you exactly what's wrong with the token if there's an issue.
