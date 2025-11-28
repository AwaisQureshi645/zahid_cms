# Deployment Guide - Separate Frontend and Backend

This guide explains how to deploy the backend on Koyeb and the frontend separately.

## Architecture Overview

- **Backend**: Flask API deployed on Koyeb
- **Frontend**: React/Vite app deployed separately (Vercel, Netlify, etc.)
- **Communication**: Frontend communicates with backend via `VITE_API_URL` environment variable

## Backend Configuration (Koyeb)

### 1. Prepare Backend for Deployment

The backend is already configured for Koyeb deployment:
- ✅ `backend/Dockerfile` - Docker configuration
- ✅ `backend/koyeb.yaml` - Koyeb configuration
- ✅ `backend/Procfile` - Process file
- ✅ `backend/requirements.txt` - Python dependencies
- ✅ `backend/wsgi.py` - WSGI entry point

### 2. Deploy to Koyeb

1. **Create a Koyeb account** at https://www.koyeb.com

2. **Create a new app**:
   - Go to Koyeb dashboard
   - Click "Create App"
   - Connect your Git repository (GitHub/GitLab)
   - Select the `backend` folder as the root directory

3. **Configure Environment Variables** in Koyeb dashboard:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_supabase_database_url (optional)
   PORT=8080 (automatically set by Koyeb)
   ```

4. **Build Settings**:
   - Build Command: (auto-detected from Dockerfile)
   - Run Command: (auto-detected from koyeb.yaml or Procfile)

5. **Deploy**:
   - Koyeb will automatically build and deploy your backend
   - Your backend will be available at: `https://your-app-name.koyeb.app`

6. **Verify Deployment**:
   - Test health endpoint: `https://your-app-name.koyeb.app/api/health`
   - Should return: `{"status": "ok"}`

## Frontend Configuration

### 1. Environment Variables

Create a `.env` file in the project root (or set in your hosting platform):

```env
# Backend API URL - Point to your Koyeb deployment
VITE_API_URL=https://your-app-name.koyeb.app

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Build Frontend

```bash
npm install
npm run build
```

The built files will be in the `dist/` directory.

### 3. Deploy Frontend

You can deploy the frontend to any static hosting service:

#### Option A: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variables in Vercel dashboard:
   - `VITE_API_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

#### Option B: Netlify
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy --prod`
3. Set environment variables in Netlify dashboard

#### Option C: Any Static Host
- Upload the `dist/` folder contents to your hosting service
- Make sure to set environment variables during build time

### 4. Important Notes

- **CORS**: The backend already has CORS enabled for all origins (`CORS(app, resources={r"/api/*": {"origins": "*"}})`)
- **Environment Variables**: Must be prefixed with `VITE_` to be accessible in the frontend
- **Build Time**: Environment variables are embedded at build time, not runtime

## Local Development

### Backend (Local)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Backend runs on: `http://localhost:5000`

### Frontend (Local)
```bash
npm install
# Create .env file with:
# VITE_API_URL=http://localhost:5000
npm run dev
```
Frontend runs on: `http://localhost:8080`

## API Configuration

The backend URL is centralized in `src/config/api.ts`. All API calls use:
- `apiGet()` - GET requests
- `apiPost()` - POST requests
- `apiPut()` - PUT requests
- `apiDelete()` - DELETE requests

These functions automatically use the `VITE_API_URL` environment variable.

## Troubleshooting

### CORS Errors
- Ensure backend CORS is enabled (already configured)
- Check that `VITE_API_URL` points to the correct backend URL

### API Not Found
- Verify `VITE_API_URL` is set correctly
- Check that backend is running and accessible
- Test backend health endpoint: `https://your-backend.koyeb.app/api/health`

### Environment Variables Not Working
- Variables must start with `VITE_` prefix
- Rebuild frontend after changing environment variables
- Check that variables are set in your hosting platform

## Backend Endpoints

- `GET /api/health` - Health check
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/invoices` - Create invoice
- `GET /api/invoices` - List invoices

## Security Notes

- Never commit `.env` files to Git
- Use environment variables for all sensitive data
- The backend debug endpoints should be secured or removed in production
- Ensure Supabase RLS (Row Level Security) is properly configured

