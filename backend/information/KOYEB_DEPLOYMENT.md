# Deploying to Koyeb

This guide will help you deploy your Flask backend application to Koyeb.

## Prerequisites

1. A Koyeb account (sign up at https://www.koyeb.com)
2. A GitHub account (or GitLab/Bitbucket)
3. Your project pushed to a Git repository
4. Supabase credentials ready

## Step 1: Prepare Your Repository

### 1.1 Ensure All Files Are Committed

Make sure all your backend files are committed to your Git repository:

```bash
git add .
git commit -m "Prepare for Koyeb deployment"
git push
```

### 1.2 Verify Required Files

Ensure these files exist in your `backend/` folder:
- ✅ `app.py` - Main application file
- ✅ `requirements.txt` - Python dependencies
- ✅ `Procfile` - Process file for Koyeb
- ✅ `koyeb.yaml` - Koyeb configuration (optional but recommended)

## Step 2: Create Koyeb Application

### 2.1 Sign In to Koyeb

1. Go to https://www.koyeb.com
2. Sign in or create an account
3. Click "Create App" or go to your dashboard

### 2.2 Connect Your Repository

1. Click "Create App" or "New App"
2. Choose "GitHub" (or your Git provider)
3. Authorize Koyeb to access your repositories
4. Select your repository
5. Choose the branch (usually `main` or `master`)

### 2.3 Configure Build Settings

**Root Directory:** Set to `backend` (since your Flask app is in the backend folder)

**Build Command:** Leave empty (Koyeb will auto-detect Python)

**Run Command:** Leave empty (Koyeb will use the Procfile)

**Python Version:** Select Python 3.11 or 3.12

## Step 3: Configure Environment Variables

In the Koyeb dashboard, go to your app's settings and add these environment variables:

### Required Variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Optional Variables:

```
DATABASE_URL=postgresql://user:password@host:port/database
PORT=8080
FLASK_ENV=production
```

**How to get Supabase credentials:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key (secret)** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important:** Use the `service_role` key, NOT the `anon` key!

## Step 4: Deploy

1. Click "Deploy" or "Save"
2. Koyeb will:
   - Clone your repository
   - Install dependencies from `requirements.txt`
   - Build your application
   - Start the server using the Procfile
3. Wait for deployment to complete (usually 2-5 minutes)

## Step 5: Get Your Application URL

Once deployed, Koyeb will provide you with:
- A default URL: `https://your-app-name.koyeb.app`
- Or a custom domain if you configure one

Your backend API will be available at:
- `https://your-app-name.koyeb.app/api/health`
- `https://your-app-name.koyeb.app/api/products`
- etc.

## Step 6: Update Frontend Configuration

After deploying the backend, update your frontend to use the new backend URL.

### Option 1: Update Vite Config for Production

Create a production build configuration that uses your Koyeb backend URL.

### Option 2: Use Environment Variables

Create a `.env.production` file in your project root:

```env
VITE_API_URL=https://your-app-name.koyeb.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Then update your frontend code to use `VITE_API_URL` instead of hardcoded localhost URLs.

## Troubleshooting

### Build Fails

**Error: "No module named 'gunicorn'"**
- Solution: Ensure `gunicorn` is in your `requirements.txt`

**Error: "Module not found"**
- Solution: Check that all dependencies are in `requirements.txt`
- Verify the root directory is set to `backend` in Koyeb settings

### Application Crashes

**Error: "Port already in use"**
- Solution: Koyeb sets the `PORT` environment variable automatically
- Your Procfile should use `$PORT`, not a hardcoded port

**Error: "Supabase connection failed"**
- Solution: Verify environment variables are set correctly
- Check that `SUPABASE_SERVICE_ROLE_KEY` is the service_role key, not anon key

### Database Issues

**SQLite file not found**
- Solution: In production, use Supabase PostgreSQL instead of SQLite
- Set `DATABASE_URL` environment variable to your Supabase PostgreSQL connection string

**RLS (Row Level Security) errors**
- Solution: Ensure you're using the `service_role` key
- Check the troubleshooting guide in `information/RLS_TROUBLESHOOTING.md`

### Check Logs

1. Go to your Koyeb dashboard
2. Click on your app
3. Go to "Logs" tab
4. Review error messages and stack traces

## Monitoring

Koyeb provides:
- **Logs:** Real-time application logs
- **Metrics:** CPU, memory, and request metrics
- **Metrics:** Request rate, error rate, response times

## Scaling

Koyeb automatically scales your application, but you can configure:
- **Instance size:** Small, Medium, Large
- **Auto-scaling:** Based on traffic
- **Regions:** Choose deployment regions

## Custom Domain

1. Go to your app settings in Koyeb
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Continuous Deployment

Koyeb automatically deploys when you push to your connected branch:
1. Push code to GitHub
2. Koyeb detects the change
3. Builds and deploys automatically
4. Your app updates without manual intervention

## Additional Resources

- [Koyeb Documentation](https://www.koyeb.com/docs)
- [Koyeb Python Guide](https://www.koyeb.com/docs/getting-started/python)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/latest/deploying/)

## Support

If you encounter issues:
1. Check Koyeb logs
2. Review this guide
3. Check Koyeb status page
4. Contact Koyeb support

