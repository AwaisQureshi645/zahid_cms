-- ============================================================================
-- FIX: Grant Permissions to Service Role for RLS Bypass
-- ============================================================================
-- Run this SQL script in Supabase SQL Editor to fix the 42501 RLS error
-- This grants the service_role the necessary permissions to bypass RLS
-- ============================================================================

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on all existing tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on all existing sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on all existing functions/routines
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future tables created by postgres role
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Specifically grant permissions on products table (if still having issues)
GRANT ALL ON TABLE public.products TO service_role;
GRANT ALL ON TABLE public.purchase_products TO service_role;
GRANT ALL ON TABLE public.invoices TO service_role;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.company_settings TO service_role;

-- ============================================================================
-- Note: After running this, restart your Flask server and try again
-- ============================================================================

