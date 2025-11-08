# Excel Import Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Make sure your `.env` file has Supabase credentials:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Run the import script:**
   ```bash
   python import_excel.py
   ```

   Or specify a custom Excel file:
   ```bash
   python import_excel.py "path/to/your/file.xlsx"
   ```

   Or specify a user_id:
   ```bash
   python import_excel.py "path/to/your/file.xlsx" "user-uuid-here"
   ```

## Excel File Format

Your Excel file should have these columns:
- `user_id` (optional - can be in Excel or will use first user from Supabase)
- `Category` (optional)
- `Item Name` (optional)
- `Item_No` (required)
- `Description` (required)
- `Unit` (default: "Piece")
- `Quantity` (default: 0)
- `Unit_Price` (required)
- `Discount` (default: 0)
- `VAT_Percent` (default: 15)

## What the Script Does

1. Reads the Excel file from `backend/data/` folder (or specified path)
2. Maps Excel columns to database fields
3. Gets user_id from Excel file (if present) or first user from Supabase profiles
4. Inserts products in batches of 100
5. Shows progress and any errors

## Notes

- The script automatically uses the `user_id` from your Excel file if present
- If no `user_id` in Excel, it uses the first user from your Supabase profiles
- Invalid rows (missing item_no or description) are skipped
- Products are inserted in batches for better performance
- If a batch fails, it tries inserting items one by one

