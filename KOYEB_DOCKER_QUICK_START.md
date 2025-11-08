# Quick Start: Docker Deployment on Koyeb

This is the fastest way to deploy your invoice application using Docker on Koyeb.

## 🚀 Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add Docker support for Koyeb deployment"
git push
```

### Step 2: Deploy Backend (Flask API)

1. **Go to Koyeb**: https://www.koyeb.com
2. **Create App**: Click "Create App" or "New App"
3. **Connect GitHub**: Authorize and select your repository
4. **Configure**:
   - **Root Directory**: `backend`
   - **Build Type**: Docker
   - **Dockerfile Path**: `backend/Dockerfile` (or leave empty)
   - **Branch**: `main` (or your default branch)

5. **Set Environment Variables**:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   PORT=8080
   ```

6. **Deploy**: Click "Deploy" and wait 2-5 minutes

7. **Test**: Visit `https://your-backend-app.koyeb.app/api/health`
   - Should return: `{"status": "ok"}`

### Step 3: Deploy Frontend (React/Vite)

1. **Create Another App** in Koyeb
2. **Configure**:
   - **Root Directory**: `.` (project root)
   - **Build Type**: Docker
   - **Dockerfile Path**: `Dockerfile`
   - **Branch**: `main`

3. **Set Build Arguments** (Important: These are build-time variables):
   ```
   VITE_API_URL=https://your-backend-app.koyeb.app
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Deploy**: Click "Deploy" and wait 3-5 minutes

5. **Test**: Visit `https://your-frontend-app.koyeb.app`
   - Should show your application

## 🧪 Test Locally First (Optional)

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

Visit: http://localhost:5000/api/health

### Test Frontend Locally

```bash
docker build \
  --build-arg VITE_API_URL=http://localhost:5000 \
  --build-arg VITE_SUPABASE_URL=your-url \
  --build-arg VITE_SUPABASE_ANON_KEY=your-key \
  -t invoice-frontend .

docker run -p 3000:80 invoice-frontend
```

Visit: http://localhost:3000

### Test with Docker Compose

1. Create `.env` file:
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

## 📝 Environment Variables Summary

### Backend (Runtime Environment Variables)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
PORT=8080 (automatically set by Koyeb)
```

### Frontend (Build Arguments - Set at Build Time!)
```
VITE_API_URL=https://your-backend-app.koyeb.app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

⚠️ **Important**: Frontend environment variables must be set as **Build Arguments** in Koyeb, not regular environment variables, because Vite embeds them at build time.

## ✅ Checklist

- [ ] Code pushed to GitHub
- [ ] Backend Dockerfile tested locally
- [ ] Frontend Dockerfile tested locally
- [ ] Backend deployed to Koyeb
- [ ] Backend environment variables set
- [ ] Backend health check works
- [ ] Frontend deployed to Koyeb
- [ ] Frontend build arguments set
- [ ] Frontend accessible
- [ ] Frontend can connect to backend
- [ ] Login/authentication works
- [ ] All features tested

## 🐛 Common Issues

### Backend Issues

**"Module not found" error**
- ✅ Ensure `gunicorn` is in `requirements.txt`
- ✅ Check all dependencies are listed

**Port binding error**
- ✅ Dockerfile uses `${PORT:-8080}` correctly
- ✅ Koyeb automatically sets PORT

**Database connection fails**
- ✅ Verify Supabase credentials
- ✅ Check environment variables in Koyeb dashboard

### Frontend Issues

**Environment variables not working**
- ⚠️ Must set as **Build Arguments**, not Environment Variables
- ⚠️ Rebuild required after changing build args
- ✅ Check build logs in Koyeb

**API calls fail**
- ✅ Verify `VITE_API_URL` points to backend
- ✅ Check CORS is enabled (already configured)
- ✅ Ensure backend is accessible

**404 on routes**
- ✅ Nginx config includes SPA routing
- ✅ Check nginx.conf is copied correctly

## 🎯 Why Docker?

✅ **Consistent**: Same environment everywhere  
✅ **Isolated**: No dependency conflicts  
✅ **Portable**: Works on any platform  
✅ **Optimized**: Multi-stage builds reduce size  
✅ **Production-ready**: Includes health checks  

## 📚 More Information

- **Detailed Docker Guide**: `backend/information/DOCKER_DEPLOYMENT.md`
- **Traditional Deployment**: `KOYEB_QUICK_START.md`
- **Backend Structure**: `backend/information/BACKEND_STRUCTURE.md`

## 🎉 You're Done!

Your application is now containerized and deployed on Koyeb! 🚀

