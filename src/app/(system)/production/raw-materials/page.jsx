"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  Boxes, 
  Package, 
  Scale, 
  TrendingDown, 
  AlertTriangle,
  Info
} from "lucide-react";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

export default function RawMaterialsPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=100`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        const productList = data.data?.data || data.data || [];
        const filtered = productList.filter(p => {
          const type = (p.product_type || "").toLowerCase();
          return type === 'raw material' || type === 'semi-finished';
        });
        setMaterials(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const columns = [
    {
      accessorKey: "name",
      header: "Material Specification",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground">{row.original.name}</span>
          <span className="text-xs text-muted-foreground mt-0.5 font-mono">{row.original.code}</span>
        </div>
      ),
    },
    {
      accessorKey: "product_type",
      header: "Classification",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn(
          "shadow-none font-medium",
          row.original.product_type === 'Semi-Finished' 
            ? "bg-purple-500/10 text-purple-600 border-purple-500/20" 
            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
        )}>
          {row.original.product_type}
        </Badge>
      ),
    },
    {
      accessorKey: "stock_quantity",
      header: "Active Inventory",
      cell: ({ row }) => {
        const qty = row.original.variants?.reduce((acc, v) => acc + parseFloat(v.stock_quantity || 0), 0) || 0;
        return (
          <div className="flex items-center gap-2">
            <span className={cn("font-mono font-bold text-sm", qty <= 10 ? "text-red-500" : "text-emerald-600")}>
              {qty} {row.original.unit?.name || "Units"}
            </span>
            {qty <= 10 && <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />}
          </div>
        );
      },
    },
    {
      accessorKey: "avg_cost",
      header: "Standard Cost",
      cell: ({ row }) => {
        const avg = row.original.variants?.length > 0 ? (row.original.variants[0].cost_price || 0) : 0;
        return <span className="font-mono text-sm font-semibold text-muted-foreground">{formatCurrency(avg)}</span>;
      },
    },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      <ResourceManagementLayout
        data={materials}
        isLoading={loading}
        columns={columns}
        headerTitle={
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-500/10 shadow-sm animate-pulse">
              <Boxes className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground leading-tight">Raw Material Inventory</h1>
              <p className="text-sm text-muted-foreground font-medium opacity-80">
                Track input components and ingredient availability
              </p>
            </div>
          </div>
        }
        searchPlaceholder="Find material by name or code..."
      />
    </div>
  );
}
