-- ============================================================================
-- FIX: All Tables RLS Configuration
-- ============================================================================
-- This script fixes RLS issues for both products and purchase_products tables
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- FIX PRODUCTS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "All authenticated users can delete products" ON public.products;
DROP POLICY IF EXISTS "All authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "All authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "All authenticated users can view all products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own products" ON public.products;
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

-- Create clean RLS policies
CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own products"
  ON public.products FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Grant service_role permissions (bypasses RLS)
GRANT ALL ON TABLE public.products TO service_role;

-- ============================================================================
-- FIX PURCHASE_PRODUCTS TABLE
-- ============================================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.purchase_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_no TEXT NOT NULL,
  item_name TEXT,
  description TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'Piece',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  vat_percent DECIMAL(5,2) DEFAULT 15,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.purchase_products ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "All authenticated users can delete purchase products" ON public.purchase_products;
DROP POLICY IF EXISTS "All authenticated users can insert purchase products" ON public.purchase_products;
DROP POLICY IF EXISTS "All authenticated users can update purchase products" ON public.purchase_products;
DROP POLICY IF EXISTS "All authenticated users can view all purchase products" ON public.purchase_products;
DROP POLICY IF EXISTS "Users can view own purchase products" ON public.purchase_products;
DROP POLICY IF EXISTS "Users can insert own purchase products" ON public.purchase_products;
DROP POLICY IF EXISTS "Users can update own purchase products" ON public.purchase_products;
DROP POLICY IF EXISTS "Users can delete own purchase products" ON public.purchase_products;

-- Create clean RLS policies
CREATE POLICY "Users can view own purchase products"
  ON public.purchase_products FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own purchase products"
  ON public.purchase_products FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own purchase products"
  ON public.purchase_products FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own purchase products"
  ON public.purchase_products FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Grant service_role permissions (bypasses RLS)
GRANT ALL ON TABLE public.purchase_products TO service_role;

-- ============================================================================
-- GRANT SCHEMA PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_item_no ON public.products(item_no);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Purchase products indexes
CREATE INDEX IF NOT EXISTS idx_purchase_products_user_id ON public.purchase_products(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_products_item_no ON public.purchase_products(item_no);
CREATE INDEX IF NOT EXISTS idx_purchase_products_category ON public.purchase_products(category);
CREATE INDEX IF NOT EXISTS idx_purchase_products_created_at ON public.purchase_products(created_at DESC);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== RLS Configuration Status ===';
    RAISE NOTICE 'Products RLS enabled: %', (
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'products'
    );
    RAISE NOTICE 'Products policies count: %', (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE tablename = 'products'
    );
    RAISE NOTICE 'Purchase_products RLS enabled: %', (
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'purchase_products'
    );
    RAISE NOTICE 'Purchase_products policies count: %', (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE tablename = 'purchase_products'
    );
    RAISE NOTICE '=== Setup Complete ===';
END $$;

-- ============================================================================
-- IMPORTANT: After running this script:
-- 1. Restart your Flask server
-- 2. Try inserting products and purchase_products again
-- ============================================================================

