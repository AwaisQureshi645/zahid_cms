-- ============================================================================
-- IMMEDIATE FIX FOR RLS ERROR 42501
-- ============================================================================
-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE SQL EDITOR
-- ============================================================================

-- Step 1: Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Step 2: Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Step 3: Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Step 4: Grant permissions on functions
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Step 5: Set default privileges for future tables
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Step 6: Explicitly grant on products table
GRANT ALL ON TABLE public.products TO service_role;
GRANT ALL ON TABLE public.invoices TO service_role;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.company_settings TO service_role;

-- ============================================================================
-- AFTER RUNNING THIS:
-- 1. Restart your Flask server (Ctrl+C, then python app.py)
-- 2. Try POST /api/products again
-- ============================================================================

