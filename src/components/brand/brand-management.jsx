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
import { getBrandColumns } from "./brand-column";
import { BrandSheet } from "./brand-sheet";
import { usePermission } from "@/hooks/use-permission";
import { 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ChevronDown, 
  LayoutGrid, 
  Tag,
  Edit3,
  MoreHorizontal,
  Check,
} from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

// --- 2. HELPER COMPONENTS ---
const HeaderContent = () => (
  <div className="flex items-center gap-4">
    <div className="size-9 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
      <Tag className="size-4.5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="flex flex-col">
      <h1 className="text-lg font-bold text-slate-900 dark:text-white  leading-none">
        Brand Directory
      </h1>
      <p className="text-xs text-slate-500 font-semibold mt-1 opacity-70">
        Manage your product manufacturer identities
      </p>
    </div>
  </div>
);

// --- 2. RENAMED COMPONENT ---
const BrandBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
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

// --- 3. RENAMED MAIN PAGE COMPONENT ---
/**
 * Renders a single brand card for the Grid View
 */
const BrandGridCard = ({ row, onEdit, onDelete, onToggleStatus, canEdit, canDelete, canToggleStatus }) => {
  const brand = row.original;
  const isSelected = row.getIsSelected();

  return (
    <div 
      className={cn(
        "group relative flex flex-col gap-4 p-5 rounded-[24px] border transition-all duration-300",
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
          <StatusBadge value={brand.is_active} className="text-xs font-bold h-5 px-2 rounded-full border-none shadow-none" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-md border-border shadow-2xl p-2 animate-in zoom-in-95">
              <DropdownMenuItem onClick={() => onEdit(brand)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 focus:bg-slate-50 dark:focus:bg-slate-900">
                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Edit Brand</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 opacity-50" />
              <DropdownMenuItem onClick={() => onToggleStatus(brand)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{brand.is_active ? "Suspend" : "Activate"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(brand.id)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-red-500">
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
          <div className="w-20 h-20 rounded-[28px] bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center ring-8 ring-slate-50 dark:ring-slate-900/50 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all duration-500 shadow-sm">
            <Tag className="w-10 h-10 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          {!brand.is_active && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white dark:border-zinc-950 rounded-full animate-pulse shadow-sm" />
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg  group-hover:text-emerald-600 transition-colors line-clamp-1 p-1">
            {brand.name}
          </h3>
          <Badge variant="secondary" className="text-[10px] px-2 h-5 font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-none tracking-wider uppercase">
            Slug: {brand.slug || "---"}
          </Badge>
        </div>
      </div>

      {/* Footer / Meta */}
      <div className="mt-auto pt-4 flex flex-wrap justify-center gap-2 border-t border-slate-50 dark:border-slate-800/50">
        <div className="flex flex-col items-center gap-0.5">
           <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Manufacturer</span>
           <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ">OFFICIAL PARTNER</span>
        </div>
      </div>
    </div>
  );
};

export default function BrandPage() {
  // --- 4. RENAMED STATE VARIABLES ---
  const [brands, setBrands] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [sortValue, setSortValue] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();

  // Permissions
  const canCreate = hasPermission(PERMISSIONS.BRAND_CREATE);
  const canEdit = hasPermission(PERMISSIONS.BRAND_EDIT);
  const canDelete = hasPermission(PERMISSIONS.BRAND_DELETE);
  const canToggleStatus = hasPermission(PERMISSIONS.BRAND_EDIT);

  // Auth logic (remains the same)
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // --- 5. UPDATED FETCH LOGIC ---
  const fetchBrands = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands`, // Updated endpoint
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.status === "success") {
        setBrands(data.data.data || []); // Updated state
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
      fetchBrands(); // Updated function call
    }
  }, [status, fetchBrands]);

  // --- 6. UPDATED DIALOG HANDLERS ---
  const handleAddClick = useCallback(() => {
    setEditingBrand(null); // Updated state
    setIsDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((brand) => {
    setEditingBrand(brand); // Updated state
    setIsDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setIsDialogOpen(false);
    setEditingBrand(null); // Updated state
    fetchBrands(); // Updated function call
  }, [fetchBrands]);

  const handleDialogClose = useCallback((open) => {
    setIsDialogOpen(open);
    if (!open) setEditingBrand(null);
  }, []);

  // --- 7. UPDATED API HANDLERS ---
  const handleDelete = useCallback(async (ids) => {
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${id}`, // Updated endpoint
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
          fetchBrands(); // Updated function call
          return "Brand(s) deleted successfully!"; // Updated text
        },
        error: "Failed to delete.",
      }
    );
  }, [session?.accessToken, fetchBrands]);

  const handleToggleStatus = useCallback(async (brand) => {
    const action = brand.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${brand.id}/${action}`, // Updated endpoint
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
        success: () => {
          fetchBrands(); // Updated function call
          return `Brand ${brand.name} ${action}d successfully!`; // Updated text
        },
        error: "Action failed.",
      }
    );
  }, [session?.accessToken, fetchBrands]);

  const handleBulkDeactivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${id}/deactivate`, // Updated endpoint
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
          fetchBrands(); // Updated function call
          return "Brand(s) deactivated successfully!"; // Updated text
        },
        error: "Action failed.",
      }
    );
  }, [session?.accessToken, fetchBrands]);

  const handleBulkActivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${id}/activate`,
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
          fetchBrands();
          return "Brand(s) activated successfully!";
        },
        error: "Action failed.",
      }
    );
  }, [session?.accessToken, fetchBrands]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = brands.length;
    const active = brands.filter(b => b.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [brands]);

  const handleExport = useCallback(() => {
    if (brands.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["ID", "Name", "Slug", "Description", "Status", "Created At"];
    const csvContent = [
      headers.join(","),
      ...brands.map(b => [
        b.id,
        `"${b.name}"`,
        `"${b.slug}"`,
        `"${b.description || ""}"`,
        b.is_active ? "Active" : "Inactive",
        new Date(b.created_at).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `brands_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Brands exported successfully!");
  }, [brands]);

  // 7. Get the columns by passing the handlers
  const columns = useMemo(() => getBrandColumns({
    // Updated function call
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
    onEdit: handleEditClick,
    canEdit,
    canDelete,
    canToggleStatus,
  }), [handleDelete, handleToggleStatus, handleEditClick, canEdit, canDelete, canToggleStatus]);

  const bulkActionsComponent = useMemo(() => (
    <BrandBulkActions // Updated component
      onDelete={handleDelete}
      onDeactivate={handleBulkDeactivate}
      onActivate={handleBulkActivate}
    />
  ), [handleDelete, handleBulkDeactivate, handleBulkActivate]);

  return (
    <div className="flex flex-col gap-4">
      
      <ResourceManagementLayout
        data={brands}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchBrands}
        headerTitle={<HeaderContent />}
        addButtonLabel="New Brand"
        onAddClick={canCreate ? handleAddClick : null}
        isAdding={isDialogOpen}
        onExportClick={handleExport}
        bulkActionsComponent={bulkActionsComponent}
        searchColumn="name"
        searchPlaceholder="Filter brands by name..."
        loadingSkeleton={<ProductSkeleton />}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSortChange={setSortValue}
        renderGridItem={(row) => (
          <BrandGridCard
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
      {/* --- 9. UPDATED DIALOG COMPONENT --- */}
      <BrandSheet
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSuccess={handleDialogSuccess}
        session={session}
        initialData={editingBrand} // Updated state
      />
    </div>
  );
}
