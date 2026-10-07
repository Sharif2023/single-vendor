"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t py-12 mt-auto">
      <div className="container mx-auto max-w-6xl px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Single Vendor Store</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Your one-stop destination for premium products. We offer the best quality items with fast and reliable delivery.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-gray-900">Home</Link></li>
            <li><Link href="/cart" className="hover:text-gray-900">Cart</Link></li>
            <li><Link href="/admin/login" className="hover:text-gray-900">Admin Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>support@singlevendor.com</li>
            <li>+880 1711 223344</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-6 mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Single Vendor Store. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Link href="#" className="hover:text-gray-600">Terms</Link>
          <Link href="#" className="hover:text-gray-600">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
