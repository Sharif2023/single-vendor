"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PaginatedResponse } from "@/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Truck } from "lucide-react";

export default function AdminDeliveries() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "deliveries", { page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<any>>("/admin/deliveries", {
        params: { page },
      });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Deliveries</h2>
          <p className="text-muted-foreground">Track order shipments and couriers.</p>
        </div>
      </div>

      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Consignment ID</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tracking URL</TableHead>
              <TableHead className="text-right">Dispatched At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No deliveries found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">#{delivery.order_id}</TableCell>
                  <TableCell className="font-mono text-sm">{delivery.consignment_id}</TableCell>
                  <TableCell>{delivery.carrier}</TableCell>
                  <TableCell>
                    <Badge variant={delivery.status === "delivered" ? "default" : "secondary"}>
                      {delivery.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {delivery.tracking_url ? (
                      <a href={delivery.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        <Truck className="h-3 w-3 mr-1" /> Track
                      </a>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {delivery.dispatched_at ? new Date(delivery.dispatched_at).toLocaleDateString() : "Pending"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Showing {data?.data.length || 0} deliveries
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!data || page >= data.last_page}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
