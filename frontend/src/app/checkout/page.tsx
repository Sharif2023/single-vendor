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
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!cart || cart.items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <>
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/cart" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Cart
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping & Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input 
                      id="name" 
                      required 
                      placeholder="John Doe"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone" 
                      required 
                      placeholder="01XXXXXXXXX"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    placeholder="john@example.com"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Delivery Address *</Label>
                  <Input 
                    id="address" 
                    required 
                    placeholder="House, Road, Area, City"
                    value={formData.customer_address}
                    onChange={(e) => setFormData({...formData, customer_address: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                  {cart.items.map(item => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <div className="flex gap-2">
                        <span className="font-medium">{item.quantity}x</span>
                        <span className="line-clamp-1">{item.name}</span>
                      </div>
                      <span className="font-medium whitespace-nowrap ml-4">
                        ৳{item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>৳{cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>৳{cart.total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-4">
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    "Place Order & Pay"
                  )}
                </Button>
                
                <div className="flex items-center justify-center text-xs text-muted-foreground">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Secure payment powered by SSLCommerz
                </div>
              </CardFooter>
            </Card>
          </div>
        </form>
      </main>
    </>
  );
}
