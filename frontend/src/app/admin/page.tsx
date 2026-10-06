"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DashboardStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Package, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/admin/dashboard");
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
      case "refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.revenue.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +৳{stats.revenue.this_week.toLocaleString()} this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.orders.pending + stats.orders.paid}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.orders.pending} pending, {stats.orders.paid} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Health</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inventory.total_products}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total products cataloged
            </p>
          </CardContent>
        </Card>

        <Card className={stats.inventory.out_of_stock_count > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.inventory.out_of_stock_count > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.inventory.out_of_stock_count}
            </div>
            <p className="text-xs text-red-500 mt-1">
              Products out of stock
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Orders */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent_orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ৳{order.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {stats.recent_orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No recent orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.inventory.low_stock.map((product) => (
                <div key={product.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="destructive" className="ml-auto">
                      {product.stock} left
                    </Badge>
                  </div>
                </div>
              ))}
              {stats.inventory.low_stock.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  All products are well stocked.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
