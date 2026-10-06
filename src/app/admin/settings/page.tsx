"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Setting = { id: number; key: string; value: string; type: string; description: string };

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data } = await api.get<Setting[]>("/admin/settings");
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const initialData: Record<string, string> = {};
      settings.forEach(s => {
        initialData[s.key] = s.value;
      });
      setFormData(initialData);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { settings: Record<string, string> }) => {
      const { data } = await api.put("/admin/settings", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update settings");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ settings: formData });
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) return <div className="p-10 text-center">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your store configurations and payment gateways.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Store Settings</CardTitle>
            <CardDescription>Basic information about your store.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.filter(s => s.key.startsWith('store_')).map((setting) => (
              <div key={setting.id} className="grid gap-2">
                <Label htmlFor={setting.key}>{setting.description}</Label>
                <Input
                  id={setting.key}
                  value={formData[setting.key] ?? ""}
                  onChange={(e) => handleInputChange(setting.key, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment & Gateway (SSLCommerz)</CardTitle>
            <CardDescription>Configure your payment gateway settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.filter(s => s.key.startsWith('sslcommerz_') || s.key === 'payment_enabled').map((setting) => (
              <div key={setting.id} className="grid gap-2">
                <Label htmlFor={setting.key}>{setting.description}</Label>
                {setting.type === 'boolean' ? (
                  <select
                    id={setting.key}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background"
                    value={formData[setting.key] ?? "false"}
                    onChange={(e) => handleInputChange(setting.key, e.target.value)}
                  >
                    <option value="true">Enabled / True</option>
                    <option value="false">Disabled / False</option>
                  </select>
                ) : (
                  <Input
                    id={setting.key}
                    value={formData[setting.key] ?? ""}
                    onChange={(e) => handleInputChange(setting.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} size="lg">
            {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
