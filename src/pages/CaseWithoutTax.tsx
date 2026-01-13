import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Package, DollarSign, AlertTriangle, BarChart3, User, Filter, Calendar, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Dot } from 'recharts';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'custom';

interface Invoice {
  id: string;
  invoice_no: string;
  subtotal: number;
  total: number;
  created_at: string;
  items: Array<{
    product_id: string;
    item_no: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

interface PurchaseProduct {
  id: string;
  item_no: string;
  quantity: number;
  unit_price: number;
}

interface Product {
  id: string;
  item_no: string;
  quantity: number;
  unit_price: number;
}

export default function CaseWithoutTax() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalRevenueWithoutTax: 0,
    inventoryValue: 0,
    totalInvoices: 0,
    profile: 0,
  });

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchaseProducts, setPurchaseProducts] = useState<PurchaseProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date();
    end.setHours(23, 59, 59, 999);

    switch (dateRange) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start = new Date(now);
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
        } else {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          start.setHours(0, 0, 0, 0);
          end = new Date(now);
          end.setHours(23, 59, 59, 999);
        }
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { start, end } = getDateRange();

      // Fetch invoices, purchase products, and products
      const [invoicesRes, purchaseProductsRes, productsRes] = await Promise.all([
        apiGet<any[]>('/api/invoices'),
        apiGet<any[]>('/api/purchase-products'),
        apiGet<any[]>('/api/products'),
      ]);

      // Filter invoices by date range
      const allInvoices = invoicesRes || [];
      const fetchedInvoices = allInvoices.filter((inv: any) => {
        const invDate = new Date(inv.created_at);
        return invDate >= start && invDate <= end;
      });

      const fetchedPurchaseProducts = purchaseProductsRes || [];
      const fetchedProducts = productsRes || [];

      setInvoices(fetchedInvoices);
      setPurchaseProducts(fetchedPurchaseProducts);
      setProducts(fetchedProducts);

      // Calculate Total Products: Count unique products sold from invoices
      const uniqueProducts = new Set<string>();
      fetchedInvoices.forEach((inv: any) => {
        if (inv.items && Array.isArray(inv.items)) {
          inv.items.forEach((item: any) => {
            if (item.product_id) {
              uniqueProducts.add(item.product_id);
            }
          });
        }
      });
      const totalProducts = uniqueProducts.size;

      // Create a map of item_no to purchase product for quick lookup
      const purchaseProductMap = new Map<string, { unit_price: number; quantity: number }>();
      fetchedPurchaseProducts.forEach((pp: any) => {
        if (pp.item_no) {
          const unitPrice = parseFloat(String(pp.unit_price || 0));
          const quantity = parseFloat(String(pp.quantity || 0));
          if (Number.isFinite(unitPrice) && Number.isFinite(quantity)) {
            if (!purchaseProductMap.has(pp.item_no)) {
              purchaseProductMap.set(pp.item_no, { unit_price: unitPrice, quantity: quantity });
            }
          }
        }
      });

      // Calculate Total Revenue: Sum of (sale_price * quantity) from invoice items
      // Calculate Inventory Value: Sum of (purchase_price * quantity) from purchase_products
      // Calculate Total Invoices: Count of invoices
      // Calculate Profile: Sum of total profit (will be calculated from productProfitData)
      let totalRevenueWithoutTax = 0;
      let totalInvoices = 0;
      let inventoryValue = 0;

      // Calculate Total Invoices: Count of invoices
      totalInvoices = fetchedInvoices.length;

      fetchedInvoices.forEach((inv: any) => {
        if (inv.items && Array.isArray(inv.items)) {
          inv.items.forEach((item: any) => {
            const itemNo = item.item_no;
            const quantity = parseFloat(String(item.quantity || 0));
            const salePrice = parseFloat(String(item.unit_price || 0));
            
            // Total Revenue: sale_price * quantity
            if (Number.isFinite(salePrice) && Number.isFinite(quantity)) {
              totalRevenueWithoutTax += salePrice * quantity;
            }

            // Inventory Value: purchase_price * quantity
            if (itemNo && purchaseProductMap.has(itemNo)) {
              const purchaseProduct = purchaseProductMap.get(itemNo)!;
              const purchasePrice = purchaseProduct.unit_price;
              if (Number.isFinite(purchasePrice) && Number.isFinite(quantity)) {
                inventoryValue += purchasePrice * quantity;
              }
            }
          });
        }
      });

      // Calculate Profile: Sum of total profit from productProfitData
      // We'll calculate this from the productProfitData useMemo hook
      let totalProfile = 0;
      const purchaseProductMapForProfile = new Map<string, { unit_price: number; quantity: number }>();
      fetchedPurchaseProducts.forEach((pp: any) => {
        if (pp.item_no) {
          const unitPrice = parseFloat(String(pp.unit_price || 0));
          const quantity = parseFloat(String(pp.quantity || 0));
          if (Number.isFinite(unitPrice) && Number.isFinite(quantity)) {
            if (!purchaseProductMapForProfile.has(pp.item_no)) {
              purchaseProductMapForProfile.set(pp.item_no, { unit_price: unitPrice, quantity: quantity });
            }
          }
        }
      });

      fetchedInvoices.forEach((inv: any) => {
        if (inv.items && Array.isArray(inv.items)) {
          inv.items.forEach((item: any) => {
            const itemNo = item.item_no;
            const quantity = parseFloat(String(item.quantity || 0));
            const salePrice = parseFloat(String(item.unit_price || 0));
            
            if (itemNo && purchaseProductMapForProfile.has(itemNo) && Number.isFinite(quantity) && Number.isFinite(salePrice)) {
              const purchaseProduct = purchaseProductMapForProfile.get(itemNo)!;
              const purchasePrice = purchaseProduct.unit_price;
              const profitPerUnit = salePrice - purchasePrice;
              const totalProfit = profitPerUnit * quantity;
              if (Number.isFinite(totalProfit)) {
                totalProfile += totalProfit;
              }
            }
          });
        }
      });

      setStats({
        totalProducts,
        totalRevenueWithoutTax,
        inventoryValue,
        totalInvoices,
        profile: totalProfile,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Product Profit Data: Combine invoice items with purchase product data
  const productProfitData = useMemo(() => {
    // Create a map of item_no to purchase product for quick lookup
    const purchaseProductMap = new Map<string, { unit_price: number; quantity: number }>();
    purchaseProducts.forEach((pp: any) => {
      if (pp.item_no) {
        const unitPrice = parseFloat(String(pp.unit_price || 0));
        const quantity = parseFloat(String(pp.quantity || 0));
        if (Number.isFinite(unitPrice) && Number.isFinite(quantity)) {
          if (!purchaseProductMap.has(pp.item_no)) {
            purchaseProductMap.set(pp.item_no, { unit_price: unitPrice, quantity: quantity });
          }
        }
      }
    });

    // Aggregate invoice items by item_no
    const itemMap = new Map<string, {
      item_no: string;
      description: string;
      quantity: number;
      sale_price: number;
      purchase_price: number;
      profit: number;
    }>();

    invoices.forEach((inv: any) => {
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item: any) => {
          const itemNo = item.item_no || '';
          const description = item.description || item.item_name || itemNo;
          const quantity = parseFloat(String(item.quantity || 0));
          const salePrice = parseFloat(String(item.unit_price || 0));
          
          if (itemNo && Number.isFinite(quantity) && Number.isFinite(salePrice)) {
            const purchasePrice = purchaseProductMap.has(itemNo) 
              ? purchaseProductMap.get(itemNo)!.unit_price 
              : 0;

            if (itemMap.has(itemNo)) {
              const existing = itemMap.get(itemNo)!;
              existing.quantity += quantity;
              // For sale price, we'll use the average or keep the latest
              existing.sale_price = salePrice; // Using latest sale price
            } else {
              const profit = salePrice - purchasePrice;
              itemMap.set(itemNo, {
                item_no: itemNo,
                description: description,
                quantity: quantity,
                sale_price: salePrice,
                purchase_price: purchasePrice,
                profit: profit,
              });
            }
          }
        });
      }
    });

    // Convert map to array and calculate total profit per item
    const result = Array.from(itemMap.values()).map(item => ({
      ...item,
      total_profit: item.profit * item.quantity,
    }));

    return result.sort((a, b) => b.total_profit - a.total_profit);
  }, [invoices, purchaseProducts]);

  // Pagination calculations
  const totalPages = Math.ceil(productProfitData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProductProfitData = productProfitData.slice(startIndex, endIndex);

  // Get visible pages for pagination
  const getVisiblePages = () => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    } else if (currentPage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
    }
  };
  const visiblePages = getVisiblePages();

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [productProfitData.length]);

  // PDF Generation function
  const handleSaveAsPDF = () => {
    if (productProfitData.length === 0) {
      toast({
        title: 'Error',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const tableStartY = 40;
      let currentY = tableStartY;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Product Profit Analysis', margin, 20);
      
      // Date range info
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const dateRangeText = dateRange === 'custom' 
        ? `${customStartDate} to ${customEndDate}`
        : dateRange.charAt(0).toUpperCase() + dateRange.slice(1);
      pdf.text(`Date Range: ${dateRangeText}`, margin, 30);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 30);

      // Table headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const colWidths = [25, 50, 20, 25, 25, 25, 25];
      const headers = ['Item No.', 'Description', 'Qty', 'Purchase Price', 'Sale Price', 'Profit/Unit', 'Total Profit'];
      let xPos = margin;

      // Draw header background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, tableStartY - 8, pageWidth - 2 * margin, 8, 'F');

      // Draw header text
      headers.forEach((header, index) => {
        pdf.text(header, xPos, tableStartY - 2);
        xPos += colWidths[index];
      });

      // Draw line under header
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, tableStartY, pageWidth - margin, tableStartY);

      currentY = tableStartY + 8;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);

      productProfitData.forEach((item, index) => {
        // Check if we need a new page
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = margin + 8;
          
          // Redraw header on new page
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, margin, pageWidth - 2 * margin, 8, 'F');
          xPos = margin;
          headers.forEach((header, idx) => {
            pdf.text(header, xPos, margin + 6);
            xPos += colWidths[idx];
          });
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, margin + 8, pageWidth - margin, margin + 8);
          currentY = margin + 16;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
        }

        xPos = margin;
        const rowData = [
          item.item_no || '-',
          item.description || '-',
          item.quantity.toString(),
          item.purchase_price > 0 ? `${item.purchase_price.toFixed(2)} SAR` : '-',
          `${item.sale_price.toFixed(2)} SAR`,
          `${item.profit.toFixed(2)} SAR`,
          `${item.total_profit.toFixed(2)} SAR`,
        ];

        rowData.forEach((cell, cellIndex) => {
          // Wrap text if needed for description column
          if (cellIndex === 1 && cell.length > 30) {
            const lines = pdf.splitTextToSize(cell, colWidths[cellIndex] - 2);
            pdf.text(lines[0], xPos, currentY);
            if (lines.length > 1) {
              pdf.text(lines[1], xPos, currentY + 4);
            }
          } else {
            pdf.text(cell, xPos, currentY);
          }
          xPos += colWidths[cellIndex];
        });

        // Draw line under row
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, currentY + 4, pageWidth - margin, currentY + 4);

        currentY += 8;
      });

      // Summary at the end
      currentY += 5;
      if (currentY > pageHeight - 30) {
        pdf.addPage();
        currentY = margin + 10;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setDrawColor(0, 0, 0);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;

      pdf.text('Summary:', margin, currentY);
      currentY += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      const totalQuantity = productProfitData.reduce((sum, item) => sum + item.quantity, 0);
      const totalProfit = productProfitData.reduce((sum, item) => sum + item.total_profit, 0);
      
      pdf.text(`Total Items: ${productProfitData.length}`, margin, currentY);
      pdf.text(`Total Quantity: ${totalQuantity}`, margin + 60, currentY);
      pdf.text(`Total Profit: ${totalProfit.toFixed(2)} SAR`, pageWidth - margin - 50, currentY);

      // Save PDF
      const fileName = `Product_Profit_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'Success',
        description: 'PDF exported successfully',
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

  // Sales Performance Data - show each invoice by creation time
  const salesData = useMemo(() => {
    const data: Array<{ date: string; revenue: number; timestamp: number }> = [];
    
    invoices.forEach(invoice => {
      try {
        const invoiceDate = new Date(invoice.created_at);
        const timestamp = invoiceDate.getTime();
        
        // Format date and time for display (e.g., "Jan 11, 10:30")
        const date = invoiceDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Calculate total revenue from invoice items (sale_price * quantity)
        let invoiceRevenue = 0;
        if (invoice.items && Array.isArray(invoice.items)) {
          invoice.items.forEach((item: any) => {
            const salePrice = parseFloat(String(item.unit_price || 0));
            const quantity = parseFloat(String(item.quantity || 0));
            if (Number.isFinite(salePrice) && Number.isFinite(quantity)) {
              invoiceRevenue += salePrice * quantity;
            }
          });
        }
        
        // Only add if revenue is valid and greater than 0
        if (Number.isFinite(invoiceRevenue) && invoiceRevenue >= 0 && !isNaN(timestamp)) {
          data.push({
            date: date,
            revenue: Number(invoiceRevenue.toFixed(2)),
            timestamp: timestamp
          });
        }
      } catch (error) {
        console.error('Error processing invoice:', invoice, error);
      }
    });

    // Sort by timestamp (oldest to newest)
    const sorted = data.sort((a, b) => a.timestamp - b.timestamp);
    
    // Debug: log the data to see what we're getting
    if (sorted.length > 0) {
      console.log('Sales data for chart:', sorted);
    }
    
    return sorted;
  }, [invoices]);

  const salesChartConfig = {
    revenue: {
      label: 'Revenue',
      color: '#16a34a', // Dark green color
    },
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Total Revenue',
      value: `${stats.totalRevenueWithoutTax.toFixed(2)} SAR`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Inventory Value',
      value: `${stats.inventoryValue.toFixed(2)} SAR`,
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: 'Profile',
      value: `${stats.profile.toFixed(2)} SAR`,
      icon: User,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
  ];

  return (
    <DashboardLayout title="Case Without TAX">
      <div className="space-y-6 p-6">
        {/* Filters */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateRange" className="text-sm font-medium">Date Range</Label>
                <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                  <SelectTrigger id="dateRange" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="border shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center transition-transform hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Product Profit Table */}
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Product Profit Analysis
              </CardTitle>
              {productProfitData.length > 0 && (
                <Button
                  onClick={handleSaveAsPDF}
                  disabled={isGeneratingPDF}
                  variant="outline"
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  {isGeneratingPDF ? 'Generating PDF...' : 'Save as PDF'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : productProfitData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No product data available</p>
                <p className="text-sm mt-2">No items found in invoices for the selected period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item No.</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Sale Price</TableHead>
                      <TableHead>Profit per Unit</TableHead>
                      <TableHead>Total Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProductProfitData.map((item, index) => {
                      const isPositiveProfit = item.profit >= 0;
                      return (
                        <TableRow key={`${item.item_no}-${index}`}>
                          <TableCell className="font-medium">{item.item_no}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="font-semibold">{item.quantity}</TableCell>
                          <TableCell>
                            {item.purchase_price > 0 
                              ? `${item.purchase_price.toFixed(2)} SAR`
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{item.sale_price.toFixed(2)} SAR</TableCell>
                          <TableCell className={`font-semibold ${isPositiveProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {item.profit.toFixed(2)} SAR
                          </TableCell>
                          <TableCell className={`font-bold ${isPositiveProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {item.total_profit.toFixed(2)} SAR
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

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
                    {currentPage > 3 && totalPages > 5 && (
                      <>
                        <PaginationItem>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(1)}
                          >
                            1
                          </Button>
                        </PaginationItem>
                        {currentPage > 4 && (
                          <PaginationItem>
                            <span className="px-2">...</span>
                          </PaginationItem>
                        )}
                      </>
                    )}
                    {visiblePages.map((page) => (
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
                    {currentPage < totalPages - 2 && totalPages > 5 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <PaginationItem>
                            <span className="px-2">...</span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </PaginationItem>
                      </>
                    )}
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
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, productProfitData.length)} of {productProfitData.length} items
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Performance Chart */}
        <Card className="border shadow-sm overflow-hidden w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 overflow-hidden">
            {loading ? (
              <div className=" flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !salesData || salesData.length === 0 ? (
              <div className=" flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data available</p>
                  <p className="text-xs mt-2">Please select a different date range or create some invoices.</p>
                </div>
              </div>
            ) : (
              <div className="w-full ">
                <ChartContainer config={salesChartConfig} id="sales-performance-chart" className="min-w-[800px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <defs>
                        <linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        stroke="#9ca3af"
                        interval={0}
                        label={{ value: 'Time', position: 'insideBottom', offset: -10, style: { fill: '#6b7280', fontSize: 12 } }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `${value.toFixed(0)}`}
                        width={80}
                        stroke="#9ca3af"
                        label={{ value: 'Revenue (SAR)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value) => [`${Number(value).toFixed(2)} SAR`, 'Revenue']}
                          labelFormatter={(label) => label}
                        />} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        fill="url(#salesRevenueGradient)"
                        fillOpacity={1}
                        stroke="none"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#16a34a" 
                        strokeWidth={2}
                        dot={{ fill: '#16a34a', r: 4, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#16a34a' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
