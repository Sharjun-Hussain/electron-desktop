"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// UI Components
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
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Icons
import {
  PlusCircle,
  Edit3,
  MoreHorizontal,
  ExternalLink,
  Boxes,
  Trash2,
  Check,
  Package,
  ChevronsUpDown,
  ImageIcon,
} from "lucide-react";

// Custom Components & Hooks
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { usePermission } from "@/hooks/use-permission";
import { getProductVariantColumns } from "./product-variant-column";
import ProductSkeleton from "@/app/skeletons/products/product-listing-skeleton";
import { PERMISSIONS } from "@/lib/permissions";

// ----------------------------------------------------------------------
// 0. Helper: Image Resolution
// ----------------------------------------------------------------------
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "");

  try {
    const images = JSON.parse(imagePath);
    const path = Array.isArray(images) && images.length > 0 ? images[0] : imagePath;
    return `${baseUrl}/${path}`;
  } catch (e) {
    return `${baseUrl}/${imagePath}`;
  }
};

// ----------------------------------------------------------------------
// 1. Helper: Page Header
// ----------------------------------------------------------------------
const HeaderContent = () => (
  <div className="flex items-center gap-4">
    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
      <Boxes className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="flex flex-col">
      <h1 className="text-lg font-bold text-foreground leading-none">
        Variant Catalog
      </h1>
      <p className="text-xs text-muted-foreground font-semibold mt-1.5 opacity-70">
        Attribute & Structural Asset Control
      </p>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// 2. Component: Variant Filters
// ----------------------------------------------------------------------
const VariantFilters = ({ table }) => {
  const [open, setOpen] = useState(false);
  const uniqueProducts = useMemo(() => {
    const products = new Set();
    table.getPreFilteredRowModel().rows.forEach((row) => {
      const name = row.getValue("parent_product_name");
      if (name) products.add(name);
    });
    return Array.from(products).sort();
  }, [table.getPreFilteredRowModel().rows]);

  const rawFilterValue = table.getColumn("parent_product_name")?.getFilterValue();
  const selectedValues = Array.isArray(rawFilterValue) ? rawFilterValue : [];

  const handleSelect = (productName) => {
    const isSelected = selectedValues.includes(productName);
    const next = isSelected
      ? selectedValues.filter(v => v !== productName)
      : [...selectedValues, productName];
    table.getColumn("parent_product_name")?.setFilterValue(next.length > 0 ? next : undefined);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[220px] px-3 bg-white dark:bg-card border border-border hover:bg-slate-50 dark:hover:bg-accent rounded-md focus:ring-emerald-500/10 text-sm font-medium justify-between shadow-sm transition-all"
          >
            <div className="flex items-center mr-2 overflow-hidden">
              {selectedValues.length === 0 ? (
                <><Package className="mr-2 h-4 w-4 shrink-0 transition-opacity" /> <span className="truncate">All Products</span></>
              ) : selectedValues.length === 1 ? (
                <span className="text-foreground truncate">{selectedValues[0]}</span>
              ) : (
                <span className="truncate bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {selectedValues.length} Selected
                </span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0 rounded-md border-border shadow-2xl">
          <Command className="bg-popover/90 backdrop-blur-xl">
            <CommandInput placeholder="Search product..." className="" />
            <CommandList className="scrollbar-thin">
              <CommandEmpty className=" text-muted-foreground font-medium text-center">No product found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value={"all products view"}
                  onSelect={() => {
                    table.getColumn("parent_product_name")?.setFilterValue(undefined);
                    setOpen(false);
                  }}
                  className="rounded-md cursor-pointer mb-1"
                >
                  <Package className="mr-2 h-4 w-4 shrink-0 text-muted-foreground/60" />
                  All Products View
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 text-emerald-500",
                      selectedValues.length === 0 ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
                {uniqueProducts.map((productName) => (
                  <CommandItem
                    key={productName}
                    value={productName}
                    onSelect={() => {
                      handleSelect(productName);
                    }}
                    className="rounded-md cursor-pointer truncate flex items-center"
                  >
                    {productName}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 text-emerald-500 shrink-0",
                        selectedValues.includes(productName) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Select
        value={
          table.getColumn("is_active")?.getFilterValue() !== undefined
            ? String(table.getColumn("is_active")?.getFilterValue())
            : "all"
        }
        onValueChange={(value) => {
          if (value === "all") {
            table.getColumn("is_active")?.setFilterValue(undefined);
          } else {
            table.getColumn("is_active")?.setFilterValue(value === "true");
          }
        }}
      >
        <SelectTrigger className="w-[180px] bg-white dark:bg-card border border-border rounded-md focus:ring-emerald-500/10 text-sm font-medium shadow-sm transition-all">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent className="rounded-md border-border shadow-2xl">
          <SelectItem value="all" className="">All Status</SelectItem>
          <SelectItem value="true" className="">
            <div className="flex items-center text-emerald-600">
              Active
            </div>
          </SelectItem>
          <SelectItem value="false" className="">
            <div className="flex items-center text-red-500">
              Inactive
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </>
  );
};

// ----------------------------------------------------------------------
// 3. Component: Bulk Actions (renders items only — toolbar owns the DropdownMenu shell)
// ----------------------------------------------------------------------
const VariantBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
  if (!table) return null;

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const numSelected = selectedRows.length;
  const selectedIds = selectedRows.map((row) => row.id);

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

// ----------------------------------------------------------------------
// 4. Component: Variant Grid Card
// ----------------------------------------------------------------------
const VariantGridCard = ({ row, onEdit, onDelete, onToggleStatus, canEdit, canDelete, canToggleStatus }) => {
  const variant = row.original;
  const isSelected = row.getIsSelected();

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 p-5 rounded-[24px] border transition-all duration-300",
        isSelected
          ? "bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
          : "bg-white dark:bg-card border-border hover:border-emerald-500/20 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1"
      )}
    >
      <div className="flex items-start justify-between">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
          className="h-4.5 w-4.5 rounded-md border-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />

        <div className="flex items-center gap-2">
          <StatusBadge value={variant.is_active} className="text-xs font-bold  h-5 px-2 rounded-full border-none shadow-none" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl border-border shadow-2xl p-2 animate-in zoom-in-95">
              <DropdownMenuItem onClick={() => onEdit(variant)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3">
                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Edit Variant</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 opacity-50" />
              <DropdownMenuItem onClick={() => onToggleStatus(variant)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{variant.is_active ? "Suspend" : "Activate"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(variant)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 rounded-2xl bg-muted/30 border border-border/50 overflow-hidden flex items-center justify-center">
          {variant.image || variant.parent_image ? (
            <img
              src={getImageUrl(variant.image || variant.parent_image)}
              alt={variant.sku}
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          )}
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 transition-colors truncate leading-tight">
              {variant.sku}
            </h3>
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider opacity-70">
            {variant.parent_product_name}
          </p>

          <div className="flex flex-wrap gap-1 mt-1">
            {variant.attribute_values?.length > 0 ? (
              variant.attribute_values.map((av, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4.5 font-bold border-emerald-500/10 text-emerald-600 bg-emerald-500/5"
                >
                  {av.value}
                </Badge>
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground/50 font-medium italic">General Variant</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            ${variant.selling_price || variant.price || "0.00"}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 leading-none">Current Stock</span>
          <span className={cn(
            "text-sm font-bold",
            (variant.total_stock || 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            {variant.total_stock || 0} Units
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-slate-400  leading-none">Asset ID</span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-500 font-medium">{variant.code || "---"}</span>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 5. Main Page Component
// ----------------------------------------------------------------------
export default function ProductVariantsPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [sortValue, setSortValue] = useState("newest");

  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();

  const canCreate = hasPermission(PERMISSIONS.PRODUCT_CREATE);
  const canEdit = hasPermission(PERMISSIONS.PRODUCT_EDIT);
  const canDelete = hasPermission(PERMISSIONS.PRODUCT_DELETE);
  const canToggleStatus = hasPermission(PERMISSIONS.PRODUCT_EDIT);

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  const fetchVariants = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=1000`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch variants");
      const data = await response.json();

      if (data.status === "success") {
        const productsArray = data.data.data || data.data; // Handle paginated array
        const flattenedVariants = productsArray.flatMap((product) =>
          (product.variants || []).map((variant) => {
            const searchText = [
              variant.sku,
              variant.code,
              variant.barcode,
              product.name,
              ...(variant.attribute_values?.map(av => av.value) || [])
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return {
              ...variant,
              parent_product_name: product.name,
              parent_image: product.image,
              // API likely returns product_id inside variant,
              // but we ensure it's available here from the parent scope just in case
              product_id: variant.product_id || product.id,
              search_text: searchText,
              total_stock: (variant.stocks || []).reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0)
            };
          })
        );
        setVariants(flattenedVariants);
      } else {
        throw new Error(data.message || "Failed to fetch variants");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchVariants();
    }
  }, [status, fetchVariants]);

  // --- ACTIONS HANDLER ---
  // This helper now resolves IDs to full variant objects to get the product_id
  const performApiAction = async (
    input,
    urlFn,
    method,
    loadingMsg,
    successMsg
  ) => {
    const inputs = Array.isArray(input) ? input : [input];

    // Map inputs (which might be IDs or Objects) to actual Variant Objects
    const targets = inputs
      .map((item) => {
        // If it's already an object with an ID, use it
        if (typeof item === "object" && item !== null && "id" in item)
          return item;
        // If it's an ID (string/number), find it in the state
        return variants.find((v) => v.id === item);
      })
      .filter(Boolean); // Remove any undefined results

    if (targets.length === 0) {
      toast.error("No valid variants selected.");
      return;
    }

    toast.promise(
      Promise.all(
        targets.map(async (variant) => {
          const response = await fetch(urlFn(variant), {
            // Pass the whole variant object to the URL generator
            method,
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Action failed for ${variant.name || 'variant'}`);
          }
          return response;
        })
      ),
      {
        loading: loadingMsg,
        success: () => {
          fetchVariants();
          return successMsg;
        },
        error: "Action failed.",
      }
    );
  };

  // --- URL GENERATORS (Updated to your required format) ---

  // Format: api/v1/products/{productid}/variants/{variantid}
  const handleDelete = (input) =>
    performApiAction(
      input,
      (variant) =>
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${variant.product_id}/variants/${variant.id}`,
      "DELETE",
      "Deleting variants...",
      "Variants deleted successfully!"
    );

  const handleBulkDeactivate = (input) =>
    performApiAction(
      input,
      (variant) =>
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${variant.product_id}/variants/${variant.id}/deactivate`,
      "PATCH",
      "Deactivating variants...",
      "Variants deactivated successfully!"
    );

  const handleBulkActivate = (input) =>
    performApiAction(
      input,
      (variant) =>
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${variant.product_id}/variants/${variant.id}/activate`,
      "PATCH",
      "Activating variants...",
      "Variants activated successfully!"
    );

  const handleToggleStatus = (variant) => {
    const action = variant.is_active ? "deactivate" : "activate";
    performApiAction(
      variant,
      (v) =>
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${v.product_id}/variants/${v.id}/${action}`,
      "PATCH",
      `${action === "activate" ? "Activating" : "Suspending"}...`,
      `Variant ${action}d successfully!`
    );
  };

  const handleAddClick = () => {
    setIsNavigating(true);
    router.push("/variants/new");
  };

  const handleEditClick = (variant) => {
    setIsNavigating(true);
    router.push(`/variants/edit?id=${variant.id}`);
  };

  const columns = useMemo(
    () =>
      getProductVariantColumns({
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
        onEdit: handleEditClick,
        canEdit,
        canDelete,
        canToggleStatus,
      }),
    [canEdit, canDelete, canToggleStatus, variants] // Added variants to dep array to ensure closure freshness
  );

  const bulkActionsComponent = useMemo(
    () => (
      <VariantBulkActions
        onDelete={handleDelete}
        onDeactivate={handleBulkDeactivate}
        onActivate={handleBulkActivate}
        table={null}
      />
    ),
    [handleDelete, handleBulkDeactivate, handleBulkActivate]
  );

  const sortedVariants = useMemo(() => {
    let result = [...variants];
    if (sortValue === "newest") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortValue === "oldest") {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortValue === "price_asc") {
      result.sort((a, b) => parseFloat(a.price || a.selling_price || 0) - parseFloat(b.price || b.selling_price || 0));
    } else if (sortValue === "price_desc") {
      result.sort((a, b) => parseFloat(b.price || b.selling_price || 0) - parseFloat(a.price || a.selling_price || 0));
    }
    return result;
  }, [variants, sortValue]);

  const sortOptions = [
    { label: "Newest", value: "newest" },
    { label: "Oldest", value: "oldest" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
  ];

  return (
    <div className="relative min-h-screen w-full bg-background">
      <div className="fixed inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(0,0,0,0))]"></div>
      </div>

      <ResourceManagementLayout
        data={sortedVariants}
        isLoading={loading || status === "loading"}
        loadingSkeleton={<ProductSkeleton />}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchVariants}
        headerTitle={<HeaderContent />}
        addButtonLabel="Add Variant"
        onAddClick={canCreate ? handleAddClick : null}
        isAdding={isNavigating}
        bulkActionsComponent={bulkActionsComponent}
        columns={columns}
        searchColumn="search_text"
        searchPlaceholder="Search by SKU, Name, Code..."
        filterComponents={(table) => <VariantFilters table={table} />}
        sortOptions={sortOptions}
        sortValue={sortValue}
        onSortChange={setSortValue}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        renderGridItem={(row) => (
          <VariantGridCard
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
    </div>
  );
}
