-- Migration to add item_name field to products table
-- Run this in Supabase SQL Editor

-- Add item_name column if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS item_name TEXT;

-- Update existing records to use item_no as item_name if item_name is null
UPDATE public.products 
SET item_name = item_no 
WHERE item_name IS NULL;

