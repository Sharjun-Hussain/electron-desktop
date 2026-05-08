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
import OrganizationPageSkeleton from "@/app/skeletons/organization-skeleton";
import { ResourceManagementLayout } from "../general/resource-management-layout";
import { UnitDialog } from "./units-dialog";
import { UnitsAiAssistant } from "./units-ai-assistant";
import { getUnitColumns } from "./units-column";
import { 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ChevronDown, 
  Box, 
  Edit3, 
  MoreHorizontal, 
  Check,
  Sparkles 
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

// --- FIX 1: Component defined outside with safety check ---
const UnitBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
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

/**
 * Renders a single unit card for the Grid View
 */
const UnitGridCard = ({ row, onEdit, onDelete, onToggleStatus, canEdit, canDelete, canToggleStatus }) => {
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
      <div className="flex flex-col items-center text-center mt-2 gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center ring-4 ring-slate-100/50 dark:ring-slate-800/30 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all duration-500">
            <Box className="w-10 h-10 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          {!unit.is_active && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white dark:border-zinc-950 rounded-full animate-pulse shadow-sm" />
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5 px-4 mt-2">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base  group-hover:text-emerald-600 transition-colors line-clamp-2">
            {unit.name}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none px-2 h-5 uppercase">
              {unit.short_name || "N/A"}
            </Badge>
            {unit.is_base_unit && (
              <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 h-5">
                Primary Base Unit
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description Footer */}
      <div className="mt-auto pt-4 flex flex-col border-t border-slate-50 dark:border-slate-800/50">
         <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1 text-center">Protocol Specs</span>
          <p className="text-xs text-center font-medium text-slate-500 line-clamp-2 px-2 italic">
            Standard metric unit: {unit.short_name}
          </p>
      </div>
    </div>
  );
};

export default function UnitsPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [units, setUnits] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [sortValue, setSortValue] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { UNIT } = MODULES;

  // 1. Auth Check
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // 2. Data Fetching (Wrapped in useCallback)
  const fetchUnits = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/units`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.status === "success") {
        setUnits(data.data.data || []);
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
      fetchUnits();
    }
  }, [status, fetchUnits]);

  // 3. Handlers (Wrapped in useCallback)
  const handleAddClick = useCallback(() => {
    setEditingUnit(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((unit) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setIsDialogOpen(false);
    setEditingUnit(null);
    fetchUnits();
  }, [fetchUnits]);

  // --- FIX 2: Correct Dialog Closing Logic ---
  const handleDialogClose = useCallback((open) => {
    setIsDialogOpen(open);
    if (!open) setEditingUnit(null);
  }, []);

  const handleDelete = useCallback(async (ids) => {
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/units/${id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          ).then(res => {
            if (!res.ok) throw new Error("Failed to delete");
            return res;
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchUnits();
          return "Unit(s) deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  }, [session, fetchUnits]);

  const handleToggleStatus = useCallback(async (unit) => {
    const action = unit.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/units/${unit.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
        success: () => {
          fetchUnits();
          return `Unit ${unit.name} ${action}d successfully!`;
        },
        error: "Action failed.",
      }
    );
  }, [session, fetchUnits]);

  const handleBulkDeactivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/units/${id}/deactivate`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Deactivating...",
        success: () => {
          fetchUnits();
          return "Unit(s) deactivated successfully!";
        },
        error: "Action failed.",
      }
    );
  }, [session, fetchUnits]);

  const handleBulkActivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/units/${id}/activate`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Activating...",
        success: () => {
          fetchUnits();
          return "Unit(s) activated successfully!";
        },
        error: "Action failed.",
      }
    );
  }, [session, fetchUnits]);

  // --- FIX 3: Memoize Columns ---
  const columns = useMemo(() => getUnitColumns({
    onDelete: canDelete(UNIT) ? handleDelete : null,
    onToggleStatus: canUpdate(UNIT) ? handleToggleStatus : null,
    onEdit: canUpdate(UNIT) ? handleEditClick : null,
  }), [handleDelete, handleToggleStatus, handleEditClick, canDelete, canUpdate, UNIT]);

  // --- FIX 4: Memoize Bulk Actions Component ---
  // This prevents the infinite loop/freeze
  const bulkActionsComponent = useMemo(() => (
    canDelete(UNIT) ? (
      <UnitBulkActions
        onDelete={handleDelete}
        onDeactivate={handleBulkDeactivate}
        onActivate={handleBulkActivate}
      />
    ) : null
  ), [handleDelete, handleBulkDeactivate, handleBulkActivate, canDelete, UNIT]);

  return (
    <>
      <ResourceManagementLayout
        data={units}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchUnits}
        headerTitle={
            <div className="flex items-center gap-4">
                <div className="size-9 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
                    <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white  leading-none">
                        Inventory Units
                    </h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1 opacity-70">
                        Metric protocols & packaging standards
                    </p>
                </div>
            </div>
        }
        addButtonLabel="Add Unit"
        onAddClick={canCreate(UNIT) ? handleAddClick : null}
        extraActions={
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAiOpen(true)}
                className="h-9 px-4 gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
            >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI Assist</span>
            </Button>
        }
        isAdding={isNavigating}
        onExportClick={() => console.log("Export clicked")}
        bulkActionsComponent={bulkActionsComponent} // Use the memoized variable
        searchColumn="name"
        searchPlaceholder="Filter unit by name..."
        loadingSkeleton={<OrganizationPageSkeleton />}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSortChange={setSortValue}
        renderGridItem={(row) => (
          <UnitGridCard
            row={row}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            canEdit={canUpdate(UNIT)}
            canDelete={canDelete(UNIT)}
            canToggleStatus={canUpdate(UNIT)}
          />
        )}
      />
      <UnitDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose} // Use fixed handler
        onSuccess={handleDialogSuccess}
        session={session}
        initialData={editingUnit}
      />
      <UnitsAiAssistant 
        open={isAiOpen}
        onOpenChange={setIsAiOpen}
        onSuccess={fetchUnits}
        session={session}
      />
    </>
  );
}