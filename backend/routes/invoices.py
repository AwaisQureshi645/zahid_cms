"""
Invoice routes for managing invoices.
All invoice operations interact with local SQLite database.
"""
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from database import db
from models import Invoice

# Create a Blueprint for invoice routes
invoices_bp = Blueprint('invoices', __name__)


@invoices_bp.post("/api/invoices")
def create_invoice():
    """
    Create a new invoice.
    
    Required fields:
        - customer_name: Name of the customer
        - total_amount: Total invoice amount (must be a number)
    
    Optional fields:
        - currency: Currency code (defaults to "USD")
        - notes: Additional notes for the invoice
    
    Returns:
        Created invoice object with 201 status code
    """
    try:
        payload = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    # Extract and validate required fields
    customer_name = (payload or {}).get("customer_name")
    total_amount = (payload or {}).get("total_amount")
    currency = (payload or {}).get("currency", "USD")
    notes = (payload or {}).get("notes")

    # Validate customer name
    if not customer_name:
        return jsonify({"error": "customer_name is required"}), 400
    
    # Validate and convert total amount
    try:
        total_amount = float(total_amount)
    except (TypeError, ValueError):
        return jsonify({"error": "total_amount must be a number"}), 400

    # Create invoice object
    invoice = Invoice(
        customer_name=customer_name,
        total_amount=total_amount,
        currency=currency,
        notes=notes,
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

