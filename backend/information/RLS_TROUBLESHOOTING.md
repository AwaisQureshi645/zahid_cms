# RLS (Row Level Security) Troubleshooting Guide

## Issue: "new row violates row-level security policy" Error

If you're getting this error when using the service_role key, follow these steps:

### 1. Verify Your .env File

Make sure your `.env` file in the `backend` directory contains:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important:** 
- Use the **SERVICE_ROLE_KEY** (secret), NOT the anon key
- Get it from: Supabase Dashboard → Project Settings → API → `service_role` key (secret)

### 2. Verify the Key is Correct

The service_role key should:
- Start with `eyJ...` (JWT token)
- Be much longer than the anon key
- Be marked as "secret" in Supabase dashboard
- Never be exposed to frontend/client code

### 3. Restart Your Flask Server

After updating `.env`, restart the Flask server:
```bash
# Stop the server (Ctrl+C)
# Then restart:
python app.py
```

### 4. Run the Updated SQL Schema

Make sure you've run the updated SQL schema (`database_schema_supabase_only.sql`) which includes:
- Fixed RLS policies using `(SELECT auth.uid())` pattern
- Proper DROP POLICY IF EXISTS statements
- Updated triggers and functions

### 5. Test the Service Role Key

You can verify the service_role key works by testing in Supabase SQL Editor:

```sql
-- This should return all products (bypassing RLS)
-- If using service_role key, this should work
SELECT * FROM public.products;
```

### 6. Common Issues

#### Issue: Using Anon Key Instead of Service Role Key
**Symptom:** RLS errors even with correct setup
**Solution:** Double-check you're using `SUPABASE_SERVICE_ROLE_KEY`, not `SUPABASE_ANON_KEY`

#### Issue: Key Not Loaded from .env
**Symptom:** "SUPABASE_SERVICE_ROLE_KEY is not set" error
**Solution:** 
- Verify `.env` file is in `backend/` directory
- Check file name is exactly `.env` (not `.env.txt`)
- Restart Flask server after creating/updating `.env`

#### Issue: User ID Doesn't Exist
**Symptom:** RLS error when inserting with a user_id
**Solution:** 
- Make sure the `user_id` exists in `auth.users` table
- You can check with: `SELECT id FROM auth.users;`
- The user_id must be a valid UUID from your Supabase Auth users

### 7. Verify Environment Variables

Add this to your Flask app temporarily to debug:

```python
# In app.py, add this temporarily:
import os
print("SUPABASE_URL:", os.getenv("SUPABASE_URL"))
print("SUPABASE_SERVICE_ROLE_KEY:", os.getenv("SUPABASE_SERVICE_ROLE_KEY")[:20] + "..." if os.getenv("SUPABASE_SERVICE_ROLE_KEY") else "NOT SET")
```

This will help you verify the environment variables are loaded correctly.

### 8. Expected Behavior

When using service_role key correctly:
- ✅ Should bypass all RLS policies
- ✅ Can insert/update/delete records for any user_id
- ✅ No authentication required from client side
- ✅ Works from backend/server-side code only

### 9. Still Having Issues?

If you're still getting RLS errors:

1. **Check Supabase Dashboard:**
   - Go to Settings → API
   - Verify you copied the correct `service_role` key
   - Make sure it's the secret key (not the anon/public key)

2. **Verify SQL Schema:**
   - Re-run the SQL schema from `database_schema_supabase_only.sql`
   - Check that policies were created correctly

3. **Test Directly:**
   - Try creating a product directly in Supabase SQL Editor using service_role key
   - This helps isolate if it's a code issue or database issue

4. **Check Python Supabase Client Version:**
   ```bash
   pip show supabase
   ```
   Should be version 2.x or higher

### 10. Alternative: Temporarily Disable RLS (For Testing Only)

⚠️ **WARNING:** Only for development/testing! Never do this in production!

```sql
-- TEMPORARY: Disable RLS for testing
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing:
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
```

This helps verify if the issue is with RLS policies or the service_role key configuration.

