-- ============================================================================
-- FIX: Products Table RLS Configuration Issue
-- ============================================================================
-- Problem: Table has RLS policies but RLS is not enabled
-- Solution: Enable RLS and ensure proper policies, OR disable RLS if using service_role
-- ============================================================================

-- Option 1: Enable RLS and set up proper policies (RECOMMENDED)
-- This allows both user-level access (via policies) and service_role bypass

-- Step 1: Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing conflicting policies
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

-- Step 3: Create clean, simple RLS policies (for user-level access)
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

-- Step 4: CRITICAL - Grant permissions to service_role (bypasses RLS)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON TABLE public.products TO service_role;

-- Step 5: Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Products table RLS status: %', (
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'products'
    );
    RAISE NOTICE 'Number of policies: %', (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE tablename = 'products'
    );
END $$;

-- ============================================================================
-- ALTERNATIVE: If you want to disable RLS completely (NOT RECOMMENDED)
-- Only use this if you're 100% sure you only want service_role access
-- ============================================================================
-- Uncomment the lines below if you want to disable RLS:

-- ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "All authenticated users can delete products" ON public.products;
-- DROP POLICY IF EXISTS "All authenticated users can insert products" ON public.products;
-- DROP POLICY IF EXISTS "All authenticated users can update products" ON public.products;
-- DROP POLICY IF EXISTS "All authenticated users can view all products" ON public.products;
-- DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.products;
-- DROP POLICY IF EXISTS "Allow authenticated users to insert their own products" ON public.products;
-- DROP POLICY IF EXISTS "Users can view own products" ON public.products;
-- DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
-- DROP POLICY IF EXISTS "Users can update own products" ON public.products;
-- DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
-- GRANT ALL ON TABLE public.products TO service_role;

-- ============================================================================
-- IMPORTANT: After running this script:
-- 1. Restart your Flask server
-- 2. Try inserting a product again
-- ============================================================================

