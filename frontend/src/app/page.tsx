"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, AlertCircle, Package, Search, Star, Filter } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useProducts(page, search, sort);
  const { addItem, isAdding } = useCart();

  const handleAddToCart = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    addItem(
      { productId, quantity: 1 },
      {
        onSuccess: () => toast.success("Added to cart!"),
        onError: () => toast.error("Failed to add to cart"),
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Navbar />
      <main className="flex-1 w-full">
        {/* HERO SECTION */}
        <section className="w-full bg-white border-b py-16 px-6">
          <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-6">
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                Shop the Latest Products
              </h1>
              <p className="text-gray-600 max-w-xl">
                Find exactly what you need with our wide selection of high-quality items. Simple, fast, and reliable shopping.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1); // Reset page on new search
                    }}
                    className="w-full pl-10 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 rounded-lg focus-visible:ring-gray-400"
                  />
                </div>
                <div className="relative w-full sm:w-48">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select 
                    className="w-full pl-9 pr-4 h-12 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Sort: Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section className="container mx-auto max-w-6xl px-6 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
            <span className="text-sm font-medium text-gray-500">
              {data?.data.length || 0} Results
            </span>
          </div>

          {isError && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg flex items-center gap-3 mb-8">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium text-sm">Failed to load products. Please try again later.</p>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data?.data.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/product/${product.id}`} 
                  className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  {/* IMAGE BOX */}
                  <div className="aspect-square w-full bg-gray-100 flex items-center justify-center relative">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out" 
                      />
                    ) : (
                      <span className="text-gray-400 font-medium text-sm">
                        No Image
                      </span>
                    )}
                    
                    {!product.in_stock && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-900 font-semibold shadow-sm">
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* PRODUCT DETAILS */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-xs text-blue-600 font-medium mb-1">
                      {product.sku.split('-')[0]} Category
                    </div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(star => (
                         <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">(12)</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                      {product.description || "No description available."}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-gray-900">
                          ৳{product.price.toFixed(2)}
                        </span>
                        {product.in_stock && (
                          <span className="text-xs text-green-600 font-medium">In Stock</span>
                        )}
                      </div>
                      {product.in_stock && (
                        <Button 
                          size="sm" 
                          className="rounded-full px-5 shadow-none"
                          disabled={isAdding}
                          onClick={(e) => handleAddToCart(e, product.id)}
                        >
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!isLoading && data?.data.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center bg-white rounded-xl border border-dashed border-gray-300">
              <Package className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                Try adjusting your search to find what you're looking for.
              </p>
            </div>
          )}
          {/* PAGINATION */}
          {!isLoading && data?.meta && data.meta.last_page > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <div className="hidden sm:flex gap-1 mx-2">
                {Array.from({ length: Math.min(5, data.meta.last_page) }).map((_, i) => {
                  let pageNum = i + 1;
                  // Simple logic to show a window of pages
                  if (data.meta.last_page > 5) {
                    if (page > 3 && page < data.meta.last_page - 1) {
                      pageNum = page - 2 + i;
                    } else if (page >= data.meta.last_page - 1) {
                      pageNum = data.meta.last_page - 4 + i;
                    }
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "ghost"}
                      className={`w-10 h-10 p-0 ${page === pageNum ? "" : "text-gray-500"}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                disabled={page === data.meta.last_page}
                onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
