"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import UnitMeasurementSkeleton from "@/app/skeletons/catalog/unit-measurement-skeleton";
import { ResourceManagementLayout } from "../general/resource-management-layout";
import { getMeasurementUnitColumns } from "./unit-measurement-column";
import { MeasurementUnitDialog } from "./unit-measurement-dialog";
import { usePermission } from "@/hooks/use-permission";
import {
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronDown,
  Scale,
  Edit3,
  MoreHorizontal,
  Check
} from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "../ui/status-badge";
import { Badge } from "../ui/badge";

// --- 2. Renamed Bulk Actions Component ---
const UnitMeasurementBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
  if (!table) return null;

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const numSelected = selectedRows.length;
  const selectedIds = selectedRows.map((row) => row.original.id);

  return (
    <>
      <DropdownMenuItem
        className="text-sm font-medium rounded-md"
        disabled={numSelected === 0}
        onClick={() => {
          onActivate(selectedIds);
          table.resetRowSelection();
        }}
      >
        <span>Activate Selection</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        className="text-sm font-medium rounded-md"
        disabled={numSelected === 0}
        onClick={() => {
          onDeactivate(selectedIds);
          table.resetRowSelection();
        }}
      >
        <span>Suspend Selection</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

      <DropdownMenuItem
        className="text-sm font-medium rounded-md text-rose-500 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/10"
        disabled={numSelected === 0}
        onClick={() => {
          onDelete(selectedIds);
          table.resetRowSelection();
        }}
      >
        <span>Delete Selection</span>
      </DropdownMenuItem>
    </>
  );
};

// --- 3. Renamed Page Component ---
/**
 * Renders a single measurement unit card for the Grid View
 */
const MeasurementUnitGridCard = ({ row, onEdit, onDelete, onToggleStatus, canEdit, canDelete, canToggleStatus }) => {
  const unit = row.original;
  const isSelected = row.getIsSelected();

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 p-5 rounded-md border transition-all duration-300",
        isSelected
          ? "bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
          : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/60 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1"
      )}
    >
      {/* Header: Checkbox & Actions */}
      <div className="flex items-start justify-between">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
          className="h-4.5 w-4.5 rounded-md border-slate-300 dark:border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />

        <div className="flex items-center gap-2">
          <StatusBadge value={unit.is_active} className="text-xs font-bold  h-5 px-2 rounded-full border-none shadow-none" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-md border-border shadow-2xl p-2 animate-in zoom-in-95">
              <DropdownMenuItem onClick={() => onEdit(unit)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 focus:bg-slate-50 dark:focus:bg-slate-900">
                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Edit Unit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 opacity-50" />
              <DropdownMenuItem onClick={() => onToggleStatus(unit)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{unit.is_active ? "Suspend" : "Activate"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(unit.id)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Identity: Icon & Name */}
      <div className="flex flex-col items-center text-center mt-2 gap-4 px-2">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center ring-4 ring-slate-100/50 dark:ring-slate-800/30 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all duration-500">
            <Scale className="w-10 h-10 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          {!unit.is_active && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white dark:border-zinc-950 rounded-full animate-pulse shadow-sm" />
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5 w-full">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base  group-hover:text-emerald-600 transition-colors line-clamp-2 min-h-[3rem] flex items-center">
            {unit.name}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none px-2 h-5">
              Code: {unit.short_name || "---"}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-800 text-slate-400 px-2 h-5">
              Type: {unit.type || "Metric"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Description Footer */}
      <div className="mt-auto pt-4 flex flex-col border-t border-slate-50 dark:border-slate-800/50">
        <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1 text-center">Precision standard</span>
        <p className="text-xs text-center font-medium text-slate-500 line-clamp-2 px-2 italic">
          {unit.description || "Official SI metric protocol for high-precision inventory management."}
        </p>
      </div>
    </div>
  );
};

export default function MeasurementUnitPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  // --- 4. Renamed State Variables ---
  const [measurementUnits, setMeasurementUnits] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [sortValue, setSortValue] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();

  // Permissions
  const canCreate = hasPermission(PERMISSIONS.UNIT_CREATE);
  const canEdit = hasPermission(PERMISSIONS.UNIT_EDIT);
  const canDelete = hasPermission(PERMISSIONS.UNIT_DELETE);
  const canToggleStatus = hasPermission(PERMISSIONS.UNIT_EDIT);

  // Auth check (remains the same)
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // --- 5. Updated Data Fetching ---
  const fetchMeasurementUnits = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        // --- Using correct endpoint ---
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/measurement-units`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch measurement units");
      const data = await response.json();
      if (data.status === "success") {
        setMeasurementUnits(data.data.data || []); // Set the correct state
      } else {
        throw new Error(data.message || "Failed to fetch");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMeasurementUnits(); // Call the renamed function
    }
  }, [status, fetchMeasurementUnits]);

  // --- 6. Updated Click Handlers ---
  const handleAddClick = useCallback(() => {
    setEditingUnit(null); // Use renamed state
    setIsDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((unit) => {
    setEditingUnit(unit); // Use renamed state
    setIsDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setIsDialogOpen(false);
    setEditingUnit(null); // Use renamed state
    fetchMeasurementUnits(); // Call renamed function
  }, [fetchMeasurementUnits]);

  const handleDialogClose = useCallback((open) => {
    setIsDialogOpen(open);
    if (!open) setEditingUnit(null); // Use renamed state
  }, []);

  // --- 7. Updated Delete Handler ---
  const handleDelete = useCallback(async (ids) => {
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(
            // --- Using correct endpoint ---
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/measurement-units/${id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${session?.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchMeasurementUnits(); // Refetch
          return "Unit(s) deleted successfully!"; // Updated message
        },
        error: "Failed to delete.",
      }
    );
  }, [session?.accessToken, fetchMeasurementUnits]);

  // --- 8. Updated Toggle Status Handler ---
  const handleToggleStatus = useCallback(async (unit) => {
    const action = unit.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        // --- Using correct endpoint ---
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/measurement-units/${unit.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Deactivating"}...`,
        success: () => {
          fetchMeasurementUnits(); // Refetch data
          return `Unit ${unit.name} ${action}d successfully!`; // Updated message
        },
        error: "Action failed.",
      }
    );
  }, [session?.accessToken, fetchMeasurementUnits]);

  // --- 9. Updated Bulk Deactivate Handler ---
  const handleBulkDeactivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            // --- Using correct endpoint ---
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/measurement-units/${id}/deactivate`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session?.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Deactivating...",
        success: () => {
          fetchMeasurementUnits(); // Refetch data
          return "Unit(s) deactivated successfully!"; // Updated message
        },
        error: "Action failed.",
      }
    );
  }, [session?.accessToken, fetchMeasurementUnits]);

  const handleBulkActivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/measurement-units/${id}/activate`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session?.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Activating...",
        success: () => {
          fetchMeasurementUnits();
          return "Unit(s) activated successfully!";
        },
        error: "Action failed.",
      }
    );
  }, [session?.accessToken, fetchMeasurementUnits]);

  // --- 10. Get Columns ---
  const columns = useMemo(() => getMeasurementUnitColumns({
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
    onEdit: handleEditClick,
    canEdit,
    canDelete,
    canToggleStatus,
  }), [handleDelete, handleToggleStatus, handleEditClick, canEdit, canDelete, canToggleStatus]);

  const bulkActionsComponent = useMemo(() => (
    <UnitMeasurementBulkActions
      onDelete={handleDelete}
      onDeactivate={handleBulkDeactivate}
      onActivate={handleBulkActivate}
    />
  ), [handleDelete, handleBulkDeactivate, handleBulkActivate]);

  return (
    <>
      {/* --- 11. Updated Layout Props --- */}
      <ResourceManagementLayout
        data={measurementUnits}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchMeasurementUnits}
        headerTitle={
          <div className="flex items-center gap-4">
            <div className="size-9 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
              <Scale className="size-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white  leading-none">
                Measurement Units
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-1 opacity-70">
                Standard metrics & precision protocols
              </p>
            </div>
          </div>
        }
        addButtonLabel="Add Unit"
        onAddClick={canCreate ? handleAddClick : null}
        isAdding={isDialogOpen}
        onExportClick={() => console.log("Export clicked")}
        bulkActionsComponent={bulkActionsComponent}
        searchColumn="name"
        searchPlaceholder="Filter units by name..."
        loadingSkeleton={<UnitMeasurementSkeleton />}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSortChange={setSortValue}
        renderGridItem={(row) => (
          <MeasurementUnitGridCard
            row={row}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            canEdit={canEdit}
            canDelete={canDelete}
            canToggleStatus={canToggleStatus}
          />
        )}
      />
      {/* --- 12. Updated Dialog Component --- */}
      <MeasurementUnitDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSuccess={handleDialogSuccess}
        session={session}
        initialData={editingUnit}
      />
    </>
  );
}
