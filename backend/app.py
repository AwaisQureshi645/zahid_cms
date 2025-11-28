"""
Main Flask application factory.
This module creates and configures the Flask app, registers blueprints,
and sets up database connections.
"""
from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from database import init_db
from routes import products, invoices, debug, auth

# Load environment variables at module level (before app creation)
# Try loading from project root first, then backend directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

backend_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=True)

# Also try loading from current directory (if running from backend/)
load_dotenv(override=False)


def create_app():
    """
    Application factory function.
    Creates and configures the Flask application instance.
    
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)

    # Database configuration
    # Use DATABASE_URL if provided (for production/Supabase), else use local SQLite
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    else:
        # Local SQLite database stored in data folder
        # Ensure data directory exists
        data_dir = os.path.join(os.path.dirname(__file__), "data")
        os.makedirs(data_dir, exist_ok=True)
        
        db_path = os.path.abspath(
            os.path.join(data_dir, "app.db")
        )
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Enable CORS for all API routes with explicit configuration
    # This supports cross-origin requests from Netlify frontend to Koyeb backend
    # Allow common development ports and production URL
    allowed_origins = [
        "https://gleaming-hummingbird-6934de.netlify.app",
        "http://localhost:5173",
        "http://localhost:5000",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:5173",
        "https://zahid-cms.vercel.app",
    ]
    
    CORS(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        }
    })

    # Initialize database
    init_db(app)

    # Register blueprints (route modules)
    app.register_blueprint(products.products_bp)
    app.register_blueprint(invoices.invoices_bp)
    app.register_blueprint(debug.debug_bp)
    app.register_blueprint(auth.auth_bp)

    return app


# Create app instance for gunicorn (app:app)
app = create_app()


if __name__ == "__main__":
    """
    Run the Flask development server.
    This is only used for local development.
    For production, use a WSGI server like Gunicorn.
    """
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)


