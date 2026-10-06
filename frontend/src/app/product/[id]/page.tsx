"use client";

import { use, useState } from "react";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingBag, 
  AlertCircle, 
  ArrowLeft, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Headphones, 
  Share2, 
  Minus, 
  Plus, 
  Clock, 
  Zap,
  ChevronRight,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.id, 10);
  const router = useRouter();

  const { data: product, isLoading, isError, refetch } = useProduct(productId);
  const { data: similarProducts } = useProducts(1, "");
  const { addItem, isAdding } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "reviews" | "faqs">("overview");

  const handleAddToCart = (directCheckout = false) => {
    if (!product) return;
    addItem(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          if (directCheckout) {
            toast.success("Proceeding to checkout...");
            router.push("/checkout");
          } else {
            toast.success(`Added ${quantity} item${quantity > 1 ? "s" : ""} to cart!`);
          }
        },
        onError: () => toast.error("Failed to add to cart. Please check stock."),
      }
    );
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const originalPrice = product ? (product.price * 1.18).toFixed(2) : "0";

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-body">
      {/* BREADCRUMB */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between text-xs sm:text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-black transition-colors flex items-center gap-1">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <Link href="/" className="hover:text-black transition-colors">
              {product ? product.sku.split("-")[0] + " Products" : "Catalog"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {product?.name || "Product Details"}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="hidden sm:flex items-center gap-1.5 text-gray-600 hover:text-black text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 transition-colors bg-white shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-6 py-8 lg:py-12">
        {/* BACK BUTTON */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-black transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Catalog
          </Link>
        </div>

        {isError && (
          <div className="bg-red-50 text-red-900 border border-red-200 p-6 rounded-2xl flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Failed to load product details</p>
                <p className="text-xs text-red-600 mt-0.5">The product could not be retrieved from the server.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-red-300 hover:bg-red-100">
              Retry
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7">
              <Skeleton className="aspect-square w-full rounded-[28px]" />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <Skeleton className="h-6 w-1/3 rounded-full" />
              <Skeleton className="h-10 w-3/4 rounded-xl" />
              <Skeleton className="h-8 w-1/2 rounded-xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>
          </div>
        ) : product && (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: VISUALS + TABS */}
            <div className="lg:col-span-7 space-y-8">
              {/* MAIN SHOWCASE IMAGE */}
              <div className="bg-white rounded-[28px] border border-gray-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden group">
                <div className="aspect-[4/3] sm:aspect-square w-full rounded-2xl bg-gray-50 flex items-center justify-center relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="text-center p-6 text-gray-400">
                      <ShoppingBag className="w-16 h-16 mx-auto mb-2 opacity-30" />
                      <span className="font-semibold text-sm uppercase tracking-wider">No Image Preview</span>
                    </div>
                  )}

                  {/* FLOATING STATUS BADGES */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {product.in_stock ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-xs font-semibold shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        In Stock ({product.stock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold shadow-xs">
                        Sold Out
                      </span>
                    )}

                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-xs font-semibold shadow-xs">
                      {product.sku.split("-")[0]} Category
                    </span>
                  </div>

                  <div className="absolute bottom-4 right-4 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[#D6FD04] text-xs font-bold shadow-xs">
                      Save 18% OFF
                    </span>
                  </div>
                </div>
              </div>

              {/* SEGMENTED TAB NAVIGATION */}
              <div className="bg-white rounded-[24px] border border-gray-200/80 p-2 shadow-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto p-1">
                  {[
                    { id: "overview", label: "Overview & Highlights" },
                    { id: "specs", label: "Specifications" },
                    { id: "reviews", label: "Verified Reviews (128)" },
                    { id: "faqs", label: "FAQs & Warranty" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`px-4 sm:px-5 py-2.5 rounded-xl font-display text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-gray-900 text-[#D6FD04] shadow-sm"
                          : "text-gray-600 hover:text-black hover:bg-gray-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB CONTENT CARDS */}
              <div className="bg-white rounded-[28px] border border-gray-200/80 p-6 sm:p-8 shadow-xs">
                {/* TAB 1: OVERVIEW */}
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="font-display text-xl font-bold text-gray-900 mb-3">
                        About this Product
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                        {product.description ||
                          "Engineered for high performance and durability, this premium item combines ergonomic design with refined aesthetics to give you the ultimate user experience."}
                      </p>
                    </div>

                    {/* KEY HIGHLIGHTS GRID */}
                    <div>
                      <h4 className="font-display text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                        Why Choose This Item
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold text-sm text-gray-900">100% Authentic Quality</h5>
                            <p className="text-xs text-gray-500 mt-0.5">Directly sourced and inspected for genuine authenticity.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold text-sm text-gray-900">Express Courier Delivery</h5>
                            <p className="text-xs text-gray-500 mt-0.5">Dispatched within 24h via CarryBee across Bangladesh.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <RotateCcw className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold text-sm text-gray-900">7-Day Easy Replacement</h5>
                            <p className="text-xs text-gray-500 mt-0.5">Hassle-free return policy if you receive any damaged unit.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold text-sm text-gray-900">Secure SSL Payment</h5>
                            <p className="text-xs text-gray-500 mt-0.5">256-bit encrypted gateway with BKash, Nagad, and Cards.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SPECIFICATIONS */}
                {activeTab === "specs" && (
                  <div className="space-y-6">
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Technical Specifications</h3>
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                      <div className="flex justify-between py-3.5 px-4 bg-gray-50/70 text-sm">
                        <span className="text-gray-500 font-medium">SKU Number</span>
                        <span className="font-mono font-semibold text-gray-900">{product.sku}</span>
                      </div>
                      <div className="flex justify-between py-3.5 px-4 text-sm">
                        <span className="text-gray-500 font-medium">Stock Status</span>
                        <span className={`font-semibold ${product.in_stock ? "text-emerald-600" : "text-red-500"}`}>
                          {product.in_stock ? `Available (${product.stock} units)` : "Out of Stock"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3.5 px-4 bg-gray-50/70 text-sm">
                        <span className="text-gray-500 font-medium">Product Category</span>
                        <span className="font-semibold text-gray-900">{product.sku.split("-")[0]} Collection</span>
                      </div>
                      <div className="flex justify-between py-3.5 px-4 text-sm">
                        <span className="text-gray-500 font-medium">Shipping Origin</span>
                        <span className="font-semibold text-gray-900">Dhaka Logistics Center</span>
                      </div>
                      <div className="flex justify-between py-3.5 px-4 bg-gray-50/70 text-sm">
                        <span className="text-gray-500 font-medium">Warranty</span>
                        <span className="font-semibold text-gray-900">1 Year Official Brand Warranty</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: REVIEWS */}
                {activeTab === "reviews" && (
                  <div className="space-y-8">
                    {/* SUMMARY BANNER */}
                    <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-center sm:text-left">
                        <div className="font-display text-5xl font-black text-gray-900">4.9</div>
                        <div className="flex items-center gap-1 my-1.5 justify-center sm:justify-start">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Based on 128 verified customer ratings</p>
                      </div>

                      <div className="w-full sm:w-64 space-y-1.5 text-xs font-medium text-gray-600">
                        <div className="flex items-center gap-2">
                          <span>5★</span>
                          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full w-[88%]" />
                          </div>
                          <span>88%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>4★</span>
                          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full w-[9%]" />
                          </div>
                          <span>9%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>3★</span>
                          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full w-[2%]" />
                          </div>
                          <span>2%</span>
                        </div>
                      </div>
                    </div>

                    {/* SAMPLE REVIEWS */}
                    <div className="space-y-4">
                      {[
                        {
                          name: "Tanvir Hasan",
                          date: "2 days ago",
                          rating: 5,
                          comment: "Exceptional build quality! Delivered to Gulshan within 24 hours. Exactly as pictured.",
                        },
                        {
                          name: "Nusrat Jahan",
                          date: "1 week ago",
                          rating: 5,
                          comment: "Very smooth purchasing experience. The item arrived securely packaged with official warranty cards.",
                        },
                        {
                          name: "Abrar Chowdhury",
                          date: "2 weeks ago",
                          rating: 4,
                          comment: "Great product for the price. Support team answered my delivery inquiries promptly.",
                        },
                      ].map((rev, i) => (
                        <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                                {rev.name.charAt(0)}
                              </div>
                              <div>
                                <h5 className="font-semibold text-sm text-gray-900">{rev.name}</h5>
                                <span className="text-[10px] text-emerald-600 font-medium">✓ Verified Buyer</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">{rev.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: rev.rating }).map((_, starIdx) => (
                              <Star key={starIdx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: FAQS */}
                {activeTab === "faqs" && (
                  <div className="space-y-4">
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h3>
                    <div className="space-y-3">
                      {[
                        {
                          q: "How fast is delivery inside Dhaka?",
                          a: "Orders placed before 2:00 PM are processed same-day. Delivery inside Dhaka typically takes 24 to 48 hours.",
                        },
                        {
                          q: "Can I pay using Cash on Delivery (COD)?",
                          a: "Yes! You can choose Cash on Delivery during checkout, or pay securely using Cards and Mobile Banking via SSLCommerz.",
                        },
                        {
                          q: "What is your replacement policy?",
                          a: "We offer a 7-day hassle-free replacement policy if the product arrives damaged or defective. Simply contact our support team.",
                        },
                        {
                          q: "Is this item covered by warranty?",
                          a: "Yes, this product includes official brand warranty covering manufacturing defects.",
                        },
                      ].map((faq, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                          <h5 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                            {faq.q}
                          </h5>
                          <p className="text-xs sm:text-sm text-gray-600 pl-6 leading-relaxed">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: STICKY PURCHASE PANEL (ByteSpace Style) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="bg-white rounded-[28px] border border-gray-200/90 p-6 sm:p-8 shadow-lg shadow-gray-200/50 space-y-6">
                {/* HEADER INFO */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {product.sku.split("-")[0]} Category
                    </span>
                    <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
                  </div>

                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-800">4.9</span>
                    <span className="text-xs text-gray-400">• 128 Reviews</span>
                  </div>
                </div>

                {/* PRICE SECTION */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900">
                      ৳{product.price.toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-gray-400 line-through">
                      ৳{originalPrice}
                    </span>
                    <span className="text-xs font-bold bg-[#D6FD04] text-black px-2 py-0.5 rounded-full ml-auto">
                      18% OFF
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Special promotional pricing applied for a limited time.
                  </p>
                </div>

                {/* QUANTITY PICKER */}
                {product.in_stock && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Quantity
                    </label>
                    <div className="flex items-center justify-between border border-gray-200 rounded-2xl p-1 bg-gray-50/50">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-xs"
                      >
                        <Minus className="w-4 h-4 text-gray-700" />
                      </button>

                      <span className="font-display font-bold text-base text-gray-900 w-12 text-center">
                        {quantity}
                      </span>

                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-xs"
                      >
                        <Plus className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>
                )}

                {/* PRIMARY ACTIONS */}
                <div className="space-y-3 pt-2">
                  {product.in_stock ? (
                    <>
                      <Button
                        size="lg"
                        className="w-full h-13 rounded-2xl font-display font-bold text-base bg-[#003BE2] hover:bg-[#002DB8] text-white shadow-md hover:shadow-lg transition-all"
                        disabled={isAdding}
                        onClick={() => handleAddToCart(false)}
                      >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        {isAdding ? "Adding..." : "Add to Cart"}
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-13 rounded-2xl font-display font-bold text-base bg-[#D6FD04] hover:bg-[#C5EA02] text-black border-transparent shadow-xs transition-all"
                        disabled={isAdding}
                        onClick={() => handleAddToCart(true)}
                      >
                        Buy Now
                      </Button>
                    </>
                  ) : (
                    <Button size="lg" disabled className="w-full h-13 rounded-2xl font-display font-bold text-base">
                      Currently Unavailable
                    </Button>
                  )}
                </div>

                {/* ASSURANCE & TRUST BADGES */}
                <div className="pt-4 border-t border-gray-100 space-y-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Estimated doorstep delivery in 2-3 business days</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Verified authentic product with official warranty</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Headphones className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Have questions? 24/7 dedicated support assistance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RELATED / RECOMMENDED PRODUCTS SECTION */}
        {similarProducts && similarProducts.data.length > 1 && (
          <section className="mt-20 pt-12 border-t border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-display text-2xl font-bold text-gray-900">You Might Also Like</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Customers who viewed this item also checked out these top picks</p>
              </div>
              <Link
                href="/"
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View Catalog <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {similarProducts.data
                .filter((p) => p.id !== productId)
                .slice(0, 4)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="group bg-white rounded-[24px] border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
                  >
                    <div className="aspect-square bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-gray-300 text-xs font-semibold uppercase">No Image</span>
                      )}
                      {!item.in_stock && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Sold Out
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <span className="text-[11px] font-bold text-blue-600 uppercase mb-1">
                        {item.sku.split("-")[0]} Category
                      </span>
                      <h4 className="font-display font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1 my-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="font-display font-bold text-base text-gray-900">
                          ৳{item.price.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                          Details →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
