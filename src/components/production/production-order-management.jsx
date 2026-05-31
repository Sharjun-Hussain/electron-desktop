"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal, 
  FileText,
  Eye,
  Calendar
} from "lucide-react";

import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { usePermission } from "@/hooks/use-permission";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { format } from "date-fns";

export default function ProductionOrderManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const { formatCurrency } = useAppSettings();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [pageCount, setPageCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        size: pagination.pageSize.toString(),
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/production/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        setOrders(data.data.data || []);
        setPageCount(data.data.pagination?.pages || 0);
      }
    } catch (err) {
      toast.error("Failed to fetch production orders");
    } finally {
      setLoading(false);
    }
  }, [session, pagination]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none font-medium"><CheckCircle2 className="w-3 h-3 mr-1" /> Finished</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-none font-medium"><Clock className="w-3 h-3 mr-1" /> Manufacturing</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/10 shadow-none font-medium"><Clock className="w-3 h-3 mr-1" /> Scheduled</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="shadow-none font-medium">Cancelled</Badge>;
      default: return <Badge className="shadow-none font-medium">{status}</Badge>;
    }
  };

  const columns = [
    {
      accessorKey: "order_number",
      header: "Batch Reference",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-white/5 px-2 py-1 rounded text-foreground/80">
          {row.original.order_number}
        </span>
      ),
    },
    {
      accessorKey: "product",
      header: "Production Item",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground">{row.original.product?.name}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <FileText className="w-3 h-3" /> Recipe: {row.original.recipe?.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "quantity_planned",
      header: "Yield Status",
      cell: ({ row }) => {
        const progress = Math.min(100, (row.original.quantity_produced / row.original.quantity_planned) * 100) || 0;
        return (
          <div className="flex flex-col w-32">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono font-bold text-xs">
                {row.original.quantity_produced || 0} / {row.original.quantity_planned}
              </span>
              <span className="text-[10px] text-muted-foreground font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
        accessorKey: "created_at",
        header: "Scheduled Date",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{format(new Date(row.original.created_at), "MMM d, yyyy")}</span>
            <span className="text-xs text-muted-foreground opacity-70">{format(new Date(row.original.created_at), "hh:mm a")}</span>
          </div>
        ),
      },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-emerald-500/10">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl shadow-2xl border-border/50 animate-in zoom-in-95 duration-200">
            {row.original.status !== 'completed' && (
              <DropdownMenuItem 
                onClick={() => router.push(`/production/orders/${row.original.id}/complete`)}
                className="rounded-lg focus:bg-emerald-50 dark:focus:bg-emerald-900/20 text-emerald-600 font-semibold cursor-pointer"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Finalize Production
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => router.push(`/production/orders/view?id=${row.original.id}`)} 
              className="rounded-lg cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" /> View Protocol
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      <ResourceManagementLayout
        data={orders}
        isLoading={loading}
        columns={columns}
        headerTitle={
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-500/10 shadow-sm animate-pulse">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground leading-tight">Production Batches</h1>
              <p className="text-sm text-muted-foreground font-medium opacity-80">
                Monitor live manufacturing runs and yield performance
              </p>
            </div>
          </div>
        }
        addButtonLabel="New Batch"
        onAddClick={() => router.push("/production/orders/new")}
        paginationState={pagination}
        onPaginationChange={setPagination}
        pageCount={pageCount}
      />
    </div>
  );
}
