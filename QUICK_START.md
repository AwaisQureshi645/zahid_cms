# Quick Start Guide - Separate Frontend & Backend Deployment

## Backend URL Configuration

The backend URL is now centralized in **`src/config/api.ts`**. 

### Set Environment Variable

Create a `.env` file in the project root:

```env
VITE_API_URL=https://your-backend-app.koyeb.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## Deploy Backend to Koyeb

1. **Push backend to Git** (if not already)
2. **Go to Koyeb Dashboard** → Create App
3. **Connect Repository** → Select `backend` folder as root
4. **Set Environment Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (optional)
5. **Deploy** → Get your backend URL (e.g., `https://my-app.koyeb.app`)

## Deploy Frontend

1. **Set `VITE_API_URL`** to your Koyeb backend URL
2. **Build**: `npm run build`
3. **Deploy `dist/` folder** to Vercel, Netlify, or any static host

## All API Calls Use Centralized Config

All API calls automatically use `VITE_API_URL`:

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// All these automatically use the configured backend URL
await apiGet('/api/products');
await apiPost('/api/products', data);
await apiPut('/api/products/123', data);
await apiDelete('/api/products/123');
```

## Files Changed

- ✅ `src/config/api.ts` - **NEW** - Backend URL configuration
- ✅ `src/lib/api.ts` - **UPDATED** - Uses centralized config, added PUT/DELETE
- ✅ `src/pages/Inventory.tsx` - **UPDATED** - Uses API functions
- ✅ `vite.config.ts` - **UPDATED** - Removed proxy

## Testing

1. **Backend Health Check**: `https://your-backend.koyeb.app/api/health`
2. **Frontend**: Should connect to backend automatically via `VITE_API_URL`

