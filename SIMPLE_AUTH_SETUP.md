# Simple Authentication Setup Guide

This application now uses a simple authentication system instead of Supabase Auth.

## What Changed

1. **Removed Complex Token Refresh**: No more 429 errors or automatic token refresh
2. **Simple User Storage**: Users stored in a simple `users` table with username, email, and password
3. **LocalStorage Session**: User session stored in browser localStorage
4. **Simple API Endpoints**: Register and login endpoints in the backend

## Setup Instructions

### 1. Create Users Table in Supabase

Run the SQL script in Supabase SQL Editor:

**File**: `backend/display_file/create_users_table.sql`

Or run this SQL directly in Supabase:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 2. Backend API Endpoints

The backend now has two new endpoints:

- **POST `/api/auth/register`**: Register a new user
  - Body: `{ "username": "...", "email": "...", "password": "..." }`
  - Returns: `{ "user": {...}, "message": "..." }`

- **POST `/api/auth/login`**: Login a user
  - Body: `{ "email": "...", "password": "..." }`
  - Returns: `{ "user": {...}, "token": "...", "message": "..." }`

### 3. Frontend Changes

- **AuthContext**: Now uses localStorage instead of Supabase Auth
- **Auth.tsx**: Registration form uses username instead of fullName
- **After Registration**: User is redirected to login page (not dashboard)
- **Session Storage**: User data stored in localStorage with key `auth_user`

## How It Works

### Registration Flow:
1. User enters username, email, and password
2. Backend hashes password (SHA-256) and stores in `users` table
3. User is redirected to login page
4. User can then login with email and password

### Login Flow:
1. User enters email and password
2. Backend verifies password against stored hash
3. If valid, user data is stored in localStorage
4. User is redirected to dashboard

### Session Management:
- User data stored in `localStorage` with key `auth_user`
- Token stored in `localStorage` with key `auth_token`
- On page reload, user is automatically loaded from localStorage
- Sign out clears localStorage

## Security Notes

⚠️ **Important**: This is a simple authentication system using SHA-256 hashing. For production use, consider:

1. **Password Hashing**: Upgrade to bcrypt or argon2 for better security
2. **JWT Tokens**: Use proper JWT tokens instead of simple random tokens
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Add rate limiting to login/register endpoints
5. **Password Requirements**: Enforce strong password requirements

## Testing

1. **Register a new user**:
   - Go to `/auth` page
   - Click "Sign Up" tab
   - Enter username, email, and password
   - Click "Create Account"
   - You should be redirected to login page

2. **Login**:
   - Enter email and password
   - Click "Sign In"
   - You should be redirected to dashboard

3. **Session Persistence**:
   - Login and refresh the page
   - You should remain logged in

4. **Sign Out**:
   - Click sign out button
   - You should be logged out and redirected

## Troubleshooting

### "Email already registered" error:
- The email is already in the database
- Try a different email or login instead

### "Invalid email or password" error:
- Check that email and password are correct
- Make sure you registered first

### User not persisting after refresh:
- Check browser localStorage
- Make sure localStorage is enabled
- Check browser console for errors

## Files Modified

- `backend/routes/auth.py` - New authentication routes
- `backend/app.py` - Registered auth blueprint
- `src/contexts/AuthContext.tsx` - Simplified to use localStorage
- `src/pages/Auth.tsx` - Updated to use username instead of fullName
- `src/lib/supabase.ts` - Removed all token refresh logic
- `backend/display_file/create_users_table.sql` - SQL script for users table

