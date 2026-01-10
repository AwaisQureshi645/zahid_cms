import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Search, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { z } from 'zod';
import DashboardLayout from '@/components/DashboardLayout';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

const purchaseProductSchema = z.object({
  item_no: z.string().min(1, 'Item number is required').max(50),
  item_name: z.string().max(100).optional(),
  description: z.string().min(1, 'Description is required').max(500),
  category: z.string().max(100).optional(),
  unit: z.string().min(1, 'Unit is required').max(20),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unit_price: z.number().min(0, 'Price must be positive'),
  discount: z.number().min(0).max(100).optional(),
  vat_percent: z.number().min(0).max(100).optional(),
});

interface PurchaseProduct {
  id?: string;
  _id?: string;
  item_no: string;
  item_name?: string;
  description: string;
  category: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  vat_percent: number;
  created_at?: string;
}

export default function Purchases() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchaseProducts, setPurchaseProducts] = useState<PurchaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PurchaseProduct | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [itemNoSearchQuery, setItemNoSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  
  const [formData, setFormData] = useState({
    item_no: '',
    item_name: '',
    description: '',
    category: '',
    unit: 'Piece',
    quantity: 0,
    unit_price: 0,
    discount: 0,
    vat_percent: 15,
  });

  useEffect(() => {
    fetchPurchaseProducts();
  }, [user]);

  const fetchPurchaseProducts = async () => {
    if (!user) return;
    try {
      const data = await apiGet<PurchaseProduct[]>('/api/purchase-products');
      setPurchaseProducts(data || []);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to fetch purchase products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from purchase products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    purchaseProducts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [purchaseProducts]);

  // Calculate total amount for a purchase product
  const calculateTotalAmount = (product: PurchaseProduct): number => {
    const subtotal = product.quantity * product.unit_price;
    const discountAmount = subtotal * (product.discount || 0) / 100;
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = afterDiscount * (product.vat_percent || 0) / 100;
    return afterDiscount + vatAmount;
  };

  // Filter and sort purchase products based on search, category, and sort order
  const filteredProducts = useMemo(() => {
    let filtered = purchaseProducts;

    // Filter by search query (description)
    if (searchQuery) {
      filtered = filtered.filter(p => {
        const description = (p.description || '').toLowerCase();
        return description.includes(searchQuery.toLowerCase());
      });
    }

    // Filter by item number search query
    if (itemNoSearchQuery) {
      filtered = filtered.filter(p => {
        const itemNo = (p.item_no || '').toLowerCase();
        return itemNo.includes(itemNoSearchQuery.toLowerCase());
      });
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Sort by created_at
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [purchaseProducts, searchQuery, itemNoSearchQuery, selectedCategory, sortOrder]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Calculate visible page numbers (show max 4 pages at a time)
  const getVisiblePages = () => {
    const maxVisible = 4;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      // Show first 4 pages
      return [1, 2, 3, 4];
    } else if (currentPage >= totalPages - 2) {
      // Show last 4 pages
      return [totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      // Show current page and 2 pages before/after
      return [currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
    }
  };

  const visiblePages = getVisiblePages();

  // Calculate total amount for all filtered purchase products
  const totalAmount = useMemo(() => {
    return filteredProducts.reduce((sum, product) => sum + calculateTotalAmount(product), 0);
  }, [filteredProducts]);

  // Reset to page 1 when filters or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemNoSearchQuery, selectedCategory, itemsPerPage, sortOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = purchaseProductSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (editingProduct) {
      // Get the product ID, using id or _id as fallback
      const productId = editingProduct.id || editingProduct._id;
      if (!productId) {
        toast({ title: 'Error', description: 'Product ID is missing', variant: 'destructive' });
        return;
      }
      try {
        await apiPut(`/api/purchase-products/${productId}`, formData);
        toast({ title: 'Purchase product updated successfully' });
        setShowDialog(false);
        fetchPurchaseProducts();
        resetForm();
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to update purchase product', variant: 'destructive' });
      }
    } else {
      try {
        await apiPost('/api/purchase-products', { ...formData, user_id: user?.id });
        toast({ title: 'Purchase product added successfully' });
        setShowDialog(false);
        fetchPurchaseProducts();
        resetForm();
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to add purchase product', variant: 'destructive' });
      }
    }
  };

  const handleDelete = async (product: PurchaseProduct) => {
    if (!confirm('Are you sure you want to delete this purchase product?')) return;

    // Get the product ID, using id or _id as fallback
    const productId = product.id || product._id;
    if (!productId) {
      toast({ title: 'Error', description: 'Product ID is missing', variant: 'destructive' });
      return;
    }

    try {
      await apiDelete(`/api/purchase-products/${encodeURIComponent(productId)}`);
      toast({ title: 'Purchase product deleted successfully' });
      fetchPurchaseProducts();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete purchase product', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      item_no: '',
      item_name: '',
      description: '',
      category: '',
      unit: 'Piece',
      quantity: 0,
      unit_price: 0,
      discount: 0,
      vat_percent: 15,
    });
    setEditingProduct(null);
    setErrors({});
  };

  const openEditDialog = (product: PurchaseProduct) => {
    setEditingProduct(product);
    setFormData({
      item_no: product.item_no,
      item_name: product.item_name || '',
      description: product.description,
      category: product.category || '',
      unit: product.unit,
      quantity: product.quantity,
      unit_price: product.unit_price,
      discount: product.discount || 0,
      vat_percent: product.vat_percent || 15,
    });
    setShowDialog(true);
  };

  return (
    <DashboardLayout title="Purchases Management">
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
        
          
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Purchase Product
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description..."
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
                  placeholder="Search by item number..."
                  value={itemNoSearchQuery}
                  onChange={(e) => setItemNoSearchQuery(e.target.value)}
                  className="pl-9"
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
              <div className="w-full sm:w-[200px]">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
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
              <div className="w-full sm:w-[200px]">
                <Select value={sortOrder} onValueChange={(value: 'latest' | 'oldest') => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest Added</SelectItem>
                    <SelectItem value="oldest">Oldest Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[150px]">
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Purchase Products</CardTitle>
              {filteredProducts.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} purchase products
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Loading purchase products...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || itemNoSearchQuery || selectedCategory !== 'all' 
                  ? 'No purchase products found matching your filters.' 
                  : 'No purchase products yet. Click "Add Purchase Product" to get started.'}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="max-h-[600px] overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Item No.</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>VAT %</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProducts.map((product) => {
                          const productId = product.id || product._id || '';
                          return (
                            <TableRow key={productId}>
                            <TableCell className="font-medium">{product.item_no}</TableCell>
                            <TableCell>{product.description}</TableCell>
                            <TableCell>{product.category || '-'}</TableCell>
                            <TableCell>{product.unit}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{product.unit_price.toFixed(2)}</TableCell>
                            <TableCell>{product.discount || 0}%</TableCell>
                            <TableCell>{product.vat_percent || 15}%</TableCell>
                            <TableCell className="font-semibold">
                              {calculateTotalAmount(product).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(product)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(product)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Total Amount Summary */}
                {filteredProducts.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-end">
                      <div className="text-lg font-semibold">
                        Total Amount: <span className="text-primary">{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
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
                        {currentPage > 3 && totalPages > 4 && (
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
                        {currentPage < totalPages - 2 && totalPages > 4 && (
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
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Purchase Product' : 'Add New Purchase Product'}</DialogTitle>
              <DialogDescription>
                Fill in the purchase product details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="item_no">Item Number *</Label>
                  <Input
                    id="item_no"
                    value={formData.item_no}
                    onChange={(e) => setFormData({ ...formData, item_no: e.target.value })}
                    required
                  />
                  {errors.item_no && <p className="text-sm text-destructive">{errors.item_no}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item_name">Item Name</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="Enter item name"
                  />
                  {errors.item_name && <p className="text-sm text-destructive">{errors.item_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category || undefined}
                    onValueChange={(value) => setFormData({ ...formData, category: value === '__none__' ? '' : value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat_percent">VAT %</Label>
                  <Input
                    id="vat_percent"
                    type="number"
                    step="0.01"
                    value={formData.vat_percent}
                    onChange={(e) => setFormData({ ...formData, vat_percent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingProduct ? 'Update' : 'Add'} Purchase Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

