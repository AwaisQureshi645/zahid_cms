"""
Excel to Products Table Update Script

This script reads Excel files from the data1 folder and updates the products table
in Supabase. It uses a priority-based matching system:

1. First Priority: Match by Description + user_id
   - If a product with the same description and user_id exists, update it

2. Second Priority: Match by Item_No + user_id
   - If no match by description, check if Item_No + user_id matches
   - If found, update the existing product

3. Third Priority: Insert new record
   - If no match is found by either Description or Item_No, insert as new product

Expected Excel columns:
    - user_id: User ID (UUID)
    - category: Product category
    - Item_No: Item number/identifier
    - Description: Product description
    - Unit: Unit of measurement (e.g., "Piece", "Kg")
    - Quantity: Product quantity
    - Unit_Price: Price per unit
    - Discount: Discount amount
    - VAT_Percent: VAT percentage
    - VAT: VAT amount (calculated field, not stored)
    - Amount: Total amount (calculated field, not stored)

Usage:
    python update_products_from_excel.py [data1_folder_path] [user_id]

Example:
    python update_products_from_excel.py
    python update_products_from_excel.py ../data1
    python update_products_from_excel.py ../data1 123e4567-e89b-12d3-a456-426614174000
"""
import os
import sys
import math
import time
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv
from supabase_client import get_supabase_client

# Load environment variables from multiple locations
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

backend_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=True)

load_dotenv(override=False)


def get_first_user_id(supabase):
    """
    Get the first user_id from the profiles table.
    This is used as a fallback when user_id is not provided.
    
    Args:
        supabase: Supabase client instance
    
    Returns:
        str: First user_id found, or None if no users exist
    """
    try:
        resp = supabase.table("profiles").select("id").limit(1).execute()
        if resp.data and len(resp.data) > 0:
            return resp.data[0]["id"]
    except Exception as e:
        print(f"Error getting user_id: {e}")
    return None


def get_column_value(row, possible_names, default=""):
    """
    Get a column value from a pandas row using case-insensitive matching.
    Handles variations in column names including case differences and extra spaces.
    
    Args:
        row: pandas Series (row from DataFrame)
        possible_names: list of possible column names (e.g., ["Category", "CATEGORY", "category"])
        default: default value if column not found
    
    Returns:
        str: Column value or default
    """
    # First try exact match
    for name in possible_names:
        if name in row.index:
            value = row.get(name, default)
            return str(value).strip() if pd.notna(value) else default
    
    # Try case-insensitive match (also handles spaces)
    row_columns_normalized = {col.strip().lower(): col for col in row.index}
    for name in possible_names:
        normalized_name = name.strip().lower()
        if normalized_name in row_columns_normalized:
            actual_col = row_columns_normalized[normalized_name]
            value = row.get(actual_col, default)
            return str(value).strip() if pd.notna(value) else default
    
    return default


def find_product_by_description(supabase, description, user_id):
    """
    Find a product by description and user_id.
    
    Args:
        supabase: Supabase client instance
        description: Product description to search for
        user_id: User ID to match
    
    Returns:
        dict: Product data if found, None otherwise
    """
    try:
        resp = supabase.table("products").select("*").eq("description", description).eq("user_id", user_id).execute()
        if resp.data and len(resp.data) > 0:
            return resp.data[0]
    except Exception as e:
        print(f"Error finding product by description: {e}")
    return None


def find_product_by_item_no(supabase, item_no, user_id):
    """
    Find a product by item_no and user_id.
    
    Args:
        supabase: Supabase client instance
        item_no: Item number to search for
        user_id: User ID to match
    
    Returns:
        dict: Product data if found, None otherwise
    """
    try:
        resp = supabase.table("products").select("*").eq("item_no", item_no).eq("user_id", user_id).execute()
        if resp.data and len(resp.data) > 0:
            return resp.data[0]
    except Exception as e:
        print(f"Error finding product by item_no: {e}")
    return None


def validate_product_data(product_data):
    """
    Validate and clean product data to ensure all values are valid.
    
    Args:
        product_data: Dictionary with product data
    
    Returns:
        dict: Cleaned product data with valid values
    """
    cleaned_data = {}
    
    for key, value in product_data.items():
        if value is None:
            cleaned_data[key] = None
        elif isinstance(value, (int, float)):
            # Check for NaN or Infinity
            if math.isnan(value) or math.isinf(value):
                print(f"  Warning: Invalid {key} value (NaN/Inf), using 0")
                cleaned_data[key] = 0
            else:
                cleaned_data[key] = value
        elif isinstance(value, str):
            # Ensure string is not empty or just whitespace (except for optional fields)
            if key in ['category'] and not value.strip():
                cleaned_data[key] = None
            else:
                cleaned_data[key] = value.strip() if value else value
        else:
            cleaned_data[key] = value
    
    return cleaned_data


def update_or_insert_product(supabase, product_data, existing_product=None, max_retries=3):
    """
    Update an existing product or insert a new one with retry logic.
    
    Args:
        supabase: Supabase client instance
        product_data: Dictionary with product data to update/insert
        existing_product: Existing product data if found, None otherwise
        max_retries: Maximum number of retry attempts for network errors
    
    Returns:
        bool: True if successful, False otherwise
    """
    # Validate and clean the data
    product_data = validate_product_data(product_data)
    
    # When updating, don't change user_id (it should remain the same)
    if existing_product:
        # Remove user_id from update data as it shouldn't change
        update_data = {k: v for k, v in product_data.items() if k != 'user_id'}
    else:
        update_data = product_data
    
    for attempt in range(max_retries):
        try:
            if existing_product:
                # Update existing product
                product_id = existing_product["id"]
                resp = supabase.table("products").update(update_data).eq("id", product_id).execute()
                if resp.data:
                    return True
                else:
                    print(f"  Warning: Update returned no data for item_no: {product_data.get('item_no')}")
                    return False
            else:
                # Insert new product
                resp = supabase.table("products").insert(update_data).execute()
                if resp.data:
                    return True
                else:
                    print(f"  Warning: Insert returned no data for item_no: {product_data.get('item_no')}")
                    return False
        except Exception as e:
            error_str = str(e)
            # Check if it's a network/connection error (502, 503, 504, or Cloudflare errors)
            is_network_error = (
                '502' in error_str or 
                '503' in error_str or 
                '504' in error_str or 
                'Internal server error' in error_str or
                'Cloudflare' in error_str
            )
            
            if is_network_error and attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                print(f"  Network error (attempt {attempt + 1}/{max_retries}), retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                # Print detailed error information
                print(f"  Error updating/inserting product: {e}")
                print(f"  Product data: {product_data}")
                if existing_product:
                    print(f"  Existing product ID: {existing_product.get('id')}")
                return False
    
    return False


def process_excel_file(excel_path, default_user_id=None):
    """
    Process a single Excel file and update products table.
    
    Args:
        excel_path: Path to the Excel file
        default_user_id: Default user_id to use if not found in Excel
    
    Returns:
        tuple: (success_count, error_count, skipped_count)
    """
    print(f"\n{'='*60}")
    print(f"Processing: {excel_path}")
    print(f"{'='*60}")
    
    # Read Excel file
    try:
        df = pd.read_excel(excel_path)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return (0, 1, 0)
    
    print(f"Found {len(df)} rows in Excel file")
    print(f"Columns: {df.columns.tolist()}")
    
    # Get Supabase client
    try:
        supabase = get_supabase_client()
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return (0, len(df), 0)
    
    # Check if Excel file has user_id column
    excel_has_user_id = any(col.lower() in ["user_id", "user id"] for col in df.columns)
    
    # Get default user_id if not provided
    if not default_user_id:
        if excel_has_user_id:
            # Use user_id from Excel (use first non-null value)
            user_id_col = [col for col in df.columns if col.lower() in ["user_id", "user id"]][0]
            user_ids = df[user_id_col].dropna().unique()
            if len(user_ids) > 0:
                default_user_id = str(user_ids[0]).strip()
                print(f"Using user_id from Excel file: {default_user_id}")
                if len(user_ids) > 1:
                    print(f"Warning: Multiple user_ids found in Excel. Using first one: {default_user_id}")
            else:
                # Try to get from Supabase
                default_user_id = get_first_user_id(supabase)
                if not default_user_id:
                    print("ERROR: No user_id found in Excel or Supabase. Please provide user_id.")
                    return (0, len(df), 0)
                print(f"Using user_id from Supabase: {default_user_id}")
        else:
            # Try to get from Supabase
            default_user_id = get_first_user_id(supabase)
            if not default_user_id:
                print("ERROR: No user_id found. Please create a user first or provide user_id.")
                return (0, len(df), 0)
            print(f"Using user_id from Supabase: {default_user_id}")
    
    # Process each row
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    for idx, row in df.iterrows():
        try:
            # Get user_id for this row
            if excel_has_user_id:
                user_id_col = [col for col in df.columns if col.lower() in ["user_id", "user id"]][0]
                row_user_id = str(row.get(user_id_col, default_user_id)).strip() if pd.notna(row.get(user_id_col)) else default_user_id
            else:
                row_user_id = default_user_id
            
            # Map columns (handle case-insensitive and variations)
            category_value = get_column_value(row, ["category", "Category", "CATEGORY"], "")
            item_no_value = get_column_value(row, ["Item_No", "Item No", "item_no", "ITEM_NO", "ItemNo"], "")
            description_value = get_column_value(row, ["Description", "description", "DESCRIPTION"], "")
            unit_value = get_column_value(row, ["Unit", "unit", "UNIT"], "Piece")
            quantity_value = get_column_value(row, ["Quantity", "quantity", "QUANTITY"], "0")
            unit_price_value = get_column_value(row, ["Unit_Price", "Unit Price", "unit_price", "UNIT_PRICE", "UnitPrice"], "0")
            discount_value = get_column_value(row, ["Discount", "discount", "DISCOUNT"], "0")
            vat_percent_value = get_column_value(row, ["VAT_Percent", "VAT Percent", "vat_percent", "VAT_PERCENT", "VAT%", "VatPercent"], "15")
            
            # Validate required fields
            if not item_no_value or not description_value:
                print(f"Row {idx + 2}: Skipping - missing item_no or description")
                skipped_count += 1
                continue
            
            # Prepare product data with proper type conversion and validation
            try:
                # Convert quantity to int, handling invalid values
                try:
                    qty = float(quantity_value or 0)
                    if math.isnan(qty) or math.isinf(qty):
                        qty = 0
                    quantity = int(qty)
                except (ValueError, TypeError):
                    quantity = 0
                
                # Convert unit_price to float, handling invalid values
                try:
                    up = float(unit_price_value or 0)
                    if math.isnan(up) or math.isinf(up):
                        up = 0.0
                    unit_price = round(up, 2)
                except (ValueError, TypeError):
                    unit_price = 0.0
                
                # Convert discount to float, handling invalid values
                try:
                    disc = float(discount_value or 0)
                    if math.isnan(disc) or math.isinf(disc):
                        disc = 0.0
                    discount = round(disc, 2)
                except (ValueError, TypeError):
                    discount = 0.0
                
                # Convert vat_percent to float, handling invalid values
                try:
                    vat = float(vat_percent_value or 15)
                    if math.isnan(vat) or math.isinf(vat):
                        vat = 15.0
                    vat_percent = round(vat, 2)
                except (ValueError, TypeError):
                    vat_percent = 15.0
                
            except Exception as e:
                print(f"Row {idx + 2}: Error converting numeric values: {e}")
                quantity = 0
                unit_price = 0.0
                discount = 0.0
                vat_percent = 15.0
            
            # Prepare product data
            product_data = {
                "user_id": row_user_id,
                "item_no": item_no_value,
                "description": description_value,
                "category": category_value if category_value else None,
                "unit": unit_value if unit_value else "Piece",
                "quantity": quantity,
                "unit_price": unit_price,
                "discount": discount,
                "vat_percent": vat_percent
            }
            
            # Step 1: First check if Description and user_id match
            existing_product = find_product_by_description(supabase, description_value, row_user_id)
            match_type = None
            
            if existing_product:
                # Found by Description + user_id - update it
                match_type = "description"
            else:
                # Step 2: If not found by Description, check Item_No + user_id
                existing_product = find_product_by_item_no(supabase, item_no_value, row_user_id)
                if existing_product:
                    # Found by Item_No + user_id - update it
                    match_type = "item_no"
                else:
                    # Step 3: Not found by either - will insert new record
                    match_type = "new"
                    existing_product = None
            
            # Update or insert
            if update_or_insert_product(supabase, product_data, existing_product):
                if match_type == "description":
                    action = "Updated (matched by Description)"
                elif match_type == "item_no":
                    action = "Updated (matched by Item_No)"
                else:
                    action = "Inserted (new record)"
                print(f"Row {idx + 2}: {action} - Item_No: {item_no_value}, Description: {description_value[:50]}")
                success_count += 1
            else:
                print(f"Row {idx + 2}: Failed to update/insert - Item_No: {item_no_value}")
                error_count += 1
                
        except Exception as e:
            print(f"Row {idx + 2}: Error processing - {e}")
            error_count += 1
            continue
    
    print(f"\nSummary for {excel_path.name}:")
    print(f"  ✅ Success: {success_count}")
    print(f"  ❌ Errors: {error_count}")
    print(f"  ⏭️  Skipped: {skipped_count}")
    
    return (success_count, error_count, skipped_count)


def main():
    """
    Main entry point for the Excel update script.
    Scans data1 folder for Excel files and processes them.
    """
    # Determine data1 folder path
    if len(sys.argv) > 1:
        data1_folder = Path(sys.argv[1])
    else:
        # Default: look for data1 folder in parent directory
        backend_dir = Path(__file__).parent
        data1_folder = backend_dir.parent / "data1"
    
    # If data1 folder doesn't exist, try current directory
    if not data1_folder.exists():
        data1_folder = Path(__file__).parent / "data1"
    
    # Validate folder exists
    if not data1_folder.exists():
        print(f"ERROR: data1 folder not found: {data1_folder}")
        print(f"Usage: python update_products_from_excel.py [data1_folder_path] [user_id]")
        sys.exit(1)
    
    print(f"Scanning folder: {data1_folder}")
    
    # Find all Excel files
    excel_files = list(data1_folder.glob("*.xlsx")) + list(data1_folder.glob("*.xls"))
    
    if not excel_files:
        print(f"No Excel files found in {data1_folder}")
        sys.exit(1)
    
    print(f"Found {len(excel_files)} Excel file(s)")
    
    # Optional: provide user_id as second command-line argument
    default_user_id = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Process each Excel file
    total_success = 0
    total_errors = 0
    total_skipped = 0
    
    for excel_file in excel_files:
        success, errors, skipped = process_excel_file(excel_file, default_user_id)
        total_success += success
        total_errors += errors
        total_skipped += skipped
    
    # Final summary
    print(f"\n{'='*60}")
    print("FINAL SUMMARY")
    print(f"{'='*60}")
    print(f"Total files processed: {len(excel_files)}")
    print(f"  ✅ Total Success: {total_success}")
    print(f"  ❌ Total Errors: {total_errors}")
    print(f"  ⏭️  Total Skipped: {total_skipped}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

