"use client";

import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CartPage() {
  const { cartQuery, stepQuantity, flushUpdates, removeItem, clearCart } = useCart();
  const cart = cartQuery.data;

  const handleRemove = (productId: number) => {
    removeItem(productId, {
      onSuccess: () => toast.success("Item removed"),
      onError: () => toast.error("Failed to remove item"),
    });
  };

  if (cartQuery.isLoading) {
    return (
      <>
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <span className="loader"></span>
            <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">Loading cart...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-900">Shopping Cart</h1>
          <p className="text-gray-500 text-sm mt-1">Review your selected items before proceeding to checkout.</p>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[28px] border border-gray-100 shadow-sm p-8">
            <div className="w-20 h-20 bg-blue-50 text-[#003BE2] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2 text-gray-900">Your cart is empty</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
              Explore our wide range of gadgets and electronics to add items to your cart.
            </p>
            <Link href="/">
              <Button size="lg" className="rounded-full bg-[#003BE2] hover:bg-blue-700 text-white font-semibold px-8 shadow-md shadow-blue-500/20">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div key={item.product_id} className="bg-white rounded-[24px] border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5 items-center">
                  <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center p-2">
                    <img 
                      src={item.image_url || `https://picsum.photos/seed/${item.product_id}/200/200`} 
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 w-full flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link href={`/product/${item.product_id}`}>
                          <h3 className="font-display font-semibold text-base text-gray-900 hover:text-[#003BE2] transition-colors leading-snug">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-400 mt-1">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-lg text-gray-900">৳{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-gray-600 hover:bg-white active:scale-90 transition-transform cursor-pointer"
                          onClick={() => stepQuantity(item.product_id, -1, { onError: () => toast.error("Failed to update cart") })}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center text-sm font-bold text-gray-900 select-none">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-gray-600 hover:bg-white active:scale-90 transition-transform cursor-pointer"
                          onClick={() => stepQuantity(item.product_id, 1, { onError: () => toast.error("Failed to update cart") })}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full h-8 w-8 cursor-pointer"
                        onClick={() => handleRemove(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-2">
                <Link href="/" className="text-sm font-medium text-[#003BE2] hover:underline flex items-center gap-1.5">
                  ← Continue Shopping
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-full text-gray-500 border-gray-200 text-xs hover:bg-gray-50"
                  onClick={() => clearCart(undefined, { onSuccess: () => toast.success("Cart cleared") })}
                >
                  Clear Cart
                </Button>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white rounded-[28px] border border-gray-100 p-6 shadow-sm sticky top-24 space-y-5">
                <h2 className="font-display font-bold text-xl text-gray-900 pb-3 border-b border-gray-100">
                  Order Summary
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.count} items)</span>
                    <span className="font-medium text-gray-900">৳{cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Estimated Shipping</span>
                    <span className="text-emerald-600 font-medium">Free</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between font-display text-lg font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-[#003BE2]">৳{cart.total.toFixed(2)}</span>
                  </div>
                </div>

                <Link href="/checkout" onClick={() => flushUpdates()} className="block w-full">
                  <Button className="w-full h-12 rounded-full bg-[#003BE2] hover:bg-blue-700 text-white font-display font-semibold shadow-md shadow-blue-500/25">
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <div className="text-center text-xs text-gray-400">
                  🔒 Safe & Secure 256-bit SSL Checkout
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
