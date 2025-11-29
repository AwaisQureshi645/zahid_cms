-- ============================================================================
-- COMPLETE SETUP FOR PURCHASE_PRODUCTS TABLE
-- Run this ENTIRE script in Supabase SQL Editor
-- This ensures the table exists and has all necessary permissions
-- ============================================================================

-- Step 1: Create the table (if it doesn't exist)
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

-- Step 2: Enable Row Level Security
ALTER TABLE public.purchase_products ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own purchase products" ON public.purchase_products;
DROP POLICY IF EXISTS "Users can insert own purchase products" ON public.purchase_products;
DROP POLICY IF EXISTS "Users can update own purchase products" ON public.purchase_products;
DROP POLICY IF EXISTS "Users can delete own purchase products" ON public.purchase_products;

-- Step 4: Create RLS Policies (for user-level access)
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

-- Step 5: CRITICAL - Grant permissions to service_role
-- This allows the backend (using service_role key) to bypass RLS
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON TABLE public.purchase_products TO service_role;

-- Step 6: Also grant to anon and authenticated (for completeness)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.purchase_products TO anon, authenticated;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_products_user_id ON public.purchase_products(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_products_item_no ON public.purchase_products(item_no);
CREATE INDEX IF NOT EXISTS idx_purchase_products_category ON public.purchase_products(category);
CREATE INDEX IF NOT EXISTS idx_purchase_products_created_at ON public.purchase_products(created_at DESC);

-- Step 8: Verify the setup (this should return success)
DO $$
BEGIN
    RAISE NOTICE 'Purchase products table setup completed successfully!';
    RAISE NOTICE 'Table exists: %', EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_products'
    );
    RAISE NOTICE 'RLS enabled: %', (
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'purchase_products'
    );
END $$;

-- ============================================================================
-- VERIFICATION QUERY (Run this separately to verify)
-- ============================================================================
-- SELECT 
--     tablename,
--     schemaname,
--     hasindexes,
--     hasrules,
--     hastriggers
-- FROM pg_tables 
-- WHERE tablename = 'purchase_products';

-- ============================================================================
-- IMPORTANT: After running this script:
-- 1. Restart your Flask server
-- 2. Try creating a purchase product again
-- ============================================================================

