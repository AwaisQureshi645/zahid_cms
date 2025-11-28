"""
Invoice routes for managing invoices.
All invoice operations interact with local SQLite database.
"""
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from database import db
from models import Invoice
import json

# Create a Blueprint for invoice routes
invoices_bp = Blueprint('invoices', __name__)


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

    return jsonify(invoice.to_dict()), 201


@invoices_bp.get("/api/invoices")
def list_invoices():
    """
    Get all invoices from the database.
    Returns invoices ordered by creation date (newest first).
    
    Returns:
        JSON array of invoice objects
    """
    invoices = Invoice.query.order_by(Invoice.created_at.desc()).all()
    return jsonify([inv.to_dict() for inv in invoices])


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

