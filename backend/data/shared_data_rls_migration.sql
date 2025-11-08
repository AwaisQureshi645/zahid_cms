-- ============================================================================
-- MIGRATION: Enable Shared Data Access for All Users
-- ============================================================================
-- This migration updates Row Level Security (RLS) policies to allow all
-- authenticated users to access and modify shared data (products, invoices, 
-- company_settings) instead of user-specific data isolation.
--
-- IMPORTANT: Run this in Supabase SQL Editor after deploying code changes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PRODUCTS TABLE - Allow all authenticated users to access all products
-- ----------------------------------------------------------------------------

-- Drop existing user-specific policies
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

-- Create new shared access policies
CREATE POLICY "All authenticated users can view all products"
  ON public.products FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert products"
  ON public.products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update products"
  ON public.products FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete products"
  ON public.products FOR DELETE
  USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 2. INVOICES TABLE - Allow all authenticated users to access all invoices
-- ----------------------------------------------------------------------------

-- Drop existing user-specific policies
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;

-- Create new shared access policies
CREATE POLICY "All authenticated users can view all invoices"
  ON public.invoices FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update invoices"
  ON public.invoices FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete invoices"
  ON public.invoices FOR DELETE
  USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 3. COMPANY_SETTINGS TABLE - Allow all authenticated users to access shared settings
-- ----------------------------------------------------------------------------

-- Drop existing user-specific policies
DROP POLICY IF EXISTS "Users can view own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can delete own company settings" ON public.company_settings;

-- Create new shared access policies
CREATE POLICY "All authenticated users can view company settings"
  ON public.company_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert company settings"
  ON public.company_settings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update company settings"
  ON public.company_settings FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete company settings"
  ON public.company_settings FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- After running this migration:
-- 1. All authenticated users will be able to see all products, invoices, and settings
-- 2. All authenticated users will be able to create, update, and delete shared data
-- 3. The user_id field will still be stored for tracking/auditing purposes
-- ============================================================================

