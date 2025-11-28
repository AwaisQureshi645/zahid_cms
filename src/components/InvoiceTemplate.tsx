import { useState } from 'react';
import QRCodeSVG from 'react-qr-code';

interface InvoiceItem {
  item_no: string;
  item_name?: string | null;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  vat_percent: number;
  vat_value: number;
  amount: number;
}

interface InvoiceTemplateProps {
  invoiceNo: string;
  date: string;
  customerName?: string;
  customerVatId?: string;
  customerPhone?: string;
  customerAddress?: string;
  quotationPrice?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  total: number;
  notes?: string;
  receiverName?: string;
  cashierName?: string;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  startIndex?: number;
  showSummary?: boolean;
}

export default function InvoiceTemplate({
  invoiceNo,
  date,
  customerName,
  customerVatId,
  customerPhone,
  customerAddress,
  quotationPrice,
  items,
  subtotal,
  discount,
  vatAmount,
  total,
  notes,
  receiverName,
  cashierName,
  currentPage = 1,
  totalPages = 1,
  startIndex = 0,
  showSummary = true,
}: InvoiceTemplateProps) {
  const [logoError, setLogoError] = useState(false);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const numberToWords = (num: number) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';
    
    const thousand = Math.floor(num / 1000);
    const hundred = Math.floor((num % 1000) / 100);
    const ten = Math.floor((num % 100) / 10);
    const one = Math.floor(num % 10);
    
    let result = '';
    if (thousand > 0) result += ones[thousand] + ' Thousand ';
    if (hundred > 0) result += ones[hundred] + ' Hundred ';
    if (ten === 1) result += teens[one] + ' ';
    else {
      if (ten > 0) result += tens[ten] + ' ';
      if (one > 0) result += ones[one] + ' ';
    }
    
    return result.trim() + ' Riyal Only';
  };

  return (
    <div 
      className="bg-white p-8 text-xs print:p-4 print:text-[10px] invoice-container" 
      dir="ltr" 
      style={{ 
        fontFamily: 'Arial, sans-serif',
        maxWidth: '210mm',
        width: '100%',
        margin: '0 auto'
      }}
    >
      <style>{`
        @media print {
          @page {
            margin: 0.5cm;
            size: A4;
            size: 210mm 297mm;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
            overflow: visible !important;
            width: 210mm;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            width: 210mm;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-border {
            border-color: #000 !important;
          }
          table {
            page-break-inside: auto;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            width: 100%;
            table-layout: fixed;
          }
          table td, table th {
            border-width: 1px !important;
          }
          tbody tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto;
          }
          tbody tr td {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group;
            page-break-after: avoid;
            break-after: avoid;
          }
          thead tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          tfoot {
            display: table-footer-group;
            page-break-before: avoid;
            break-before: avoid;
          }
        }
        @media screen {
          .invoice-container {
            max-width: 210mm;
            width: 100%;
            margin: 0 auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="border-2 border-black p-4 mb-1 print-break">
        <div className="flex justify-between items-start">
          <div className="text-right" dir="rtl">
            <div className="font-bold text-sm mb-1">مؤسسة وثبة العز لقطع غيار التكييف والتبريد</div>
            <div className="text-xs">KINGDOM OF SAUDI ARABIA RIYADH</div>
            <div className="text-xs">Phone: 0559882948</div>
            <div className="text-xs">VAT ID: 311278399900003</div>
          </div>
          <div className="w-20 h-20 flex items-center justify-center">
            {logoError ? (
              <span className="text-xs text-gray-500">Logo</span>
            ) : (
              <img 
                src="/images/logo.png" 
                alt="Company Logo" 
                className="max-w-full max-h-full object-contain"
                onError={() => setLogoError(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="border-2 border-t-0 border-black p-2 grid grid-cols-2 gap-2 mb-1 text-xs">
        <div>
          <span className="font-bold">Invoice No:</span> {invoiceNo} | <span dir="rtl">رقم الفاتورة:</span>
        </div>
        <div className="text-right">
          <span className="font-bold">Quotation Price:</span> {quotationPrice || 'Type E'} | <span dir="rtl">السعر:</span> E نوع
        </div>
        <div>
          <span className="font-bold">Date:</span> {formatDate(date)} | <span dir="rtl">التاريخ:</span>
        </div>
        <div className="text-right">
          <span className="font-bold">Date:</span> {formatDate(date)} | <span dir="rtl">التاريخ:</span><span className="font-bold">Customer:</span> {customerName || ''} <span className="font-bold ml-4">VAT ID:</span> {customerVatId || ''}
        </div>
        <div className="col-span-2 flex justify-between">
          <div>
            <span className="font-bold">Page:</span> {currentPage}/{totalPages} | <span dir="rtl">الصفحة</span>
          </div>
          <div className="text-right" dir="rtl">
            <span className="ml-8"><span className="font-bold">Tel:</span> {customerPhone || ''} | <span className="font-bold">Mob:</span></span>
            <span className="ml-8"><span className="font-bold">Address:</span> {customerAddress || ''} | <span dir="rtl">العنوان</span></span>
          </div>
        </div>
      </div>

      {/* Items Table - Hide on summary-only page */}
      {items.length > 0 && (
      <div className="mb-1 print-break" style={{ pageBreakInside: 'auto' }}>
        <table 
          className="w-full border-2 border-t-0 border-black" 
          style={{ 
            borderCollapse: 'collapse', 
            borderSpacing: 0,
            pageBreakInside: 'auto'
          }}
        >
          <thead>
            <tr className="bg-blue-100 print:bg-blue-100">
              <th className="border border-black p-1 text-center" style={{ width: '3%', borderWidth: '1px' }}>
                <div>م</div>
              </th>
              <th className="border border-black p-1 text-center" style={{ width: '7%', borderWidth: '1px' }}>
                <div>رقم الصنف</div>
                <div className="text-xs">Item No.</div>
              </th>
              <th className="border border-black p-1 text-center" style={{ width: '36%', borderWidth: '1px' }}>
                <div>الوصف</div>
                <div className="text-xs">Description</div>
              </th>
              <th className="border border-black p-1 text-center" style={{ width: '7%', borderWidth: '1px' }}>
                <div>الوحدة</div>
                <div className="text-xs">Unit</div>
              </th>
              <th className="border border-black p-1 text-center" style={{ width: '7%', borderWidth: '1px' }}>
                <div>الكمية</div>
                <div className="text-xs">Qty.</div>
              </th>
              <th className="border border-black p-1 text-center" style={{ width: '9%', borderWidth: '1px' }}>
                <div>السعر</div>
                <div className="text-xs">U. Price</div>
              </th>
              <th className="border border-black p-1 text-center" style={{ width: '7%', borderWidth: '1px' }}>
                <div>الخصم</div>
                <div className="text-xs">Dis.</div>
              </th>
              <th className="border border-black p-1 text-center" style={{ width: '9%', borderWidth: '1px' }}>
                <div>المجموع</div>
                <div className="text-xs">Total</div>
              </th>
              <th className="border border-black p-1 text-center" style={{ width: '9%', borderWidth: '1px' }}>
                <div>قيمة الضريبة %</div>
                <div className="text-xs">Vat Value %</div>
              </th>
              <th className="border border-black p-1 text-center" style={{ width: '13%', borderWidth: '1px' }}>
                <div>الاجمالي</div>
                <div className="text-xs">Amount</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="border border-black p-4 text-center text-muted-foreground" style={{ borderWidth: '1px' }}>
                  No items added
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr 
                  key={index} 
                  className="print-break"
                  style={{ 
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                  }}
                >
                  <td className="border border-black p-1 text-center" style={{ borderWidth: '1px', pageBreakInside: 'avoid' }}>{startIndex + index + 1}</td>
                  <td className="border border-black p-1 text-center" style={{ borderWidth: '1px', pageBreakInside: 'avoid' }}>{item.item_no}</td>
                  <td className="border border-black p-1" style={{ borderWidth: '1px', pageBreakInside: 'avoid' }}>{item.description}</td>
                  <td className="border border-black p-1 text-center" style={{ borderWidth: '1px', pageBreakInside: 'avoid' }}>{item.unit}</td>
                  <td className="border border-black p-1 text-center" style={{ borderWidth: '1px', pageBreakInside: 'avoid' }}>{item.quantity}</td>
                  <td className="border border-black p-1 text-right" style={{ borderWidth: '1px', pageBreakInside: 'avoid' }}>{item.unit_price.toFixed(2)}</td>
                  <td className="border border-black p-1 text-right" style={{ borderWidth: '1px', pageBreakInside: 'avoid' }}>{item.discount.toFixed(2)}</td>
                  <td className="border border-black p-1 text-right" style={{ borderWidth: '1px', pageBreakInside: 'avoid' }}>{item.total.toFixed(2)}</td>
                  <td className="border border-black p-1 text-right" style={{ borderWidth: '1px', pageBreakInside: 'avoid' }}>
                    {item.vat_value.toFixed(2)} | {item.vat_percent}
                  </td>
                  <td className="border border-black p-1 text-right font-bold" style={{ borderWidth: '1px', pageBreakInside: 'avoid' }}>{item.amount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Summary Section - Only show on last page or when showSummary is true */}
      {showSummary && (
      <div className={`border-2 ${items.length > 0 ? 'border-t-0' : ''} border-black`}>
        <div className="grid grid-cols-2">
          {/* Left side - Stamp & Signature Area */}
          <div className="border-r border-black p-4 flex flex-col items-center justify-center min-h-[200px]">
            <div className="border-2 border-dashed border-gray-400 rounded-lg w-full h-full flex flex-col items-center justify-center space-y-4">
              <div className="text-sm text-gray-500 mb-2" dir="rtl">ختم وتوقيع</div>
              <div className="text-sm text-gray-500 mb-4">Stamp & Signature</div>
              <div className="flex-1 w-full"></div>
            </div>
          </div>

          {/* Right side - Totals */}
          <div className="space-y-1">
            <div className="flex justify-between p-2 border-b border-black">
              <span dir="rtl">: المجموع</span>
              <span className="font-bold">{subtotal.toFixed(3)}</span>
              <span>Total :</span>
            </div>
            <div className="flex justify-between p-2 border-b border-black">
              <span dir="rtl">: الخصم</span>
              <span>{discount.toFixed(3)}</span>
              <span>Discount :</span>
            </div>
            <div className="flex justify-between p-2 border-b border-black">
              <span dir="rtl">: الإجمالى قبل الضريبة</span>
              <span className="font-bold">{(subtotal - discount).toFixed(3)}</span>
              <span>Before VAT :</span>
            </div>
            <div className="flex justify-between p-2 border-b border-black">
              <span dir="rtl">(15%) VAT</span>
              <span>{vatAmount.toFixed(3)}</span>
            </div>
            <div className="flex justify-between p-2 border-b border-black">
              <span dir="rtl">: خصم إضافى</span>
              <span>0.000</span>
              <span>Extra Dis. :</span>
            </div>
            <div className="flex justify-between p-2 bg-blue-50 font-bold text-sm">
              <span dir="rtl">: الإجمالى</span>
              <span>{total.toFixed(3)}</span>
              <span>Net Amount :</span>
            </div>
          </div>
        </div>

        <div className="border-t border-black p-2">
          <div><span className="font-bold">Note:</span> {notes || 'ملاحظات'}</div>
        </div>

        <div className="border-t border-black p-2 font-bold">
          {numberToWords(Math.round(total))}
        </div>

        <div className="border-t border-black p-2 print-break">
          <div className="grid grid-cols-3 gap-4 items-start">
            <div>
              <span className="font-bold">Receiver:</span> {receiverName || 'المستلم'}
              <div className="mt-1">SAJJAD HOSEN: Salesman <span dir="rtl">الشيخ</span></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-xs text-gray-600 mb-1" dir="rtl">رمز QR</div>
              <div className="text-xs text-gray-600 mb-1">QR Code</div>
              <div className="bg-white p-1 border border-gray-300">
                <QRCodeSVG 
                  value={`Invoice: ${invoiceNo}\nAmount: ${total.toFixed(3)} SAR\nDate: ${formatDate(date)}`}
                  size={80}
                  level="M"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">{invoiceNo}</div>
            </div>
            <div className="text-right">
              <div className="font-bold mb-2">Cashier:</div>
              <div>{cashierName || 'الصراف'}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-black p-2 text-center text-xs">
          <span dir="rtl">من هنا تصبح فاتورة بان المبلغ دائن عليها نما يقتضي علية السداد فور استلام والا الحق كالا بالرجوع الى منبوذه</span>
        </div>
      </div>
      )}
    </div>
  );
}
