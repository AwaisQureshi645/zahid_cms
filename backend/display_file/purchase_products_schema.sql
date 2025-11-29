-- ----------------------------------------------------------------------------
-- PURCHASE_PRODUCTS TABLE (Purchases Management)
-- This table stores purchase product information similar to products table
-- ----------------------------------------------------------------------------
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

ALTER TABLE public.purchase_products ENABLE ROW LEVEL SECURITY;

-- Purchase Products RLS Policies
DROP POLICY IF EXISTS "Users can view own purchase products" ON public.purchase_products;
CREATE POLICY "Users can view own purchase products"
  ON public.purchase_products FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own purchase products" ON public.purchase_products;
CREATE POLICY "Users can insert own purchase products"
  ON public.purchase_products FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own purchase products" ON public.purchase_products;
CREATE POLICY "Users can update own purchase products"
  ON public.purchase_products FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own purchase products" ON public.purchase_products;
CREATE POLICY "Users can delete own purchase products"
  ON public.purchase_products FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Grant permissions to service_role (this allows backend to bypass RLS)
GRANT ALL ON TABLE public.purchase_products TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_products_user_id ON public.purchase_products(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_products_item_no ON public.purchase_products(item_no);
CREATE INDEX IF NOT EXISTS idx_purchase_products_category ON public.purchase_products(category);
CREATE INDEX IF NOT EXISTS idx_purchase_products_created_at ON public.purchase_products(created_at DESC);

