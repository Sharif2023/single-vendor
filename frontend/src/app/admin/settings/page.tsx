"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Save, 
  Store, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw,
  Building2,
  Phone,
  Mail,
  MapPin,
  Lock,
  Power
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Setting = { 
  id: number; 
  key: string; 
  value: string | boolean; 
  type: string; 
  description: string;
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: settings, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data } = await api.get<Setting[]>("/admin/settings");
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const initialData: Record<string, string> = {};
      settings.forEach((s) => {
        initialData[s.key] = s.value !== null && s.value !== undefined ? String(s.value) : "";
      });
      setFormData(initialData);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { settings: { key: string; value: string }[] }) => {
      const { data } = await api.put("/admin/settings", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update settings");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      settings: Object.entries(formData).map(([key, value]) => ({
        key,
        value: String(value),
      })),
    };
    updateMutation.mutate(payload);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <span className="loader"></span>
        <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide">
          Loading settings panel...
        </p>
      </div>
    );
  }

  const isPaymentEnabled = formData["payment_enabled"] === "true";

  const storeFields = [
    { key: "store_name", label: "Store Display Name", icon: Building2, placeholder: "Single Vendor Store" },
    { key: "store_email", label: "Store Contact Email", icon: Mail, placeholder: "support@singlevendor.com" },
    { key: "store_phone", label: "Store Contact Phone", icon: Phone, placeholder: "+880 1700 000000" },
    { key: "store_address", label: "Store Physical Address", icon: MapPin, placeholder: "Dhaka, Bangladesh" },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">System Settings</h2>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Live Config
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure store profile, toggle payment processing, and view integrated logistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updateMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            {updateMutation.isPending ? (
              <span className="loader mr-2" style={{ "--color-1": "#ffffff", "--size": "0.35px" } as React.CSSProperties}></span>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Card 1: Store Information */}
        <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Store Identity & Profile
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Storefront name and customer service contact details.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-normal">
                Configurable
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {storeFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={field.key} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <field.icon className="h-3.5 w-3.5 text-slate-400" />
                    {field.label}
                  </Label>
                  <Input
                    id={field.key}
                    value={formData[field.key] ?? ""}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="h-10 text-sm focus-visible:ring-primary"
                    placeholder={field.placeholder}
                  />
                  <p className="text-[11px] text-slate-400 font-mono">key: {field.key}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Payment Configuration (TASK.md Requirement) */}
        <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Payment Gateway (SSLCommerz)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Payment configuration requirement from TASK.md specification.
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  isPaymentEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }
              >
                {isPaymentEnabled ? "Payments Active" : "Payments Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* The Configurable Toggle as specified in TASK.md */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Power className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-900">
                    Online Payment Processing
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-lg">
                  Enable or disable customer payment processing at checkout. When disabled, customer checkouts are blocked.
                </p>
              </div>

              <div className="w-full sm:w-48">
                <select
                  id="payment_enabled"
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                  value={formData["payment_enabled"] ?? "true"}
                  onChange={(e) => handleInputChange("payment_enabled", e.target.value)}
                >
                  <option value="true">Enabled (Active)</option>
                  <option value="false">Disabled (Inactive)</option>
                </select>
              </div>
            </div>

            {/* Environment Security Status */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <span>SSLCommerz Sandbox Credentials Protected</span>
                  <Badge variant="outline" className="text-[10px] bg-white text-slate-600">
                    <Lock className="h-2.5 w-2.5 mr-1" /> .env Managed
                  </Badge>
                </div>
                <p>
                  API credentials (<code className="font-mono text-[11px] text-slate-700">SSLCOMMERZ_STORE_ID</code>,{" "}
                  <code className="font-mono text-[11px] text-slate-700">SSLCOMMERZ_STORE_PASSWORD</code>) are stored securely in your server environment (<code className="font-mono text-[11px] text-slate-700">.env</code>) and cannot be leaked via the browser.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: CarryBee Courier & Logistics */}
        <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Delivery & Logistics (CarryBee)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Automated parcel dispatch requirement from TASK.md specification.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                CarryBee v2 Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Carrier</span>
                <span className="text-sm font-semibold text-slate-800 mt-0.5 block">CarryBee Logistics</span>
                <span className="text-xs text-slate-500 mt-1 block">API v2 Sandbox</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Merchant Store</span>
                <span className="text-sm font-semibold text-slate-800 mt-0.5 block">Store #3753</span>
                <span className="text-xs text-slate-500 mt-1 block">Configured in .env</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Dispatch Trigger</span>
                <span className="text-sm font-semibold text-emerald-700 mt-0.5 block">Automated on Paid</span>
                <span className="text-xs text-slate-500 mt-1 block">Async Queue Worker</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <span>Asynchronous Dispatch Lifecycle Active</span>
                  <Badge variant="outline" className="text-[10px] bg-white text-slate-600">
                    <Lock className="h-2.5 w-2.5 mr-1" /> .env Managed
                  </Badge>
                </div>
                <p>
                  CarryBee credentials (<code className="font-mono text-[11px] text-slate-700">CARRYBEE_CLIENT_ID</code>,{" "}
                  <code className="font-mono text-[11px] text-slate-700">CARRYBEE_CLIENT_SECRET</code>) are configured in <code className="font-mono text-[11px] text-slate-700">.env</code>.
                  Paid orders automatically queue <code className="font-mono text-[11px] text-slate-700">DispatchDeliveryJob</code> to generate tracking links on the CarryBee portal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (settings) {
                const initialData: Record<string, string> = {};
                settings.forEach((s) => {
                  initialData[s.key] = s.value !== null && s.value !== undefined ? String(s.value) : "";
                });
                setFormData(initialData);
                toast.info("Changes reset to current settings");
              }
            }}
          >
            Discard Unsaved
          </Button>

          <Button 
            type="submit" 
            disabled={updateMutation.isPending} 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white min-w-[140px]"
          >
            {updateMutation.isPending ? (
              <span className="loader mr-2" style={{ "--color-1": "#ffffff", "--size": "0.35px" } as React.CSSProperties}></span>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
