# Flask Backend

## Setup

1. Create a Python virtual environment (recommended)
```
python -m venv .venv
# Windows PowerShell
. .venv\\Scripts\\Activate.ps1
```

2. Install dependencies
```
pip install -r backend/requirements.txt
```

3. Configure environment (optional)
- By default, a local SQLite file `backend/app.db` is used.
- To use another DB, set `DATABASE_URL` (e.g. Postgres):
```
setx DATABASE_URL "postgresql+psycopg2://user:pass@localhost:5432/dbname"
```

4. Run the server
```
python -m backend.app
```
The API runs at `http://localhost:5000`.

## API
- GET `/api/health` → `{ status: "ok" }`
- GET `/api/invoices` → list invoices
- POST `/api/invoices` with JSON body:
```
{
  "customer_name": "Acme Inc",
  "total_amount": 123.45,
  "currency": "USD",
  "notes": "optional"
}
```

