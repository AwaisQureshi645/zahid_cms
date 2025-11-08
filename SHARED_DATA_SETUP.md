# Shared Data Access Implementation

## Overview
This update modifies the application to allow all authenticated users to share and access the same data (products, invoices, and company settings) instead of having user-specific data isolation.

## Changes Made

### Frontend Changes
1. **Invoices.tsx** - Removed `user_id` filter from invoice queries and delete operations
2. **Reports.tsx** - Removed `user_id` filters from invoice and product queries
3. **CreateInvoice.tsx** - Removed `user_id` filter from product queries
4. **Inventory.tsx** - Updated to fetch all products without `user_id` filter
5. **Settings.tsx** - Updated to use shared company settings (first record) instead of per-user settings

### Backend Changes
1. **app.py** - Updated `/api/products` GET endpoint to return all products without requiring `user_id` parameter

### Database Migration
Created `backend/shared_data_rls_migration.sql` - SQL script to update Row Level Security (RLS) policies

## Important: Database Migration Required

**You MUST run the SQL migration in Supabase for this to work!**

### Steps to Apply Migration:

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project
   - Go to **SQL Editor**

2. **Run the Migration Script**
   - Open the file: `backend/shared_data_rls_migration.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Migration**
   - After running, all authenticated users should be able to:
     - See all products, invoices, and company settings
     - Create, update, and delete shared data
     - Access data created by any user

## How It Works Now

### Before (User-Specific Data):
- Each user could only see their own products, invoices, and settings
- Data was isolated per user

### After (Shared Data):
- All authenticated users see the same products, invoices, and company settings
- Any user can create, update, or delete shared data
- The `user_id` field is still stored for tracking/auditing purposes, but doesn't restrict access

## Notes

- **Company Settings**: The system now uses the first company settings record as shared settings. If no settings exist, the first user to save will create them, and all subsequent users will update the same record.

- **Data Tracking**: The `user_id` field is still populated when creating records, so you can track who created what, but it no longer restricts visibility.

- **Security**: Only authenticated users can access the data. Unauthenticated users still cannot access anything.

## Testing

After applying the migration:
1. Log in as User A and create some products/invoices
2. Log out and log in as User B
3. User B should now see all the data created by User A
4. User B should be able to create, update, and delete shared data

## Troubleshooting

If users still can't see shared data after running the migration:
1. Check that the migration ran successfully in Supabase SQL Editor
2. Verify that RLS policies were updated (check Table Editor → Policies)
3. Clear browser cache and refresh
4. Check browser console for any RLS-related errors

