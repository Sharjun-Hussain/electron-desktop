"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Trash2, 
  Package, 
  AlertTriangle,
  User
} from "lucide-react";
import { format } from "date-fns";

import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

export default function WastageManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatCurrency } = useAppSettings();

  const [wastages, setWastages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [pageCount, setPageCount] = useState(0);

  const fetchWastages = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        size: pagination.pageSize.toString(),
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wastages?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        setWastages(data.data.data);
        setPageCount(data.data.pagination.pages);
      }
    } catch (err) {
      toast.error("Failed to fetch wastage logs");
    } finally {
      setLoading(false);
    }
  }, [session, pagination]);

  useEffect(() => {
    fetchWastages();
  }, [fetchWastages]);

  const columns = [
    {
      accessorKey: "created_at",
      header: "Date & Time",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {format(new Date(row.original.created_at), "MMM dd, yyyy")}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {format(new Date(row.original.created_at), "hh:mm a")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "product.name",
      header: "Product / Material",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
            <Package className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">{row.original.product?.name}</span>
            {row.original.variant && (
              <span className="text-xs text-muted-foreground font-medium">
                {row.original.variant.name}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "wastage_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs font-medium capitalize",
            row.original.wastage_type === 'raw_material' ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-500/20" :
            row.original.wastage_type === 'finished_good' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-500/20" :
            "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/10 dark:text-slate-400 dark:border-slate-500/20"
          )}
        >
          {row.original.wastage_type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Loss Quantity",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-red-600 text-sm">
            -{parseFloat(row.original.quantity).toFixed(3)}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            Units
          </span>
        </div>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason for Loss",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-foreground/80 leading-tight">
            {row.original.reason}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "user.name",
      header: "Logged By",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-muted flex items-center justify-center">
            <User className="w-3 h-3 text-muted-foreground" />
          </div>
          <span className="text-xs font-semibold text-foreground/70">
            {row.original.user?.name}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      <ResourceManagementLayout
        data={wastages}
        isLoading={loading}
        columns={columns}
        headerTitle={
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/20 shadow-sm">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground leading-none">Wastage Log</h1>
              <p className="text-sm text-muted-foreground font-medium mt-1.5">
                Inventory Reconciliation & Production Loss Records
              </p>
            </div>
          </div>
        }
        addButtonLabel="Record Wastage"
        onAddClick={() => router.push("/production/wastage/new")}
        paginationState={pagination}
        onPaginationChange={setPagination}
        pageCount={pageCount}
        searchPlaceholder="Filter by product..."
      />
    </div>
  );
}
