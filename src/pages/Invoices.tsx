import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Eye, Printer, Download, Trash2, Search, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiDelete } from '@/lib/api';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import DashboardLayout from '@/components/DashboardLayout';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Invoice {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_vat_id: string;
  customer_phone: string;
  customer_address: string;
  quotation_price: string;
  items: any[];
  subtotal: number;
  discount: number;
  vat_amount: number;
  total: number;
  notes: string;
  receiver_name: string;
  cashier_name: string;
  created_at: string;
  qr_code?: string | null;
}

const ITEMS_PER_PAGE = 15;
const SUMMARY_ITEMS_THRESHOLD = 9;

export default function Invoices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('Preparing download...');
  
  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;
    
    try {
      const data = await apiGet<Invoice[]>('/api/invoices');
      setInvoices(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch invoices',
        variant: 'destructive',
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Get item names from invoice items
  const getItemNames = (items: any[]): string => {
    if (!items || items.length === 0) return 'N/A';
    const names = items
      .map(item => item.item_name || item.description || item.item_no)
      .filter(Boolean)
      .slice(0, 3); // Show first 3 item names
    return names.join(', ') + (items.length > 3 ? '...' : '');
  };

  // Filter invoices based on search query (item name and customer name)
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Filter by search query (item name)
    if (searchQuery) {
      filtered = filtered.filter(invoice => {
        const itemNames = invoice.items
          .map((item: any) => 
            (item.item_name || item.description || item.item_no || '').toLowerCase()
          )
          .join(' ');
        return itemNames.includes(searchQuery.toLowerCase());
      });
    }

    // Filter by customer name search query
    if (customerSearchQuery) {
      filtered = filtered.filter(invoice => {
        const customerName = (invoice.customer_name || '').toLowerCase();
        return customerName.includes(customerSearchQuery.toLowerCase());
      });
    }

    // Sort by date
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [invoices, searchQuery, customerSearchQuery, dateSort]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, customerSearchQuery, dateSort]);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };
  
  // Helper function to check if invoice is a quotation
  const isInvoiceQuotation = (invoice: Invoice): boolean => {
    return !!(invoice.quotation_price && invoice.quotation_price.trim() !== '');
  };

  const handlePrintInvoice = async (invoice: Invoice) => {
    const items = invoice.items || [];
    const itemPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const lastPageItemCount = itemPages > 0 ? items.length - ITEMS_PER_PAGE * (itemPages - 1) : 0;
    const summaryFitsOnLastItemsPage = itemPages > 0 && lastPageItemCount <= SUMMARY_ITEMS_THRESHOLD;
    const needsSummaryPage = !summaryFitsOnLastItemsPage;
    const totalPages = itemPages + (needsSummaryPage ? 1 : 0);
    
    // Format date for display (YYYY-MM-DD)
    const invoiceDate = invoice.created_at ? new Date(invoice.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

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
      const pageItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      
      const pageDiv = document.createElement('div');
      pageDiv.className = 'print-page';
      pageDiv.style.pageBreakAfter = page < itemPages || (needsSummaryPage && page === itemPages) ? 'always' : 'auto';
      pagesWrapper.appendChild(pageDiv);

      const root = createRoot(pageDiv);
      roots.push(root);
      root.render(
        <InvoiceTemplate
          invoiceNo={invoice.invoice_no}
          date={invoiceDate}
          customerName={invoice.customer_name}
          customerVatId={invoice.customer_vat_id}
          customerPhone={invoice.customer_phone}
          customerAddress={invoice.customer_address}
          items={pageItems}
          subtotal={invoice.subtotal}
          discount={invoice.discount}
          vatAmount={invoice.vat_amount}
          total={invoice.total}
          notes={invoice.notes}
          receiverName={invoice.receiver_name}
          cashierName={invoice.cashier_name}
          currentPage={page}
          totalPages={totalPages}
          startIndex={startIndex}
          showSummary={summaryFitsOnLastItemsPage && page === itemPages}
          isQuotation={isInvoiceQuotation(invoice)}
          qrCode={invoice.qr_code}
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
          invoiceNo={invoice.invoice_no}
          date={invoiceDate}
          customerName={invoice.customer_name}
          customerVatId={invoice.customer_vat_id}
          customerPhone={invoice.customer_phone}
          customerAddress={invoice.customer_address}
          items={[]}
          subtotal={invoice.subtotal}
          discount={invoice.discount}
          vatAmount={invoice.vat_amount}
          total={invoice.total}
          notes={invoice.notes}
          receiverName={invoice.receiver_name}
          cashierName={invoice.cashier_name}
          currentPage={totalPages}
          totalPages={totalPages}
          startIndex={items.length}
          showSummary={true}
          isQuotation={isInvoiceQuotation(invoice)}
          qrCode={invoice.qr_code}
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

  const handleDownloadInvoice = async (invoice: Invoice) => {
    setShowDownloadDialog(true);
    setDownloadMessage('Preparing download...');
    
    try {
      const items = invoice.items || [];
      const itemPages = Math.ceil(items.length / ITEMS_PER_PAGE);
      const lastPageItemCount = itemPages > 0 ? items.length - ITEMS_PER_PAGE * (itemPages - 1) : 0;
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

      if (itemPages === 0) {
        setDownloadMessage('Generating summary...');
      }

      for (let page = 1; page <= itemPages; page++) {
        setDownloadMessage(`Generating page ${page} of ${needsSummaryPage ? totalPages - 1 : totalPages}...`);
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const pageItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        
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
            invoiceNo={invoice.invoice_no}
            date={invoice.created_at}
            customerName={invoice.customer_name}
            customerVatId={invoice.customer_vat_id}
            customerPhone={invoice.customer_phone}
            customerAddress={invoice.customer_address}
            items={pageItems}
            subtotal={invoice.subtotal}
            discount={invoice.discount}
            vatAmount={invoice.vat_amount}
            total={invoice.total}
            notes={invoice.notes}
            receiverName={invoice.receiver_name}
            cashierName={invoice.cashier_name}
            currentPage={page}
            totalPages={totalPages}
            startIndex={startIndex}
            showSummary={summaryFitsOnLastItemsPage && page === itemPages}
            isQuotation={isInvoiceQuotation(invoice)}
            qrCode={invoice.qr_code}
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

      if (needsSummaryPage || itemPages === 0) {
        setDownloadMessage('Generating summary...');
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempDiv);

        const root = createRoot(tempDiv);
        root.render(
          <InvoiceTemplate
            invoiceNo={invoice.invoice_no}
            date={invoice.created_at}
            customerName={invoice.customer_name}
            customerVatId={invoice.customer_vat_id}
            customerPhone={invoice.customer_phone}
            customerAddress={invoice.customer_address}
            items={[]}
            subtotal={invoice.subtotal}
            discount={invoice.discount}
            vatAmount={invoice.vat_amount}
            total={invoice.total}
            notes={invoice.notes}
            receiverName={invoice.receiver_name}
            cashierName={invoice.cashier_name}
            currentPage={totalPages || 1}
            totalPages={totalPages || 1}
            startIndex={items.length}
            showSummary={true}
            isQuotation={isInvoiceQuotation(invoice)}
            qrCode={invoice.qr_code}
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

        if (itemPages > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Cleanup
        root.unmount();
        document.body.removeChild(tempDiv);
      }

      pdf.save(`invoice-${invoice.invoice_no}.pdf`);

      toast({
        title: 'Success',
        description: 'Invoice downloaded as PDF',
      });
      setDownloadMessage('Download complete');
      await new Promise(resolve => setTimeout(resolve, 600));
      setShowDownloadDialog(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
      setDownloadMessage('Failed to download invoice');
      await new Promise(resolve => setTimeout(resolve, 1200));
      setShowDownloadDialog(false);
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoice_no}?`)) {
      return;
    }

    try {
      await apiDelete(`/api/invoices/${invoice.id}`);

      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
      
      fetchInvoices();
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout title="Invoices">
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
          
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by item name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
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
                  placeholder="Search by customer name..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {customerSearchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setCustomerSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={dateSort} onValueChange={(value: 'newest' | 'oldest') => setDateSort(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Invoices</CardTitle>
              {filteredInvoices.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} invoices
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Loading invoices...</p>
            ) : filteredInvoices.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || customerSearchQuery
                  ? 'No invoices found matching your search.' 
                  : 'No invoices yet. Create your first invoice!'}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice No.</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                          <TableCell>{invoice.customer_name || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {getItemNames(invoice.items)}
                          </TableCell>
                          <TableCell>{invoice.items.length}</TableCell>
                          <TableCell className="font-bold">
                            {invoice.total.toFixed(2)} SAR
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintInvoice(invoice)}
                                title="Print Invoice"
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadInvoice(invoice)}
                                title="Download Invoice"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewInvoice(invoice)}
                                title="View Invoice"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteInvoice(invoice)}
                                title="Delete Invoice"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Button
                            variant="ghost"
                            size="default"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="gap-1 pl-2.5"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>Previous</span>
                          </Button>
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <Button
                              variant={currentPage === page ? "outline" : "ghost"}
                              size="icon"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <Button
                            variant="ghost"
                            size="default"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="gap-1 pr-2.5"
                          >
                            <span>Next</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <div ref={invoiceRef}>
                <InvoiceTemplate
                  invoiceNo={selectedInvoice.invoice_no}
                  date={selectedInvoice.created_at}
                  customerName={selectedInvoice.customer_name}
                  customerVatId={selectedInvoice.customer_vat_id}
                  customerPhone={selectedInvoice.customer_phone}
                  customerAddress={selectedInvoice.customer_address}
                  items={selectedInvoice.items}
                  subtotal={selectedInvoice.subtotal}
                  discount={selectedInvoice.discount}
                  vatAmount={selectedInvoice.vat_amount}
                  total={selectedInvoice.total}
                  notes={selectedInvoice.notes}
                  receiverName={selectedInvoice.receiver_name}
                  cashierName={selectedInvoice.cashier_name}
                  isQuotation={isInvoiceQuotation(selectedInvoice)}
                  qrCode={selectedInvoice.qr_code}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showDownloadDialog} onOpenChange={(open) => { if (!open) setShowDownloadDialog(false); }}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <h3 className="text-base font-semibold">Downloading invoice</h3>
              <p className="text-sm text-muted-foreground mt-1">{downloadMessage}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}