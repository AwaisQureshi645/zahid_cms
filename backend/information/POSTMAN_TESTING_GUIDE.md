# Postman API Testing Guide

## Base URL
```
http://localhost:5000
```

## Headers
Set these headers for all requests:
```
Content-Type: application/json
```

---

## 1. Health Check

### GET `/api/health`
**Method:** `GET`  
**URL:** `http://localhost:5000/api/health`  
**Body:** None  
**Expected Response:**
```json
{
  "status": "ok"
}
```

---

## 2. Products API

### GET `/api/products` - List Products
**Method:** `GET`  
**URL:** `http://localhost:5000/api/products?user_id=YOUR_USER_ID`  
**Query Parameters:**
- `user_id` (required) - UUID of the user

**Example:**
```
http://localhost:5000/api/products?user_id=123e4567-e89b-12d3-a456-426614174000
```

**Body:** None

**Expected Response:**
```json
[
  {
    "id": "uuid-here",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "item_no": "ITEM-001",
    "description": "Product Description",
    "category": "Electronics",
    "unit": "Piece",
    "quantity": 100,
    "unit_price": 29.99,
    "discount": 5.00,
    "vat_percent": 15.00,
    "custom_fields": [],
    "image_url": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### POST `/api/products` - Create Product
**Method:** `POST`  
**URL:** `http://localhost:5000/api/products`  
**Body:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "item_no": "ITEM-001",
  "description": "Wireless Mouse",
  "category": "Electronics",
  "unit": "Piece",
  "quantity": 50,
  "unit_price": 29.99,
  "discount": 5.00,
  "vat_percent": 15.00
}
```

**Required Fields:**
- `user_id` (string/UUID)
- `item_no` (string)
- `description` (string)
- `unit` (string)
- `quantity` (number)
- `unit_price` (number)

**Optional Fields:**
- `category` (string)
- `discount` (number, default: 0)
- `vat_percent` (number, default: 0)

**Minimal Example:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "item_no": "ITEM-002",
  "description": "Keyboard",
  "unit": "Piece",
  "quantity": 30,
  "unit_price": 49.99
}
```

**Expected Response (201 Created):**
```json
{
  "id": "uuid-here",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "item_no": "ITEM-001",
  "description": "Wireless Mouse",
  "category": "Electronics",
  "unit": "Piece",
  "quantity": 50,
  "unit_price": 29.99,
  "discount": 5.00,
  "vat_percent": 15.00,
  "custom_fields": [],
  "image_url": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### PUT `/api/products/<product_id>` - Update Product
**Method:** `PUT`  
**URL:** `http://localhost:5000/api/products/YOUR_PRODUCT_ID`  
**Example URL:** `http://localhost:5000/api/products/123e4567-e89b-12d3-a456-426614174000`

**Body:** (Send only fields you want to update)
```json
{
  "description": "Updated Wireless Mouse",
  "quantity": 75,
  "unit_price": 34.99,
  "discount": 10.00,
  "vat_percent": 20.00
}
```

**Allowed Fields:**
- `item_no`
- `description`
- `category`
- `unit`
- `quantity`
- `unit_price`
- `discount`
- `vat_percent`

**Example - Update Price Only:**
```json
{
  "unit_price": 39.99
}
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid-here",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "item_no": "ITEM-001",
  "description": "Updated Wireless Mouse",
  "category": "Electronics",
  "unit": "Piece",
  "quantity": 75,
  "unit_price": 34.99,
  "discount": 10.00,
  "vat_percent": 20.00,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### DELETE `/api/products/<product_id>` - Delete Product
**Method:** `DELETE`  
**URL:** `http://localhost:5000/api/products/YOUR_PRODUCT_ID`  
**Example URL:** `http://localhost:5000/api/products/123e4567-e89b-12d3-a456-426614174000`

**Body:** None

**Expected Response:** 
- Status Code: `204 No Content`
- No body content

---

## 3. Invoices API

### POST `/api/invoices` - Create Invoice
**Method:** `POST`  
**URL:** `http://localhost:5000/api/invoices`  
**Body:**
```json
{
  "customer_name": "Acme Corporation",
  "total_amount": 1234.56,
  "currency": "USD",
  "notes": "Payment due within 30 days"
}
```

**Required Fields:**
- `customer_name` (string)
- `total_amount` (number)

**Optional Fields:**
- `currency` (string, default: "USD")
- `notes` (string)

**Minimal Example:**
```json
{
  "customer_name": "John Doe",
  "total_amount": 500.00
}
```

**Example with All Fields:**
```json
{
  "customer_name": "ABC Company Ltd",
  "total_amount": 2500.75,
  "currency": "EUR",
  "notes": "Invoice for monthly services. Please pay via bank transfer."
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "customer_name": "Acme Corporation",
  "total_amount": 1234.56,
  "currency": "USD",
  "notes": "Payment due within 30 days",
  "created_at": "2024-01-01T12:00:00Z"
}
```

---

### GET `/api/invoices` - List All Invoices
**Method:** `GET`  
**URL:** `http://localhost:5000/api/invoices`  
**Body:** None

**Expected Response:**
```json
[
  {
    "id": 1,
    "customer_name": "Acme Corporation",
    "total_amount": 1234.56,
    "currency": "USD",
    "notes": "Payment due within 30 days",
    "created_at": "2024-01-01T12:00:00Z"
  },
  {
    "id": 2,
    "customer_name": "John Doe",
    "total_amount": 500.00,
    "currency": "USD",
    "notes": null,
    "created_at": "2024-01-02T10:30:00Z"
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: user_id, item_no"
}
```

### 500 Internal Server Error
```json
{
  "error": "Supabase configuration error: SUPABASE_URL is not set in environment. Please check your .env file."
}
```

---

## Testing Tips

1. **Start with Health Check**: Always test `/api/health` first to ensure the server is running

2. **User ID**: You'll need a valid UUID for the `user_id` field. You can:
   - Use a UUID from your Supabase Auth users table
   - Generate a test UUID: `123e4567-e89b-12d3-a456-426614174000`

3. **Product ID**: After creating a product, copy the `id` from the response to use in PUT/DELETE requests

4. **Order of Operations**:
   - Create a product first
   - Note the product ID from response
   - Use that ID to update or delete

5. **Testing Invalid Data**: Try sending requests with missing required fields to test error handling

---

## Postman Collection JSON

You can import this into Postman:

```json
{
  "info": {
    "name": "CoolCool Invoice API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5000/api/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "health"]
        }
      }
    },
    {
      "name": "Create Product",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"user_id\": \"123e4567-e89b-12d3-a456-426614174000\",\n  \"item_no\": \"ITEM-001\",\n  \"description\": \"Wireless Mouse\",\n  \"category\": \"Electronics\",\n  \"unit\": \"Piece\",\n  \"quantity\": 50,\n  \"unit_price\": 29.99,\n  \"discount\": 5.00,\n  \"vat_percent\": 15.00\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/products",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "products"]
        }
      }
    },
    {
      "name": "Get Products",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5000/api/products?user_id=123e4567-e89b-12d3-a456-426614174000",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "products"],
          "query": [
            {
              "key": "user_id",
              "value": "123e4567-e89b-12d3-a456-426614174000"
            }
          ]
        }
      }
    },
    {
      "name": "Create Invoice",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"customer_name\": \"Acme Corporation\",\n  \"total_amount\": 1234.56,\n  \"currency\": \"USD\",\n  \"notes\": \"Payment due within 30 days\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/invoices",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "invoices"]
        }
      }
    },
    {
      "name": "Get Invoices",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5000/api/invoices",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "invoices"]
        }
      }
    }
  ]
}
```

Save this as `postman_collection.json` and import it into Postman!

