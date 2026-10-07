"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Product, ProductImage, PaginatedResponse } from "@/types";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Upload, 
  X, 
  Images, 
  AlertTriangle,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Package,
  Layers,
  CheckCircle2,
  Boxes
} from "lucide-react";
import { toast } from "sonner";

const STOCK_FILTERS = [
  { label: "All Stock", value: "" },
  { label: "In Stock (>5)", value: "in_stock" },
  { label: "Low Stock (1-5)", value: "low_stock" },
  { label: "Out of Stock (0)", value: "out_of_stock" },
];

const CATEGORIES = [
  { label: "All Categories", value: "all" },
  { label: "Kitchen (KIT)", value: "KIT" },
  { label: "Electronics (ELE)", value: "ELE" },
  { label: "Books (BOO)", value: "BOO" },
  { label: "Clothing (CLO)", value: "CLO" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Stock: Low to High", value: "stock_asc" },
  { label: "Stock: High to Low", value: "stock_desc" },
  { label: "Name: A to Z", value: "name_asc" },
];

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlStockStatus = searchParams.get("stock_status") || "";
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "all";
  const urlStatus = searchParams.get("status") || "";

  const [search, setSearch] = useState(urlSearch);
  const [stockStatus, setStockStatus] = useState(urlStockStatus);
  const [category, setCategory] = useState(urlCategory);
  const [status, setStatus] = useState(urlStatus);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    price: 0,
    stock: 0,
    status: "active" as "active" | "inactive",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingSubImages, setExistingSubImages] = useState<ProductImage[]>([]);
  const [newSubImageFiles, setNewSubImageFiles] = useState<File[]>([]);
  
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subImagesInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state if URL query params change (e.g. from Dashboard click)
  useEffect(() => {
    if (urlStockStatus !== stockStatus) setStockStatus(urlStockStatus);
    if (urlSearch !== search) setSearch(urlSearch);
    if (urlCategory !== category) setCategory(urlCategory);
    if (urlStatus !== status) setStatus(urlStatus);
  }, [urlStockStatus, urlSearch, urlCategory, urlStatus]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", { page, search, stockStatus, category, status, sort }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Product>>("/admin/products", {
        params: { 
          page, 
          search: search || undefined,
          stock_status: stockStatus || undefined,
          category: category !== "all" ? category : undefined,
          status: status || undefined,
          sort: sort !== "newest" ? sort : undefined,
        },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const { data } = await api.post(`/admin/products`, payload, {
        headers: { "Content-Type": undefined },
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create product");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: FormData }) => {
      payload.append("_method", "PUT");
      const { data } = await api.post(`/admin/products/${id}`, payload, {
        headers: { "Content-Type": undefined },
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update product");
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/admin/products/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  });

  const deleteSubImageMutation = useMutation({
    mutationFn: async ({ productId, imageId }: { productId: number; imageId: number }) => {
      const { data } = await api.delete(`/admin/products/${productId}/images/${imageId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success("Sub-image deleted");
      setExistingSubImages((prev) => prev.filter((img) => img.id !== variables.imageId));
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete sub-image");
    }
  });

  // Quick Stock Adjustment Mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: number; stock: number }) => {
      const { data } = await api.patch(`/admin/products/${id}/stock`, { stock });
      return data;
    },
    onSuccess: () => {
      toast.success("Inventory stock updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setStockAdjustProduct(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update stock");
    }
  });

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        price: product.price,
        stock: product.stock,
        status: product.status as "active" | "inactive",
        image_url: product.image_url || "",
      });
      setExistingSubImages(product.images || []);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        sku: "",
        description: "",
        price: 0,
        stock: 0,
        status: "active",
        image_url: "",
      });
      setExistingSubImages([]);
    }
    setImageFile(null);
    setNewSubImageFiles([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImageFile(null);
    setExistingSubImages([]);
    setNewSubImageFiles([]);
  };

  const handleSubImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const availableSlots = 5 - (existingSubImages.length + newSubImageFiles.length);

    if (availableSlots <= 0) {
      toast.error("Maximum 5 sub-images allowed per product.");
      return;
    }

    if (files.length > availableSlots) {
      toast.warning(`Only adding ${availableSlots} sub-images to respect the 5 images limit.`);
    }

    const filesToAdd = files.slice(0, availableSlots);
    setNewSubImageFiles((prev) => [...prev, ...filesToAdd]);
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("sku", formData.sku);
    if (formData.description) payload.append("description", formData.description);
    payload.append("price", formData.price.toString());
    payload.append("stock", formData.stock.toString());
    payload.append("status", formData.status);
    
    if (imageFile) {
      payload.append("image", imageFile);
    } else if (formData.image_url) {
      payload.append("image_url", formData.image_url);
    }

    newSubImageFiles.forEach((file) => {
      payload.append("sub_images[]", file);
    });

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const resetAllFilters = () => {
    setSearch("");
    setStockStatus("");
    setCategory("all");
    setStatus("");
    setSort("newest");
    setPage(1);
    router.replace("/admin/products");
  };

  const hasActiveFilters = !!search || !!stockStatus || category !== "all" || !!status || sort !== "newest";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Product Inventory</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage catalog items, prices, inventory stock levels, and gallery images.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Top Filter Row: Stock Pills & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Boxes className="h-3.5 w-3.5" /> Stock:
            </span>
            {STOCK_FILTERS.map((f) => {
              const isActive = stockStatus === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => {
                    setStockStatus(f.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? f.value === "out_of_stock"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-primary text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="text-xs text-slate-500 hover:text-slate-800 h-8 self-end sm:self-auto gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset Filters
            </Button>
          )}
        </div>

        {/* Second Row: Search, Category, Status, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or SKU..."
              className="pl-8 bg-slate-50/50 h-9 text-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-3">
            <select
              className="h-9 w-full rounded-md border border-input bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="lg:col-span-2">
            <select
              className="h-9 w-full rounded-md border border-input bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="lg:col-span-3">
            <select
              className="h-9 w-full rounded-md border border-input bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="w-[70px] text-xs font-semibold text-slate-600">Image</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">SKU</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Price</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Stock</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Gallery</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="loader" style={{ "--size": "0.65px" } as React.CSSProperties}></span>
                      <span className="text-xs font-medium text-gray-400 tracking-wide">
                        Loading products...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-14 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-700">No products matching filters</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try clearing search or selecting a different stock filter.
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={resetAllFilters} className="mt-3 text-xs">
                        Reset All Filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell>
                      <div className="h-11 w-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold uppercase">No img</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium text-slate-700">
                      {product.sku}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 text-sm max-w-[220px] truncate" title={product.name}>
                      {product.name}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 text-sm">
                      ৳{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => {
                          setStockAdjustProduct(product);
                          setNewStockValue(product.stock);
                        }}
                        className="group flex items-center gap-1.5 text-left focus:outline-none"
                        title="Click to adjust stock"
                      >
                        {product.stock <= 0 ? (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold group-hover:bg-rose-100 transition-colors">
                            Out of stock (0)
                          </Badge>
                        ) : product.stock <= 5 ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold group-hover:bg-amber-100 transition-colors">
                            {product.stock} (Low)
                          </Badge>
                        ) : (
                          <span className="text-xs font-medium text-slate-700 group-hover:text-primary transition-colors">
                            {product.stock} units
                          </span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-600">
                        <Images className="w-3 h-3 text-slate-400" />
                        {product.images?.length || 0} / 5
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          product.status === "active" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" 
                            : "bg-slate-100 text-slate-600 border-slate-200 text-xs"
                        }
                      >
                        {product.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-primary"
                          onClick={() => handleOpenModal(product)}
                          title="Edit product & images"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => setProductToDelete(product)}
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>
          Showing {data?.data.length || 0} of {data?.total || 0} products
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-xs h-8"
          >
            Previous
          </Button>
          <span className="font-medium text-slate-700 px-1">
            Page {page} of {data?.last_page || 1}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!data || page >= data.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs h-8"
          >
            Next
          </Button>
        </div>
      </div>

      {/* QUICK STOCK ADJUSTMENT DIALOG */}
      <Dialog open={!!stockAdjustProduct} onOpenChange={(open) => !open && setStockAdjustProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Quick Stock Adjustment</DialogTitle>
            <DialogDescription className="text-xs">
              Update inventory level for <strong>{stockAdjustProduct?.name}</strong> (SKU: {stockAdjustProduct?.sku}).
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <Label htmlFor="quick-stock" className="text-xs font-semibold">New Stock Quantity</Label>
            <Input
              id="quick-stock"
              type="number"
              min="0"
              value={newStockValue}
              onChange={(e) => setNewStockValue(Math.max(0, parseInt(e.target.value) || 0))}
              className="text-sm font-semibold"
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="text-xs flex-1" onClick={() => setNewStockValue((v) => v + 5)}>+5</Button>
              <Button type="button" variant="outline" size="sm" className="text-xs flex-1" onClick={() => setNewStockValue((v) => v + 10)}>+10</Button>
              <Button type="button" variant="outline" size="sm" className="text-xs flex-1" onClick={() => setNewStockValue((v) => v + 25)}>+25</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setStockAdjustProduct(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={adjustStockMutation.isPending}
              onClick={() => {
                if (stockAdjustProduct) {
                  adjustStockMutation.mutate({ id: stockAdjustProduct.id, stock: newStockValue });
                }
              }}
              className="bg-primary text-white"
            >
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT PRODUCT MODAL (with multi-image upload) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? "Update product details, main cover photo, and gallery sub-images (max: 5)." 
                : "Fill in the details to add a new product to your catalog."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (৳) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* MAIN COVER IMAGE */}
            <div className="space-y-2 pt-2 border-t">
              <Label>Main Cover Image</Label>
              <div className="flex items-center gap-4">
                {(imageFile || formData.image_url) && (
                  <div className="h-16 w-16 rounded-lg border overflow-hidden bg-slate-50 relative shrink-0">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setFormData({ ...formData, image_url: "" });
                      }}
                      className="absolute top-0 right-0 bg-rose-600 text-white rounded-bl p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" /> Upload Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImageFile(file);
                      }}
                    />
                  </div>
                  <Input
                    placeholder="Or enter image URL..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* SUB-IMAGES GALLERY (MAX 5) */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Images className="h-4 w-4 text-primary" />
                    Gallery Sub-Images ({existingSubImages.length + newSubImageFiles.length} / 5)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Additional product views displayed in the gallery carousel.
                  </p>
                </div>
                {existingSubImages.length + newSubImageFiles.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => subImagesInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" /> Add Photos
                  </Button>
                )}
                <input
                  ref={subImagesInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleSubImagesSelect}
                />
              </div>

              {/* Gallery Thumbnails */}
              <div className="grid grid-cols-5 gap-2 pt-1">
                {existingSubImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg border bg-slate-50 overflow-hidden group">
                    <img src={img.image_url} alt="Sub" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        if (editingProduct) deleteSubImageMutation.mutate({ productId: editingProduct.id, imageId: img.id });
                      }}
                      className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-600 text-white p-1 rounded-md transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {newSubImageFiles.map((file, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg border border-primary/40 bg-blue-50/30 overflow-hidden group">
                    <img src={URL.createObjectURL(file)} alt="New Sub" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewSubImageFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-slate-800/90 text-white p-1 rounded-md"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-white">
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <span className="loader mr-2" style={{ "--size": "0.35px", "--color-1": "#ffffff" } as React.CSSProperties}></span>
                ) : null}
                {editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete Product</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-2">
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>? This action will remove the product from the storefront.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button variant="outline" size="sm" onClick={() => setProductToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteProductMutation.isPending}
              onClick={() => {
                if (productToDelete) deleteProductMutation.mutate(productToDelete.id);
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminProducts() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <span className="loader"></span>
        <p className="text-xs text-slate-500 font-medium">Loading products catalog...</p>
      </div>
    }>
      <AdminProductsContent />
    </Suspense>
  );
}
