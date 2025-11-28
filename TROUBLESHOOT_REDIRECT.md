# 🔧 Troubleshoot: Still Redirecting to localhost:3000

## The Problem
After email confirmation, you're still being redirected to `http://localhost:3000` instead of your Netlify domain.

## ⚠️ Most Common Causes

### 1. **Email Link Was Generated Before Configuration Change**
If you signed up BEFORE configuring Supabase, the email link already has `localhost:3000` hardcoded in it.

**Solution**: Sign up with a NEW email address AFTER configuring everything.

### 2. **Supabase Site URL is Still localhost**
Supabase might be using `localhost:3000` as the default redirect URL.

**Solution**: Check and update Supabase configuration (see below).

### 3. **VITE_APP_URL Not Set or Not Redeployed**
The environment variable might not be set, or the site wasn't redeployed after setting it.

**Solution**: Verify and redeploy (see below).

## ✅ Step-by-Step Fix

### Step 1: Verify Supabase Configuration

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. Go to **Authentication** → **URL Configuration**
4. **Check "Site URL"** - Should be:
   ```
   https://gleaming-hummingbird-6934de.netlify.app
   ```
   **NOT** `http://localhost:3000`

5. **Check "Redirect URLs"** - Should include:
   ```
   https://gleaming-hummingbird-6934de.netlify.app/**
   https://gleaming-hummingbird-6934de.netlify.app
   http://localhost:3000/**  (for development)
   ```

6. **If localhost is listed FIRST**, Supabase might use it as default
   - **Remove** `http://localhost:3000/**` temporarily
   - **Save**
   - **Add it back** at the END of the list
   - **Save again**

### Step 2: Verify Netlify Environment Variable

1. **Go to Netlify**: https://app.netlify.com
2. **Select your site**: `gleaming-hummingbird-6934de`
3. Go to **Site settings** → **Environment variables**
4. **Verify** `VITE_APP_URL` exists and is:
   ```
   https://gleaming-hummingbird-6934de.netlify.app
   ```
5. **If missing or wrong**, update it and **redeploy**

### Step 3: Force Redeploy

After setting/updating environment variables, you MUST redeploy:

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for deployment to complete

### Step 4: Test with NEW Email

**IMPORTANT**: Use a **NEW email address** that hasn't signed up before.

1. **Sign up** with a completely new email
2. **Check email** for confirmation link
3. **Click the link**
4. **Verify** redirect goes to Netlify domain

## 🔍 Debug Steps

### Check 1: Verify Redirect URL in Console

1. **Open your Netlify site**: https://gleaming-hummingbird-6934de.netlify.app
2. **Open Browser DevTools** (F12)
3. Go to **Console** tab
4. **Sign up** with a new email
5. **Look for** these logs:
   ```
   [SignUp] Redirect URL: https://gleaming-hummingbird-6934de.netlify.app/
   [SignUp] VITE_APP_URL: https://gleaming-hummingbird-6934de.netlify.app
   ```

**If you see**:
- `VITE_APP_URL: undefined` → Environment variable not set
- `Redirect URL: http://localhost:3000/` → Using wrong URL

### Check 2: Inspect Email Link

1. **Open the confirmation email**
2. **Right-click** the confirmation link
3. **Copy link address**
4. **Check the URL** - it should contain:
   ```
   redirect_to=https%3A%2F%2Fgleaming-hummingbird-6934de.netlify.app
   ```
   
**If it contains**:
   ```
   redirect_to=http%3A%2F%2Flocalhost%3A3000
   ```
   → The link was generated with the wrong URL

### Check 3: Check Supabase Auth Logs

1. Go to **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Look for recent signup/confirmation events
3. Check if there are any redirect errors

## 🎯 Quick Verification Checklist

- [ ] Supabase **Site URL** = `https://gleaming-hummingbird-6934de.netlify.app`
- [ ] Supabase **Redirect URLs** includes Netlify domain
- [ ] `VITE_APP_URL` is set in Netlify environment variables
- [ ] Netlify site was **redeployed** after setting env var
- [ ] Testing with a **NEW email** (not old confirmation link)
- [ ] Browser console shows correct redirect URL when signing up

## 🚨 If Still Not Working

### Option 1: Manually Update Email Link

If you have an old confirmation email:
1. **Copy the confirmation link**
2. **Find** `redirect_to=http%3A%2F%2Flocalhost%3A3000` in the URL
3. **Replace** with: `redirect_to=https%3A%2F%2Fgleaming-hummingbird-6934de.netlify.app%2F`
4. **Paste** the modified URL in browser

### Option 2: Reset User and Resend Email

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. **Find the user** who needs to confirm
3. **Delete the user** or **Resend confirmation email**
4. **Sign up again** with the same email

### Option 3: Check Supabase Project Settings

1. Go to **Supabase Dashboard** → **Settings** → **General**
2. Check if there are any project-level redirect settings
3. Verify project is in correct region

## 📝 Code Changes Made

The code now:
1. **Logs redirect URL** when signing up (check browser console)
2. **Uses `VITE_APP_URL`** if set, otherwise falls back to current origin
3. **Handles redirect** if user lands on localhost with auth token

## 🔗 Related Files

- `src/contexts/AuthContext.tsx` - Signup function with redirect URL
- `src/pages/Index.tsx` - Redirect handler for localhost

## 💡 Pro Tip

**Always test with a NEW email** after making configuration changes. Old confirmation emails contain the redirect URL that was set when the email was sent.

