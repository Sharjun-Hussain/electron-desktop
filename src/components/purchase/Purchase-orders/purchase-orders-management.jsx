"use client";

import { useState, useEffect, useCallback, useMemo, Activity } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSpreadsheet, ChevronDown, Trash2, ShoppingCart, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getColumns } from "./columns";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import PurchaseOrdersSkeleton from "@/app/skeletons/purchases/purchase-orders-skeleton";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";

import { SendPOWhatsAppDialog } from "./SendPOWhatsAppDialog";
import { DeletePODialog } from "./delete-po-dialog";

// ── Header ──────────────────────────────────────────────────────────────────
const POHeaderContent = () => (
  <div className="flex items-center gap-4">
    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/5 transition-transform hover:scale-105 active:scale-95 cursor-default">
      <ShoppingCart className="w-5 h-5 text-emerald-600" />
    </div>
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
      <p className="text-xs text-muted-foreground font-medium opacity-80">Manage procurement lifecycle and supplier orders</p>
    </div>
  </div>
);

// ── Status Filter ────────────────────────────────────────────────────────────
const POFilters = ({ table }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-1.5 ml-1">
      <Activity className="size-3.5 text-emerald-600/70" />
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Status</label>
    </div>
    <Select
      value={String(table.getColumn("status")?.getFilterValue() ?? "all")}
      onValueChange={(value) => {
        table
          .getColumn("status")
          ?.setFilterValue(value === "all" ? undefined : value);
      }}
    >
      <SelectTrigger className="w-[200px] h-10 font-medium text-[13px] shadow-sm">
        <SelectValue placeholder="All Status" />
      </SelectTrigger>
      <SelectContent className="rounded-xl border border-border shadow-lg">
        <SelectItem value="all" className="text-[13px]">All Orders</SelectItem>
        <SelectItem value="pending" className="text-[13px] text-amber-600">Pending</SelectItem>
        <SelectItem value="approved" className="text-[13px] text-emerald-600">Approved</SelectItem>
        <SelectItem value="received" className="text-[13px] text-blue-600">Received</SelectItem>
        <SelectItem value="cancelled" className="text-[13px] text-red-600">Cancelled</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// ── Bulk Actions ─────────────────────────────────────────────────────────────
const POBulkActions = ({ table, onDelete }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);

  const handleDelete = () => {
    if (window.onDeletePO) {
      window.onDeletePO(selectedIds);
    }
    table.resetRowSelection();
  };

  return (
    <>
      <DropdownMenuItem
        className="rounded-xl py-3 text-[11px] font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10 cursor-pointer transition-all"
        onClick={handleDelete}
      >
        <Trash2 className="mr-3 h-4 w-4" />
        Purge Selection
      </DropdownMenuItem>
    </>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function PurchaseOrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState(null);
  const [idsToDelete, setIdsToDelete] = useState([]);
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { PURCHASE } = MODULES;

  useEffect(() => {
    // Global handler for the columns component to call
    window.onSendPOWhatsApp = (po) => {
      setSelectedPO(po);
      setWhatsappDialogOpen(true);
    };
    window.onDeletePO = (poOrIds) => {
      if (Array.isArray(poOrIds)) {
        setIdsToDelete(poOrIds);
        setPoToDelete(null);
      } else {
        setPoToDelete(poOrIds);
        setIdsToDelete([poOrIds.id]);
      }
      setDeleteDialogOpen(true);
    };
    return () => { 
      delete window.onSendPOWhatsApp; 
      delete window.onDeletePO;
    };
  }, []);

  const fetchPurchaseOrders = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch purchase orders");
      const result = await response.json();
      if (result.status === "success") {
        const data = Array.isArray(result.data)
          ? result.data
          : result.data?.data || [];
        setOrders(data);
      } else {
        throw new Error(result.message || "Something went wrong");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  // Auth check is handled by AppLayout

  useEffect(() => {
    if (status === "authenticated") fetchPurchaseOrders();
  }, [status, fetchPurchaseOrders]);

  const handleDelete = useCallback(async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    
    // Check if we have IDs to delete
    if (idsToDelete.length === 0) return;

    try {
      const results = await Promise.all(
        idsToDelete.map(async (id) => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          });
          const data = await response.json();
          return { id, ok: response.ok, message: data.message };
        })
      );

      const failed = results.filter(r => !r.ok);
      if (failed.length === 0) {
        toast.success(idsToDelete.length > 1 ? "Orders deleted successfully!" : "Order deleted successfully!");
        fetchPurchaseOrders();
      } else {
        // Show the first error message
        toast.error(failed[0].message || "Failed to delete order(s). Status might prevent deletion.");
        fetchPurchaseOrders(); // Still refresh to show current state
      }
    } catch (err) {
      toast.error("An error occurred while deleting.");
      console.error(err);
    }
  }, [session, fetchPurchaseOrders]);

  const columns = useMemo(
    () =>
      getColumns({
        onDelete: canDelete(PURCHASE) ? handleDelete : null,
        canEdit: canUpdate(PURCHASE),
        session,
      }),
    [handleDelete, canDelete, canUpdate, PURCHASE, session]
  );

  const stats = useMemo(() => {
    const totalPos = orders.length;
    const pendingPos = orders.filter(o => o.status === 'pending').length;
    const totalValue = orders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
    const receivedValue = orders
      .filter(o => o.status === 'received')
      .reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);

    return [
      {
        label: "Total Orders",
        val: totalPos,
        desc: "All procurement records",
        icon: ShoppingCart,
        gradient: "from-emerald-500 to-teal-400",
      },
      {
        label: "Pending Approval",
        val: pendingPos,
        desc: "Awaiting authorization",
        icon: Clock,
        gradient: "from-blue-500 to-indigo-400",
      },
      {
        label: "Total Amount",
        val: new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', notation: 'compact' }).format(totalValue),
        desc: "Gross order volume",
        icon: TrendingUp,
        gradient: "from-amber-500 to-orange-400",
      },
      {
        label: "Received Assets",
        val: new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', notation: 'compact' }).format(receivedValue),
        desc: "Completed procurement",
        icon: CheckCircle2,
        gradient: "from-violet-500 to-purple-400",
      },
    ];
  }, [orders]);

  const exportData = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return orders.map((o) => ({
      "PO Number": o.po_number,
      Supplier: o.supplier?.name || "N/A",
      "Order Date": o.order_date
        ? new Date(o.order_date).toLocaleDateString()
        : "N/A",
      "Exp Delivery": o.expected_delivery_date
        ? new Date(o.expected_delivery_date).toLocaleDateString()
        : "N/A",
      "Total Amount": o.total_amount,
      Status: o.status?.toUpperCase(),
      "Created By": o.created_by_user?.name || "N/A",
    }));
  }, [orders]);

  const statCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((card, idx) => (
        <div 
          key={idx} 
          className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4"
        >
          <div className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} text-white`}>
            <card.icon className="w-5 h-5 shadow-sm" />
          </div>
          <div className="flex flex-col">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
            <h3 className="text-2xl font-bold text-foreground">
              {card.val}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <ResourceManagementLayout
      data={orders}
      columns={columns}
      isLoading={loading || status === "loading"}
      isError={!!error}
      errorMessage={error}
      onRetry={fetchPurchaseOrders}
      headerTitle={<POHeaderContent />}
      addButtonLabel="Create Purchase Order"
      onAddClick={canCreate(PURCHASE) ? () => {
        setIsNavigating(true);
        router.push("/purchase/purchase-orders/create");
      } : null}
      isAdding={isNavigating}
      exportData={exportData}
      exportFileName="Purchase_Orders_Archive"
      statCardsComponent={statCards}
      bulkActionsComponent={
        canDelete(PURCHASE) ? (
          <POBulkActions onDelete={handleDelete} />
        ) : null
      }
      searchColumn="po_number"
      searchPlaceholder="Search protocol designation..."
      searchLabel="Protocol Search"
      loadingSkeleton={<PurchaseOrdersSkeleton />}
      filterComponents={(table) => <POFilters table={table} />}
    >
      <SendPOWhatsAppDialog 
        open={whatsappDialogOpen} 
        onOpenChange={setWhatsappDialogOpen} 
        po={selectedPO} 
      />
      <DeletePODialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => handleDelete(idsToDelete)}
        poNumber={poToDelete?.po_number}
        count={idsToDelete.length}
      />
    </ResourceManagementLayout>
  );
}