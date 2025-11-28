# Backend URL Configuration

## Overview

The backend URL is stored in a centralized variable that can be imported and used throughout the frontend application.

## Usage

### Import the Backend URL Variable

```typescript
import { BACKEND_URL } from '@/config/api';

// Use it directly
const apiUrl = `${BACKEND_URL}/api/products`;
console.log('Backend URL:', BACKEND_URL);
```

### Using API Helper Functions (Recommended)

The recommended way is to use the API helper functions which automatically use the backend URL:

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// These automatically use BACKEND_URL internally
await apiGet('/api/products');
await apiPost('/api/products', data);
await apiPut('/api/products/123', data);
await apiDelete('/api/products/123');
```

### Direct URL Construction

If you need to construct URLs manually:

```typescript
import { BACKEND_URL, getApiUrl } from '@/config/api';

// Method 1: Use getApiUrl helper
const fullUrl = getApiUrl('/api/products');
// Result: "https://your-backend.koyeb.app/api/products" (if BACKEND_URL is set)
// Result: "/api/products" (if BACKEND_URL is not set)

// Method 2: Manual construction
const fullUrl = BACKEND_URL ? `${BACKEND_URL}/api/products` : '/api/products';
```

## Environment Variable

Set the backend URL via environment variable:

```env
VITE_API_URL=https://your-backend-app.koyeb.app
```

If not set, the backend URL defaults to an empty string, which means the app will use relative paths (same origin).

## Available Exports

- `BACKEND_URL` - The backend URL string (primary variable)
- `API_BASE_URL` - Alias for BACKEND_URL (deprecated, use BACKEND_URL)
- `getApiUrl(path)` - Helper function to construct full API URLs
- `isDevelopment` - Boolean indicating if running in development mode

