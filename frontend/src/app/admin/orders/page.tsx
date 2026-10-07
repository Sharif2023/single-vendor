"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Order, PaginatedResponse } from "@/types";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle,
  Eye,
  CreditCard,
  User,
  MapPin,
  Calendar,
  ExternalLink,
  Phone,
  Mail,
  Clock,
  Filter,
  X,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";

const STATUS_FILTERS = [
  { label: "All Orders", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status") || "";
  const urlSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (urlStatus !== statusFilter) setStatusFilter(urlStatus);
    if (urlSearch !== search) setSearch(urlSearch);
  }, [urlStatus, urlSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", { page, search, status: statusFilter }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Order>>("/admin/orders", {
        params: { 
          page, 
          search: search || undefined, 
          status: statusFilter || undefined 
        },
      });
      return data;
    },
  });

  // Query for single order details when modal is open
  const { data: orderDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["admin", "order", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return null;
      const { data } = await api.get<any>(`/admin/orders/${selectedOrderId}`);
      return data;
    },
    enabled: !!selectedOrderId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/admin/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ["admin", "order", selectedOrderId] });
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "processing": return "bg-purple-100 text-purple-800 border-purple-200";
      case "shipped": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "cancelled": return "bg-rose-100 text-rose-800 border-rose-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Orders Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track customer orders, payments, fulfillment status, and delivery logistics.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm ring-2 ring-primary/20"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Search Input & Reset */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[260px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by ID, name, phone, email..."
              className="pl-8 pr-8 bg-white h-9 text-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button 
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {(statusFilter || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("");
                setSearch("");
                setPage(1);
              }}
              className="text-xs h-9 text-muted-foreground hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="w-[100px] text-xs font-semibold text-slate-600">Order ID</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Customer</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Total</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Payment</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Delivery</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="loader" style={{ "--size": "0.65px" } as React.CSSProperties}></span>
                      <span className="text-xs font-medium text-gray-400 tracking-wide">
                        Loading orders...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-14 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">No orders found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try adjusting your search criteria or status filter.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((order) => (
                  <TableRow 
                    key={order.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <TableCell className="font-semibold text-primary">
                      #{order.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 text-sm">{order.customer_name}</div>
                      <div className="text-xs text-slate-400">{order.customer_email}</div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 text-sm">
                      ৳{Number(order.total).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          order.payment?.status === "paid" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" 
                            : "bg-slate-50 text-slate-600 border-slate-200 text-xs"
                        }
                      >
                        {order.payment?.status?.toUpperCase() || "PENDING"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.delivery ? (
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[11px] font-mono">
                            {order.delivery.consignment_id || order.delivery.status}
                          </Badge>
                          {order.delivery.tracking_url && (
                            <a
                              href={order.delivery.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:text-primary/80"
                              title="Track parcel"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not Dispatched</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-primary"
                          onClick={() => setSelectedOrderId(order.id)}
                          title="View order details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: order.id, status: "processing" })}>
                              <Package className="mr-2 h-4 w-4 text-purple-600" /> Mark Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: order.id, status: "shipped" })}>
                              <Truck className="mr-2 h-4 w-4 text-indigo-600" /> Mark Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: order.id, status: "delivered" })}>
                              <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Mark Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: "cancelled" })}
                              className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                            >
                              <XCircle className="mr-2 h-4 w-4 text-rose-600" /> Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>
          Showing {data?.data.length || 0} of {data?.total || 0} orders
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-xs h-8"
          >
            Previous
          </Button>
          <span className="font-medium text-slate-700 px-1">
            Page {page} of {data?.last_page || 1}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!data || page >= data.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs h-8"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {isLoadingDetails || !orderDetails ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <span className="loader" style={{ "--size": "0.65px" } as React.CSSProperties}></span>
              <p className="text-xs text-slate-500 font-medium">Loading order #{selectedOrderId} details...</p>
            </div>
          ) : (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <DialogTitle className="text-xl font-bold text-slate-900">
                      Order #{orderDetails.id}
                    </DialogTitle>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(orderDetails.status)}`}>
                      {orderDetails.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(orderDetails.created_at).toLocaleString()}
                  </div>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Full customer profile, order items, payment records, and delivery tracking.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Customer and Shipping Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <User className="h-4 w-4 text-primary" /> Customer Info
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-slate-900">{orderDetails.customer_name}</p>
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-slate-400" /> {orderDetails.customer_email}
                      </p>
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400" /> {orderDetails.customer_phone}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 text-primary" /> Delivery Address
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed">
                      {orderDetails.customer_address}
                    </div>
                    {orderDetails.notes && (
                      <div className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5 mt-1.5">
                        <span className="font-semibold">Notes: </span>{orderDetails.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-slate-500" />
                    Ordered Items ({orderDetails.items?.length || 0})
                  </div>
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="text-left py-2 px-3">Item</th>
                          <th className="text-center py-2 px-3">Qty</th>
                          <th className="text-right py-2 px-3">Price</th>
                          <th className="text-right py-2 px-3">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orderDetails.items?.map((item: any) => {
                          const name = item.product?.name || item.product_name || `Product #${item.product_id}`;
                          const unitPrice = Number(item.unit_price ?? item.price ?? 0);
                          const lineTotal = Number(item.subtotal ?? (item.quantity * unitPrice));
                          return (
                            <tr key={item.id}>
                              <td className="py-2.5 px-3">
                                <p className="font-medium text-slate-900">{name}</p>
                                {(item.product?.sku || item.sku) && (
                                  <p className="text-[11px] text-slate-400 font-mono">SKU: {item.product?.sku || item.sku}</p>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                              <td className="py-2.5 px-3 text-right text-slate-600">৳{unitPrice.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                                ৳{lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50/50 border-t border-slate-200">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-3 text-right font-semibold text-slate-700">Grand Total:</td>
                          <td className="py-2.5 px-3 text-right font-bold text-sm text-primary">
                            ৳{Number(orderDetails.total).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Payment & Logistics Badges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <CreditCard className="h-4 w-4 text-emerald-600" /> Payment Details
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Provider:</span>
                        <span className="font-semibold">{orderDetails.payment?.provider || "SSLCommerz"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700">
                          {orderDetails.payment?.status?.toUpperCase() || "PENDING"}
                        </Badge>
                      </div>
                      {orderDetails.payment?.transaction_id && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Transaction ID:</span>
                          <span className="font-mono text-[11px]">{orderDetails.payment.transaction_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Truck className="h-4 w-4 text-orange-600" /> Delivery Status
                    </div>
                    {orderDetails.delivery ? (
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Carrier:</span>
                          <span className="font-semibold">{orderDetails.delivery.carrier || "CarryBee"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Consignment:</span>
                          <span className="font-mono text-[11px] font-bold text-slate-800">
                            {orderDetails.delivery.consignment_id}
                          </span>
                        </div>
                        {orderDetails.delivery.tracking_url && (
                          <div className="pt-1">
                            <a
                              href={orderDetails.delivery.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                            >
                              <ExternalLink className="h-3 w-3" /> Track on CarryBee Portal
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-1">Delivery parcel not yet dispatched.</p>
                    )}
                  </div>
                </div>

                {/* Quick Status Action Buttons */}
                <div className="pt-2 border-t space-y-2">
                  <div className="text-xs font-semibold text-slate-700">Update Order Status:</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      disabled={updateStatusMutation.isPending || orderDetails.status === "processing"}
                      onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "processing" })}
                    >
                      <Package className="h-3.5 w-3.5 mr-1 text-purple-600" /> Mark Processing
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      disabled={updateStatusMutation.isPending || orderDetails.status === "shipped"}
                      onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "shipped" })}
                    >
                      <Truck className="h-3.5 w-3.5 mr-1 text-indigo-600" /> Mark Shipped
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      disabled={updateStatusMutation.isPending || orderDetails.status === "delivered"}
                      onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "delivered" })}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Mark Delivered
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      disabled={updateStatusMutation.isPending || orderDetails.status === "cancelled"}
                      onClick={() => updateStatusMutation.mutate({ id: orderDetails.id, status: "cancelled" })}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1 text-rose-600" /> Cancel
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t pt-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminOrders() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <span className="loader" style={{ "--size": "0.75px" } as React.CSSProperties}></span>
          <span className="text-xs font-medium text-slate-400 tracking-wide">
            Loading orders workspace...
          </span>
        </div>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}
