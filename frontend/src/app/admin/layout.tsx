"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X,
  ShieldCheck,
  Store
} from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (pathname === "/admin/login") {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setAdminUser(data);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {}
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <span className="loader"></span>
        <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
          Loading Admin Panel...
        </p>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAuthenticated) return null;

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Deliveries", href: "/admin/deliveries", icon: Truck },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard";
    if (pathname.startsWith("/admin/orders")) return "Orders Management";
    if (pathname.startsWith("/admin/products")) return "Product Inventory";
    if (pathname.startsWith("/admin/deliveries")) return "Logistics & Deliveries";
    if (pathname.startsWith("/admin/settings")) return "Store Settings";
    return pathname.split("/").pop() || "Admin";
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" className="h-8 w-8 rounded-lg shadow-sm" alt="Single Vendor" />
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-tight">
                Single Vendor
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Admin Console
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Mini Card */}
        <div className="px-4 py-3 mx-3 my-3 bg-slate-800/60 rounded-lg border border-slate-700/50 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-semibold">
            {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {adminUser?.name || "Administrator"}
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Online
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-2 px-3 overflow-y-auto">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm shadow-primary/30"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className={`h-4 w-4 mr-3 ${isActive ? "text-white" : "text-slate-400"}`} />
                      {item.label}
                    </div>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mt-6 mb-2">
            Storefront
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all group"
          >
            <div className="flex items-center">
              <Store className="h-4 w-4 mr-3 text-slate-400 group-hover:text-white" />
              Live Storefront
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-white" />
          </a>
        </nav>

        {/* Footer with Logout */}
        <div className="p-3 pb-12 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8 shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Store
            </a>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <span className="hidden md:inline-block text-xs font-medium text-slate-600">
                {adminUser?.email || "admin@example.com"}
              </span>
              <Badge variant="outline" className="text-[11px] bg-slate-50 text-slate-600 border-slate-300">
                Admin
              </Badge>
            </div>
          </div>
        </header>

        {/* Page Content Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/60">
          {children}
        </div>
      </main>
    </div>
  );
}
