"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierLedgerSheet } from "./SupplierLedgerSheet";
import { SupplierDetailSheet } from "./SupplierDetailSheet";
import { AddSupplierSheet } from "./AddSupplierSheet";
import { EditSupplierSheet } from "./EditSupplierSheet";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Users, UserCheck, UserX, Briefcase, CheckCircle2, XCircle, Trash2, ChevronDown, Activity, Building2, RefreshCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getSupplierColumns } from "./supplier-column";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import SupplierSkeleton from "@/app/skeletons/purchases/supplier-skeleton";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";
import { exportToCSV } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";

const SupplierHeaderContent = () => (
  <div className="flex items-center gap-4">
    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
      <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div>
      <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">Supplier Directory</h1>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Vendor Lifecycle & Procurement Asset Management</p>
    </div>
  </div>
);

const SupplierFilters = ({ table }) => {
  if (!table) return null;
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest pl-1">Network Status</label>
        <Select
          value={String(table.getColumn("is_active")?.getFilterValue() ?? "all")}
          onValueChange={(value) => {
            table
              .getColumn("is_active")
              ?.setFilterValue(value === "all" ? undefined : value === "true");
          }}
        >
          <SelectTrigger className="w-[180px] h-9 shadow-xs text-[12px] font-bold">
            <SelectValue placeholder="All partners" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border shadow-lg">
            <SelectItem value="all" className="text-[12px] font-medium">All Global Partners</SelectItem>
            <SelectItem value="true" className="text-[12px] font-bold text-emerald-600">Active Supply</SelectItem>
            <SelectItem value="false" className="text-[12px] font-bold text-amber-600">Suspended / Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

const SupplierBulkActions = ({ table, onDelete, onBulkActivation }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);

  const handleDeactivate = () => {
    onBulkActivation(selectedIds, "deactivate");
    table.resetRowSelection();
  };

  const handleActivate = () => {
    onBulkActivation(selectedIds, "activate");
    table.resetRowSelection();
  };

  const handleDelete = () => {
    onDelete(selectedIds);
    table.resetRowSelection();
  };

  return (
    <>
      <DropdownMenuItem onClick={handleActivate} className="rounded-lg py-2.5 cursor-pointer font-bold text-[11px] focus:bg-emerald-50 focus:text-emerald-600 transition-colors uppercase tracking-wider">
        <CheckCircle2 className="mr-3 h-4 w-4" />
        Activate Network
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleDeactivate} className="rounded-lg py-2.5 cursor-pointer font-bold text-[11px] focus:bg-amber-50 focus:text-amber-600 transition-colors uppercase tracking-wider">
        <XCircle className="mr-3 h-4 w-4" />
        Suspend Network
      </DropdownMenuItem>
      <DropdownMenuSeparator className="my-2 opacity-50" />
      <DropdownMenuItem onClick={handleDelete} className="rounded-lg py-2.5 cursor-pointer font-bold text-[11px] text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors uppercase tracking-wider">
        <Trash2 className="mr-3 h-4 w-4" />
        Purge Metadata
      </DropdownMenuItem>
    </>
  );
};

export default function SupplierPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [isSettleMode, setIsSettleMode] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { SUPPLIER } = MODULES;

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  const fetchSuppliers = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.status === "success") {
        setSuppliers(data?.data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchSuppliers();
    }
  }, [status, session]);

  const handleAddClick = () => setAddOpen(true);

  const handleEditClick = (supplier) => {
    setSelectedSupplier(supplier);
    setEditOpen(true);
  };

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    // Layout and internal table filters are reset by the ResourceManagementLayout 
    // when it detects onClearFilters being called and resets its own internal table state
  }, []);

  const handleDelete = async (ids) => {
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchSuppliers();
          return "Supplier(s) deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  };

  const handleToggleStatus = async (supplier) => {
    const action = supplier?.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplier?.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
        success: () => {
          fetchSuppliers();
          return `Supplier ${action}d successfully!`;
        },
        error: "Action failed.",
      }
    );
  };

  const handleBulkActivation = async (ids, type) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${id}/${type === "activate" ? "activate" : "deactivate"
            }`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: type === "activate" ? "Activating..." : "Deactivating...",
        success: () => {
          fetchSuppliers();
          return `Suppliers ${type === "activate" ? "activated" : "deactivated"} successfully!`;
        },
        error: "Action failed.",
      }
    );
  };

  const columns = getSupplierColumns({
    onDelete: canDelete(SUPPLIER) ? handleDelete : null,
    onToggleStatus: canUpdate(SUPPLIER) ? handleToggleStatus : null,
    onEdit: canUpdate(SUPPLIER) ? handleEditClick : null,
    onViewLedger: (supplier) => {
      setSelectedSupplier(supplier);
      setIsSettleMode(false);
      setLedgerOpen(true);
    },
    onSettle: (supplier) => {
      setSelectedSupplier(supplier);
      setIsSettleMode(true);
      setLedgerOpen(true);
    },
    onViewDetails: (supplier) => {
      setSelectedSupplier(supplier);
      setDetailOpen(true);
    },
  });

  const exportData = useMemo(() => {
    if (!suppliers || suppliers.length === 0) return [];
    return suppliers.map((s) => ({
      "Supplier Name": s.name,
      "Official Email": s.email || "N/A",
      "Phone Number": s.phone || "N/A",
      "Official Representative": s.contact_person || "Unassigned",
      "Operational Address": s.address || "N/A",
      "Operational Status": s.is_active ? "Active" : "Suspended",
      "Registration Date": s.created_at
        ? new Date(s.created_at).toLocaleDateString()
        : "N/A",
    }));
  }, [suppliers]);

  const SupplierStatsCards = ({ suppliers }) => {
    const stats = React.useMemo(() => {
      if (!suppliers?.length) return { total: 0, active: 0, suspended: 0, exposure: 0 };
      return {
        total: suppliers.length,
        active: suppliers.filter((sup) => sup.is_active).length,
        suspended: suppliers.filter((sup) => !sup.is_active).length,
        exposure: suppliers.reduce((acc, sup) => acc + (Math.abs(sup.current_balance || 0)), 0)
      };
    }, [suppliers]);

    const statItems = [
      {
        label: "Total Network",
        value: stats.total,
        icon: Building2,
        gradient: "from-blue-500 to-indigo-400",
        trend: "Suppliers"
      },
      {
        label: "Active Supply",
        value: stats.active,
        icon: UserCheck,
        gradient: "from-emerald-500 to-teal-400",
        trend: stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(0)}% Util.` : "0%"
      },
      {
        label: "Risk / Hold",
        value: stats.suspended,
        icon: UserX,
        gradient: "from-amber-500 to-orange-400",
        trend: stats.total > 0 ? `${((stats.suspended / stats.total) * 100).toFixed(0)}% Rate` : "0%"
      },
      {
        label: "Exposure Sum",
        value: `LKR ${(stats.exposure / 1000).toFixed(1)}k`,
        subValue: `Exact: ${stats.exposure.toLocaleString()}`,
        icon: Activity,
        gradient: "from-violet-500 to-purple-400",
        trend: "Liability"
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statItems.map((item, idx) => (
          <div key={idx} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
            <div className={`p-3 rounded-lg bg-linear-to-br ${item.gradient} text-white`}>
              <item.icon className="w-5 h-5 shadow-sm" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 opacity-60">{item.label}</p>
                {item.trend && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full leading-none mb-1">{item.trend}</span>}
              </div>
              <h3 className="text-2xl font-bold text-foreground leading-none tabular-nums">{item.value}</h3>
              {item.subValue && <p className="text-[9px] font-bold text-muted-foreground mt-1 opacity-50">{item.subValue}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };


  return (
    <ResourceManagementLayout
      data={suppliers}
      columns={columns}
      isLoading={loading || status === "loading"}
      isError={!!error}
      errorMessage={error}
      onRetry={fetchSuppliers}
      headerTitle={<SupplierHeaderContent />}
      addButtonLabel="New Supplier"
      onAddClick={canCreate(SUPPLIER) ? handleAddClick : null}
      isAdding={isNavigating}
      exportData={exportData}
      exportFileName="Strategic_Suppliers_Archive"
      extraActions={
        <Button onClick={fetchSuppliers} variant="outline" size="icon" className="h-9 w-9 p-0 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200">
          <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      }
      statCardsComponent={SupplierStatsCards}
      bulkActionsComponent={
        canDelete(SUPPLIER) ? (
          <SupplierBulkActions
            table={null}
            onDelete={handleDelete}
            onBulkActivation={handleBulkActivation}
          />
        ) : null
      }
      searchColumn="name"
      searchPlaceholder="Search in directory..."
      onSearchChange={setSearchQuery}
      isFiltered={searchQuery !== ""}
      onClearFilters={handleClearFilters}
      loadingSkeleton={<SupplierSkeleton />}
      filterComponents={(table) => <SupplierFilters table={table} />}
    >
      <SupplierLedgerSheet
        supplier={selectedSupplier}
        open={ledgerOpen}
        onOpenChange={(val) => {
          setLedgerOpen(val);
          if (!val) setIsSettleMode(false);
        }}
        isSettleMode={isSettleMode}
        accessToken={session?.accessToken}
      />
      <EditSupplierSheet
        supplier={selectedSupplier}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={fetchSuppliers}
      />
      <AddSupplierSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={fetchSuppliers}
      />
      <SupplierDetailSheet
        supplier={selectedSupplier}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSuccess={fetchSuppliers}
        accessToken={session?.accessToken}
        onSettle={(sup) => {
          setDetailOpen(false);
          setSelectedSupplier(sup);
          setIsSettleMode(true);
          setLedgerOpen(true);
        }}
      />
    </ResourceManagementLayout>
  );
}