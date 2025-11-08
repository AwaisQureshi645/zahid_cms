# Quick Start: Deploy to Koyeb

This is a quick guide to deploy your invoice application to Koyeb.

## 🐳 Docker Deployment (Recommended)

We now support Docker deployment! See `backend/information/DOCKER_DEPLOYMENT.md` for detailed Docker instructions.

**Quick Docker Deploy:**
1. Backend: Use `backend/Dockerfile` - Set Root Directory to `backend` in Koyeb
2. Frontend: Use `Dockerfile` - Set Root Directory to `.` in Koyeb
3. Set build arguments for frontend (VITE_* variables)

---

## 📦 Traditional Deployment (Without Docker)

## 🚀 Backend Deployment (Flask API)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for Koyeb deployment"
git push
```

### Step 2: Deploy on Koyeb

1. **Go to Koyeb**: https://www.koyeb.com
2. **Create App**: Click "Create App" or "New App"
3. **Connect GitHub**: Authorize and select your repository
4. **Configure**:
   - **Root Directory**: `backend`
   - **Branch**: `main` (or your default branch)
   - **Build Command**: Leave empty (auto-detected)
   - **Run Command**: Leave empty (uses Procfile)
   - **Python Version**: 3.11 or 3.12

### Step 3: Set Environment Variables

In Koyeb dashboard → Your App → Settings → Environment Variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Get these from**: Supabase Dashboard → Settings → API

### Step 4: Deploy

Click "Deploy" and wait 2-5 minutes. Your backend will be live at:
`https://your-app-name.koyeb.app`

### Step 5: Test Your Backend

Visit: `https://your-app-name.koyeb.app/api/health`

Should return: `{"status": "ok"}`

---

## 🎨 Frontend Deployment (React/Vite)

### Option A: Deploy Frontend to Koyeb Too

1. **Create Another App** in Koyeb
2. **Configure**:
   - **Root Directory**: `.` (root of project)
   - **Build Command**: `npm install && npm run build`
   - **Run Command**: `npx serve -s dist -l $PORT`
3. **Add to package.json**:
   ```json
   "scripts": {
     "serve": "serve -s dist -l $PORT"
   }
   ```
4. **Set Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-app.koyeb.app
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Option B: Deploy Frontend to Vercel/Netlify

**Vercel:**
1. Go to https://vercel.com
2. Import your GitHub repository
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables (same as above)

**Netlify:**
1. Go to https://netlify.com
2. Import your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables (same as above)

---

## 📝 Environment Variables Summary

### Backend (Koyeb)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Frontend (Koyeb/Vercel/Netlify)
```
VITE_API_URL=https://your-backend-app.koyeb.app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

## ✅ Checklist

- [ ] Backend deployed to Koyeb
- [ ] Environment variables set in backend
- [ ] Backend health check works (`/api/health`)
- [ ] Frontend deployed (Koyeb/Vercel/Netlify)
- [ ] Environment variables set in frontend
- [ ] Frontend can connect to backend API
- [ ] Test login/authentication
- [ ] Test creating invoices
- [ ] Test inventory management

---

## 🐛 Troubleshooting

**Backend not starting?**
- Check Koyeb logs
- Verify environment variables are set
- Ensure `gunicorn` is in `requirements.txt`

**Frontend can't connect to backend?**
- Check CORS is enabled (already done in `app.py`)
- Verify `VITE_API_URL` is set correctly
- Check backend URL is accessible

**Supabase errors?**
- Verify you're using `service_role` key (not `anon` key) for backend
- Check Supabase project is active
- Review RLS policies if needed

---

## 📚 More Help

- Full deployment guide: `backend/information/KOYEB_DEPLOYMENT.md`
- Backend structure: `backend/information/BACKEND_STRUCTURE.md`
- Koyeb docs: https://www.koyeb.com/docs

---

## 🎉 You're Done!

Your application should now be live! Share your URLs and start using your invoice system.

