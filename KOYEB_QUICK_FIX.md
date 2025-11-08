# Quick Fix for Koyeb "gunicorn: command not found" Error

## 🔧 Immediate Fix Steps

### Step 1: Check Koyeb App Settings

1. Go to your Koyeb dashboard
2. Click on your app
3. Go to **Settings** → **Build & Deploy**

### Step 2: Verify Configuration

**Make sure these settings are correct:**

✅ **Build Type**: `Docker` (not "Buildpack" or "Nixpacks")  
✅ **Root Directory**: `backend`  
✅ **Dockerfile Path**: `backend/Dockerfile` (or leave empty)  
✅ **Run Command**: **LEAVE EMPTY** (important!)  

❌ **If "Run Command" has any value, DELETE IT** - Docker will use the Dockerfile CMD

### Step 3: Verify Environment Variables

Go to **Settings** → **Environment Variables** and ensure:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Redeploy

1. Click **"Redeploy"** or push a new commit to trigger rebuild
2. Wait for build to complete
3. Check logs

## 🐛 If Still Not Working

### Option A: Use Procfile Instead of Docker

If Docker isn't working, switch to Procfile:

1. **Change Build Type** to `Buildpack` or `Nixpacks`
2. **Set Run Command** to:
   ```
   gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120
   ```
3. Make sure `Procfile` exists at `backend/Procfile`

### Option B: Set Run Command in Koyeb

1. Keep Build Type as `Docker`
2. In **Run Command** field, enter:
   ```
   gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120
   ```
3. This will override Dockerfile CMD

## ✅ What I Fixed in the Code

1. ✅ **Dockerfile**: Now installs gunicorn globally (not just user space)
2. ✅ **Entrypoint script**: Created `backend/entrypoint.sh` for reliable startup
3. ✅ **PATH**: Ensured gunicorn is in system PATH

## 📝 Files Updated

- `backend/Dockerfile` - Fixed gunicorn installation
- `backend/entrypoint.sh` - New startup script
- `KOYEB_TROUBLESHOOTING.md` - Detailed troubleshooting guide

## 🚀 Next Steps

1. **Commit and push** the updated files:
   ```bash
   git add backend/Dockerfile backend/entrypoint.sh
   git commit -m "Fix gunicorn installation in Dockerfile"
   git push
   ```

2. **In Koyeb**: Click "Redeploy" or wait for auto-deploy

3. **Check logs** - Should see gunicorn starting successfully

## 📞 Still Having Issues?

Check the detailed guide: `KOYEB_TROUBLESHOOTING.md`

