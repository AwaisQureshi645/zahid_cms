"""
Simple authentication routes for user registration and login.
Uses a simple users table in Supabase with username, email, and password.
"""
from flask import Blueprint, request, jsonify
from supabase_client import get_supabase_client
import hashlib
import secrets
import uuid
from datetime import datetime

# Create a Blueprint for auth routes
auth_bp = Blueprint('auth', __name__)


def get_supabase():
    """
    Lazy initialization of Supabase client.
    """
    try:
        return get_supabase_client()
    except RuntimeError as e:
        raise RuntimeError(f"Supabase configuration error: {str(e)}. Please check your .env file.")


def hash_password(password: str) -> str:
    """
    Hash a password using SHA-256 (simple hashing for basic auth).
    In production, consider using bcrypt or argon2.
    """
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """
    Verify a password against a hash.
    """
    return hash_password(password) == hashed


@auth_bp.post("/api/auth/register")
def register():
    """
    Register a new user.
    Expects JSON: { "username": "...", "email": "...", "password": "..." }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "").strip()
        
        # Validation
        if not username:
            return jsonify({"error": "Username is required"}), 400
        if not email:
            return jsonify({"error": "Email is required"}), 400
        if not password or len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        
        # Check if email already exists
        supabase = get_supabase()
        existing_user = supabase.table("users").select("id").eq("email", email).execute()
        
        if existing_user.data:
            return jsonify({"error": "Email already registered"}), 400
        
        # Check if username already exists
        existing_username = supabase.table("users").select("id").eq("username", username).execute()
        
        if existing_username.data:
            return jsonify({"error": "Username already taken"}), 400
        
        # Hash password
        hashed_password = hash_password(password)
        
        # Create user
        user_data = {
            "id": str(uuid.uuid4()),
            "username": username,
            "email": email,
            "password": hashed_password,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("users").insert(user_data).execute()
        
        if result.data:
            # Return user data (without password)
            user = result.data[0]
            return jsonify({
                "message": "User registered successfully",
                "user": {
                    "id": user["id"],
                    "username": user["username"],
                    "email": user["email"]
                }
            }), 201
        else:
            return jsonify({"error": "Failed to create user"}), 500
            
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        error_msg = str(e)
        return jsonify({"error": f"Registration failed: {error_msg}"}), 500


@auth_bp.post("/api/auth/login")
def login():
    """
    Login a user.
    Expects JSON: { "email": "...", "password": "..." }
    Returns: { "user": {...}, "token": "..." }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get("email", "").strip().lower()
        password = data.get("password", "").strip()
        
        # Validation
        if not email:
            return jsonify({"error": "Email is required"}), 400
        if not password:
            return jsonify({"error": "Password is required"}), 400
        
        # Find user by email
        supabase = get_supabase()
        result = supabase.table("users").select("*").eq("email", email).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({"error": "Invalid email or password"}), 401
        
        user = result.data[0]
        
        # Verify password
        if not verify_password(password, user["password"]):
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Generate a simple token (in production, use JWT)
        token = secrets.token_urlsafe(32)
        
        # Return user data (without password) and token
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            },
            "token": token
        }), 200
            
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        error_msg = str(e)
        return jsonify({"error": f"Login failed: {error_msg}"}), 500

