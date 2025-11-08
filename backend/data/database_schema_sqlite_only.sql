-- ============================================================================
-- SQLITE DATABASE SCHEMA - For Local Flask Backend
-- ============================================================================
-- ⚠️  IMPORTANT: This file is ONLY for SQLite databases!
-- 
-- DO NOT run this in Supabase/PostgreSQL - it will cause syntax errors!
-- 
-- This is for the local SQLite database used by Flask-SQLAlchemy
-- Note: The products table is managed through Supabase, not SQLite
-- 
-- To use this file:
-- 1. Open your SQLite database (e.g., app.db in backend folder)
-- 2. Copy and paste this file
-- 3. Or let Flask create it automatically when you run app.py
-- ============================================================================

-- ----------------------------------------------------------------------------
-- INVOICES TABLE
-- ----------------------------------------------------------------------------
-- This table is used by the Flask backend for invoice storage
-- It's automatically created by Flask-SQLAlchemy, but you can use this
-- SQL to create it manually if needed

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name VARCHAR(255) NOT NULL,
  total_amount REAL NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. The Flask app automatically creates this table when you run it
-- 2. If you want to create it manually, run this SQL in your SQLite database
-- 3. The products table is NOT stored in SQLite - it's managed by Supabase
-- 4. Make sure your Flask app has DATABASE_URL configured in .env file
-- ============================================================================

