# Quick Test Guide: Forgot Password & Guest Mode

## 🚀 Quick Start

### Step 1: Start Backend
```bash
cd backend
npm run dev
```
**Watch for**: `✅ Connected to MongoDB` and server running on port 3000

### Step 2: Start Mobile App
```bash
cd mobile
npm start
# Press 'i' for iOS simulator or 'a' for Android emulator
```

---

## ✅ Test 1: Guest Mode (2 minutes)

1. **On Login Screen**:
   - Scroll down past the "Sign Up" link
   - You should see an "OR" divider
   - Click **"Continue as Guest"** button

2. **Expected Result**:
   - ✅ App navigates to main tabs
   - ✅ You can browse movies
   - ✅ You can view movie details
   - ✅ You can read reviews

3. **Test Restrictions**:
   - Try to write a review → Should show "Login Required" alert
   - Try to add to watchlist → Should show "Login Required" alert
   - Tap Account tab → Should show "Login Required" alert

---

## ✅ Test 2: Forgot Password Flow (5 minutes)

### Setup: Create Test User
1. If not already registered, create a test account:
   - Email: `test@example.com`
   - Password: `test123` (remember this!)

### Test Flow:

1. **Request Reset**:
   - On Login screen, click **"Forgot Password?"** (below password field)
   - Enter email: `test@example.com`
   - Click **"Send Code"**
   - ✅ Should show success message
   - ✅ Screen should show OTP input

2. **Get OTP**:
   - **Check backend console** for log:
     ```
     [DEV MODE] Password reset OTP for test@example.com: 123456
     ```
   - Copy the 6-digit code

3. **Verify OTP**:
   - Enter the 6-digit code
   - Click **"Verify Code"**
   - ✅ Should transition to password reset screen

4. **Reset Password**:
   - Enter new password: `newpass123`
   - Confirm password: `newpass123`
   - Click **"Reset Password"**
   - ✅ Should show success and navigate to Login

5. **Login with New Password**:
   - Email: `test@example.com`
   - Password: `newpass123` (the new one!)
   - Click **"Login"**
   - ✅ Should successfully login

---

## 🐛 Troubleshooting

### Issue: OTP not showing in console
**Solution**: 
- Make sure backend is running (`npm run dev`)
- Check terminal where backend is running
- Look for `[DEV MODE] Password reset OTP for...`

### Issue: "Forgot Password?" link not visible
**Solution**:
- Make sure you're on Login screen
- Scroll down if needed
- Check it's between password field and login button

### Issue: Guest mode not working
**Solution**:
- Restart the mobile app completely
- Make sure you're not already logged in
- Check `AppNavigator.tsx` allows guest mode

### Issue: Can't navigate to ForgotPassword screen
**Solution**:
- Check backend is running
- Check mobile app is connected to backend
- Restart both backend and mobile app

---

## 📋 Quick Checklist

- [ ] Backend running (`npm run dev`)
- [ ] Mobile app running (`npm start`)
- [ ] Guest mode button visible
- [ ] Guest mode allows browsing
- [ ] Guest mode blocks restricted actions
- [ ] "Forgot Password?" link visible
- [ ] Can navigate to ForgotPassword screen
- [ ] OTP appears in backend console
- [ ] Can verify OTP
- [ ] Can reset password
- [ ] Can login with new password

---

## 🎯 Expected Console Output

When you request password reset, you should see in backend console:
```
[DEV MODE] Password reset OTP for test@example.com: 123456
```

The OTP will be a 6-digit number (e.g., `123456`, `789012`, etc.)

---

## 💡 Tips

1. **Keep backend console visible** - OTPs are logged there in dev mode
2. **Use a real email** - Even in dev mode, you can configure SMTP to send real emails
3. **Test expiration** - OTPs expire in 10 minutes
4. **Test invalid OTP** - Try wrong code to see error handling
5. **Test password mismatch** - Try different passwords to see validation

---

## 🔧 Production Setup (Optional)

To send real emails in production, add to `backend/.env`:
```env
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@tfireviews.com
```

For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an "App Password"
3. Use that app password in `SMTP_PASS`
