import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Eye, Printer, Download, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
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
}

const ITEMS_PER_PAGE = 15;

export default function Invoices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive',
      });
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
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

  // Filter invoices based on search query (item name)
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

    // Sort by date
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [invoices, searchQuery, dateSort]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateSort]);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
    
    // Wait for dialog to open and render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const ITEMS_PER_PAGE = 15;
      const items = invoice.items || [];
      const itemPages = Math.ceil(items.length / ITEMS_PER_PAGE);
      const totalPages = itemPages + 1; // +1 for summary page
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm

      // Generate pages for items (10 per page)
      for (let page = 1; page <= itemPages; page++) {
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
            quotationPrice={invoice.quotation_price}
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
            showSummary={false}
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
          quotationPrice={invoice.quotation_price}
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

      pdf.save(`invoice-${invoice.invoice_no}.pdf`);

      toast({
        title: 'Success',
        description: 'Invoice downloaded as PDF',
      });
      
      setShowPreview(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoice_no}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
      
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
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
                {searchQuery 
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
                  quotationPrice={selectedInvoice.quotation_price}
                  items={selectedInvoice.items}
                  subtotal={selectedInvoice.subtotal}
                  discount={selectedInvoice.discount}
                  vatAmount={selectedInvoice.vat_amount}
                  total={selectedInvoice.total}
                  notes={selectedInvoice.notes}
                  receiverName={selectedInvoice.receiver_name}
                  cashierName={selectedInvoice.cashier_name}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
