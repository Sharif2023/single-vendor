"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DashboardStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowRight,
  TrendingUp, 
  Truck, 
  Plus, 
  RefreshCw,
  Settings
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: stats, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/admin/dashboard");
      return data;
    },
    refetchInterval: 60000,
  });

  if (isLoading || !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <span className="loader"></span>
        <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
          Loading dashboard metrics...
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
      case "processing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
      case "refunded":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Welcome & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Store Overview</h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time financial performance, inventory health, and recent orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/admin/products">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs h-9 shadow-sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid - All interactive and linked to filtered lists */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue -> Paid Orders */}
        <Link 
          href="/admin/orders?status=paid" 
          className="block group focus:outline-none"
          title="Click to view paid orders"
        >
          <Card className="border border-slate-200/80 shadow-xs group-hover:border-emerald-300 group-hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                Total Revenue
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ৳{Number(stats.revenue.total).toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-emerald-600 font-medium">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+৳{Number(stats.revenue.this_week).toLocaleString()} this week</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-700" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Active Orders -> All Orders */}
        <Link 
          href="/admin/orders" 
          className="block group focus:outline-none"
          title="Click to manage orders"
        >
          <Card className="border border-slate-200/80 shadow-xs group-hover:border-blue-300 group-hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider group-hover:text-blue-700 transition-colors">
                Active Orders
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.orders.pending + stats.orders.paid}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                <p>
                  <span className="font-semibold text-slate-700">{stats.orders.paid}</span> paid,{" "}
                  <span className="font-semibold text-slate-700">{stats.orders.pending}</span> pending
                </p>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Total Cataloged Products -> Products Catalog */}
        <Link 
          href="/admin/products" 
          className="block group focus:outline-none"
          title="Click to view all products"
        >
          <Card className="border border-slate-200/80 shadow-xs group-hover:border-purple-300 group-hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider group-hover:text-purple-700 transition-colors">
                Inventory Health
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                <Package className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.inventory.total_products}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                <p>Active cataloged items</p>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Stock Alerts -> Filtered directly to out_of_stock products */}
        <Link 
          href="/admin/products?stock_status=out_of_stock" 
          className="block group focus:outline-none"
          title="Click to view out of stock products"
        >
          <Card className={`border shadow-xs group-hover:shadow-md transition-all ${
            stats.inventory.out_of_stock_count > 0 
              ? "border-rose-200 bg-rose-50/30 group-hover:border-rose-400 group-hover:bg-rose-50/60" 
              : "border-slate-200/80 group-hover:border-slate-300"
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider group-hover:text-rose-700 transition-colors">
                Stock Warnings
              </CardTitle>
              <div className={`p-2 rounded-lg transition-colors ${
                stats.inventory.out_of_stock_count > 0 
                  ? "bg-rose-100 text-rose-600 group-hover:bg-rose-200" 
                  : "bg-slate-100 text-slate-500"
              }`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                stats.inventory.out_of_stock_count > 0 ? "text-rose-600" : "text-slate-900"
              }`}>
                {stats.inventory.out_of_stock_count}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs font-medium">
                <p className={stats.inventory.out_of_stock_count > 0 ? "text-rose-600" : "text-slate-500"}>
                  {stats.inventory.out_of_stock_count > 0 ? "Items currently out of stock" : "All products in stock"}
                </p>
                <span className="text-[11px] text-rose-600 underline font-semibold flex items-center gap-0.5">
                  View List <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Link 
          href="/admin/orders" 
          className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-primary/50 hover:shadow-sm transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-primary group-hover:text-white transition-colors">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Fulfill Orders</div>
              <div className="text-[11px] text-slate-400">View customer orders</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link 
          href="/admin/deliveries" 
          className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-primary/50 hover:shadow-sm transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">CarryBee Parcels</div>
              <div className="text-[11px] text-slate-400">Live courier tracking</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link 
          href="/admin/products" 
          className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-primary/50 hover:shadow-sm transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Catalog Inventory</div>
              <div className="text-[11px] text-slate-400">Manage images & stock</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link 
          href="/admin/settings" 
          className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-primary/50 hover:shadow-sm transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Gateway Settings</div>
              <div className="text-[11px] text-slate-400">SSLCommerz & keys</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Main Tables Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Orders Table */}
        <Card className="lg:col-span-4 border border-slate-200/80 shadow-xs overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-4 bg-slate-50/50 border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">Recent Customer Orders</CardTitle>
              <CardDescription className="text-xs text-slate-400">Latest transactions from the storefront.</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/90 h-8 gap-1">
                View All <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-600">Order ID</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Customer</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-600">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent_orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/60">
                    <TableCell className="font-semibold text-primary text-xs">
                      <Link href="/admin/orders" className="hover:underline">
                        #{order.id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-800">
                      {order.customer_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-xs text-slate-900">
                      ৳{Number(order.total).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {stats.recent_orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                      No recent orders recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Watchlist */}
        <Card className="lg:col-span-3 border border-slate-200/80 shadow-xs overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-4 bg-slate-50/50 border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">Low Stock Watchlist</CardTitle>
              <CardDescription className="text-xs text-slate-400">Products requiring inventory replenishment.</CardDescription>
            </div>
            <Link href="/admin/products?stock_status=low_stock">
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/90 h-8 gap-1">
                View Low Stock <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {stats.inventory.low_stock.map((product) => (
              <Link
                key={product.id}
                href={`/admin/products?search=${encodeURIComponent(product.sku)}`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 hover:border-slate-300 transition-all border border-slate-100 group"
                title={`Click to filter and edit ${product.name}`}
              >
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-primary transition-colors truncate">
                    {product.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">SKU: {product.sku}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={
                      product.stock <= 0 
                        ? "bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold" 
                        : "bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold"
                    }
                  >
                    {product.stock <= 0 ? "Out of Stock" : `${product.stock} units`}
                  </Badge>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
            {stats.inventory.low_stock.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <Package className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-xs font-medium text-slate-600">All products adequately stocked</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No immediate re-order required.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
