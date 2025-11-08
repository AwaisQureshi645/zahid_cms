# HOW TO FIX RLS ERROR 42501 - Step by Step Guide

## Problem
Even with service_role key, you're getting: `new row violates row-level security policy`

## Root Cause
The `service_role` role doesn't have proper GRANT permissions on the `public` schema.

## Solution (2 Steps)

### Step 1: Run This SQL in Supabase SQL Editor

Go to: **Supabase Dashboard → SQL Editor** and run:

```sql
-- Grant schema usage permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on all existing tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on all existing sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on all existing functions/routines
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Specifically grant on products table
GRANT ALL ON TABLE public.products TO service_role;
GRANT ALL ON TABLE public.invoices TO service_role;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.company_settings TO service_role;
```

### Step 2: Verify Your .env File

Make sure your `backend/.env` file has:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key-here
```

**Important:**
- Use the **service_role** key (secret), NOT the anon key
- Get it from: Supabase Dashboard → Settings → API → `service_role` key (secret)
- The key should be long (200+ characters) and start with `eyJ`

### Step 3: Restart Flask Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
python app.py
```

### Step 4: Test Again

Try creating a product again via Postman. It should work now!

## If Still Not Working

1. **Check the debug endpoint:**
   ```
   GET http://localhost:5000/api/debug/supabase-config
   ```
   This will show if your key is loaded correctly.

2. **Verify key format:**
   - Service role key should start with `eyJ`
   - Should be very long (200+ characters)
   - Should be marked as "secret" in Supabase dashboard

3. **Double-check SQL:**
   - Make sure you ran ALL the GRANT statements above
   - Check that tables exist: `SELECT * FROM public.products LIMIT 1;`

## Quick Test SQL

Run this to verify permissions:
```sql
-- Check if service_role has permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'products' AND grantee = 'service_role';
```

If you see results, permissions are set correctly!

