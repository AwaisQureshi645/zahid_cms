# 🔧 Fix Email Confirmation Redirect to Production Domain

## The Problem
After email confirmation, users are redirected to `localhost:3000` instead of your production domain.

## Root Cause
Supabase needs to have your production domain configured as an **allowed redirect URL** in the Supabase dashboard.

## ✅ Solution (2 Steps)

### Step 1: Configure Supabase Dashboard

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. Go to **Authentication** → **URL Configuration** (or **Settings** → **Auth**)
4. Find **"Redirect URLs"** or **"Site URL"** section
5. Add your production domain to **"Redirect URLs"**:
   ```
   https://your-production-domain.com/**
   https://your-production-domain.com
   ```
   
   **Example:**
   ```
   https://your-app.vercel.app/**
   https://your-app.netlify.app/**
   https://your-custom-domain.com/**
   ```

6. **Update "Site URL"** to your production domain:
   ```
   https://your-production-domain.com
   ```

7. **Save** the changes

### Step 2: Set Environment Variable (Optional but Recommended)

Set `VITE_APP_URL` in your frontend deployment platform (Vercel, Netlify, etc.):

**For Vercel:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   - Name: `VITE_APP_URL`
   - Value: `https://your-production-domain.com`
3. Redeploy

**For Netlify:**
1. Go to your site → **Site settings** → **Environment variables**
2. Add:
   - Key: `VITE_APP_URL`
   - Value: `https://your-production-domain.com`
3. Redeploy

**For other platforms:**
Set the environment variable `VITE_APP_URL` to your production domain URL.

## 🔍 How to Find Your Production Domain

Your production domain is where your frontend is deployed:
- **Vercel**: `https://your-app.vercel.app` or your custom domain
- **Netlify**: `https://your-app.netlify.app` or your custom domain
- **Other**: Your actual frontend URL

## 📝 Code Changes Made

The code now uses:
```typescript
const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
```

This means:
- If `VITE_APP_URL` is set → uses that (production)
- Otherwise → uses `window.location.origin` (current domain)

## ⚠️ Important Notes

1. **Supabase Configuration is Required**: Even if you set `VITE_APP_URL`, Supabase must have your domain in the allowed redirect URLs list.

2. **Wildcard Pattern**: Use `/**` at the end to allow all paths:
   ```
   https://your-domain.com/**
   ```

3. **Multiple Domains**: You can add multiple redirect URLs:
   ```
   http://localhost:3000/**
   https://your-staging-domain.com/**
   https://your-production-domain.com/**
   ```

4. **Site URL vs Redirect URLs**:
   - **Site URL**: The main domain of your app
   - **Redirect URLs**: All allowed redirect destinations (can be multiple)

## 🧪 Testing

1. **Sign up** with a new email
2. **Check your email** for confirmation link
3. **Click the confirmation link**
4. **Verify** you're redirected to your production domain, not localhost

## 🐛 If Still Not Working

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard → **Logs** → **Auth Logs**
   - Look for redirect errors

2. **Verify Environment Variable**:
   - Check if `VITE_APP_URL` is set correctly
   - Rebuild and redeploy after setting it

3. **Check Browser Console**:
   - Open browser DevTools → Console
   - Look for any redirect errors

4. **Verify Supabase Settings**:
   - Make sure your production domain is in the redirect URLs list
   - Make sure there are no typos in the URL

## 📋 Quick Checklist

- [ ] Added production domain to Supabase **Redirect URLs**
- [ ] Updated **Site URL** in Supabase to production domain
- [ ] Set `VITE_APP_URL` environment variable (optional)
- [ ] Redeployed frontend after changes
- [ ] Tested email confirmation flow

## 🔗 Related Files

- `src/contexts/AuthContext.tsx` - Updated to use `VITE_APP_URL` environment variable

