# Docker Setup Summary

All Docker files have been created for deploying your React + Flask application on Koyeb!

## 📁 Files Created

### Backend Docker Files
- ✅ `backend/Dockerfile` - Multi-stage Dockerfile for Flask backend
- ✅ `backend/.dockerignore` - Excludes unnecessary files from backend build
- ✅ `backend/wsgi.py` - WSGI entry point (already existed, used by Docker)

### Frontend Docker Files
- ✅ `Dockerfile` - Multi-stage Dockerfile for React frontend
- ✅ `.dockerignore` - Excludes unnecessary files from frontend build
- ✅ `nginx.conf` - Nginx configuration for serving React app

### Docker Compose
- ✅ `docker-compose.yml` - For local testing with both services

### Documentation
- ✅ `KOYEB_DOCKER_QUICK_START.md` - Quick deployment guide
- ✅ `backend/information/DOCKER_DEPLOYMENT.md` - Detailed Docker guide

## 🚀 Quick Deploy to Koyeb

### Backend Deployment

1. **In Koyeb Dashboard:**
   - Create new app
   - Connect GitHub repository
   - **Root Directory**: `backend`
   - **Build Type**: Docker
   - **Dockerfile Path**: `backend/Dockerfile` (or leave empty)

2. **Environment Variables:**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=8080
   ```

3. **Deploy!** 🎉

### Frontend Deployment

1. **In Koyeb Dashboard:**
   - Create another app
   - Connect same GitHub repository
   - **Root Directory**: `.` (project root)
   - **Build Type**: Docker
   - **Dockerfile Path**: `Dockerfile`

2. **Build Arguments** (Important!):
   ```
   VITE_API_URL=https://your-backend-app.koyeb.app
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Deploy!** 🎉

## 🧪 Test Locally

### Option 1: Docker Compose (Easiest)

1. Create `.env` file in project root:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   VITE_API_URL=http://localhost:5000
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Run:
   ```bash
   docker-compose up --build
   ```

3. Access:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### Option 2: Individual Containers

**Backend:**
```bash
cd backend
docker build -t invoice-backend .
docker run -p 5000:8080 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  invoice-backend
```

**Frontend:**
```bash
docker build \
  --build-arg VITE_API_URL=http://localhost:5000 \
  --build-arg VITE_SUPABASE_URL=your-url \
  --build-arg VITE_SUPABASE_ANON_KEY=your-key \
  -t invoice-frontend .

docker run -p 3000:80 invoice-frontend
```

## 📋 Key Features

### Backend Dockerfile
- ✅ Multi-stage build (smaller image size)
- ✅ Python 3.11 slim base image
- ✅ Gunicorn WSGI server
- ✅ Health check included
- ✅ Environment variable support

### Frontend Dockerfile
- ✅ Multi-stage build (Node.js build, Nginx serve)
- ✅ Node.js 20 Alpine for build
- ✅ Nginx Alpine for production
- ✅ Environment variables at build time
- ✅ SPA routing support
- ✅ Health check included

### Docker Compose
- ✅ Both services in one command
- ✅ Volume mounting for data persistence
- ✅ Health checks configured
- ✅ Environment variable support

## ⚠️ Important Notes

1. **Frontend Environment Variables**: Must be set as **Build Arguments** in Koyeb, not regular environment variables, because Vite embeds them at build time.

2. **Backend Port**: Koyeb automatically sets the `PORT` environment variable. The Dockerfile uses `${PORT:-8080}` as a fallback.

3. **Database**: The backend will use Supabase in production. SQLite is only for local development.

4. **CORS**: Already configured in your Flask app to allow all origins.

## 📚 Documentation

- **Quick Start**: `KOYEB_DOCKER_QUICK_START.md`
- **Detailed Guide**: `backend/information/DOCKER_DEPLOYMENT.md`
- **Traditional Deploy**: `KOYEB_QUICK_START.md`

## ✅ Next Steps

1. Test locally with `docker-compose up --build`
2. Push code to GitHub
3. Deploy backend to Koyeb
4. Deploy frontend to Koyeb
5. Test your live application!

## 🎉 You're All Set!

Your application is now containerized and ready for deployment on Koyeb! 🚀

