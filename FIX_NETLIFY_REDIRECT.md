# 🔧 Fix Redirect for Netlify: gleaming-hummingbird-6934de.netlify.app

## Your Netlify Domain
`https://gleaming-hummingbird-6934de.netlify.app`

## ✅ Step-by-Step Fix

### Step 1: Configure Supabase Dashboard (REQUIRED)

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. Go to **Authentication** → **URL Configuration**
   - Or: **Settings** → **Auth** → **URL Configuration**
4. Find **"Redirect URLs"** section
5. **Add your Netlify domain**:
   ```
   https://gleaming-hummingbird-6934de.netlify.app/**
   https://gleaming-hummingbird-6934de.netlify.app
   ```
   
   **Important**: Add BOTH:
   - With `/**` (allows all paths)
   - Without `/**` (allows root path)

6. **Update "Site URL"** to:
   ```
   https://gleaming-hummingbird-6934de.netlify.app
   ```

7. **Also add localhost** (for development):
   ```
   http://localhost:3000/**
   http://localhost:5173/**
   ```

8. **Click "Save"**

### Step 2: Set Environment Variable in Netlify

1. **Go to Netlify Dashboard**: https://app.netlify.com
2. **Select your site**: `gleaming-hummingbird-6934de`
3. Go to **Site settings** → **Environment variables** (or **Build & deploy** → **Environment**)
4. **Click "Add variable"**
5. Add:
   - **Key**: `VITE_APP_URL`
   - **Value**: `https://gleaming-hummingbird-6934de.netlify.app`
6. **Click "Save"**

### Step 3: Redeploy Your Site

After setting the environment variable, you **MUST** redeploy:

1. **Option A: Trigger Redeploy**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Deploy site"**

2. **Option B: Push to Git**
   - Make any small change (or just push)
   - Netlify will auto-deploy

### Step 4: Verify

1. **Test signup** with a new email
2. **Check email** for confirmation link
3. **Click confirmation link**
4. **Verify** you're redirected to: `https://gleaming-hummingbird-6934de.netlify.app/`

## 📋 Complete Environment Variables for Netlify

Make sure you have ALL these set in Netlify:

```
VITE_APP_URL=https://gleaming-hummingbird-6934de.netlify.app
VITE_API_URL=https://advisory-mireille-start-up-122s-37de736c.koyeb.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🐛 If Still Not Working

### Check 1: Verify Environment Variable is Set
1. Go to Netlify → **Site settings** → **Environment variables**
2. Confirm `VITE_APP_URL` is set correctly
3. If missing, add it and **redeploy**

### Check 2: Verify Supabase Configuration
1. Go to Supabase → **Authentication** → **URL Configuration**
2. Confirm your Netlify domain is in **Redirect URLs**
3. Should see: `https://gleaming-hummingbird-6934de.netlify.app/**`

### Check 3: Check Browser Console
1. Open your Netlify site
2. Open **Browser DevTools** (F12)
3. Go to **Console** tab
4. Look for any errors related to redirects

### Check 4: Test the Redirect URL
The code uses:
```typescript
const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
```

To verify it's working:
1. Open browser console on your Netlify site
2. Type: `import.meta.env.VITE_APP_URL`
3. Should show: `"https://gleaming-hummingbird-6934de.netlify.app"`

## ⚠️ Important Notes

1. **Environment variables are embedded at BUILD TIME**
   - You MUST rebuild/redeploy after setting `VITE_APP_URL`
   - Just saving the variable isn't enough

2. **Supabase must allow the domain**
   - Even if `VITE_APP_URL` is set, Supabase will block redirects to unlisted domains
   - Always configure Supabase first

3. **Use HTTPS**
   - Always use `https://` in URLs
   - Never use `http://` for production

## 🎯 Quick Checklist

- [ ] Added Netlify domain to Supabase **Redirect URLs**
- [ ] Updated **Site URL** in Supabase
- [ ] Set `VITE_APP_URL` in Netlify environment variables
- [ ] Redeployed Netlify site (after setting env var)
- [ ] Tested email confirmation flow
- [ ] Verified redirect goes to Netlify domain (not localhost)

## 📸 Visual Guide

### Supabase Dashboard:
```
Authentication → URL Configuration

Redirect URLs:
✅ https://gleaming-hummingbird-6934de.netlify.app/**
✅ https://gleaming-hummingbird-6934de.netlify.app
✅ http://localhost:3000/**

Site URL:
✅ https://gleaming-hummingbird-6934de.netlify.app
```

### Netlify Dashboard:
```
Site settings → Environment variables

Key: VITE_APP_URL
Value: https://gleaming-hummingbird-6934de.netlify.app
```

