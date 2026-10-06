"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
  const { cartQuery } = useCart();
  const cart = cartQuery.data;

  return (
    <nav className="sticky top-0 z-50 w-full glass">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="h-10 w-10 bg-black text-white flex items-center justify-center rounded-xl group-hover:scale-105 transition-transform duration-300">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">STORE</span>
        </Link>

        <div className="flex items-center space-x-6">
          <Link href="/cart">
            <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-black/5 transition-colors p-0 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
              {cart && cart.count > 0 && (
                <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black text-[10px] font-bold text-white flex items-center justify-center shadow-md transform hover:scale-110 transition-transform border-2 border-white">
                  {cart.count}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
