# Koyeb Deployment Troubleshooting Guide

## Issue: "gunicorn: command not found" or "no command to run"

This error occurs when Koyeb can't find the command to run your application.

### Solution 1: If Using Docker Deployment

**Check your Koyeb app settings:**

1. Go to your Koyeb app dashboard
2. Click on "Settings" → "Build & Deploy"
3. Verify:
   - **Build Type**: Should be set to **"Docker"**
   - **Dockerfile Path**: Should be `backend/Dockerfile` (or leave empty if Dockerfile is in root directory)
   - **Root Directory**: Should be `backend`

4. **Important**: If you see "Run Command" field, **leave it empty** when using Docker. The Dockerfile CMD will be used.

### Solution 2: If Using Procfile Deployment

**Check your Procfile location and content:**

1. **Procfile must be in the root directory** that Koyeb is building from
   - If Root Directory is `backend`, Procfile should be at `backend/Procfile`
   - If Root Directory is `.`, Procfile should be at root of repo

2. **Procfile content should be:**
   ```
   web: gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120
   ```

3. **Verify gunicorn is in requirements.txt:**
   ```
   gunicorn==21.2.0
   ```

### Solution 3: Set Run Command in Koyeb

If Docker/Procfile isn't working, set the run command directly in Koyeb:

1. Go to your app → Settings → Build & Deploy
2. Find "Run Command" field
3. Enter:
   ```
   gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120
   ```
4. Make sure "Build Type" is set to "Docker" or "Buildpack"

## Issue: "uvicorn: command not found"

You're trying to use uvicorn, but this is a Flask app that uses gunicorn.

**Solution:**
- Remove any uvicorn references
- Use gunicorn instead (already configured)
- If you set a run command in Koyeb, make sure it uses `gunicorn`, not `uvicorn`

## Issue: Application exits immediately

**Possible causes:**

1. **Missing environment variables**
   - Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
   - Go to Settings → Environment Variables

2. **Port binding issue**
   - Make sure your command uses `$PORT` (Koyeb sets this automatically)
   - Don't hardcode port numbers

3. **Import errors**
   - Check build logs for Python import errors
   - Ensure all dependencies are in `requirements.txt`

## Quick Fix Checklist

- [ ] Build Type is set to "Docker" in Koyeb
- [ ] Root Directory is set correctly (`backend` for backend app)
- [ ] Dockerfile exists at `backend/Dockerfile`
- [ ] `gunicorn` is in `requirements.txt`
- [ ] Environment variables are set in Koyeb
- [ ] No custom "Run Command" set (if using Docker)
- [ ] Procfile exists if not using Docker
- [ ] Code is pushed to GitHub

## Recommended Koyeb Configuration

### Backend App Settings:

**Build & Deploy:**
- Build Type: **Docker**
- Root Directory: **backend**
- Dockerfile Path: **backend/Dockerfile** (or leave empty)
- Run Command: **Leave empty** (uses Dockerfile CMD)

**Environment Variables:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=8080 (optional, Koyeb sets this automatically)
```

## Still Having Issues?

1. **Check Build Logs:**
   - Go to your app → Logs
   - Look for build errors
   - Check if gunicorn is being installed

2. **Check Runtime Logs:**
   - Look for startup errors
   - Check for import errors
   - Verify environment variables are loaded

3. **Test Locally:**
   ```bash
   cd backend
   docker build -t test-backend .
   docker run -p 5000:8080 \
     -e SUPABASE_URL=your-url \
     -e SUPABASE_SERVICE_ROLE_KEY=your-key \
     -e PORT=8080 \
     test-backend
   ```

4. **Verify Dockerfile:**
   - Make sure gunicorn is installed
   - Check CMD/ENTRYPOINT is correct
   - Verify PATH includes gunicorn location

## Common Mistakes

❌ **Wrong**: Setting Run Command when using Docker
✅ **Correct**: Leave Run Command empty, use Dockerfile CMD

❌ **Wrong**: Procfile in wrong directory
✅ **Correct**: Procfile in same directory as Root Directory setting

❌ **Wrong**: Using uvicorn for Flask app
✅ **Correct**: Use gunicorn for Flask

❌ **Wrong**: Hardcoding port number
✅ **Correct**: Use `$PORT` environment variable

