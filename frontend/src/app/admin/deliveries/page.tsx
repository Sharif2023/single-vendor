"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { PaginatedResponse } from "@/types";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Truck, 
  ExternalLink, 
  Copy, 
  Check, 
  RotateCw, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  Eye,
  User,
  Phone,
  MapPin,
  Info,
  Calendar,
  Search,
  X,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";

const DELIVERY_STATUS_FILTERS = [
  { label: "All Deliveries", value: "" },
  { label: "Dispatched", value: "dispatched" },
  { label: "Pending", value: "pending" },
  { label: "Delivered", value: "delivered" },
  { label: "Failed", value: "failed" },
];

function AdminDeliveriesContent() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status") || "";
  const urlSearch = searchParams.get("search") || "";

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [search, setSearch] = useState(urlSearch);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (urlStatus !== statusFilter) setStatusFilter(urlStatus);
    if (urlSearch !== search) setSearch(urlSearch);
  }, [urlStatus, urlSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "deliveries", { page, status: statusFilter, search }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<any>>("/admin/deliveries", {
        params: { 
          page,
          status: statusFilter || undefined,
          search: search || undefined
        },
      });
      return data;
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/admin/deliveries/${id}/retry`);
      return data;
    },
    onSuccess: () => {
      toast.success("Delivery dispatch job re-queued successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "deliveries"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to retry delivery dispatch");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Delivered
          </Badge>
        );
      case "dispatched":
      case "in_transit":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
            <Truck className="h-3 w-3 mr-1 text-blue-600" /> Dispatched
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
            <Clock className="h-3 w-3 mr-1 text-amber-600" /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
            <AlertCircle className="h-3 w-3 mr-1 text-rose-600" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const orderData = selectedDelivery?.api_response?.data?.order;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Courier & Deliveries</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track real-time CarryBee consignments, parcel dispatch timestamps, and delivery statuses.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {DELIVERY_STATUS_FILTERS.map((filter) => {
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
              placeholder="Search by consignment, tracking, order #..."
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

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="w-[100px] text-xs font-semibold text-slate-600">Order #</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Consignment ID</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Courier / Carrier</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Live Tracking</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Dispatched At</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="loader" style={{ "--size": "0.65px" } as React.CSSProperties}></span>
                      <span className="text-xs font-medium text-gray-400 tracking-wide">Loading deliveries...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                    <Truck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">No deliveries found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Deliveries are automatically created when paid orders are dispatched.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((delivery: any) => {
                  const trackingUrl = delivery.tracking_url || (delivery.consignment_id ? `https://carrybee.com/track?consignmentId=${delivery.consignment_id}` : null);
                  return (
                    <TableRow 
                      key={delivery.id} 
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedDelivery(delivery)}
                    >
                      <TableCell className="font-semibold text-primary">
                        #{delivery.order_id}
                      </TableCell>
                      <TableCell>
                        {delivery.consignment_id ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-slate-800" onClick={(e) => e.stopPropagation()}>
                            <span>{delivery.consignment_id}</span>
                            <button
                              onClick={() => copyToClipboard(delivery.consignment_id)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Copy Consignment ID"
                            >
                              {copiedId === delivery.consignment_id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not Assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-slate-700">{delivery.carrier || "CarryBee"}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(delivery.status)}
                        {delivery.failed_reason && (
                          <p className="text-[11px] text-rose-500 mt-0.5 truncate max-w-[200px]" title={delivery.failed_reason}>
                            {delivery.failed_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {trackingUrl ? (
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            CarryBee Portal
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {delivery.dispatched_at ? (
                          new Date(delivery.dispatched_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        ) : (
                          <span className="text-slate-400 italic">Pending Dispatch</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-primary"
                            onClick={() => setSelectedDelivery(delivery)}
                            title="Inspect dispatch details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {delivery.status === "failed" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={retryMutation.isPending}
                              onClick={() => retryMutation.mutate(delivery.id)}
                              className="text-xs h-7 gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                            >
                              <RotateCw className={`h-3 w-3 ${retryMutation.isPending ? "animate-spin" : ""}`} />
                              Retry
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono pr-2">
                              #{delivery.attempt_count || 1}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>
          Showing {data?.data?.length || 0} of {data?.total || 0} deliveries
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

      {/* Delivery Inspection Dialog */}
      <Dialog open={!!selectedDelivery} onOpenChange={(open) => !open && setSelectedDelivery(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {selectedDelivery && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <DialogTitle className="text-xl font-bold text-slate-900">
                      Consignment {selectedDelivery.consignment_id || `#${selectedDelivery.id}`}
                    </DialogTitle>
                    {getStatusBadge(selectedDelivery.status)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Order #{selectedDelivery.order_id}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Real-time CarryBee courier dispatch details and parcel tracking data.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Parcel & Recipient Summary */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                      <User className="h-4 w-4 text-primary" /> Recipient Details
                    </div>
                    {selectedDelivery.dispatched_at && (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(selectedDelivery.dispatched_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Name:</span>
                      <span className="font-semibold text-slate-800">
                        {orderData?.recipient_name || selectedDelivery.order?.customer_name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Phone:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {orderData?.recipient_phone || selectedDelivery.order?.customer_phone || "N/A"}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">Delivery Address:</span>
                      <span className="text-slate-700 flex items-start gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                        {orderData?.recipient_address || selectedDelivery.order?.customer_address || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CarryBee Courier Dispatch Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Carrier</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{selectedDelivery.carrier || "CarryBee"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Delivery Fee</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      ৳{orderData?.delivery_fee || "49.00"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Transfer Status</span>
                    <span className="font-semibold text-blue-700 mt-0.5 block">
                      {orderData?.transfer_status_id === 2 ? "In Transit (#2)" : "Dispatched (#1)"}
                    </span>
                  </div>
                </div>

                {/* Direct Tracking Portal Button */}
                <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-900">
                      <Truck className="h-4 w-4 text-orange-600" /> CarryBee Live Tracking
                    </div>
                    <a
                      href={`https://carrybee.com/track?consignmentId=${selectedDelivery.consignment_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium transition-colors shadow-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open CarryBee Portal
                    </a>
                  </div>
                  <p className="text-[11px] text-orange-800/80 leading-relaxed">
                    CarryBee tracking URL with auto-filled parameter:{" "}
                    <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-orange-200">
                      https://carrybee.com/track?consignmentId={selectedDelivery.consignment_id}
                    </code>
                  </p>
                </div>

                {/* Sandbox Note */}
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 text-slate-500 text-xs">
                  <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">
                    This consignment was created in the <strong>CarryBee Sandbox Environment</strong> via automated API v2 dispatch.
                    CarryBee stores sandbox test records on its sandbox compute instances, verified with status 200 via the API.
                  </p>
                </div>
              </div>

              <DialogFooter className="border-t pt-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedDelivery(null)}>
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

export default function AdminDeliveries() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <span className="loader" style={{ "--size": "0.75px" } as React.CSSProperties}></span>
          <span className="text-xs font-medium text-slate-400 tracking-wide">
            Loading logistics and deliveries...
          </span>
        </div>
      }
    >
      <AdminDeliveriesContent />
    </Suspense>
  );
}
