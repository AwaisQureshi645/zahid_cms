# Database Setup Guide

This invoice system uses **two databases**:
1. **Supabase (PostgreSQL)** - For products, invoices, profiles, and company settings
2. **SQLite (Local)** - For simple invoice storage in Flask backend

## Quick Setup

### For Supabase Database:

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project
   - Go to **SQL Editor**

2. **Run the SQL Script**
   - Open `database_schema_supabase_only.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Tables Created**
   - Go to **Table Editor** in Supabase
   - You should see these tables:
     - `profiles`
     - `products`
     - `invoices`
     - `company_settings`

### For SQLite Database (Flask Backend):

The SQLite database is **automatically created** when you run the Flask app. However, if you want to create it manually:

1. **Option 1: Let Flask create it (Recommended)**
   ```bash
   cd backend
   python app.py
   ```
   Flask will automatically create the `invoices` table.

2. **Option 2: Manual creation**
   - Use SQLite command line or a SQLite browser
   - Run `database_schema_sqlite_only.sql`

## Database Tables Overview

### Supabase Tables:

#### 1. **profiles**
- Stores user profile information
- Links to Supabase Auth users
- Fields: `id`, `full_name`, `email`, `created_at`, `updated_at`

#### 2. **products**
- Stores product/inventory items
- Fields: `id`, `user_id`, `item_no`, `description`, `category`, `unit`, `quantity`, `unit_price`, `discount`, `vat_percent`, `custom_fields`, `image_url`, `created_at`, `updated_at`

#### 3. **invoices** (Supabase)
- Stores invoice data with full details
- Fields: `id`, `user_id`, `invoice_no`, `customer_name`, `customer_phone`, `customer_vat_id`, `customer_address`, `quotation_price`, `items` (JSONB), `subtotal`, `discount`, `vat_amount`, `total`, `notes`, `receiver_name`, `cashier_name`, `created_at`, `updated_at`

#### 4. **company_settings**
- Stores company configuration per user
- Fields: `id`, `user_id`, `company_name_en`, `company_name_ar`, `phone`, `vat_id`, `logo_url`, `address_en`, `address_ar`, `created_at`, `updated_at`

### SQLite Tables:

#### 1. **invoices** (Local Flask)
- Simple invoice storage for Flask backend
- Fields: `id`, `customer_name`, `total_amount`, `currency`, `notes`, `created_at`

## Security Features (Supabase)

All Supabase tables have **Row Level Security (RLS)** enabled:
- Users can only access their own data
- Policies automatically filter by `user_id`
- Secure by default

## Automatic Features

- **Auto Profile Creation**: When a user signs up, a profile is automatically created
- **Auto Timestamps**: `created_at` and `updated_at` are automatically managed
- **Cascade Delete**: When a user is deleted, all their data is automatically removed

## Troubleshooting

### If tables already exist:
- Use `DROP TABLE IF EXISTS` before `CREATE TABLE` if you need to recreate
- Or modify the SQL to use `CREATE TABLE IF NOT EXISTS` (already included)

### If RLS policies fail:
- Make sure you're using the `service_role` key for admin operations
- Check that user authentication is working properly

### If Flask can't create SQLite table:
- Check file permissions in the `backend` directory
- Ensure `DATABASE_URL` is set correctly in `.env`
- Check that Flask-SQLAlchemy is installed: `pip install flask-sqlalchemy`

## Files Included

- `database_schema.sql` - Complete documentation with both versions
- `database_schema_supabase_only.sql` - Ready-to-use Supabase SQL
- `database_schema_sqlite_only.sql` - SQLite SQL for local backend

