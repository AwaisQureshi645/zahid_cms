-- ============================================================================
-- SIMPLE USERS TABLE FOR BASIC AUTHENTICATION
-- ============================================================================
-- This creates a simple users table with username, email, and password
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Disable RLS for simple auth (or enable it if you want security)
-- For simple auth, we'll use service_role key which bypasses RLS anyway
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service_role (backend will use this)
-- In production, you might want to restrict this
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

