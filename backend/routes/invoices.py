"""
Invoice routes for managing invoices.
All invoice operations interact with local SQLite database.
"""
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from database import db
from models import Invoice
from supabase_client import get_supabase_client
from zatca_qr import generate_zatca_qr, format_amount, format_datetime
from datetime import datetime
import json

# Create a Blueprint for invoice routes
invoices_bp = Blueprint('invoices', __name__)


def get_supabase():
    """
    Lazy initialization of Supabase client.
    """
    try:
        return get_supabase_client()
    except RuntimeError as e:
        raise RuntimeError(f"Supabase configuration error: {str(e)}. Please check your .env file.")


def update_product_quantities(items):
    """
    Update product quantities in inventory after invoice is created.
    Deducts the sold quantity from each product's inventory.
    
    Args:
        items: List of invoice items, each containing product_id and quantity
    
    Returns:
        tuple: (success: bool, errors: list)
    """
    if not items or not isinstance(items, list):
        return True, []
    
    errors = []
    supabase = get_supabase()
    
    for item in items:
        try:
            product_id = item.get("product_id")
            sold_quantity = item.get("quantity", 0)
            
            if not product_id:
                errors.append(f"Item missing product_id: {item}")
                continue
            
            if sold_quantity <= 0:
                # Skip items with zero or negative quantity
                continue
            
            # Get current product from Supabase
            resp = supabase.table("products").select("id, quantity").eq("id", product_id).execute()
            
            if not resp.data or len(resp.data) == 0:
                errors.append(f"Product not found: {product_id}")
                continue
            
            current_product = resp.data[0]
            current_quantity = int(current_product.get("quantity", 0))
            
            # Calculate new quantity (ensure it doesn't go below 0)
            new_quantity = max(0, current_quantity - sold_quantity)
            
            # Update product quantity in Supabase
            update_resp = supabase.table("products").update({
                "quantity": new_quantity
            }).eq("id", product_id).execute()
            
            if not update_resp.data:
                errors.append(f"Failed to update product {product_id}")
                
        except Exception as e:
            error_msg = f"Error updating product {item.get('product_id', 'unknown')}: {str(e)}"
            errors.append(error_msg)
    
    return len(errors) == 0, errors


@invoices_bp.post("/api/invoices")
def create_invoice():
    """
    Create a new invoice.
    
    Required fields:
        - invoice_no: Invoice number
        - customer_name: Name of the customer
        - items: List of invoice items (JSON array)
        - total_amount: Total invoice amount (must be a number)
    
    Optional fields:
        - customer_phone: Customer phone number
        - customer_vat_id: Customer VAT ID
        - customer_address: Customer address
        - quotation_price: Quotation price type
        - subtotal: Subtotal amount (defaults to 0)
        - discount: Discount amount (defaults to 0)
        - vat_amount: VAT amount (defaults to 0)
        - currency: Currency code (defaults to "USD")
        - notes: Additional notes for the invoice
        - receiver_name: Receiver name
        - cashier_name: Cashier name
    
    Returns:
        Created invoice object with 201 status code
    """
    try:
        payload = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    # Extract and validate required fields
    invoice_no = (payload or {}).get("invoice_no")
    customer_name = (payload or {}).get("customer_name")
    items = (payload or {}).get("items", [])
    total_amount = (payload or {}).get("total_amount")
    
    # Optional fields
    customer_phone = (payload or {}).get("customer_phone")
    customer_vat_id = (payload or {}).get("customer_vat_id")
    customer_address = (payload or {}).get("customer_address")
    quotation_price = (payload or {}).get("quotation_price")
    subtotal = (payload or {}).get("subtotal", 0.0)
    discount = (payload or {}).get("discount", 0.0)
    vat_amount = (payload or {}).get("vat_amount", 0.0)
    currency = (payload or {}).get("currency", "USD")
    notes = (payload or {}).get("notes")
    receiver_name = (payload or {}).get("receiver_name")
    cashier_name = (payload or {}).get("cashier_name")

    # Validate required fields
    if not invoice_no:
        return jsonify({"error": "invoice_no is required"}), 400
    if not customer_name:
        return jsonify({"error": "customer_name is required"}), 400
    if not items or not isinstance(items, list):
        return jsonify({"error": "items must be a non-empty array"}), 400
    
    # Validate and convert amounts
    try:
        total_amount = float(total_amount) if total_amount is not None else 0.0
        subtotal = float(subtotal) if subtotal is not None else 0.0
        discount = float(discount) if discount is not None else 0.0
        vat_amount = float(vat_amount) if vat_amount is not None else 0.0
    except (TypeError, ValueError):
        return jsonify({"error": "Amounts must be valid numbers"}), 400

    # Convert items to JSON string
    try:
        items_json = json.dumps(items)
    except (TypeError, ValueError) as e:
        return jsonify({"error": f"Invalid items format: {str(e)}"}), 400

    # Create invoice object
    invoice = Invoice(
        invoice_no=invoice_no,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_vat_id=customer_vat_id,
        customer_address=customer_address,
        quotation_price=quotation_price,
        items=items_json,
        subtotal=subtotal,
        discount=discount,
        vat_amount=vat_amount,
        total_amount=total_amount,
        currency=currency,
        notes=notes,
        receiver_name=receiver_name,
        cashier_name=cashier_name,
    )

    # Save to database
    try:
        db.session.add(invoice)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    # Update product quantities in inventory after invoice is saved
    try:
        success, errors = update_product_quantities(items)
        if not success and errors:
            # Log errors but don't fail the invoice creation
            # The invoice is already saved, so we just log the inventory update errors
            print(f"Warning: Some product quantities could not be updated: {errors}")
    except Exception as e:
        # Log error but don't fail the invoice creation
        print(f"Warning: Error updating product quantities: {str(e)}")

    # Generate ZATCA QR code
    invoice_dict = invoice.to_dict()
    try:
        # ZATCA Phase-1 required data
        seller_name = "مؤسسة وثبة العز لقطع غيار التكييف والتبريد"
        vat_number = "314265267200003"
        invoice_datetime = format_datetime(invoice.created_at)
        total_amount_str = format_amount(total_amount)
        vat_amount_str = format_amount(vat_amount)
        
        qr_code = generate_zatca_qr(
            seller_name=seller_name,
            vat_number=vat_number,
            invoice_datetime=invoice_datetime,
            total_amount=total_amount_str,
            vat_amount=vat_amount_str
        )
        invoice_dict["qr_code"] = qr_code
    except Exception as e:
        # Log error but don't fail the invoice creation
        print(f"Warning: Failed to generate QR code: {str(e)}")
        invoice_dict["qr_code"] = None

    return jsonify(invoice_dict), 201


@invoices_bp.get("/api/invoices")
def list_invoices():
    """
    Get all invoices from the database.
    Returns invoices ordered by creation date (newest first).
    Each invoice includes ZATCA QR code.
    
    Returns:
        JSON array of invoice objects
    """
    invoices = Invoice.query.order_by(Invoice.created_at.desc()).all()
    result = []
    
    # ZATCA Phase-1 required data (fixed for this company)
    seller_name = "مؤسسة وثبة العز لقطع غيار التكييف والتبريد"
    vat_number = "314265267200003"
    
    for invoice in invoices:
        invoice_dict = invoice.to_dict()
        
        # Generate QR code for each invoice
        try:
            invoice_datetime = format_datetime(invoice.created_at)
            total_amount_str = format_amount(invoice.total_amount)
            vat_amount_str = format_amount(invoice.vat_amount)
            
            qr_code = generate_zatca_qr(
                seller_name=seller_name,
                vat_number=vat_number,
                invoice_datetime=invoice_datetime,
                total_amount=total_amount_str,
                vat_amount=vat_amount_str
            )
            invoice_dict["qr_code"] = qr_code
        except Exception as e:
            print(f"Warning: Failed to generate QR code for invoice {invoice.id}: {str(e)}")
            invoice_dict["qr_code"] = None
        
        result.append(invoice_dict)
    
    return jsonify(result)


@invoices_bp.get("/api/invoices/<int:invoice_id>/qr")
def get_invoice_qr(invoice_id):
    """
    Get ZATCA QR code for a specific invoice.
    
    Args:
        invoice_id: ID of the invoice
        
    Returns:
        JSON object with qr_code field, or error with 404
    """
    invoice = Invoice.query.get(invoice_id)
    
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404
    
    try:
        # ZATCA Phase-1 required data
        seller_name = "مؤسسة وثبة العز لقطع غيار التكييف والتبريد"
        vat_number = "314265267200003"
        invoice_datetime = format_datetime(invoice.created_at)
        total_amount_str = format_amount(invoice.total_amount)
        vat_amount_str = format_amount(invoice.vat_amount)
        
        qr_code = generate_zatca_qr(
            seller_name=seller_name,
            vat_number=vat_number,
            invoice_datetime=invoice_datetime,
            total_amount=total_amount_str,
            vat_amount=vat_amount_str
        )
        
        return jsonify({
            "invoice_id": invoice.id,
            "invoice_no": invoice.invoice_no,
            "qr_code": qr_code
        })
    except Exception as e:
        return jsonify({"error": f"Failed to generate QR code: {str(e)}"}), 500


@invoices_bp.delete("/api/invoices/<int:invoice_id>")
def delete_invoice(invoice_id):
    """
    Delete an invoice by ID.
    
    Args:
        invoice_id: ID of the invoice to delete
    
    Returns:
        Success message with 200 status code, or error with 404/500
    """
    invoice = Invoice.query.get(invoice_id)
    
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404
    
    try:
        db.session.delete(invoice)
        db.session.commit()
        return jsonify({"message": "Invoice deleted successfully"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

