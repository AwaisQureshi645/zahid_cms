# MongoDB Authentication Fix

## Issue Fixed

**Error:** `"Login failed: MongoDB configuration error: Username and password must be escaped according to RFC 3986, use urllib.parse.quote_plus"`

## Solution

The MongoDB client now automatically URL-encodes the username and password in the connection string according to RFC 3986 standards. This handles special characters like `!`, `@`, `#`, etc. in passwords.

## Changes Made

### 1. Updated `backend/mongodb_client.py`
- Added automatic URL encoding of username and password
- Uses `urllib.parse.quote_plus()` to encode credentials
- Handles connection strings with special characters in passwords

### 2. Authentication System
The authentication system is already simple and uses the `users` collection:
- **No role-based access control**
- Simple username/email + password authentication
- All users have equal access (no admin/user roles)
- Uses SHA-256 password hashing (can be upgraded to bcrypt later)

## How It Works

### Connection String Encoding
When you provide a MongoDB URI like:
```
mongodb+srv://awais:!Awais@123@possystem.psyxhcw.mongodb.net/?appName=PosSystem
```

The client automatically encodes it to:
```
mongodb+srv://awais:%21Awais%40123@possystem.psyxhcw.mongodb.net/?appName=PosSystem
```

Where:
- `!` becomes `%21`
- `@` becomes `%40`

### Authentication Flow

1. **Registration** (`POST /api/auth/register`)
   - Creates user in `users` collection
   - Stores: `id`, `username`, `email`, `hashed_password`
   - No roles assigned

2. **Login** (`POST /api/auth/login`)
   - Validates email and password
   - Returns user info and token
   - No role checks

3. **Protected Routes**
   - Frontend checks if user exists (no role check)
   - All authenticated users have same access

## Environment Setup

Your `.env` file should have:

```env
MONGODB_URI=mongodb+srv://awais:!Awais@123@possystem.psyxhcw.mongodb.net/?appName=PosSystem
MONGODB_DB_NAME=possystem
```

**Note:** You can now use the connection string as-is with special characters. The client will automatically encode them.

## Testing

1. **Test Connection:**
   ```bash
   cd backend
   python app.py
   ```
   Should connect without encoding errors.

2. **Test Authentication:**
   ```bash
   # Register a user
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
   
   # Login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

## User Collection Structure

```json
{
  "_id": ObjectId("..."),
  "id": "uuid-string",
  "username": "string",
  "email": "string",
  "password": "sha256-hashed-string",
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

**No role field** - all users are equal.

## Security Notes

1. **Password Hashing:** Currently uses SHA-256. For production, consider upgrading to bcrypt or argon2.

2. **Token:** Uses simple token generation. For production, consider using JWT with expiration.

3. **No Role-Based Access:** All authenticated users have the same permissions. If you need different access levels later, you can add a `role` field and implement checks.

## Troubleshooting

### Still Getting Encoding Errors?

If you still see encoding errors:
1. Make sure you're using the latest `mongodb_client.py`
2. Check that your `.env` file has the correct `MONGODB_URI`
3. Restart your Flask server after updating the code

### Connection Issues?

1. Verify your MongoDB Atlas IP whitelist includes your server IP
2. Check that the database user has proper permissions
3. Verify the connection string format is correct

## Summary

✅ MongoDB connection string encoding fixed  
✅ Simple authentication system (no roles)  
✅ All users have equal access  
✅ Uses `users` collection for authentication  

The system is now ready to use with your MongoDB connection string!
