"use client";

import { use, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, AlertCircle, ArrowLeft, Star, ChevronDown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.id, 10);
  
  const { data: product, isLoading, isError } = useProduct(productId);
  const { data: similarProducts, isLoading: isLoadingSimilar } = useProducts(1, "");
  const { addItem, isAdding } = useCart();
  
  const handleAddToCart = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    addItem(
      { productId: id, quantity: 1 },
      {
        onSuccess: () => toast.success("Added to cart!"),
        onError: () => toast.error("Failed to add to cart"),
      }
    );
  };

  const [activeTab, setActiveTab] = useState("details");

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col w-full bg-white">
        
        {/* PRODUCT DETAILS SECTION */}
        <section className="container mx-auto px-6 py-12 md:py-24">
          <div className="mb-12">
            <Link href="/" className="inline-flex items-center text-sm font-semibold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
              <ArrowLeft className="mr-3 h-4 w-4" /> Back to Collection
            </Link>
          </div>

          {isError && (
            <div className="bg-red-50 text-red-900 border border-red-200 p-6 rounded-2xl flex items-center gap-4 mb-16">
              <AlertCircle className="h-6 w-6" />
              <p className="font-medium">Failed to load product details. It might not exist.</p>
            </div>
          )}

          {isLoading ? (
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
              <Skeleton className="aspect-square w-full rounded-[2rem]" />
              <div className="flex flex-col justify-center gap-8 py-10">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-32 w-full mt-8" />
                <Skeleton className="h-16 w-full mt-12 rounded-full" />
              </div>
            </div>
          ) : product && (
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
              {/* Product Image */}
              <div className="aspect-[4/5] lg:aspect-square bg-neutral-100 rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <span className="text-neutral-300 font-semibold tracking-widest uppercase text-xl group-hover:scale-105 transition-transform duration-700">No Image</span>
                )}
                {!product.in_stock && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center z-10">
                    <Badge variant="destructive" className="px-6 py-2 uppercase tracking-widest text-sm font-bold shadow-xl">Sold Out</Badge>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-center">
                <div className="flex flex-col gap-4 mb-8">
                  <div className="text-sm font-medium text-blue-600 uppercase tracking-wider">
                    {product.sku.split('-')[0]} Category
                  </div>
                  <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">{product.name}</h1>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ৳{product.price.toFixed(2)}
                    </span>
                    <Badge variant="secondary" className="font-medium text-gray-600 bg-gray-100">
                      SKU: {product.sku}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[1,2,3,4,5].map(star => (
                       <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-500 ml-2">(12 Reviews)</span>
                  </div>
                </div>

                <div className="text-gray-600 mb-10 leading-relaxed text-base">
                  <p className="whitespace-pre-line line-clamp-3">{product.description || "An essential addition to your collection. Impeccable craftsmanship and modern design meet in this premium product."}</p>
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    size="lg" 
                    className="w-full text-lg h-14 rounded-xl shadow-none font-semibold"
                    disabled={!product.in_stock || isAdding}
                    onClick={(e) => handleAddToCart(e, product.id)}
                  >
                    <ShoppingBag className="mr-3 h-5 w-5" />
                    <span className="font-bold tracking-wide uppercase">
                      {product.in_stock ? "Add to Cart" : "Sold Out"}
                    </span>
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-center text-gray-500 font-medium mt-2">
                    <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-center gap-2">
                      <ChevronDown className="w-4 h-4" /> Returns Policy
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-center gap-2">
                      <ChevronDown className="w-4 h-4" /> Delivery Info
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* TABS SECTION */}
        {product && (
          <section className="container mx-auto px-6 py-12 border-t border-gray-100">
            <div className="flex gap-8 border-b border-gray-200 mb-8">
              {['details', 'reviews', 'qa'].map(tab => (
                <button 
                  key={tab}
                  className={`pb-4 font-semibold text-lg capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'qa' ? 'Q&A' : tab}
                </button>
              ))}
            </div>
            
            <div className="max-w-4xl min-h-[200px]">
              {activeTab === 'details' && (
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description || "Detailed description goes here."}
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="text-gray-600">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="text-4xl font-bold text-gray-900">5.0</div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <span className="text-sm">Based on 12 reviews</span>
                    </div>
                  </div>
                  <p className="italic">"Excellent product, highly recommended!" - Customer</p>
                </div>
              )}
              {activeTab === 'qa' && (
                <div className="text-gray-600">
                  <div className="font-semibold text-gray-900 mb-2">Q: Is this item covered by warranty?</div>
                  <div className="mb-6">A: Yes, all our products come with a standard 1-year warranty.</div>
                  <Button variant="outline">Ask a Question</Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SIMILAR PRODUCTS SECTION */}
        <section className="border-t border-neutral-100 bg-neutral-50/50 py-24">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-16 text-center">You May Also Like</h2>
            
            {isLoadingSimilar ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
               {Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="flex flex-col gap-4">
                   <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                   <Skeleton className="h-5 w-2/3" />
                 </div>
               ))}
             </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                {similarProducts?.data
                  .filter(p => p.id !== productId)
                  .slice(0, 4)
                  .map((p) => (
                  <Link key={p.id} href={`/product/${p.id}`} className="group flex flex-col gap-5 hover-lift">
                    <div className="aspect-[4/5] w-full bg-neutral-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      ) : (
                        <span className="text-neutral-300 font-semibold tracking-widest uppercase text-sm group-hover:scale-110 transition-transform duration-700 ease-out">
                          {p.name.substring(0, 2)} Image
                        </span>
                      )}
                      
                      {!p.in_stock && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center z-10">
                          <Badge variant="destructive" className="px-4 py-1.5 uppercase tracking-widest text-xs font-bold">Sold Out</Badge>
                        </div>
                      )}
                      
                      {p.in_stock && (
                        <div className="absolute bottom-4 right-4 z-20 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <Button 
                            size="icon" 
                            className="h-12 w-12 rounded-full shadow-2xl bg-black hover:bg-neutral-800"
                            disabled={isAdding}
                            onClick={(e) => handleAddToCart(e, p.id)}
                          >
                            <ShoppingBag className="h-5 w-5 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1 px-3 pb-4 text-left">
                      <h3 className="font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      <span className="font-bold text-gray-900 mt-1">
                        ৳{p.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
