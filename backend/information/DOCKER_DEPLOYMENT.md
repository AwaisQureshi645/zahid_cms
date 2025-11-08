# Docker Deployment Guide for Koyeb

This guide explains how to deploy your Flask backend and React frontend using Docker on Koyeb.

## 📋 Prerequisites

1. Docker installed locally (for testing)
2. Koyeb account
3. GitHub repository with your code
4. Supabase credentials

## 🐳 Docker Files Overview

### Backend Dockerfile (`backend/Dockerfile`)
- Multi-stage build for optimized image size
- Uses Python 3.11 slim image
- Installs dependencies and runs with Gunicorn
- Exposes port 8080

### Frontend Dockerfile (`Dockerfile`)
- Multi-stage build with Node.js for build and Nginx for serving
- Builds React app with environment variables
- Serves static files with Nginx
- Includes SPA routing support

## 🚀 Deployment Steps

### Option 1: Deploy Backend to Koyeb (Docker)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add Docker support"
   git push
   ```

2. **Create Backend App on Koyeb**
   - Go to https://www.koyeb.com
   - Click "Create App"
   - Select "GitHub" as source
   - Choose your repository
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `backend/Dockerfile` (or leave empty if in root)
   - **Build Type**: Docker

3. **Set Environment Variables**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=8080
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your backend will be at: `https://your-backend-app.koyeb.app`

### Option 2: Deploy Frontend to Koyeb (Docker)

1. **Create Frontend App on Koyeb**
   - Click "Create App" again
   - Select "GitHub" as source
   - Choose your repository
   - **Root Directory**: `.` (project root)
   - **Dockerfile Path**: `Dockerfile`
   - **Build Type**: Docker

2. **Set Build Arguments** (for environment variables at build time)
   ```
   VITE_API_URL=https://your-backend-app.koyeb.app
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your frontend will be at: `https://your-frontend-app.koyeb.app`

## 🧪 Local Testing with Docker

### Test Backend Locally

```bash
cd backend
docker build -t invoice-backend .
docker run -p 5000:8080 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e PORT=8080 \
  invoice-backend
```

Test: http://localhost:5000/api/health

### Test Frontend Locally

```bash
# Build with environment variables
docker build \
  --build-arg VITE_API_URL=http://localhost:5000 \
  --build-arg VITE_SUPABASE_URL=your-url \
  --build-arg VITE_SUPABASE_ANON_KEY=your-key \
  -t invoice-frontend .

# Run
docker run -p 3000:80 invoice-frontend
```

Test: http://localhost:3000

### Test with Docker Compose

1. **Create `.env` file** in project root:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   VITE_API_URL=http://localhost:5000
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Run docker-compose**:
   ```bash
   docker-compose up --build
   ```

3. **Access applications**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 📝 Koyeb Configuration

### Backend App Settings

**Build Settings:**
- Build Type: Docker
- Dockerfile Path: `backend/Dockerfile`
- Root Directory: `backend`

**Environment Variables:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
PORT=8080
```

**Port:**
- Koyeb automatically sets `PORT` environment variable
- Your Dockerfile should use `${PORT:-8080}` as fallback

### Frontend App Settings

**Build Settings:**
- Build Type: Docker
- Dockerfile Path: `Dockerfile`
- Root Directory: `.`

**Build Arguments:**
```
VITE_API_URL=https://your-backend-app.koyeb.app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

**Note:** Vite environment variables must be set at build time, not runtime.

## 🔧 Troubleshooting

### Backend Issues

**Build fails: "Module not found"**
- Ensure all dependencies are in `requirements.txt`
- Check that `gunicorn` is included

**Port binding error**
- Verify Dockerfile uses `${PORT:-8080}`
- Check Koyeb sets PORT environment variable

**Database connection fails**
- Verify Supabase credentials are correct
- Check environment variables are set in Koyeb

### Frontend Issues

**Environment variables not working**
- Vite variables must be set at build time (use build args)
- Check build arguments are set in Koyeb
- Rebuild after changing environment variables

**API calls fail (CORS)**
- Verify backend CORS is configured correctly
- Check `VITE_API_URL` points to correct backend URL
- Ensure backend is accessible

**404 errors on routes**
- Verify nginx.conf includes SPA routing (`try_files`)
- Check nginx configuration is copied correctly

### Docker Build Issues

**Build takes too long**
- Use multi-stage builds (already implemented)
- Leverage Docker layer caching
- Use `.dockerignore` to exclude unnecessary files

**Image size too large**
- Use slim/alpine base images (already implemented)
- Remove build dependencies in final stage
- Use multi-stage builds

## 📊 Monitoring

### Check Logs in Koyeb

1. Go to your app dashboard
2. Click "Logs" tab
3. View real-time logs

### Health Checks

Both Dockerfiles include health checks:
- Backend: `/api/health` endpoint
- Frontend: Nginx root endpoint

## 🔄 Continuous Deployment

Koyeb automatically redeploys when you push to your connected branch:
1. Push code to GitHub
2. Koyeb detects changes
3. Builds new Docker image
4. Deploys automatically

## 🎯 Best Practices

1. **Use Multi-stage Builds**: Reduces final image size
2. **Set Health Checks**: Helps Koyeb monitor your app
3. **Use .dockerignore**: Excludes unnecessary files
4. **Environment Variables**: Never commit secrets
5. **Version Pinning**: Pin dependency versions in requirements.txt
6. **Optimize Layers**: Order Dockerfile commands for better caching

## 📚 Additional Resources

- [Koyeb Docker Guide](https://www.koyeb.com/docs/getting-started/docker)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

## ✅ Deployment Checklist

- [ ] Backend Dockerfile created and tested locally
- [ ] Frontend Dockerfile created and tested locally
- [ ] Backend deployed to Koyeb
- [ ] Frontend deployed to Koyeb
- [ ] Environment variables set correctly
- [ ] Health checks passing
- [ ] Frontend can connect to backend
- [ ] All features working in production

---

Your application is now containerized and ready for deployment! 🎉

