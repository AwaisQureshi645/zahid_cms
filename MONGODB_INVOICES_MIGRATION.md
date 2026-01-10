# MongoDB Invoices Migration

## Overview

Invoices are now stored in MongoDB's `invoices` collection instead of SQLite. All invoice data including customer information, product items, and financial details are stored in MongoDB.

## Changes Made

### Backend Changes

1. **Updated `backend/routes/invoices.py`**
   - Removed SQLite/SQLAlchemy dependencies
   - Now uses MongoDB for all invoice operations
   - Stores all invoice data in `invoices` collection

2. **Invoice Data Structure in MongoDB**

The invoice document structure:
```json
{
  "_id": ObjectId("..."),
  "id": "string",  // Added for frontend compatibility
  "invoice_no": "string",
  "user_id": "string",  // Optional, for multi-user support
  "customer_name": "string",
  "customer_phone": "string",
  "customer_vat_id": "string",
  "customer_address": "string",
  "quotation_price": "string",
  "items": [
    {
      "product_id": "string",
      "item_no": "string",
      "item_name": "string",
      "description": "string",
      "unit": "string",
      "quantity": 0,
      "unit_price": 0.0,
      "discount": 0.0,
      "vat_percent": 0.0,
      "total": 0.0,
      "vat_value": 0.0,
      "amount": 0.0
    }
  ],
  "subtotal": 0.0,
  "discount": 0.0,
  "vat_amount": 0.0,
  "total": 0.0,
  "total_amount": 0.0,  // Kept for compatibility
  "currency": "USD",
  "notes": "string",
  "receiver_name": "string",
  "cashier_name": "string",
  "qr_code": "string",  // ZATCA QR code (Base64)
  "created_at": "ISO datetime string",
  "updated_at": "ISO datetime string"
}
```

## Features

### 1. Create Invoice (`POST /api/invoices`)
- Saves all invoice data to MongoDB
- Stores items as array (not JSON string)
- Updates product quantities in inventory
- Generates ZATCA QR code
- Returns complete invoice with `id` field

### 2. List Invoices (`GET /api/invoices`)
- Fetches all invoices from MongoDB
- Orders by creation date (newest first)
- Generates QR codes for invoices that don't have them
- Returns invoices with `id` field for frontend compatibility

### 3. Get Invoice QR (`GET /api/invoices/<invoice_id>/qr`)
- Fetches invoice from MongoDB
- Generates ZATCA QR code
- Returns QR code data

### 4. Delete Invoice (`DELETE /api/invoices/<invoice_id>`)
- Deletes invoice from MongoDB
- Uses ObjectId or string ID

## Data Stored

All invoice information is stored in MongoDB:

### Customer Information
- Customer name
- Customer phone
- Customer VAT ID
- Customer address

### Product/Items Information
- Complete item details (item_no, description, unit, etc.)
- Quantity sold
- Unit price
- Discount
- VAT percentage
- Calculated totals

### Financial Information
- Subtotal
- Discount amount
- VAT amount
- Total amount
- Currency

### Other Information
- Invoice number
- Notes
- Receiver name
- Cashier name
- Quotation price type
- ZATCA QR code
- Timestamps (created_at, updated_at)

## Migration Notes

### Old System (SQLite)
- Used SQLAlchemy models
- Stored items as JSON string
- Integer IDs

### New System (MongoDB)
- Uses MongoDB collections
- Stores items as array
- ObjectId with string `id` field for compatibility

### Compatibility
- Frontend receives `id` field (string) for compatibility
- Items are returned as array (not JSON string)
- All existing fields are preserved

## Testing

1. **Create an invoice:**
   ```bash
   curl -X POST http://localhost:5000/api/invoices \
     -H "Content-Type: application/json" \
     -d '{
       "invoice_no": "INV-001",
       "customer_name": "Test Customer",
       "items": [{"product_id": "...", "quantity": 1, ...}],
       "total_amount": 100.0,
       "subtotal": 100.0,
       "vat_amount": 15.0
     }'
   ```

2. **List invoices:**
   ```bash
   curl http://localhost:5000/api/invoices
   ```

3. **Get invoice QR:**
   ```bash
   curl http://localhost:5000/api/invoices/<invoice_id>/qr
   ```

4. **Delete invoice:**
   ```bash
   curl -X DELETE http://localhost:5000/api/invoices/<invoice_id>
   ```

## Benefits

1. **Centralized Storage:** All data in MongoDB
2. **Better Structure:** Items stored as array (easier to query)
3. **Scalability:** MongoDB handles large datasets better
4. **Consistency:** Same database for all collections
5. **Flexibility:** Easy to add new fields without migrations

## Notes

- Old SQLite invoices are not automatically migrated
- If you need to migrate existing invoices, create a migration script
- The `id` field is automatically added for frontend compatibility
- QR codes are generated on-the-fly if missing

## Summary

✅ Invoices now stored in MongoDB  
✅ All customer information saved  
✅ All product/items information saved  
✅ All financial data saved  
✅ QR codes generated and stored  
✅ Frontend compatibility maintained  

All invoice data is now properly stored in MongoDB's `invoices` collection!
