"""
Database models for the invoice application.
This module defines SQLAlchemy models for local database tables.
"""
from datetime import datetime
from database import db


class Invoice(db.Model):
    """
    Invoice model for storing invoice data in local SQLite database.
    
    Attributes:
        id: Primary key (auto-incrementing integer)
        customer_name: Name of the customer (required)
        total_amount: Total invoice amount (required)
        currency: Currency code (defaults to "USD")
        notes: Additional notes or comments (optional)
        created_at: Timestamp when invoice was created (auto-generated)
    """
    __tablename__ = "invoices"

    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(255), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), nullable=False, default="USD")
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        """
        Convert invoice object to dictionary for JSON serialization.
        
        Returns:
            dict: Dictionary representation of the invoice
        """
        return {
            "id": self.id,
            "customer_name": self.customer_name,
            "total_amount": self.total_amount,
            "currency": self.currency,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() + "Z",
        }


