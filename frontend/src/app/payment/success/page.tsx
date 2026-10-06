"use client";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { Suspense, useEffect } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container mx-auto px-4 py-16 flex items-center justify-center">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
          {orderId && (
            <div className="bg-muted p-3 rounded-md mb-2">
              <p className="text-sm font-medium">Order Reference:</p>
              <p className="font-mono text-lg font-bold">#{orderId}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            We'll send you an email with your order details and tracking information once your package has shipped.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          <Link href="/">
            <Button>
              Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </>
  );
}
