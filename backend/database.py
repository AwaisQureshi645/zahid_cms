"""
Database configuration and initialization.
This module sets up SQLAlchemy for database operations.
"""
from flask_sqlalchemy import SQLAlchemy

# Create SQLAlchemy instance
# This will be initialized with the Flask app in init_db()
db = SQLAlchemy()


def init_db(app):
    """
    Initialize the database with the Flask application.
    Creates all database tables if they don't exist.
    
    Args:
        app: Flask application instance
    """
    db.init_app(app)
    with app.app_context():
        db.create_all()


