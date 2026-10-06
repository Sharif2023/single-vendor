"use client";

import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CartPage() {
  const { cartQuery, updateItem, removeItem, clearCart } = useCart();
  const cart = cartQuery.data;

  const handleUpdate = (productId: number, newQty: number) => {
    updateItem(
      { productId, quantity: newQty },
      {
        onError: () => toast.error("Failed to update cart"),
      }
    );
  };

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
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading cart...
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border shadow-sm">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-2xl font-medium mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
            <Link href="/">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <Card key={item.product_id} className="flex flex-col sm:flex-row overflow-hidden">
                  <div className="sm:w-32 h-32 bg-gray-100 flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                    No Image
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-medium text-lg leading-tight">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">৳{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => handleUpdate(item.product_id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => handleUpdate(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemove(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="text-muted-foreground"
                  onClick={() => clearCart(undefined, { onSuccess: () => toast.success("Cart cleared") })}
                >
                  Clear Cart
                </Button>
              </div>
            </div>

            <div className="md:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({cart.count} items)</span>
                    <span>৳{cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>৳{cart.total.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/checkout" className="w-full">
                    <Button className="w-full" size="lg">
                      Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
