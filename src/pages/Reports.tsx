import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Package, FileText, DollarSign, Calendar, Filter, AlertTriangle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

type DateRange = 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'custom';

interface Invoice {
  id: string;
  invoice_no: string;
  total: number;
  created_at: string;
  items: any[];
}

interface Product {
  id: string;
  item_no: string;
  item_name?: string;
  description: string;
  category: string | null;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  vat_percent: number;
  created_at: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    totalInventoryValue: 0,
  });

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedCategory, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    switch (dateRange) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date();
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          end = new Date(customEndDate);
        } else {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { start, end } = getDateRange();
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // Fetch invoices and products from API
      const [invoicesRes, productsRes] = await Promise.all([
        apiGet<any[]>('/api/invoices'),
        apiGet<any[]>('/api/products'),
      ]);

      // Filter invoices by date range
      const fetchedInvoices = (invoicesRes || []).filter((inv: any) => {
        const invDate = new Date(inv.created_at);
        return invDate >= start && invDate <= end;
      });

      // Filter products by category if needed
      let fetchedProducts = productsRes || [];
      if (selectedCategory !== 'all') {
        fetchedProducts = fetchedProducts.filter((p: any) => p.category === selectedCategory);
      }

      setInvoices(fetchedInvoices);
      setProducts(fetchedProducts);

      // Calculate stats from inventory
      const totalRevenue = fetchedInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.total || 0)), 0);
      const lowStock = fetchedProducts.filter(p => p.quantity < 5).length;
      const totalInventoryValue = fetchedProducts.reduce((sum, p) => {
        const itemValue = p.quantity * parseFloat(String(p.unit_price || 0));
        return sum + itemValue;
      }, 0);

      setStats({
        totalProducts: fetchedProducts.length,
        totalInvoices: fetchedInvoices.length,
        totalRevenue: totalRevenue,
        lowStockItems: lowStock,
        totalInventoryValue: totalInventoryValue,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sales Performance Data (grouped by date)
  const salesData = useMemo(() => {
    const grouped: Array<{ date: string; revenue: number; dateValue: number }> = [];
    const dateMap: Record<string, number> = {};
    
    invoices.forEach(invoice => {
      const dateValue = new Date(invoice.created_at).getTime();
      const date = new Date(invoice.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!dateMap[date]) {
        dateMap[date] = dateValue;
        grouped.push({ date, revenue: 0, dateValue });
      }
      
      const index = grouped.findIndex(g => g.date === date);
      if (index !== -1) {
        grouped[index].revenue += parseFloat(String(invoice.total || 0));
      }
    });

    return grouped
      .map(item => ({ 
        date: item.date, 
        revenue: Number.isFinite(item.revenue) ? Number(item.revenue.toFixed(2)) : 0 
      }))
      .filter(item => Number.isFinite(item.revenue) && item.revenue >= 0)
      .sort((a, b) => {
        const dateA = dateMap[a.date] || 0;
        const dateB = dateMap[b.date] || 0;
        return dateA - dateB;
      });
  }, [invoices]);

  // Product Performance from Inventory
  const productPerformanceData = useMemo(() => {
    // Calculate total value per product (quantity * unit_price)
    return products
      .map(product => {
        const quantity = Number.isFinite(product.quantity) ? product.quantity : 0;
        const unitPrice = Number.isFinite(parseFloat(String(product.unit_price || 0))) 
          ? parseFloat(String(product.unit_price || 0)) 
          : 0;
        return {
          name: product.item_name || product.description || product.item_no || 'Unknown',
          value: Number.isFinite(quantity * unitPrice) ? quantity * unitPrice : 0,
          quantity: quantity,
          revenue: 0, // Will be calculated from invoices if needed
        };
      })
      .filter(item => Number.isFinite(item.value) && item.value >= 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  // Category Distribution from Inventory
  const categoryDistributionData = useMemo(() => {
    const categoryMap: Record<string, { count: number; totalValue: number }> = {};

    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      const quantity = Number.isFinite(product.quantity) ? product.quantity : 0;
      const unitPrice = Number.isFinite(parseFloat(String(product.unit_price || 0))) 
        ? parseFloat(String(product.unit_price || 0)) 
        : 0;
      const value = Number.isFinite(quantity * unitPrice) ? quantity * unitPrice : 0;
      
      if (!categoryMap[category]) {
        categoryMap[category] = { count: 0, totalValue: 0 };
      }
      
      categoryMap[category].count += 1;
      categoryMap[category].totalValue += value;
    });

    return Object.entries(categoryMap)
      .map(([name, data]) => {
        const value = Number.isFinite(data.totalValue) ? Number(data.totalValue.toFixed(2)) : 0;
        return { 
          name, 
          value: value >= 0 ? value : 0,
          count: data.count 
        };
      })
      .filter(item => Number.isFinite(item.value) && item.value >= 0)
      .sort((a, b) => b.value - a.value);
  }, [products]);

  // Product Revenue from Invoices
  const productRevenueData = useMemo(() => {
    const revenueMap: Record<string, number> = {};

    invoices.forEach(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item: any) => {
          const productName = item.item_name || item.description || item.item_no || 'Unknown';
          const amount = Number.isFinite(parseFloat(String(item.amount || item.total || 0)))
            ? parseFloat(String(item.amount || item.total || 0))
            : 0;
          if (Number.isFinite(amount) && amount >= 0) {
            revenueMap[productName] = (revenueMap[productName] || 0) + amount;
          }
        });
      }
    });

    return Object.entries(revenueMap)
      .map(([name, revenue]) => {
        const revenueValue = Number.isFinite(revenue) ? Number(revenue.toFixed(2)) : 0;
        return { name, revenue: revenueValue >= 0 ? revenueValue : 0 };
      })
      .filter(item => Number.isFinite(item.revenue) && item.revenue >= 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [invoices]);

  // Low Stock Items from Inventory
  const lowStockItems = useMemo(() => {
    return products
      .filter(p => p.quantity < 5)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);
  }, [products]);

  // Get unique categories from inventory
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  const salesChartConfig = {
    revenue: {
      label: 'Revenue (SAR)',
      color: 'hsl(var(--chart-1))',
    },
  };

  const productChartConfig = {
    revenue: {
      label: 'Revenue (SAR)',
      color: 'hsl(var(--chart-2))',
    },
  };

  const categoryChartConfig = categoryDistributionData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Total Revenue',
      value: `${stats.totalRevenue.toFixed(2)} SAR`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Inventory Value',
      value: `${stats.totalInventoryValue.toFixed(2)} SAR`,
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
  ];

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-6 p-6">
        {/* Filters */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filters & Date Range
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
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

        {/* Sales Performance Chart */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 overflow-hidden">
            {loading ? (
              <div className="h-[350px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : salesData.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data available for the selected period</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-[350px] overflow-hidden">
                <ChartContainer config={salesChartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `${value.toFixed(0)}`}
                        width={60}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)"
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product & Category Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products by Revenue */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Top Products by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 overflow-hidden">
              {loading ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : productRevenueData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No product revenue data available</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-[350px] overflow-hidden">
                  <ChartContainer config={productChartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productRevenueData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          type="number" 
                          className="text-xs" 
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          className="text-xs" 
                          width={100}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="revenue" 
                          fill="hsl(var(--chart-2))" 
                          radius={[0, 4, 4, 0]}
                          animationDuration={1000}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 overflow-hidden">
              {loading ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : categoryDistributionData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No category data available</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-[350px] overflow-hidden">
                  <ChartContainer config={categoryChartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                        <Pie
                          data={categoryDistributionData}
                          cx="50%"
                          cy="45%"
                          labelLine={false}
                          label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          animationDuration={1000}
                        >
                          {categoryDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend 
                          content={<ChartLegendContent />}
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory Health */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Inventory Health - Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">All items are well stocked!</p>
                <p className="text-sm mt-2">No low stock items found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item No.</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_no}</TableCell>
                        <TableCell>{item.item_name || item.description}</TableCell>
                        <TableCell>{item.category || 'N/A'}</TableCell>
                        <TableCell className="font-semibold">{item.quantity}</TableCell>
                        <TableCell>{parseFloat(String(item.unit_price || 0)).toFixed(2)} SAR</TableCell>
                        <TableCell className="font-medium">
                          {(item.quantity * parseFloat(String(item.unit_price || 0))).toFixed(2)} SAR
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.quantity === 0 ? "destructive" : "secondary"}
                            className={item.quantity === 0 ? "animate-pulse" : ""}
                          >
                            {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
