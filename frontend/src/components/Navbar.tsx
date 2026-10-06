"use client";

import Link from "next/link";
import { ShoppingBag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
  const { cartQuery } = useCart();
  const cart = cartQuery.data;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
      <div className="container mx-auto max-w-6xl px-6 h-18 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-10 w-10 bg-[#003BE2] text-[#D6FD04] flex items-center justify-center rounded-2xl group-hover:scale-105 transition-transform duration-300 shadow-sm">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-lg tracking-tight text-gray-900 leading-none">
              STORE<span className="text-[#003BE2]">.</span>
            </span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
              Single-Vendor
            </span>
          </div>
        </Link>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xs font-semibold text-gray-500 hover:text-black hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
            Admin Panel
          </Link>

          <Link href="/cart">
            <Button
              variant="ghost"
              className="relative h-11 w-11 rounded-full hover:bg-gray-100 transition-colors p-0 flex items-center justify-center border border-gray-200"
            >
              <ShoppingBag className="h-4.5 w-4.5 text-gray-800" />
              {cart && cart.count > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#D6FD04] text-[10px] font-black text-black flex items-center justify-center shadow-xs border-2 border-white">
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
