# Frontend-Backend Setup Summary

## Changes Made

### 1. Centralized Backend URL Configuration

**Created**: `src/config/api.ts`
- Centralized configuration for backend API URL
- Uses `VITE_API_URL` environment variable
- Provides `getApiUrl()` helper function
- Includes development logging

### 2. Enhanced API Client

**Updated**: `src/lib/api.ts`
- Now imports from centralized config
- Added `apiPut()` function for PUT requests
- Added `apiDelete()` function for DELETE requests
- Improved error handling
- All API functions now use the centralized backend URL

### 3. Updated Components

**Updated**: `src/pages/Inventory.tsx`
- Replaced direct `fetch()` calls with API functions
- Uses `apiPut()` for product updates
- Uses `apiDelete()` for product deletion
- All API calls now go through centralized configuration

### 4. Removed Development Proxy

**Updated**: `vite.config.ts`
- Removed proxy configuration (no longer needed)
- Frontend and backend are now separate deployments
- Backend URL configured via `VITE_API_URL` environment variable

## How It Works

### Environment Variable
Set `VITE_API_URL` in your `.env` file or hosting platform:

```env
# Local development
VITE_API_URL=http://localhost:5000

# Production (after deploying backend to Koyeb)
VITE_API_URL=https://your-backend-app.koyeb.app
```

### API Usage
All API calls automatically use the configured backend URL:

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// GET request
const products = await apiGet<Product[]>('/api/products');

// POST request
await apiPost('/api/products', productData);

// PUT request
await apiPut(`/api/products/${id}`, updatedData);

// DELETE request
await apiDelete(`/api/products/${id}`);
```

## File Structure

```
src/
├── config/
│   └── api.ts              # Backend URL configuration (NEW)
├── lib/
│   └── api.ts              # API client functions (UPDATED)
└── pages/
    └── Inventory.tsx       # Uses API functions (UPDATED)
```

## Deployment Checklist

### Backend (Koyeb)
- [ ] Deploy backend to Koyeb
- [ ] Note the backend URL (e.g., `https://your-app.koyeb.app`)
- [ ] Set environment variables in Koyeb:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL` (optional)
- [ ] Test health endpoint: `https://your-app.koyeb.app/api/health`

### Frontend
- [ ] Set `VITE_API_URL` environment variable to backend URL
- [ ] Set `VITE_SUPABASE_URL` environment variable
- [ ] Set `VITE_SUPABASE_ANON_KEY` environment variable
- [ ] Build frontend: `npm run build`
- [ ] Deploy `dist/` folder to your hosting platform
- [ ] Verify frontend can communicate with backend

## Benefits

1. **Centralized Configuration**: Backend URL defined in one place
2. **Easy Environment Switching**: Change URL via environment variable
3. **Consistent API Calls**: All requests use the same configuration
4. **Type Safety**: TypeScript ensures correct usage
5. **Separation of Concerns**: Frontend and backend can be deployed independently

## Testing

### Local Development
1. Start backend: `cd backend && python app.py` (runs on port 5000)
2. Set `.env`: `VITE_API_URL=http://localhost:5000`
3. Start frontend: `npm run dev` (runs on port 8080)
4. Test API calls in the application

### Production
1. Deploy backend to Koyeb
2. Get backend URL from Koyeb
3. Set `VITE_API_URL` in frontend hosting platform
4. Build and deploy frontend
5. Test that frontend can reach backend API

