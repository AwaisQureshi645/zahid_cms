# ZATCA Phase-1 QR Code Implementation

This document describes the implementation of Saudi Arabia ZATCA Phase-1 compliant QR codes for VAT invoices.

## Overview

The QR code implementation follows ZATCA Phase-1 specifications exactly:
- Uses TLV (Tag-Length-Value) encoding
- Encodes to Base64
- Contains exactly 5 fields in this order:
  1. Tag 1: Seller Name (UTF-8 string)
  2. Tag 2: VAT Registration Number (15 digits)
  3. Tag 3: Invoice Date & Time (ISO format: YYYY-MM-DDTHH:MM:SS)
  4. Tag 4: Total Invoice Amount with VAT (2 decimals)
  5. Tag 5: VAT Amount (2 decimals)

## Backend Implementation

### Files

1. **`backend/zatca_qr.py`** - Core QR code generation module
   - `generate_zatca_qr()` - Main function to generate QR code Base64 string
   - `decode_zatca_qr()` - Utility to decode QR code for verification
   - `verify_zatca_qr()` - Verify QR code matches expected values
   - Validation functions for all fields

2. **`backend/routes/invoices.py`** - Updated invoice routes
   - Automatically generates QR code when creating invoices
   - Includes QR code in invoice list responses
   - New endpoint: `GET /api/invoices/<id>/qr` - Get QR code for specific invoice

3. **`backend/test_zatca_qr.py`** - Test and verification utility
   - Run with: `python -m backend.test_zatca_qr`
   - Tests QR generation, decoding, and validation

### Company Information

The following company information is hardcoded (as per requirements):
- **Seller Name**: مؤسسة وثبة العز لقطع غيار التكييف والتبريد
- **VAT Number**: 314265267200003

### API Usage

#### Create Invoice (with QR code)

```bash
POST /api/invoices
Content-Type: application/json

{
  "invoice_no": "202412-1234",
  "customer_name": "Customer Name",
  "items": [...],
  "total_amount": 1000.50,
  "vat_amount": 150.08,
  ...
}
```

Response includes `qr_code` field:
```json
{
  "id": "123",
  "invoice_no": "202412-1234",
  "qr_code": "BASE64_STRING_HERE",
  ...
}
```

#### Get Invoice QR Code

```bash
GET /api/invoices/<invoice_id>/qr
```

Response:
```json
{
  "invoice_id": 123,
  "invoice_no": "202412-1234",
  "qr_code": "BASE64_STRING_HERE"
}
```

## Frontend Implementation

### Files

1. **`src/lib/zatcaQr.ts`** - Frontend QR code generation
   - `generateZatcaQr()` - Generate QR code Base64 string
   - `generateInvoiceQrCode()` - Helper with company defaults
   - `formatDatetime()` - Format date to ISO format

2. **`src/components/InvoiceTemplate.tsx`** - Updated invoice template
   - Accepts `qrCode` prop (Base64 string)
   - Displays ZATCA QR code if provided
   - Falls back to simple QR code if not provided

3. **`src/pages/CreateInvoice.tsx`** - Invoice creation page
   - Generates QR code for preview/print before saving
   - Uses QR code from API response after saving

4. **`src/pages/Invoices.tsx`** - Invoice list page
   - Displays QR code from API response
   - QR code included in print/PDF exports

### Usage in React Components

```typescript
import { generateInvoiceQrCode } from '@/lib/zatcaQr';

// Generate QR code
const qrCode = generateInvoiceQrCode(
  new Date(),           // Invoice datetime
  1000.50,              // Total amount
  150.08                // VAT amount
);

// Use in InvoiceTemplate
<InvoiceTemplate
  ...
  qrCode={qrCode}
/>
```

## QR Code Format

The QR code contains Base64-encoded TLV data:

```
TLV Structure:
[Tag (1 byte)][Length (1 byte)][Value (variable bytes)]

Example:
Tag 1: [0x01][0x2F][Seller Name UTF-8 bytes]
Tag 2: [0x02][0x0F][VAT Number UTF-8 bytes]
Tag 3: [0x03][0x13][DateTime UTF-8 bytes]
Tag 4: [0x04][0x06][Total Amount UTF-8 bytes]
Tag 5: [0x05][0x06][VAT Amount UTF-8 bytes]

Final: Base64 encode the entire TLV binary data
```

## Validation Rules

1. **VAT Number**: Must be exactly 15 digits (spaces/dashes are cleaned)
2. **Amounts**: Must have exactly 2 decimal places
3. **DateTime**: Must be ISO format YYYY-MM-DDTHH:MM:SS (no timezone)
4. **Seller Name**: UTF-8 encoded, max 255 bytes

## Testing

### Backend Test

```bash
cd backend
python -m backend.test_zatca_qr
```

This will:
- Generate a sample QR code
- Decode it and display all fields
- Verify it matches expected values
- Run validation tests

### Manual Verification

1. Generate an invoice through the UI
2. Check the QR code is displayed on the invoice
3. Scan the QR code with a QR scanner
4. The scanned data should be the Base64 string
5. Decode using `decode_zatca_qr()` to verify contents

## Important Notes

⚠️ **DO NOT**:
- Add extra fields to the QR code
- Include invoice number in QR code
- Include customer information in QR code
- Encrypt or hash the QR code data
- Modify the TLV tag order

✅ **DO**:
- Use UTF-8 encoding for text fields
- Ensure amounts have exactly 2 decimals
- Use ISO datetime format without timezone
- Generate QR code at invoice creation time
- Use system time for invoice datetime

## Troubleshooting

### QR Code Not Displaying

1. Check browser console for errors
2. Verify QR code is included in API response
3. Check `qrCode` prop is passed to `InvoiceTemplate`

### QR Code Invalid

1. Verify amounts have 2 decimal places
2. Check datetime format is correct
3. Ensure VAT number is exactly 15 digits
4. Run test utility to verify generation

### QR Code Not Scannable

1. Ensure QR code size is adequate (minimum 80x80px)
2. Check print quality/contrast
3. Verify Base64 string is valid
4. Test with multiple QR scanners

## Compliance

This implementation follows ZATCA Phase-1 specifications exactly. The QR code is compatible with:
- Saudi bank mobile apps
- ZATCA verification systems
- Standard QR code scanners

For Phase-2 compliance (if required in future), additional fields and encryption may be needed.

