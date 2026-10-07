"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function FailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const reason = searchParams.get("reason");

  return (
    <main className="container mx-auto px-4 py-16 flex items-center justify-center">
      <Card className="max-w-md w-full text-center border-destructive/20">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {reason === "cancelled" 
              ? "You cancelled the payment process." 
              : "We couldn't process your payment. Your account has not been charged."}
          </p>
          {orderId && (
            <div className="bg-muted p-3 rounded-md mb-2">
              <p className="text-sm font-medium">Order Reference:</p>
              <p className="font-mono text-lg">#{orderId}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Please try again using a different payment method or contact support if the problem persists.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-8">
          <Link href="/checkout" className="w-full">
            <Button className="w-full">
              <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Return to Store
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}

export default function PaymentFailedPage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50/50">
            <span className="loader"></span>
            <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
              Loading payment details...
            </p>
          </div>
        }
      >
        <FailedContent />
      </Suspense>
    </>
  );
}
