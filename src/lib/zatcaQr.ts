/**
 * ZATCA Phase-1 QR Code Generator (Frontend)
 * 
 * This module provides functions to generate ZATCA-compliant QR codes
 * for Saudi Arabia VAT invoices. The QR code is generated as a Base64
 * string that can be used directly with QR code libraries.
 */

/**
 * Generate ZATCA Phase-1 QR code Base64 string
 * 
 * @param sellerName - Seller name (UTF-8, Arabic/English allowed)
 * @param vatNumber - VAT registration number (must be exactly 15 digits)
 * @param invoiceDatetime - Invoice date & time in ISO format (YYYY-MM-DDTHH:MM:SS)
 * @param totalAmount - Total invoice amount with VAT (must have 2 decimals)
 * @param vatAmount - VAT amount (must have 2 decimals)
 * @returns Base64 encoded TLV data (ready for QR code generation)
 */
export function generateZatcaQr(
  sellerName: string,
  vatNumber: string,
  invoiceDatetime: string,
  totalAmount: number,
  vatAmount: number
): string {
  // Validate inputs
  if (!sellerName || !sellerName.trim()) {
    throw new Error("Seller name is required");
  }

  // Clean VAT number (remove spaces/dashes)
  const cleanedVat = vatNumber.replace(/[\s\-]/g, '');
  if (!cleanedVat.match(/^\d{15}$/)) {
    throw new Error(`VAT number must be exactly 15 digits. Got: ${vatNumber}`);
  }

  // Validate datetime format
  if (!invoiceDatetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    throw new Error(`Invalid datetime format. Expected YYYY-MM-DDTHH:MM:SS. Got: ${invoiceDatetime}`);
  }

  // Format amounts to 2 decimal places
  const totalAmountStr = totalAmount.toFixed(2);
  const vatAmountStr = vatAmount.toFixed(2);

  // Build TLV fields
  const tlvFields: Uint8Array[] = [];

  // Tag 1: Seller Name
  const sellerNameBytes = new TextEncoder().encode(sellerName.trim());
  if (sellerNameBytes.length > 255) {
    throw new Error(`Seller name length (${sellerNameBytes.length}) exceeds maximum (255)`);
  }
  tlvFields.push(new Uint8Array([1, sellerNameBytes.length, ...sellerNameBytes]));

  // Tag 2: VAT Registration Number
  const vatBytes = new TextEncoder().encode(cleanedVat);
  tlvFields.push(new Uint8Array([2, vatBytes.length, ...vatBytes]));

  // Tag 3: Invoice Date & Time
  const datetimeBytes = new TextEncoder().encode(invoiceDatetime);
  tlvFields.push(new Uint8Array([3, datetimeBytes.length, ...datetimeBytes]));

  // Tag 4: Total Invoice Amount (with VAT)
  const totalAmountBytes = new TextEncoder().encode(totalAmountStr);
  tlvFields.push(new Uint8Array([4, totalAmountBytes.length, ...totalAmountBytes]));

  // Tag 5: VAT Amount
  const vatAmountBytes = new TextEncoder().encode(vatAmountStr);
  tlvFields.push(new Uint8Array([5, vatAmountBytes.length, ...vatAmountBytes]));

  // Combine all TLV fields
  const totalLength = tlvFields.reduce((sum, field) => sum + field.length, 0);
  const tlvData = new Uint8Array(totalLength);
  let offset = 0;
  for (const field of tlvFields) {
    tlvData.set(field, offset);
    offset += field.length;
  }

  // Convert to Base64
  // Convert Uint8Array to binary string, then to base64
  const binaryString = String.fromCharCode(...tlvData);
  const base64String = btoa(binaryString);

  return base64String;
}

/**
 * Format datetime to ISO format (YYYY-MM-DDTHH:MM:SS)
 */
export function formatDatetime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Generate QR code for invoice using company defaults
 */
export function generateInvoiceQrCode(
  invoiceDatetime: Date | string,
  totalAmount: number,
  vatAmount: number
): string {
  const sellerName = "مؤسسة وثبة العز لقطع غيار التكييف والتبريد";
  const vatNumber = "314265267200003";
  
  const datetimeStr = typeof invoiceDatetime === 'string' 
    ? invoiceDatetime 
    : formatDatetime(invoiceDatetime);
  
  return generateZatcaQr(
    sellerName,
    vatNumber,
    datetimeStr,
    totalAmount,
    vatAmount
  );
}

