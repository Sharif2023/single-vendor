"use client";

import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartQuery } = useCart();
  const cart = cartQuery.data;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        items: cart.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      };

      const { data } = await api.post("/checkout", payload);
      
      // Redirect to SSLCommerz
      window.location.href = data.payment_url;
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to process checkout. Please try again.");
      setIsLoading(false);
    }
  };

  if (cartQuery.isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50/50">
        <span className="loader"></span>
        <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">Loading checkout...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <>
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/cart" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#003BE2] transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-900">Checkout</h1>
          <p className="text-gray-500 text-sm mt-1">Provide your delivery details to complete your order securely.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-[28px] border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="font-display text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">
                Shipping & Contact Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold text-gray-700">Full Name *</Label>
                  <Input 
                    id="name" 
                    required 
                    placeholder="John Doe"
                    className="rounded-full h-11 border-gray-200 focus:border-[#003BE2] px-4"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    required 
                    placeholder="01XXXXXXXXX"
                    className="rounded-full h-11 border-gray-200 focus:border-[#003BE2] px-4"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  placeholder="john@example.com"
                  className="rounded-full h-11 border-gray-200 focus:border-[#003BE2] px-4"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-semibold text-gray-700">Full Delivery Address *</Label>
                <Input 
                  id="address" 
                  required 
                  placeholder="House, Road, Area, City"
                  className="rounded-2xl h-12 border-gray-200 focus:border-[#003BE2] px-4"
                  value={formData.customer_address}
                  onChange={(e) => setFormData({...formData, customer_address: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-[28px] border border-gray-100 p-6 shadow-sm sticky top-24 space-y-5">
              <h2 className="font-display font-bold text-xl text-gray-900 pb-3 border-b border-gray-100">
                Order Summary
              </h2>
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 text-sm">
                {cart.items.map(item => (
                  <div key={item.product_id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{item.quantity}x</span>
                      <span className="line-clamp-1 text-gray-800">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900 whitespace-nowrap ml-3">
                      ৳{item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2.5 pt-3 border-t border-gray-100 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">৳{cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between font-display text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-[#003BE2]">৳{cart.total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-12 rounded-full bg-[#003BE2] hover:bg-blue-700 text-white font-display font-semibold shadow-md shadow-blue-500/25" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <><span className="loader mr-2" style={{ "--color-1": "#ffffff", "--size": "0.38px" } as React.CSSProperties}></span> Processing...</>
                ) : (
                  "Place Order & Pay"
                )}
              </Button>
              
              <div className="flex items-center justify-center text-xs text-gray-400 gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Secure payment powered by SSLCommerz
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
