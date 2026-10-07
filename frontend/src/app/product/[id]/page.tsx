"use client";

import { use, useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  X,
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("center center");

  // Collect all images (main + sub-images up to 5)
  const galleryImages: string[] = [];
  if (product?.image_url) {
    galleryImages.push(product.image_url);
  }
  if (product?.images && Array.isArray(product.images)) {
    product.images.forEach((img) => {
      if (img.image_url && !galleryImages.includes(img.image_url)) {
        galleryImages.push(img.image_url);
      }
    });
  }

  // Handle keyboard navigation for modal lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev + 1) % (galleryImages.length || 1));
      }
      if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) => (prev - 1 + (galleryImages.length || 1)) % (galleryImages.length || 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, galleryImages.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryImages.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryImages.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
    }
  };

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

  const currentPrice = product?.discount_price ? product.discount_price : product?.price || 0;
  const originalPrice = product?.discount_price ? product.price : null;
  const discountPercent = product?.discount_price ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0;

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
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 bg-white rounded-[28px] border border-gray-100 p-12 shadow-xs">
            <span className="loader"></span>
            <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
              Loading Product Details...
            </p>
          </div>
        ) : product && (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: VISUALS + TABS */}
            <div className="lg:col-span-7 space-y-8">
              {/* PROFESSIONAL MULTI-IMAGE PRODUCT GALLERY */}
              <div className="bg-white rounded-[28px] border border-gray-200/80 p-5 sm:p-7 shadow-xs space-y-4">
                {/* MAIN SHOWCASE CONTAINER WITH ZOOM & CONTROLS */}
                <div 
                  className="aspect-[4/3] sm:aspect-square w-full rounded-2xl bg-gray-50 flex items-center justify-center relative overflow-hidden group select-none cursor-crosshair"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => {
                    setIsHovering(false);
                    setZoomOrigin("center center");
                  }}
                  onClick={() => setIsLightboxOpen(true)}
                >
                  {galleryImages.length > 0 ? (
                    <>
                      {/* BASE IMAGE */}
                      <img
                        src={galleryImages[selectedImageIndex] || galleryImages[0]}
                        alt={`${product.name} - View ${selectedImageIndex + 1}`}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />

                      {/* HOVER MAGNIFIER LAYER */}
                      <div
                        className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
                          isHovering ? "opacity-100" : "opacity-0"
                        }`}
                        style={{
                          backgroundImage: `url(${galleryImages[selectedImageIndex] || galleryImages[0]})`,
                          backgroundPosition: zoomOrigin,
                          backgroundSize: "220%",
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    </>
                  ) : (
                    <div className="text-center p-6 text-gray-400">
                      <ShoppingBag className="w-16 h-16 mx-auto mb-2 opacity-30" />
                      <span className="font-semibold text-sm uppercase tracking-wider">No Image Preview</span>
                    </div>
                  )}

                  {/* FLOATING STATUS BADGES */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
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

                  {/* TOP-RIGHT CONTROLS: FULLSCREEN & ZOOM HINT */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLightboxOpen(true);
                      }}
                      className="p-2.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md shadow-md transition-all hover:scale-105"
                      title="Expand to Fullscreen Lightbox"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* CAROUSEL ARROWS ON SHOWCASE (IF MULTIPLE IMAGES) */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        title="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        title="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* BOTTOM FLOATING BAR: DISCOUNT & IMAGE COUNTER */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[#D6FD04] text-xs font-bold shadow-xs">
                      Save 18% OFF
                    </span>

                    {galleryImages.length > 1 && (
                      <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold shadow-xs">
                        {selectedImageIndex + 1} / {galleryImages.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* THUMBNAIL GALLERY STRIP */}
                {galleryImages.length > 1 && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                      {galleryImages.map((imgUrl, idx) => {
                        const isSelected = selectedImageIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedImageIndex(idx)}
                            onMouseEnter={() => setSelectedImageIndex(idx)}
                            className={`relative aspect-square w-16 sm:w-20 rounded-xl overflow-hidden border-2 transition-all duration-200 shrink-0 cursor-pointer ${
                              isSelected
                                ? "border-gray-900 ring-2 ring-gray-900/20 shadow-md scale-105"
                                : "border-gray-200 hover:border-gray-400 opacity-75 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CLEAN SEGMENTED TAB NAVIGATION (NO HORIZONTAL SCROLLBAR) */}
              <div className="bg-white rounded-[24px] border border-gray-200/80 p-1.5 sm:p-2 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "specs", label: "Specifications" },
                    { id: "reviews", label: "Reviews (128)" },
                    { id: "faqs", label: "FAQs & Warranty" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`w-full py-2.5 sm:py-3 px-2 sm:px-3 text-center rounded-xl font-display text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
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

            {/* RIGHT COLUMN: STICKY PURCHASE PANEL (Single Vendor Store) */}
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

                {/* DYNAMIC PRICE & CALCULATION SECTION */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900">
                      ৳{(currentPrice * quantity).toFixed(2)}
                    </span>
                    {originalPrice && (
                      <>
                        <span className="text-sm font-medium text-gray-400 line-through">
                          ৳{(originalPrice * quantity).toFixed(2)}
                        </span>
                        <span className="text-xs font-bold bg-[#D6FD04] text-black px-2 py-0.5 rounded-full ml-auto">
                          {discountPercent}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {quantity > 1 ? (
                    <div className="text-xs text-gray-600 font-medium flex items-center justify-between pt-1 border-t border-gray-200/60">
                      <span>৳{currentPrice.toFixed(2)} × {quantity} items</span>
                      <span className="font-bold text-gray-900">Total: ৳{(currentPrice * quantity).toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {originalPrice ? "Special promotional pricing applied." : "Best price guaranteed."}
                    </p>
                  )}
                </div>

                {/* QUANTITY PICKER */}
                {product.in_stock && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Quantity
                      </label>
                      <span className="text-xs text-gray-400 font-medium">
                        (Available: {product.stock})
                      </span>
                    </div>
                    <div className="flex items-center justify-between border border-gray-200 rounded-2xl p-1 bg-gray-50/50">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                        title="Decrease quantity"
                      >
                        <Minus className="w-4 h-4 text-gray-700" />
                      </button>

                      <div className="flex flex-col items-center">
                        <span className="font-display font-bold text-base text-gray-900 w-16 text-center">
                          {quantity}
                        </span>
                        {quantity > 1 && (
                          <span className="text-[10px] text-gray-400 font-medium -mt-0.5">
                            units
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                        title="Increase quantity"
                      >
                        <Plus className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* LIVE CALCULATION CARD */}
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100/80 flex items-center justify-between text-xs mt-2">
                      <span className="text-gray-600 font-medium">
                        Order Subtotal ({quantity} {quantity > 1 ? "items" : "item"}):
                      </span>
                      <span className="font-display font-bold text-sm text-[#003BE2]">
                        ৳{(currentPrice * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* PRIMARY ACTIONS */}
                <div className="space-y-3 pt-2">
                  {product.in_stock ? (
                    <>
                      <Button
                        size="lg"
                        className="w-full h-13 rounded-2xl font-display font-bold text-base bg-[#003BE2] hover:bg-[#002DB8] text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                        disabled={isAdding}
                        onClick={() => handleAddToCart(false)}
                      >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        {isAdding ? "Adding..." : `Add to Cart • ৳${(currentPrice * quantity).toFixed(2)}`}
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-13 rounded-2xl font-display font-bold text-base bg-[#D6FD04] hover:bg-[#C5EA02] text-black border-transparent shadow-xs transition-all cursor-pointer"
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

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && galleryImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* TOP BAR */}
          <div className="flex items-center justify-between text-white max-w-6xl mx-auto w-full z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <h4 className="font-display font-semibold text-base sm:text-lg truncate max-w-sm sm:max-w-md">
                {product?.name}
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
                {selectedImageIndex + 1} of {galleryImages.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* CENTER IMAGE WITH ARROWS */}
          <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full my-4" onClick={(e) => e.stopPropagation()}>
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-md transition-all hover:scale-110 cursor-pointer"
                title="Previous (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative max-h-[75vh] max-w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
              <img
                src={galleryImages[selectedImageIndex]}
                alt={product?.name || "Product preview"}
                className="max-h-[75vh] w-auto max-w-full object-contain mx-auto"
              />
            </div>

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-md transition-all hover:scale-110 cursor-pointer"
                title="Next (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* BOTTOM THUMBNAIL STRIP */}
          {galleryImages.length > 1 && (
            <div className="flex items-center justify-center gap-3 overflow-x-auto py-2 z-10" onClick={(e) => e.stopPropagation()}>
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square w-14 sm:w-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? "border-[#D6FD04] ring-2 ring-[#D6FD04]/40 scale-110 shadow-lg"
                      : "border-white/30 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
