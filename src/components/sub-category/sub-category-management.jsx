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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ProductSkeleton from "@/app/skeletons/products/product-listing-skeleton";
import { ResourceManagementLayout } from "../general/resource-management-layout";
import { getSubCategoryColumns } from "./sub-category-column";
import { SubCategorySheet } from "./sub-category-sheet";
import { usePermission } from "@/hooks/use-permission";
import { 
  Plus, 
  Search, 
  RotateCcw, 
  FolderOpen, 
  CheckCircle2, 
  XCircle,
  Hash,
  Trash2, 
  ChevronDown,
  Edit3,
  MoreHorizontal,
  Check,
  ExternalLink,
} from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

// --- HELPERS ---
const HeaderContent = () => (
  <div className="flex items-center gap-4">
    <div className="size-9 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
      <FolderOpen className="size-4.5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="flex flex-col">
      <h1 className="text-lg font-bold text-slate-900 dark:text-white  leading-none">
        Sub-Category Catalog
      </h1>
      <p className="text-xs text-slate-500 font-semibold mt-1 opacity-70">
        Niche classification and taxonomy mappings
      </p>
    </div>
  </div>
);

// --- FIX 1: Component defined outside with safety check ---
const SubCategoryBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
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
        <span>Delete Permanently</span>
      </DropdownMenuItem>
    </>
  );
};

/**
 * Renders a single sub-category card for the Grid View
 */
const SubCategoryGridCard = ({ row, onEdit, onDelete, onToggleStatus, canEdit, canDelete, canToggleStatus }) => {
  const category = row.original;
  const isSelected = row.getIsSelected();

  return (
    <div 
      className={cn(
        "group relative flex flex-col gap-4 p-5 rounded-md border transition-all duration-300",
        isSelected 
          ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20" 
          : "bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/50 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-emerald-500/5 hover:-translate-y-1.5"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
          className="h-4.5 w-4.5 rounded-md border-slate-300 dark:border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />
        
        <div className="flex items-center gap-2">
          <StatusBadge value={category.is_active} className="text-xs font-bold h-5 px-2 rounded-full border-none shadow-none" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-md border-border shadow-2xl p-2 animate-in zoom-in-95">
              <DropdownMenuItem onClick={() => onEdit(category)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 focus:bg-slate-50 dark:focus:bg-slate-900">
                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Edit Sub-Category</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 opacity-50" />
              <DropdownMenuItem onClick={() => onDelete(category.id)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center text-center mt-2 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-[24px] bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center ring-8 ring-slate-50 dark:ring-slate-900/50 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all duration-500 shadow-sm">
            <FolderOpen className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          {!category.is_active && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white dark:border-zinc-950 rounded-full animate-pulse shadow-sm" />
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5 px-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base  group-hover:text-emerald-600 transition-colors line-clamp-1">
              {category.name}
            </h3>
            <ExternalLink className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <Badge variant="secondary" className="text-[10px] px-2 h-5 font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-none tracking-wider uppercase">
            {category.main_category?.name ?? "Ungrouped"}
          </Badge>
        </div>
      </div>

      {/* Footer / Meta */}
      <div className="mt-auto pt-4 flex flex-wrap justify-center gap-2 border-t border-slate-50 dark:border-slate-800/50">
        <div className="flex flex-col items-center gap-0.5">
           <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Status Code</span>
           <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ">{category.code || "---"}</span>
        </div>
      </div>
    </div>
  );
};


export default function SubCategoryPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [SubCategories, setSubCategories] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [sortValue, setSortValue] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();

  // Permissions
  const canCreate = hasPermission(PERMISSIONS.CATEGORY_CREATE);
  const canEdit = hasPermission(PERMISSIONS.CATEGORY_EDIT);
  const canDelete = hasPermission(PERMISSIONS.CATEGORY_DELETE);
  const canToggleStatus = hasPermission(PERMISSIONS.CATEGORY_EDIT);

  // 1. Auth Check
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // 2. Data Fetching
  const fetchSubCategories = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories?size=1000`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      if (data.status === "success") {
        setSubCategories(data.data.data || []);
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
      fetchSubCategories();
    }
  }, [status, fetchSubCategories]);

  // 3. Handlers
  const handleAddClick = useCallback(() => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    fetchSubCategories();
  }, [fetchSubCategories]);

  // --- FIX 2: Correct Dialog Closing Logic ---
  const handleDialogClose = useCallback((open) => {
    setIsDialogOpen(open);
    if (!open) setEditingCategory(null);
  }, []);

  const handleDelete = useCallback(
    async (ids) => {
      const isBulk = Array.isArray(ids);
      const idsToDelete = isBulk ? ids : [ids];

      toast.promise(
        Promise.all(
          idsToDelete.map((id) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories/${id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` },
              }
            )
          )
        ),
        {
          loading: "Deleting...",
          success: () => {
            fetchSubCategories();
            return "Sub Category(s) deleted successfully!";
          },
          error: "Failed to delete.",
        }
      );
    },
    [session, fetchSubCategories]
  );

  const handleToggleStatus = useCallback(
    async (sub_category) => {
      const action = sub_category.is_active ? "deactivate" : "activate";
      toast.promise(
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories/${sub_category.id}/${action}`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }
        ),
        {
          loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
          success: () => {
            fetchSubCategories();
            return `Sub Category ${sub_category.name} ${action}d successfully!`;
          },
          error: "Action failed.",
        }
      );
    },
    [session, fetchSubCategories]
  );

  const handleBulkActivate = useCallback(
    async (ids) => {
      toast.promise(
        Promise.all(
          ids.map((id) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories/${id}/activate`,
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
            fetchSubCategories();
            return "Sub Category(s) activated successfully!";
          },
          error: "Action failed.",
        }
      );
    },
    [session, fetchSubCategories]
  );

  const handleBulkDeactivate = useCallback(
    async (ids) => {
      toast.promise(
        Promise.all(
          ids.map((id) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories/${id}/deactivate`,
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
            fetchSubCategories();
            return "Sub Category(s) deactivated successfully!";
          },
          error: "Action failed.",
        }
      );
    },
    [session, fetchSubCategories]
  );

  // 4. Memoize Columns
  const columns = useMemo(
    () =>
      getSubCategoryColumns({
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
        onEdit: handleEditClick,
        canEdit,
        canDelete,
        canToggleStatus,
      }),
    [
      handleDelete,
      handleToggleStatus,
      handleEditClick,
      canEdit,
      canDelete,
      canToggleStatus,
    ]
  );

  // --- FIX 3: Memoize Bulk Actions Component ---
  // This prevents the infinite loop freeze
  const bulkActionsComponent = useMemo(
    () => (
      <SubCategoryBulkActions
        onDelete={handleDelete}
        onDeactivate={handleBulkDeactivate}
        onActivate={handleBulkActivate}
      />
    ),
    [handleDelete, handleBulkDeactivate, handleBulkActivate]
  );

  const stats = useMemo(() => {
    const total = SubCategories.length;
    const active = SubCategories.filter(b => b.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [SubCategories]);

  return (
    <div className="flex flex-col gap-6">
    

      <ResourceManagementLayout
        data={SubCategories}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchSubCategories}
        headerTitle={<HeaderContent />}
        addButtonLabel="New Sub Category"
        onAddClick={canCreate ? handleAddClick : null}
        isAdding={isNavigating}
        onExportClick={() => console.log("Export clicked")}
        bulkActionsComponent={bulkActionsComponent}
        searchColumn="name"
        searchPlaceholder="Filter sub categories by name..."
        loadingSkeleton={<ProductSkeleton />}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSortChange={setSortValue}
        renderGridItem={(row) => (
          <SubCategoryGridCard
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
      <SubCategorySheet
        open={isDialogOpen}
        onOpenChange={handleDialogClose} // Use fixed handler
        onSuccess={handleDialogSuccess}
        session={session}
        initialData={editingCategory}
      />
    </div>
  );
}
