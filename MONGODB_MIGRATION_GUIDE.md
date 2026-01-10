# MongoDB Migration Guide

This guide explains how to migrate from Supabase to MongoDB for your POS system.

## Overview

The application has been migrated from Supabase (PostgreSQL) to MongoDB. All database operations now use MongoDB instead of Supabase.

## Changes Made

### Backend Changes

1. **New MongoDB Client** (`backend/mongodb_client.py`)
   - Replaces `backend/supabase_client.py`
   - Handles MongoDB connection and database operations

2. **Updated Routes**
   - `backend/routes/products.py` - Now uses MongoDB
   - `backend/routes/purchase_products.py` - Now uses MongoDB
   - `backend/routes/auth.py` - Now uses MongoDB
   - `backend/routes/invoices.py` - Product quantity updates now use MongoDB
   - `backend/routes/company_settings.py` - New route for company settings

3. **Updated Scripts**
   - `backend/push_data.py` - Updated to use MongoDB
   - `backend/push_update_data.py` - Updated to use MongoDB

4. **Dependencies**
   - Added `pymongo==4.10.1` to `requirements.txt`
   - Removed `supabase==2.6.0` from `requirements.txt`

### Frontend Changes

1. **Removed Direct Supabase Queries**
   - `src/pages/CreateInvoice.tsx` - Now uses API calls
   - `src/pages/Reports.tsx` - Now uses API calls
   - `src/pages/Settings.tsx` - Now uses API calls

2. **API Integration**
   - All frontend components now use the API client (`src/lib/api.ts`)
   - No direct database access from frontend

## Setup Instructions

### 1. Install MongoDB Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install `pymongo` which is required for MongoDB operations.

### 2. Set Environment Variables

Create or update your `.env` file in the backend directory (or project root) with:

```env
MONGODB_URI=mongodb+srv://awais:!Awais@123@possystem.psyxhcw.mongodb.net/?appName=PosSystem
MONGODB_DB_NAME=possystem
```

**Important Notes:**
- The MongoDB connection string contains special characters in the password (`!Awais@123`)
- If you encounter connection issues, you may need to URL-encode the password:
  - `!` becomes `%21`
  - `@` becomes `%40`
  - So the encoded URI would be: `mongodb+srv://awais:%21Awais%40123@possystem.psyxhcw.mongodb.net/?appName=PosSystem`

### 3. Database Collections

MongoDB uses collections instead of tables. The following collections will be created automatically when you first insert data:

- `products` - Product inventory
- `purchase_products` - Purchase products
- `users` - User accounts
- `company_settings` - Company settings
- `invoices` - Still stored in SQLite (local database)

### 4. Data Migration (Optional)

If you have existing data in Supabase that you want to migrate:

1. Export data from Supabase tables
2. Use the import scripts (`push_data.py`, `push_update_data.py`) to import into MongoDB
3. Or manually insert data using MongoDB Compass or MongoDB shell

### 5. Test the Connection

You can test the MongoDB connection by:

1. Starting the Flask backend:
   ```bash
   cd backend
   python app.py
   ```

2. Check the health endpoint:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. Try creating a product through the API or frontend

## MongoDB Collections Structure

### products
```json
{
  "_id": ObjectId("..."),
  "id": "uuid-string",  // Optional, for compatibility
  "user_id": "uuid-string",
  "item_no": "string",
  "item_name": "string",
  "description": "string",
  "category": "string",
  "unit": "string",
  "quantity": 0,
  "unit_price": 0.0,
  "discount": 0.0,
  "vat_percent": 0.0,
  "created_at": "ISO datetime string",
  "updated_at": "ISO datetime string"
}
```

### purchase_products
Same structure as `products`

### users
```json
{
  "_id": ObjectId("..."),
  "id": "uuid-string",
  "username": "string",
  "email": "string",
  "password": "hashed string",
  "created_at": "ISO datetime string",
  "updated_at": "ISO datetime string"
}
```

### company_settings
```json
{
  "_id": ObjectId("..."),
  "user_id": "uuid-string",
  "company_name_en": "string",
  "company_name_ar": "string",
  "phone": "string",
  "vat_id": "string",
  "address_en": "string",
  "address_ar": "string",
  "created_at": "ISO datetime string",
  "updated_at": "ISO datetime string"
}
```

## Troubleshooting

### Connection Issues

1. **Check MongoDB URI**
   - Ensure the connection string is correct
   - Verify network access to MongoDB Atlas
   - Check if IP address is whitelisted in MongoDB Atlas

2. **Password Encoding**
   - If password contains special characters, URL-encode them
   - Common encodings: `!` → `%21`, `@` → `%40`, `#` → `%23`

3. **Database Name**
   - Default database name is `possystem`
   - Can be changed via `MONGODB_DB_NAME` environment variable

### Data Issues

1. **ObjectId vs String IDs**
   - MongoDB uses ObjectId internally
   - The API converts ObjectId to string for JSON responses
   - When querying by ID, the code handles both ObjectId and string formats

2. **Missing Collections**
   - Collections are created automatically on first insert
   - No need to create them manually

## Differences from Supabase

1. **No Row Level Security (RLS)**
   - MongoDB doesn't have RLS like Supabase
   - All security is handled at the application level

2. **No Real-time Subscriptions**
   - MongoDB doesn't have built-in real-time features like Supabase
   - Frontend uses polling or manual refresh

3. **Schema Flexibility**
   - MongoDB is schema-less
   - Documents can have different structures
   - The application enforces structure at the code level

4. **Query Syntax**
   - MongoDB uses different query syntax than SQL
   - All queries are now MongoDB queries

## Next Steps

1. Set up environment variables
2. Install dependencies
3. Test the connection
4. Migrate existing data (if any)
5. Test all features:
   - User authentication
   - Product management
   - Invoice creation
   - Reports

## Support

If you encounter any issues:
1. Check MongoDB Atlas dashboard for connection status
2. Review backend logs for error messages
3. Verify environment variables are set correctly
4. Test MongoDB connection using MongoDB Compass or MongoDB shell
