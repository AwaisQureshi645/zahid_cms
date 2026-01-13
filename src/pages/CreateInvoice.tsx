import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Plus, Trash2, Save, Eye, Printer, Search, X, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import DashboardLayout from '@/components/DashboardLayout';
import { apiPost } from '@/lib/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { generateInvoiceQrCode } from '@/lib/zatcaQr';

interface Product {
  id: string;
  item_no: string;
  item_name: string | null;
  description: string;
  category: string | null;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  vat_percent: number;
}

interface InvoiceItem {
  product_id: string;
  item_no: string;
  item_name: string | null;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  vat_percent: number;
  total: number;
  vat_value: number;
  amount: number;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const ITEMS_PER_PAGE = 15;
  const SUMMARY_ITEMS_THRESHOLD = 9;
  
  // Product selection filters
  const [searchQuery, setSearchQuery] = useState('');
  const [itemNoSearchQuery, setItemNoSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerVatId, setCustomerVatId] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [isQuotation, setIsQuotation] = useState(false);
  const [cashWithoutTax, setCashWithoutTax] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  // Auto-fill customer information when customer name is entered
  useEffect(() => {
    if (!user?.id || !customerName.trim()) {
      // Clear fields if customer name is empty
      if (!customerName.trim()) {
        return;
      }
      return;
    }
    
    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(async () => {
      try {
        const customer = await apiGet<any>(
          `/api/customers/search?user_id=${encodeURIComponent(user.id)}&name=${encodeURIComponent(customerName.trim())}`
        );
        
        // Only auto-fill if customer is found and name matches exactly
        if (customer && customer.customer_name && 
            customer.customer_name.toLowerCase() === customerName.trim().toLowerCase()) {
          setCustomerPhone(customer.customer_phone || '');
          setCustomerVatId(customer.customer_vat_id || '');
          setCustomerAddress(customer.customer_address || '');
        }
      } catch (error) {
        // Silently fail - customer might not exist yet
        console.log('Customer not found');
      }
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [customerName, user?.id]);

  const fetchProducts = async () => {
    if (!user) {
      setLoadingProducts(false);
      return;
    }
    
    setLoadingProducts(true);
    try {
      const data = await apiGet<any[]>('/api/products');
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query (description)
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by item number search query
    if (itemNoSearchQuery) {
      filtered = filtered.filter(p => 
        p.item_no.toLowerCase().includes(itemNoSearchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    return filtered;
  }, [products, searchQuery, itemNoSearchQuery, selectedCategory]);

  // Handle product selection
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProductIds(newSelected);
  };

  // Select all filtered products
  const handleSelectAll = () => {
    const allFilteredIds = new Set(filteredProducts.map(p => p.id));
    setSelectedProductIds(allFilteredIds);
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedProductIds(new Set());
  };

  // Add selected products to invoice
  const addSelectedProductsToInvoice = () => {
    if (selectedProductIds.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one product',
        variant: 'destructive',
      });
      return;
    }

    const newItems: InvoiceItem[] = [];
    const itemsToUpdate: { index: number; quantity: number }[] = [];
    
    selectedProductIds.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const availableQuantity = product.quantity || 0;

      // Check if product already exists in invoice
      const existingIndex = invoiceItems.findIndex(item => item.product_id === productId);
      if (existingIndex >= 0) {
        // Check if increasing quantity would exceed available
        const currentInvoiceQty = invoiceItems[existingIndex].quantity;
        const newQuantity = currentInvoiceQty + 1;
        
        if (newQuantity > availableQuantity) {
          toast({
            title: 'Insufficient Stock',
            description: `Only ${availableQuantity} ${product.unit}(s) available for ${product.description || product.item_no}. You can only order the available quantity.`,
            variant: 'destructive',
          });
          // Limit to available quantity
          itemsToUpdate.push({ index: existingIndex, quantity: availableQuantity });
        } else {
          itemsToUpdate.push({ index: existingIndex, quantity: newQuantity });
        }
      } else {
        // Add new item - check if quantity 1 is available
        if (availableQuantity < 1) {
          toast({
            title: 'Out of Stock',
            description: `${product.description || product.item_no} is out of stock. Available quantity: ${availableQuantity}`,
            variant: 'destructive',
          });
          return;
        }
        
        const quantity = 1;
        const total = product.unit_price * quantity;
        const discountAmount = (total * (product.discount || 0)) / 100;
        const subtotal = total - discountAmount;
        const vat_value = (subtotal * (product.vat_percent || 0)) / 100;
        const amount = subtotal + vat_value;

        const newItem: InvoiceItem = {
          product_id: product.id,
          item_no: product.item_no,
          item_name: product.item_name,
          description: product.description,
          unit: product.unit,
          quantity: quantity,
          unit_price: product.unit_price,
          discount: product.discount || 0,
          vat_percent: product.vat_percent || 0,
          total: total,
          vat_value: vat_value,
          amount: amount,
        };
        newItems.push(newItem);
      }
    });

    // Apply updates
    if (itemsToUpdate.length > 0 || newItems.length > 0) {
      const updatedItems = [...invoiceItems];
      
      // Update existing items
      itemsToUpdate.forEach(({ index, quantity }) => {
        const item = updatedItems[index];
        item.quantity = quantity;
        item.total = item.unit_price * quantity;
        const discountAmount = (item.total * item.discount) / 100;
        const subtotal = item.total - discountAmount;
        item.vat_value = (subtotal * item.vat_percent) / 100;
        item.amount = subtotal + item.vat_value;
      });
      
      // Add new items
      if (newItems.length > 0) {
        updatedItems.push(...newItems);
      }
      
      setInvoiceItems(updatedItems);
    }
    
    // Clear selections after adding
    setSelectedProductIds(new Set());
    
    const totalProcessed = newItems.length + itemsToUpdate.length;
    if (totalProcessed > 0) {
      toast({
        title: 'Products Added',
        description: `${totalProcessed} product(s) ${newItems.length > 0 && itemsToUpdate.length > 0 ? 'added/updated' : newItems.length > 0 ? 'added' : 'updated'} to invoice`,
      });
    }
  };

  const updateItemQuantity = (index: number, newQty: number) => {
    const items = [...invoiceItems];
    const item = items[index];
    
    // Find the product to check available quantity
    const product = products.find(p => p.id === item.product_id);
    if (!product) {
      // If product not found, just ensure quantity is at least 1
      item.quantity = Math.max(1, newQty || 1);
      item.total = item.unit_price * item.quantity;
      const discountAmount = (item.total * item.discount) / 100;
      const subtotal = item.total - discountAmount;
      item.vat_value = (subtotal * item.vat_percent) / 100;
      item.amount = subtotal + item.vat_value;
      setInvoiceItems(items);
      return;
    }
    
    const availableQuantity = product.quantity || 0;
    const requestedQty = Math.max(1, newQty || 1);
    
    // Check if requested quantity exceeds available
    if (requestedQty > availableQuantity) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${availableQuantity} ${product.unit}(s) available for ${item.description || item.item_no}. You can only order the available quantity.`,
        variant: 'destructive',
      });
      // Limit to available quantity
      item.quantity = availableQuantity;
    } else {
      item.quantity = requestedQty;
    }
    
    item.total = item.unit_price * item.quantity;
    const discountAmount = (item.total * item.discount) / 100;
    const subtotal = item.total - discountAmount;
    item.vat_value = (subtotal * item.vat_percent) / 100;
    item.amount = subtotal + item.vat_value;
    
    setInvoiceItems(items);
  };

  const updateItemUnitPrice = (index: number, newUnitPrice: number) => {
    const items = [...invoiceItems];
    const item = items[index];
    
    item.unit_price = newUnitPrice;
    item.total = item.unit_price * item.quantity;
    const discountAmount = (item.total * item.discount) / 100;
    const subtotal = item.total - discountAmount;
    item.vat_value = (subtotal * item.vat_percent) / 100;
    item.amount = subtotal + item.vat_value;
    
    setInvoiceItems(items);
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    if (cashWithoutTax) {
      // When cashWithoutTax is checked, use unit_price * quantity (no VAT)
      const subtotal = invoiceItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const discount = 0;
      const beforeVat = subtotal - discount;
      const vatAmount = 0; // No VAT when cashWithoutTax is checked
      const total = subtotal; // Total is just unit_price * quantity
      
      return { subtotal, discount, beforeVat, vatAmount, total };
    } else {
      // Normal calculation with VAT
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
      const discount = 0;
      const beforeVat = subtotal - discount;
      const vatAmount = invoiceItems.reduce((sum, item) => sum + item.vat_value, 0);
      const total = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
      
      return { subtotal, discount, beforeVat, vatAmount, total };
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000);
    return `${year}${month}-${random}`;
  };

  const handleSave = async () => {
    if (invoiceItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to the invoice',
        variant: 'destructive',
      });
      return;
    }

    // Validate quantities before saving
    const quantityErrors: string[] = [];
    invoiceItems.forEach((item) => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        const availableQuantity = product.quantity || 0;
        if (item.quantity > availableQuantity) {
          quantityErrors.push(
            `${item.description || item.item_no}: Requested ${item.quantity}, but only ${availableQuantity} available`
          );
        }
      }
    });

    if (quantityErrors.length > 0) {
      toast({
        title: 'Insufficient Stock',
        description: `Cannot save invoice. ${quantityErrors.join('. ')}. Please adjust quantities.`,
        variant: 'destructive',
      });
      return;
    }

    const totals = calculateTotals();
    const invoiceNo = generateInvoiceNumber();

    // Save to Flask backend (primary storage)
    setIsSaving(true);
    try {
      const response = await apiPost<{ qr_code?: string }>('/api/invoices', {
        invoice_no: invoiceNo,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_vat_id: customerVatId,
        customer_address: customerAddress,
        quotation_price: isQuotation ? 'quotation' : null,
        items: invoiceItems,
        subtotal: totals.subtotal,
        discount: totals.discount,
        vat_amount: totals.vatAmount,
        total_amount: totals.total,
        currency: 'SAR',
        user_id: user?.id || '',
        notes: notes,
        receiver_name: receiverName,
        cashier_name: cashierName,
      });
      
      toast({ title: 'Invoice saved successfully' });
      navigate('/dashboard/invoices');
    } catch (e: any) {
      // If backend save fails, show error
      const errorMessage = e.message || 'Failed to save invoice';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Failed to save invoice to backend:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const totals = calculateTotals();

  const handlePrint = async () => {
    if (invoiceItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to the invoice',
        variant: 'destructive',
      });
      return;
    }

    const itemPages = Math.ceil(invoiceItems.length / ITEMS_PER_PAGE);
    const lastPageItemCount = itemPages > 0 ? invoiceItems.length - ITEMS_PER_PAGE * (itemPages - 1) : 0;
    const summaryFitsOnLastItemsPage = itemPages > 0 && lastPageItemCount <= SUMMARY_ITEMS_THRESHOLD;
    const needsSummaryPage = !summaryFitsOnLastItemsPage;
    const totalPages = itemPages + (needsSummaryPage ? 1 : 0);
    const invoiceNo = generateInvoiceNumber();
    const totals = calculateTotals();
    
    // Generate ZATCA QR code for print
    const invoiceDate = new Date();
    let qrCode: string | null = null;
    try {
      qrCode = generateInvoiceQrCode(invoiceDate, totals.total, totals.vatAmount);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }

    // Create a print container
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.style.position = 'fixed';
    printContainer.style.top = '0';
    printContainer.style.left = '0';
    printContainer.style.width = '210mm';
    printContainer.style.backgroundColor = '#ffffff';
    printContainer.style.zIndex = '9999';
    printContainer.style.opacity = '0';
    printContainer.style.pointerEvents = 'none';
    document.body.appendChild(printContainer);

    // Create a wrapper for all pages
    const pagesWrapper = document.createElement('div');
    pagesWrapper.className = 'print-wrapper';
    printContainer.appendChild(pagesWrapper);

    const roots: ReturnType<typeof createRoot>[] = [];

    // Generate pages for items
    for (let page = 1; page <= itemPages; page++) {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const pageItems = invoiceItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      
      const pageDiv = document.createElement('div');
      pageDiv.className = 'print-page';
      pageDiv.style.pageBreakAfter = page < itemPages || (needsSummaryPage && page === itemPages) ? 'always' : 'auto';
      pagesWrapper.appendChild(pageDiv);

      const root = createRoot(pageDiv);
      roots.push(root);
      root.render(
        <InvoiceTemplate
          invoiceNo={invoiceNo}
          date={new Date().toISOString().split('T')[0]}
          customerName={customerName}
          customerVatId={customerVatId}
          customerPhone={customerPhone}
          customerAddress={customerAddress}
          items={pageItems}
          subtotal={totals.subtotal}
          discount={totals.discount}
          vatAmount={totals.vatAmount}
          total={totals.total}
          notes={notes}
          receiverName={receiverName}
          cashierName={cashierName}
          currentPage={page}
          totalPages={totalPages}
          startIndex={startIndex}
          showSummary={summaryFitsOnLastItemsPage && page === itemPages}
          isQuotation={isQuotation}
          qrCode={qrCode}
        />
      );
    }

    if (needsSummaryPage) {
      const summaryPageDiv = document.createElement('div');
      summaryPageDiv.className = 'print-page';
      pagesWrapper.appendChild(summaryPageDiv);

      const summaryRoot = createRoot(summaryPageDiv);
      roots.push(summaryRoot);
      summaryRoot.render(
        <InvoiceTemplate
          invoiceNo={invoiceNo}
          date={new Date().toISOString().split('T')[0]}
          customerName={customerName}
          customerVatId={customerVatId}
          customerPhone={customerPhone}
          customerAddress={customerAddress}
          items={[]}
          subtotal={totals.subtotal}
          discount={totals.discount}
          vatAmount={totals.vatAmount}
          total={totals.total}
          notes={notes}
          receiverName={receiverName}
          cashierName={cashierName}
          currentPage={totalPages}
          totalPages={totalPages}
          startIndex={invoiceItems.length}
          showSummary={true}
          isQuotation={isQuotation}
          qrCode={qrCode}
        />
      );
    }

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 800));

    // Add print styles
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.textContent = `
      @media screen {
        #print-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 210mm;
          background: white;
          z-index: 9999;
          overflow: visible;
          opacity: 0;
          pointer-events: none;
        }
      }
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 210mm;
          height: auto;
        }
        body > *:not(#print-container) {
          display: none !important;
        }
        #print-container {
          display: block !important;
          position: relative !important;
          left: 0 !important;
          top: 0 !important;
          width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          z-index: 1 !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        .print-page {
          page-break-after: always;
          page-break-inside: avoid;
          width: 210mm;
          min-height: 297mm;
        }
        .print-page:last-child {
          page-break-after: auto;
        }
      }
    `;
    document.head.appendChild(printStyles);

    // Small delay to ensure styles are applied
    await new Promise(resolve => setTimeout(resolve, 200));

    // Trigger print
    window.print();

    // Cleanup after print dialog closes
    const cleanup = () => {
      // Hide container first
      printContainer.style.opacity = '0';
      printContainer.style.pointerEvents = 'none';
      
      // Unmount all React roots
      roots.forEach(root => {
        try {
          root.unmount();
        } catch (e) {
          // Ignore unmount errors
        }
      });
      
      // Remove print container
      if (printContainer.parentNode) {
        document.body.removeChild(printContainer);
      }
      
      // Remove print styles
      const styles = document.getElementById('print-styles');
      if (styles && styles.parentNode) {
        document.head.removeChild(styles);
      }
    };

    // Use beforeprint and afterprint events for better cleanup
    const handleAfterPrint = () => {
      cleanup();
      window.removeEventListener('afterprint', handleAfterPrint);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    // Fallback cleanup after a delay (in case afterprint doesn't fire)
    setTimeout(() => {
      if (printContainer.parentNode) {
        cleanup();
        window.removeEventListener('afterprint', handleAfterPrint);
      }
    }, 2000);
  };

  const handleSaveAsPDF = async () => {
    if (invoiceItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to the invoice',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const itemPages = Math.ceil(invoiceItems.length / ITEMS_PER_PAGE);
      const lastPageItemCount = itemPages > 0 ? invoiceItems.length - ITEMS_PER_PAGE * (itemPages - 1) : 0;
      const summaryFitsOnLastItemsPage = itemPages > 0 && lastPageItemCount <= SUMMARY_ITEMS_THRESHOLD;
      const needsSummaryPage = !summaryFitsOnLastItemsPage;
      const totalPages = itemPages + (needsSummaryPage ? 1 : 0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgWidth = 210; // A4 width in mm
      const invoiceNo = generateInvoiceNumber();
      
      // Generate ZATCA QR code for PDF
      const invoiceDate = new Date();
      let qrCode: string | null = null;
      try {
        qrCode = generateInvoiceQrCode(invoiceDate, totals.total, totals.vatAmount);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }

      // Generate pages for items (10 per page)
      for (let page = 1; page <= itemPages; page++) {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const pageItems = invoiceItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        
        // Create a temporary container for this page
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempDiv);

        // Render invoice template for this page
        const root = createRoot(tempDiv);
        root.render(
          <InvoiceTemplate
            invoiceNo={invoiceNo}
            date={new Date().toISOString().split('T')[0]}
            customerName={customerName}
            customerVatId={customerVatId}
            customerPhone={customerPhone}
            customerAddress={customerAddress}
            items={pageItems}
            subtotal={totals.subtotal}
            discount={totals.discount}
            vatAmount={totals.vatAmount}
            total={totals.total}
            notes={notes}
            receiverName={receiverName}
            cashierName={cashierName}
            currentPage={page}
            totalPages={totalPages}
            startIndex={startIndex}
            showSummary={summaryFitsOnLastItemsPage && page === itemPages}
            isQuotation={isQuotation}
            qrCode={qrCode}
          />
        );

        await new Promise(resolve => setTimeout(resolve, 300));

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: tempDiv.scrollWidth,
          windowHeight: tempDiv.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (page > 1) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Cleanup
        root.unmount();
        document.body.removeChild(tempDiv);
      }

      // Generate summary page
      if (needsSummaryPage) {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempDiv);

        const root = createRoot(tempDiv);
        root.render(
          <InvoiceTemplate
            invoiceNo={invoiceNo}
            date={new Date().toISOString().split('T')[0]}
            customerName={customerName}
            customerVatId={customerVatId}
            customerPhone={customerPhone}
            customerAddress={customerAddress}
            items={[]}
            subtotal={totals.subtotal}
            discount={totals.discount}
            vatAmount={totals.vatAmount}
            total={totals.total}
            notes={notes}
            receiverName={receiverName}
            cashierName={cashierName}
            currentPage={totalPages}
            totalPages={totalPages}
            startIndex={invoiceItems.length}
            showSummary={true}
            isQuotation={isQuotation}
            qrCode={qrCode}
          />
        );

        await new Promise(resolve => setTimeout(resolve, 300));

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: tempDiv.scrollWidth,
          windowHeight: tempDiv.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Cleanup
        root.unmount();
        document.body.removeChild(tempDiv);
      }

      pdf.save(`invoice-${invoiceNo}.pdf`);

      toast({
        title: 'Success',
        description: 'Invoice downloaded as PDF',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <DashboardLayout title="Create Invoice">
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button> */}
            {/* <div>
              <h1 className="text-3xl font-bold">Create Invoice</h1>
              <p className="text-muted-foreground">Generate a new invoice</p>
            </div> */}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handlePrint}
              disabled={invoiceItems.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveAsPDF}
              disabled={invoiceItems.length === 0 || isGeneratingPDF}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Save as PDF'}
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={isSaving || invoiceItems.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
       

          <Card>
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by item number..."
                    value={itemNoSearchQuery}
                    onChange={(e) => setItemNoSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {itemNoSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setItemNoSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={handleSelectAll}
                  disabled={filteredProducts.length === 0}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClearSelection}
                  disabled={selectedProductIds.size === 0}
                >
                  Clear
                </Button>
                <Button 
                  onClick={addSelectedProductsToInvoice}
                  disabled={selectedProductIds.size === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Selected ({selectedProductIds.size})
                </Button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto mb-6 border rounded-lg">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Item No.</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Discount %</TableHead>
                        <TableHead>VAT 15%</TableHead>
                        <TableHead>Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingProducts ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            Loading products...
                          </TableCell>
                        </TableRow>
                      ) : filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No products found. {searchQuery || itemNoSearchQuery || selectedCategory !== 'all' ? 'Try adjusting your filters.' : 'Add products to your inventory first.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => (
                          <TableRow
                            key={product.id}
                            className={`cursor-pointer ${
                              selectedProductIds.has(product.id) ? 'bg-muted' : ''
                            } hover:bg-muted/50`}
                            onClick={() => toggleProductSelection(product.id)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedProductIds.has(product.id)}
                                onCheckedChange={() => toggleProductSelection(product.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{product.item_no}</TableCell>
                            <TableCell>{product.description}</TableCell>
                            <TableCell>{product.category || '-'}</TableCell>
                            <TableCell>{product.unit}</TableCell>
                            <TableCell>{product.unit_price.toFixed(2)}</TableCell>
                            <TableCell>{product.discount.toFixed(2)}</TableCell>
                            <TableCell>{product.vat_percent}</TableCell>
                            <TableCell className="font-medium">{product.unit_price.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Invoice Items Table */}
              {invoiceItems.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Invoice Items</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all invoice items?')) {
                          setInvoiceItems([]);
                          toast({
                            title: 'Cleared',
                            description: 'All invoice items have been removed',
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                  <div className="overflow-x-auto border rounded-lg">
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead>Item No.</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>U.Price</TableHead>
                            <TableHead>Dis.%</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>VAT%</TableHead>
                            <TableHead>VAT Value</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.item_no}</TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.quantity || 1}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    updateItemQuantity(index, isNaN(val) ? 1 : val);
                                  }}
                                  className="w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  min="1"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) => updateItemUnitPrice(index, parseFloat(e.target.value) || 0)}
                                  className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </TableCell>
                              <TableCell>{item.discount.toFixed(2)}</TableCell>
                              <TableCell>{item.total.toFixed(2)}</TableCell>
                              <TableCell>{item.vat_percent}</TableCell>
                              <TableCell>{item.vat_value.toFixed(2)}</TableCell>
                              <TableCell className="font-bold">{item.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeItem(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>




          {invoiceItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">{totals.subtotal.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>{totals.discount.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Before VAT:</span>
                    <span className="font-bold">{totals.beforeVat.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span>{totals.vatAmount.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Net Amount:</span>
                    <span>{totals.total.toFixed(3)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


<Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>VAT ID</Label>
                  <Input
                    value={customerVatId}
                    onChange={(e) => setCustomerVatId(e.target.value)}
                    placeholder="Enter VAT ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quotation</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="quotation-checkbox-create"
                      checked={isQuotation}
                      onCheckedChange={(checked) => setIsQuotation(checked === true)}
                    />
                    <label
                      htmlFor="quotation-checkbox-create"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Enable Quotation
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cash Without Tax</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="cash-without-tax-checkbox-create"
                      checked={cashWithoutTax}
                      onCheckedChange={(checked) => setCashWithoutTax(checked === true)}
                    />
                    <label
                      htmlFor="cash-without-tax-checkbox-create"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Cash Without Tax
                    </label>
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Receiver Name</Label>
                  <Input
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="Enter receiver name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cashier Name</Label>
                  <Input
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    placeholder="Enter cashier name"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden invoice template for PDF generation */}
      <div 
        className="fixed -left-[9999px] -top-[9999px] w-[210mm] bg-white"
        ref={invoiceRef}
        style={{ width: '210mm' }}
      >
        <InvoiceTemplate
          invoiceNo={generateInvoiceNumber()}
          date={new Date().toISOString().split('T')[0]}
          customerName={customerName}
          customerVatId={customerVatId}
          customerPhone={customerPhone}
          customerAddress={customerAddress}
          items={invoiceItems}
          subtotal={totals.subtotal}
          discount={totals.discount}
          vatAmount={totals.vatAmount}
          total={totals.total}
          notes={notes}
          receiverName={receiverName}
          cashierName={cashierName}
          isQuotation={isQuotation}
          qrCode={(() => {
            try {
              return generateInvoiceQrCode(new Date(), totals.total, totals.vatAmount);
            } catch {
              return null;
            }
          })()}
        />
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <InvoiceTemplate
            invoiceNo={generateInvoiceNumber()}
            date={new Date().toISOString().split('T')[0]}
            customerName={customerName}
            customerVatId={customerVatId}
            customerPhone={customerPhone}
            customerAddress={customerAddress}
            items={invoiceItems}
            subtotal={totals.subtotal}
            discount={totals.discount}
            vatAmount={totals.vatAmount}
            total={totals.total}
            notes={notes}
            receiverName={receiverName}
            cashierName={cashierName}
            isQuotation={isQuotation}
            qrCode={(() => {
              try {
                return generateInvoiceQrCode(new Date(), totals.total, totals.vatAmount);
              } catch {
                return null;
              }
            })()}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}