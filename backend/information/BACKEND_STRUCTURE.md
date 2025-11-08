# Backend Code Structure

This document describes the refactored backend structure for better organization and maintainability.

## Folder Structure

```
backend/
├── data/                          # Database files and SQL scripts
│   ├── app.db                     # SQLite database file
│   ├── *.sql                     # All SQL migration and schema files
│   └── *.xlsx                    # Excel files for data import
│
├── information/                   # Documentation files
│   ├── *.md                      # All markdown documentation files
│   └── BACKEND_STRUCTURE.md      # This file
│
├── routes/                        # API route handlers (organized by resource)
│   ├── __init__.py               # Routes package initialization
│   ├── products.py               # Product CRUD operations (Supabase)
│   ├── invoices.py               # Invoice CRUD operations (SQLite)
│   └── debug.py                  # Debug and health check endpoints
│
├── app.py                        # Main Flask application factory
├── database.py                    # Database configuration and initialization
├── models.py                      # SQLAlchemy database models
├── supabase_client.py            # Supabase client configuration
├── import_excel.py               # Excel import utility script
└── requirements.txt              # Python dependencies
```

## Code Organization

### Main Application (`app.py`)
- Application factory pattern for creating Flask app instances
- Configures database connection (SQLite or Supabase via DATABASE_URL)
- Registers all route blueprints
- Sets up CORS and environment variables

### Routes (`routes/`)
Routes are organized into separate modules using Flask Blueprints:

- **`products.py`**: Handles all product-related API endpoints
  - GET `/api/products` - List all products
  - POST `/api/products` - Create a new product
  - PUT `/api/products/<id>` - Update a product
  - DELETE `/api/products/<id>` - Delete a product

- **`invoices.py`**: Handles all invoice-related API endpoints
  - GET `/api/invoices` - List all invoices
  - POST `/api/invoices` - Create a new invoice

- **`debug.py`**: Development and debugging endpoints
  - GET `/api/health` - Health check
  - GET `/api/debug/supabase-config` - Supabase configuration check
  - GET `/api/debug/test-insert` - Test Supabase permissions

### Database (`database.py`)
- SQLAlchemy database instance
- Database initialization function
- Creates tables automatically on first run

### Models (`models.py`)
- SQLAlchemy model definitions
- Currently contains `Invoice` model for local SQLite database

### Supabase Client (`supabase_client.py`)
- Supabase connection configuration
- Service role key validation
- Client initialization with proper error handling

### Excel Import (`import_excel.py`)
- Utility script for importing Excel data into Supabase
- Handles batch insertion and data validation
- Supports command-line arguments for file path and user_id

## Database Configuration

The application supports two database backends:

1. **SQLite** (default, for local development):
   - Database file: `data/app.db`
   - Used for invoices and local data

2. **Supabase** (for production):
   - Configured via `DATABASE_URL` environment variable
   - Used for products and shared data
   - Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`

## File Locations

### Database Files
All database-related files are stored in the `data/` folder:
- SQLite database: `data/app.db`
- SQL scripts: `data/*.sql`
- Excel files: `data/*.xlsx`

### Documentation
All documentation files are stored in the `information/` folder:
- Setup guides: `information/DATABASE_SETUP.md`
- Troubleshooting: `information/RLS_TROUBLESHOOTING.md`
- Import guides: `information/IMPORT_EXCEL_GUIDE.md`
- Testing guides: `information/POSTMAN_TESTING_GUIDE.md`

## Benefits of This Structure

1. **Better Organization**: Related files are grouped together
2. **Easier Maintenance**: Routes are separated by resource type
3. **Improved Readability**: Code is well-documented with docstrings
4. **Scalability**: Easy to add new routes or modules
5. **Clear Separation**: Database files, documentation, and code are clearly separated

## Migration Notes

If you have an existing `app.db` file in the backend root:
1. Stop the Flask server
2. Move `app.db` to the `data/` folder
3. Restart the server

The application will automatically use the database in the `data/` folder.

