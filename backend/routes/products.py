"""
Product routes for managing inventory products.
All product operations interact with Supabase database.
"""
from flask import Blueprint, request, jsonify
from supabase_client import get_supabase_client

# Create a Blueprint for product routes
products_bp = Blueprint('products', __name__)


def get_supabase():
    """
    Lazy initialization of Supabase client.
    This function is injected into the blueprint context.
    """
    try:
        return get_supabase_client()
    except RuntimeError as e:
        raise RuntimeError(f"Supabase configuration error: {str(e)}. Please check your .env file.")


@products_bp.get("/api/products")
def list_products():
    """
    Get all products from the database.
    Returns all products shared across all users, ordered by creation date (newest first).
    
    Returns:
        JSON array of product objects
    """
    try:
        supabase_client = get_supabase()
        resp = supabase_client.table("products").select("*").order("created_at", desc=True).execute()
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
        return jsonify({"error": f"Failed to fetch products: {error_msg}"}), 500


@products_bp.post("/api/products")
def create_product():
    """
    Create a new product in the database.
    
    Required fields:
        - user_id: UUID of the user creating the product
        - item_no: Item number/identifier
        - description: Product description
        - unit: Unit of measurement (e.g., "Piece", "Kg")
        - quantity: Initial quantity
        - unit_price: Price per unit
    
    Optional fields:
        - item_name: Name of the item
        - category: Product category
        - discount: Discount amount
        - vat_percent: VAT percentage
    
    Returns:
        Created product object with 201 status code
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
        resp = supabase_client.table("products").insert(record).execute()
        
        if resp.data:
            return jsonify(resp.data[0]), 201
        return jsonify({"error": str(resp)}), 500
        
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        error_msg = str(e)
        # Check if it's an RLS (Row Level Security) error
        if "row-level security" in error_msg.lower() or "42501" in error_msg:
            return jsonify({
                "error": "Permission denied. Please ensure you're using the correct service_role key and that the user_id exists in auth.users table.",
                "details": error_msg
            }), 403
        return jsonify({"error": f"Failed to create product: {error_msg}"}), 500


@products_bp.put("/api/products/<product_id>")
def update_product(product_id: str):
    """
    Update an existing product by ID.
    
    Args:
        product_id: UUID of the product to update
    
    Allowed fields to update:
        - item_no, item_name, description, category
        - unit, quantity, unit_price, discount, vat_percent
    
    Returns:
        Updated product object
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
        resp = supabase_client.table("products").update(update).eq("id", product_id).execute()
        
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
        return jsonify({"error": f"Failed to update product: {error_msg}"}), 500


@products_bp.delete("/api/products/<product_id>")
def delete_product(product_id: str):
    """
    Delete a product by ID.
    
    Args:
        product_id: UUID of the product to delete
    
    Returns:
        Empty response with 204 status code on success
    """
    try:
        supabase_client = get_supabase()
        resp = supabase_client.table("products").delete().eq("id", product_id).execute()
        
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
        return jsonify({"error": f"Failed to delete product: {error_msg}"}), 500

