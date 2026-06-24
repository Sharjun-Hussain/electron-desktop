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
import { getMainCategoryColumns } from "./main-category-column";
import { MainCategorySheet } from "./main-category-sheet";
import { usePermission } from "@/hooks/use-permission";
import { 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ChevronDown, 
  Folder,
  Edit3,
  MoreHorizontal,
  Check,
} from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

// --- HELPERS ---
const HeaderContent = () => (
  <div className="flex items-center gap-4">
    <div className="size-9 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
      <Folder className="size-4.5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="flex flex-col">
      <h1 className="text-lg font-bold text-slate-900 dark:text-white  leading-none">
        Primary Taxonomies
      </h1>
      <p className="text-xs text-slate-500 font-semibold mt-1 opacity-70">
        High-level product catalog hierarchy
      </p>
    </div>
  </div>
);

// --- Component Definition ---
const MainCategoryBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
  if (!table) return null;

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const numSelected = selectedRows.length;
  const selectedIds = selectedRows.map((row) => row.original.id);

  return (
    <>
      <DropdownMenuItem
        className="text-sm font-medium rounded-lg"
        disabled={numSelected === 0}
        onClick={() => {
          onActivate(selectedIds);
          table.resetRowSelection();
        }}
      >
        <span>Activate Selection</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        className="text-sm font-medium rounded-lg"
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
        className="text-sm font-medium rounded-lg text-rose-500 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/10"
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
 * Renders a single category card for the Grid View
 */
const CategoryGridCard = ({ row, onEdit, onDelete, onToggleStatus, canEdit, canDelete, canToggleStatus }) => {
  const category = row.original;
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
          className="h-4.5 w-4.5 rounded-lg border-slate-300 dark:border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />
        
        <div className="flex items-center gap-2">
          <StatusBadge value={category.is_active} className="text-xs font-bold  h-5 px-2 rounded-full border-none shadow-none" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-md border-border shadow-2xl p-2 animate-in zoom-in-95">
              <DropdownMenuItem onClick={() => onEdit(category)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 focus:bg-slate-50 dark:focus:bg-slate-900">
                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Edit Category</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 opacity-50" />
              <DropdownMenuItem onClick={() => onToggleStatus(category)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{category.is_active ? "Suspend" : "Activate"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(category.id)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Identity: Folder Icon & Name */}
      <div className="flex flex-col items-center text-center mt-2 gap-4">
        <div className="relative group/folder">
          <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center ring-4 ring-slate-100/50 dark:ring-slate-800/30 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all duration-500">
            <Folder className="w-10 h-10 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          {!category.is_active && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white dark:border-zinc-950 rounded-full animate-pulse shadow-sm" />
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base  group-hover:text-emerald-600 transition-colors line-clamp-1 p-1">
            {category.name}
          </h3>
        </div>
      </div>

      {/* Stats/Meta */}
      <div className="mt-auto pt-4 flex flex-wrap justify-center gap-2 border-t border-slate-50 dark:border-slate-800/50">
        <div className="flex flex-col items-center">
           <span className="text-xs font-bold text-slate-400 leading-none">Catalog Type</span>
           <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Primary Taxonomy</span>
        </div>
      </div>
    </div>
  );
};

export default function MainCategoryPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [MainCategories, setMainCategories] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [sortValue, setSortValue] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();

  const canCreate = hasPermission(PERMISSIONS.CATEGORY_CREATE);
  const canEdit = hasPermission(PERMISSIONS.CATEGORY_EDIT);
  const canDelete = hasPermission(PERMISSIONS.CATEGORY_DELETE);
  const canToggleStatus = hasPermission(PERMISSIONS.CATEGORY_EDIT);

  // 1. Safe Auth Check
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // 2. Data Fetching
  const fetchMainCategories = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories?size=1000`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      if (data.status === "success") {
        setMainCategories(data.data.data || []);
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
      fetchMainCategories();
    }
  }, [status, fetchMainCategories]);

  // 3. Dialog Handlers
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
    fetchMainCategories();
  }, [fetchMainCategories]);

  const handleDialogClose = useCallback((open) => {
    setIsDialogOpen(open);
    if (!open) setEditingCategory(null);
  }, []);

  // 4. Action Handlers
  const handleDelete = useCallback(
    async (ids) => {
      const idsToDelete = Array.isArray(ids) ? ids : [ids];
      toast.promise(
        Promise.all(
          idsToDelete.map((id) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/${id}`,
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
            fetchMainCategories();
            return "Main Category(s) deleted successfully!";
          },
          error: "Failed to delete.",
        }
      );
    },
    [session?.accessToken, fetchMainCategories]
  );

  const handleToggleStatus = useCallback(
    async (main_category) => {
      const action = main_category.is_active ? "deactivate" : "activate";
      toast.promise(
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/${main_category.id}/${action}`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          }
        ),
        {
          loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
          success: () => {
            fetchMainCategories();
            return `Main Category ${main_category.name} ${action}d successfully!`;
          },
          error: "Action failed.",
        }
      );
    },
    [session?.accessToken, fetchMainCategories]
  );

  const handleBulkDeactivate = useCallback(
    async (ids) => {
      toast.promise(
        Promise.all(
          ids.map((id) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/${id}/deactivate`,
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
            fetchMainCategories();
            return "Main Category(s) deactivated successfully!";
          },
          error: "Action failed.",
        }
      );
    },
    [session?.accessToken, fetchMainCategories]
  );

  // --- NEW: Bulk Activate Handler ---
  const handleBulkActivate = useCallback(
    async (ids) => {
      toast.promise(
        Promise.all(
          ids.map((id) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/${id}/activate`,
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
            fetchMainCategories();
            return "Main Category(s) activated successfully!";
          },
          error: "Action failed.",
        }
      );
    },
    [session?.accessToken, fetchMainCategories]
  );

  // 5. Memoized Configurations
  const columns = useMemo(
    () =>
      getMainCategoryColumns({
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

  const bulkActionsComponent = useMemo(
    () => (
      <MainCategoryBulkActions
        onDelete={handleDelete}
        onDeactivate={handleBulkDeactivate}
        onActivate={handleBulkActivate} // Pass the new handler
      />
    ),
    [handleDelete, handleBulkDeactivate, handleBulkActivate]
  );

  const stats = useMemo(() => {
    const total = MainCategories.length;
    const active = MainCategories.filter(b => b.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [MainCategories]);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      

      <ResourceManagementLayout
        data={MainCategories}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchMainCategories}
        headerTitle={<HeaderContent />}
        addButtonLabel="New Category"
        onAddClick={canCreate ? handleAddClick : null}
        isAdding={isNavigating}
        bulkActionsComponent={bulkActionsComponent}
        searchColumn="name"
        searchPlaceholder="Filter categories by name..."
        loadingSkeleton={<ProductSkeleton />}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSortChange={setSortValue}
        renderGridItem={(row) => (
          <CategoryGridCard
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
      <MainCategorySheet
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSuccess={handleDialogSuccess}
        session={session}
        initialData={editingCategory}
      />
    </div>
  );
}
