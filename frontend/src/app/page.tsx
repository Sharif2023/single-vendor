"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Star, Search, Filter, ShoppingBag, Package, AlertCircle, ArrowUpDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const CATEGORIES = [
  { label: "All Items", prefix: "" },
  { label: "Electronics", prefix: "ELE" },
  { label: "Kitchen", prefix: "KIT" },
  { label: "Books", prefix: "BOO" },
  { label: "Clothing", prefix: "CLO" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);

  // Search query combines category prefix if selected
  const activeSearch = selectedCategory ? (search ? `${selectedCategory} ${search}` : selectedCategory) : search;

  const { data, isLoading, isError, error, refetch } = useProducts(page, activeSearch, sort);
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
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] font-body text-gray-900">
      <main className="flex-1 w-full">
        {/* HERO & SEARCH SECTION (ByteSpace Aesthetics) */}
        <section className="w-full bg-white border-b border-gray-200/80 pt-12 pb-14 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-50/70 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-[#D6FD04]/20 blur-3xl pointer-events-none" />

          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Verified Single-Vendor Marketplace
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Discover Authentic Products, <br className="hidden sm:inline" />
                Delivered Right to Your Door.
              </h1>

              <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                Browse our curated inventory with verified warranties, competitive prices, and express nationwide delivery.
              </p>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                {/* SEARCH INPUT */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search by product name, model, or SKU..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-11 pr-4 h-12 bg-gray-50/70 hover:bg-gray-50 focus:bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl text-sm transition-all focus-visible:ring-2 focus-visible:ring-black"
                  />
                </div>

                {/* SORT SELECTOR */}
                <div className="relative sm:w-56 shrink-0">
                  <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select
                    className="w-full pl-10 pr-8 h-12 bg-gray-50/70 hover:bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl appearance-none text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black cursor-pointer transition-all"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Sort: Featured & Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* CATEGORY CHIPS */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filter:
                </span>
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.prefix;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => {
                        setSelectedCategory(isActive ? "" : cat.prefix);
                        setPage(1);
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? "bg-gray-900 text-[#D6FD04] shadow-xs scale-105"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section className="container mx-auto max-w-6xl px-6 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900">
                {selectedCategory ? `${CATEGORIES.find((c) => c.prefix === selectedCategory)?.label}` : "All Products"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Showing authentic products ready for shipment</p>
            </div>
            <span className="text-xs font-bold bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600 shadow-xs">
              {data?.meta?.total ?? data?.total ?? data?.data?.length ?? 0} Items
            </span>
          </div>

          {/* ERROR BANNER */}
          {isError && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 shadow-xs">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Failed to load products</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {error instanceof Error && error.message.includes("Network Error")
                      ? "Backend server is offline or unreachable on port 8000."
                      : "Could not fetch products. Please check your connection and try again."}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white hover:bg-red-100 border-red-300 text-red-700 font-medium shrink-0 self-start sm:self-auto rounded-xl"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          )}

          {/* SKELETONS */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[28px] border border-gray-200/80 p-4 space-y-4">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3 rounded-full" />
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                  </div>
                  <div className="pt-2 flex justify-between items-center">
                    <Skeleton className="h-6 w-1/3 rounded-md" />
                    <Skeleton className="h-8 w-24 rounded-full" />
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
                  className="group flex flex-col bg-white rounded-[28px] border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
                >
                  {/* IMAGE FRAME */}
                  <div className="aspect-square w-full bg-gray-50 flex items-center justify-center relative overflow-hidden p-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="text-center text-gray-300">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-1 opacity-40" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">No Image</span>
                      </div>
                    )}

                    {/* STATUS PILLS */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                      {product.in_stock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-xs">
                          Sold Out
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <span className="text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm px-2 py-0.5 rounded-full">
                        {product.sku.split("-")[0]}
                      </span>
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-1">
                      {product.sku.split("-")[0]} Category
                    </div>

                    <h3 className="font-display font-semibold text-base text-gray-900 line-clamp-1 mb-1.5 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-[11px] text-gray-400 ml-1">(4.9)</span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                      {product.description || "High quality authentic product ready for shipment."}
                    </p>

                    {/* PRICE & ACTION */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-display font-bold text-lg text-gray-900">
                          ৳{product.price.toFixed(2)}
                        </span>
                      </div>

                      {product.in_stock && (
                        <Button
                          size="sm"
                          className="rounded-full px-4 text-xs font-display font-semibold bg-gray-900 hover:bg-black text-[#D6FD04] shadow-xs hover:scale-105 transition-all"
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

          {/* EMPTY STATE */}
          {!isLoading && data?.data.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center bg-white rounded-[28px] border border-dashed border-gray-300">
              <Package className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="font-display text-lg font-bold text-gray-900 mb-1">No products found</h3>
              <p className="text-gray-500 text-xs sm:text-sm max-w-sm mb-4">
                Try searching for another keyword or selecting a different category filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("");
                  setPage(1);
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}

          {/* PAGINATION */}
          {!isLoading && (data?.last_page || data?.meta?.last_page) && (data.last_page || data.meta?.last_page || 1) > 1 && (() => {
            const lastPage = data.last_page || data.meta?.last_page || 1;
            return (
              <div className="flex justify-center items-center gap-2 mt-14">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  className="rounded-full px-4 text-xs font-semibold"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="hidden sm:flex gap-1.5 mx-2">
                  {Array.from({ length: Math.min(5, lastPage) }).map((_, i) => {
                    let pageNum = i + 1;
                    if (lastPage > 5) {
                      if (page > 3 && page < lastPage - 1) {
                        pageNum = page - 2 + i;
                      } else if (page >= lastPage - 1) {
                        pageNum = lastPage - 4 + i;
                      }
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "ghost"}
                        className={`w-10 h-10 p-0 rounded-full font-display font-semibold text-xs ${
                          page === pageNum ? "bg-gray-900 text-[#D6FD04]" : "text-gray-500 hover:text-black"
                        }`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  disabled={page === lastPage}
                  className="rounded-full px-4 text-xs font-semibold"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                >
                  Next
                </Button>
              </div>
            );
          })()}
        </section>
      </main>
    </div>
  );
}
