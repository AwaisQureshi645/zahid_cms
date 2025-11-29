"""
Purchase product routes for managing purchase products.
All purchase product operations interact with Supabase database.
"""
from flask import Blueprint, request, jsonify
from supabase_client import get_supabase_client

# Create a Blueprint for purchase product routes
purchase_products_bp = Blueprint('purchase_products', __name__)


def get_supabase():
    """
    Lazy initialization of Supabase client.
    This function is injected into the blueprint context.
    """
    try:
        return get_supabase_client()
    except RuntimeError as e:
        raise RuntimeError(f"Supabase configuration error: {str(e)}. Please check your .env file.")


@purchase_products_bp.get("/api/purchase-products")
def list_purchase_products():
    """
    Get all purchase products from the database.
    Returns all purchase products shared across all users, ordered by creation date (newest first).
    
    Returns:
        JSON array of purchase product objects
    """
    try:
        supabase_client = get_supabase()
        resp = supabase_client.table("purchase_products").select("*").order("created_at", desc=True).execute()
        return jsonify(resp.data or [])
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        error_msg = str(e)
        # Check if it's an RLS (Row Level Security) error
        if "row-level security" in error_msg.lower() or "42501" in error_msg:
            return jsonify({
                "error": "Permission denied. Please ensure you're using the correct service_role key.",
                "details": error_msg
            }), 403
        return jsonify({"error": f"Failed to fetch purchase products: {error_msg}"}), 500


@purchase_products_bp.post("/api/purchase-products")
def create_purchase_product():
    """
    Create a new purchase product in the database.
    
    Required fields:
        - user_id: UUID of the user creating the purchase product
        - item_no: Item number/identifier
        - description: Purchase product description
        - unit: Unit of measurement (e.g., "Piece", "Kg")
        - quantity: Initial quantity
        - unit_price: Price per unit
    
    Optional fields:
        - item_name: Name of the item
        - category: Purchase product category
        - discount: Discount amount
        - vat_percent: VAT percentage
    
    Returns:
        Created purchase product object with 201 status code
    """
    data = request.get_json(force=True) or {}
    
    # Validate required fields
    required = ["user_id", "item_no", "description", "unit", "quantity", "unit_price"]
    missing = [k for k in required if data.get(k) in (None, "")]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
    
    try:
        supabase_client = get_supabase()
        record = {
            "user_id": data["user_id"],
            "item_no": data["item_no"],
            "item_name": data.get("item_name") or "",
            "description": data["description"],
            "category": data.get("category") or "",
            "unit": data["unit"],
            "quantity": int(data.get("quantity", 0)),
            "unit_price": float(data.get("unit_price", 0)),
            "discount": float(data.get("discount", 0) or 0),
            "vat_percent": float(data.get("vat_percent", 0) or 0),
        }
        resp = supabase_client.table("purchase_products").insert(record).execute()
        
        if resp.data:
            return jsonify(resp.data[0]), 201
        # If no data returned, check if it's an error response
        if hasattr(resp, 'error') and resp.error:
            error_details = str(resp.error)
            # Check if it's an RLS error in the response
            if "row-level security" in error_details.lower() or "42501" in error_details or "permission denied" in error_details.lower():
                return jsonify({
                    "error": "Permission denied. Please ensure the purchase_products table exists and has proper permissions.",
                    "details": error_details,
                    "solution": "Run the SQL script: backend/display_file/COMPLETE_PURCHASE_PRODUCTS_SETUP.sql"
                }), 403
            return jsonify({"error": str(resp.error)}), 500
        return jsonify({"error": f"Insert failed: {str(resp)}"}), 500
        
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        error_msg = str(e)
        # Check if it's an RLS (Row Level Security) error
        if "row-level security" in error_msg.lower() or "42501" in error_msg or "permission denied" in error_msg.lower():
            return jsonify({
                "error": "Permission denied. Please ensure the purchase_products table exists and has proper permissions.",
                "details": error_msg,
                "solution": "Run the SQL script: backend/display_file/COMPLETE_PURCHASE_PRODUCTS_SETUP.sql"
            }), 403
        # Return detailed error for debugging
        import traceback
        return jsonify({
            "error": f"Failed to create purchase product: {error_msg}",
            "details": traceback.format_exc() if hasattr(traceback, 'format_exc') else str(e),
            "solution": "Check the error details above and ensure the purchase_products table exists"
        }), 500


@purchase_products_bp.put("/api/purchase-products/<product_id>")
def update_purchase_product(product_id: str):
    """
    Update an existing purchase product by ID.
    
    Args:
        product_id: UUID of the purchase product to update
    
    Allowed fields to update:
        - item_no, item_name, description, category
        - unit, quantity, unit_price, discount, vat_percent
    
    Returns:
        Updated purchase product object
    """
    data = request.get_json(force=True) or {}
    
    # Only allow specific fields to be updated
    allowed = {
        "item_no", "item_name", "description", "category",
        "unit", "quantity", "unit_price", "discount", "vat_percent"
    }
    update = {k: data[k] for k in allowed if k in data}
    
    # Coerce numeric fields to proper types
    for k in ("unit_price", "discount", "vat_percent"):
        if k in update and update[k] is not None:
            update[k] = float(update[k])
    
    # Quantity must be integer, not float
    if "quantity" in update and update["quantity"] is not None:
        update["quantity"] = int(update["quantity"])
    
    try:
        supabase_client = get_supabase()
        resp = supabase_client.table("purchase_products").update(update).eq("id", product_id).execute()
        
        if resp.data:
            return jsonify(resp.data[0])
        return jsonify({"error": "Update failed"}), 500
        
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        error_msg = str(e)
        if "row-level security" in error_msg.lower() or "42501" in error_msg:
            return jsonify({
                "error": "Permission denied. Please ensure you're using the correct service_role key.",
                "details": error_msg
            }), 403
        return jsonify({"error": f"Failed to update purchase product: {error_msg}"}), 500


@purchase_products_bp.delete("/api/purchase-products/<product_id>")
def delete_purchase_product(product_id: str):
    """
    Delete a purchase product by ID.
    
    Args:
        product_id: UUID of the purchase product to delete
    
    Returns:
        Empty response with 204 status code on success
    """
    try:
        supabase_client = get_supabase()
        resp = supabase_client.table("purchase_products").delete().eq("id", product_id).execute()
        
        return ("", 204) if resp.data is not None else (jsonify({"error": "Delete failed"}), 500)
        
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        error_msg = str(e)
        if "row-level security" in error_msg.lower() or "42501" in error_msg:
            return jsonify({
                "error": "Permission denied. Please ensure you're using the correct service_role key.",
                "details": error_msg
            }), 403
        return jsonify({"error": f"Failed to delete purchase product: {error_msg}"}), 500

