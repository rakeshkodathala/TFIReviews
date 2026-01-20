# Testing Guide: Forgot Password & Guest Mode

This guide will help you test the newly implemented **Forgot Password** and **Guest Mode** features.

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Mobile App Running**
   ```bash
   cd mobile
   npm start
   # Then press 'i' for iOS or 'a' for Android
   ```

3. **MongoDB Running**
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Or check if running
   mongosh
   ```

## Part 1: Testing Guest Mode

### Test 1: Continue as Guest
1. Open the app (or restart if already logged in)
2. On the Login screen, scroll down
3. You should see an "OR" divider
4. Click **"Continue as Guest"** button
5. ✅ **Expected**: App should navigate to the main tabs (Home, Search, Activity, Account)
6. ✅ **Expected**: You can browse movies, view details, read reviews

### Test 2: Guest Restrictions - Write Review
1. While in guest mode, navigate to any movie details
2. Click **"Write a Review"** or **"Rate this Movie"**
3. ✅ **Expected**: Alert should appear saying "Login Required - Please login or sign up to write a review"
4. ✅ **Expected**: Alert should have "Cancel" and "Login" buttons

### Test 3: Guest Restrictions - Watchlist
1. While in guest mode, navigate to any movie details
2. Click the **bookmark/watchlist** button
3. ✅ **Expected**: Alert should appear saying "Login Required - Please login or sign up to add movies to your watchlist"

### Test 4: Guest Restrictions - Account Screen
1. While in guest mode, tap the **Account** tab
2. ✅ **Expected**: Alert should appear saying "Login Required - Please login or sign up to access your account"
3. ✅ **Expected**: Alert should have "OK" button that dismisses

### Test 5: Guest Restrictions - Watchlist Screen
1. While in guest mode, try to navigate to Watchlist (if accessible)
2. ✅ **Expected**: Alert should appear and redirect back

### Test 6: Guest Restrictions - Create Review Screen
1. While in guest mode, try to navigate directly to Create Review (if possible)
2. ✅ **Expected**: Alert should appear and redirect back

### Test 7: Login from Guest Mode
1. While in guest mode, try to perform any restricted action
2. Click "Login" in the alert
3. ✅ **Expected**: Should navigate to Login screen (or show login prompt)
4. Login with valid credentials
5. ✅ **Expected**: Guest mode should end, and you should be fully authenticated

## Part 2: Testing Forgot Password Flow

### Setup: Create a Test User
1. If you don't have a test user, register one:
   - Go to Register screen
   - Create account with email: `test@example.com`
   - Remember the password

### Test 1: Request Password Reset
1. On Login screen, click **"Forgot Password?"** link (below password field)
2. ✅ **Expected**: Should navigate to ForgotPasswordScreen
3. Enter your email address (e.g., `test@example.com`)
4. Click **"Send Code"**
5. ✅ **Expected**: 
   - Loading indicator should show
   - Success alert: "Code Sent - A verification code has been sent to your email..."
   - Screen should transition to OTP input step
   - **In Development**: Check backend console for OTP (look for `[DEV MODE] Password reset OTP for test@example.com: XXXXXX`)

### Test 2: Verify OTP
1. Enter the 6-digit OTP from console/email
2. ✅ **Expected**: 
   - Only numbers should be accepted (no letters)
   - Maximum 6 digits
3. Click **"Verify Code"**
4. ✅ **Expected**:
   - If correct: Screen transitions to "Reset Password" step
   - If incorrect/expired: Error alert "Invalid or expired verification code"

### Test 3: Resend OTP
1. On OTP screen, click **"Didn't receive code? Resend"**
2. ✅ **Expected**: 
   - New OTP should be sent
   - Old OTP should be invalidated
   - Check console for new OTP

### Test 4: Reset Password
1. After verifying OTP, enter new password (min 6 characters)
2. Enter confirm password (must match)
3. Click **"Reset Password"**
4. ✅ **Expected**:
   - If passwords match: Success alert "Your password has been reset successfully..."
   - Should navigate back to Login screen
   - If passwords don't match: Error alert

### Test 5: Login with New Password
1. On Login screen, enter email
2. Enter the **new password** you just set
3. Click **"Login"**
4. ✅ **Expected**: Should successfully login

### Test 6: Invalid Email
1. On Forgot Password screen, enter non-existent email
2. Click **"Send Code"**
3. ✅ **Expected**: 
   - Should still show success message (for security, don't reveal if email exists)
   - But no OTP should be generated

### Test 7: Expired OTP
1. Request password reset
2. Wait 10+ minutes (or modify backend expiration time for testing)
3. Try to verify OTP
4. ✅ **Expected**: Error "Invalid or expired OTP"

### Test 8: Used OTP
1. Complete password reset flow successfully
2. Try to use the same OTP again
3. ✅ **Expected**: Error "Invalid or expired OTP" (OTP marked as used)

## Part 3: Edge Cases & Error Handling

### Test 1: Empty Fields
1. Try to send code without email
2. ✅ **Expected**: Error "Please enter your email address"

### Test 2: Invalid OTP Format
1. Try to enter letters in OTP field
2. ✅ **Expected**: Only numbers accepted

### Test 3: Short Password
1. In reset password step, enter password < 6 characters
2. ✅ **Expected**: Error "Password must be at least 6 characters long"

### Test 4: Password Mismatch
1. Enter different passwords in "New Password" and "Confirm Password"
2. ✅ **Expected**: Error "Passwords do not match"

### Test 5: Navigation Back
1. On OTP screen, click back button
2. ✅ **Expected**: Should go back to email input step
3. On Reset Password screen, click back button
4. ✅ **Expected**: Should go back to OTP screen

## Part 4: Integration Testing

### Test 1: Guest → Login → Full Access
1. Start as guest
2. Browse movies (should work)
3. Try to write review (should prompt login)
4. Login with credentials
5. ✅ **Expected**: Can now write reviews, add to watchlist, etc.

### Test 2: Guest → Sign Up → Full Access
1. Start as guest
2. Try to perform restricted action
3. Click "Sign Up" instead of "Login"
4. Create new account
5. ✅ **Expected**: Should be authenticated and guest mode disabled

### Test 3: Logout → Guest Mode
1. Be logged in
2. Logout from Account screen
3. ✅ **Expected**: Should return to Login screen
4. Click "Continue as Guest"
5. ✅ **Expected**: Should enter guest mode

## Troubleshooting

### Issue: OTP not received
- **Solution**: Check backend console for `[DEV MODE]` log
- In production, configure SMTP settings in `.env`

### Issue: "Cannot read property 'isGuest'"
- **Solution**: Make sure AuthContext is properly updated and app is restarted

### Issue: Guest mode not working
- **Solution**: 
  1. Check `AppNavigator.tsx` allows `isGuest || isAuthenticated`
  2. Restart the app completely
  3. Clear app cache if needed

### Issue: Forgot Password screen not showing
- **Solution**: 
  1. Check `ForgotPasswordScreen` is imported in `AppNavigator.tsx`
  2. Check route is added to `AuthStackParamList`
  3. Restart app

### Issue: Email sending fails in production
- **Solution**: Configure SMTP in `.env`:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  EMAIL_FROM=noreply@tfireviews.com
  ```

## Quick Test Checklist

- [ ] Guest mode allows browsing
- [ ] Guest mode blocks write review
- [ ] Guest mode blocks watchlist
- [ ] Guest mode blocks account access
- [ ] Forgot password link appears on login
- [ ] Email input works
- [ ] OTP is generated (check console)
- [ ] OTP verification works
- [ ] Password reset works
- [ ] Can login with new password
- [ ] Invalid OTP shows error
- [ ] Expired OTP shows error
- [ ] Navigation back works
- [ ] Login from guest mode works

## Notes

- **Development Mode**: OTPs are logged to console instead of sending emails
- **Production Mode**: Configure SMTP for actual email delivery
- **Security**: Email existence is not revealed (same message for valid/invalid emails)
- **OTP Expiration**: 10 minutes by default
- **OTP Format**: 6-digit numeric code
