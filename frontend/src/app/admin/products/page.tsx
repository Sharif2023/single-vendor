"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Product, PaginatedResponse } from "@/types";
import { useState, useRef } from "react";
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
} from "@/components/ui/dialog";
import { Plus, Search, Edit2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
  
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", { page, search }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Product>>("/admin/products", {
        params: { page, search },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      // Remove Content-Type so browser sets multipart/form-data with the correct boundary
      const { data } = await api.post(`/admin/products`, payload, {
        headers: {
          "Content-Type": undefined,
        },
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
        headers: {
          "Content-Type": undefined,
        },
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

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        price: product.price,
        stock: product.stock,
        status: product.status,
        image_url: product.image_url || "",
      });
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
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImageFile(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("sku", formData.sku);
    if (formData.description) {
      payload.append("description", formData.description);
    }
    payload.append("price", formData.price.toString());
    payload.append("stock", formData.stock.toString());
    payload.append("status", formData.status);
    
    if (imageFile) {
      payload.append("image", imageFile);
    } else if (formData.image_url) {
      payload.append("image_url", formData.image_url);
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your inventory and catalog.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or SKU..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>৳{product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {product.stock <= 5 ? (
                      <span className="text-destructive font-medium">{product.stock} (Low)</span>
                    ) : (
                      product.stock
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.status === "active" ? "default" : "secondary"}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(product)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Showing {data?.data.length || 0} products
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!data || page >= data.last_page}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input 
                    id="sku" 
                    value={formData.sku} 
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (৳)</Label>
                  <Input 
                    id="price" 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price || ""} 
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input 
                    id="stock" 
                    type="number"
                    min="0"
                    value={formData.stock || ""} 
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value, 10) || 0})}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Product Image</Label>
                <div className="flex items-center gap-4">
                  {(imageFile || formData.image_url) && (
                    <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 border shrink-0">
                      <img 
                        src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url} 
                        alt="Preview" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {imageFile ? "Change Image" : "Upload Image"}
                    </Button>
                    {imageFile && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select 
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as "active" | "inactive"})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
