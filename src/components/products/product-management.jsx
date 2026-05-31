"use client";

// ----------------------------------------------------------------------
// 1. Imports
// ----------------------------------------------------------------------
import { useState, useEffect, useCallback, useMemo } from "react";
import React from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag, Barcode, DollarSign, Layers, Info } from "lucide-react";

// UI Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import {
  Trash2,
  Package,
  PlusCircle,
  Loader2,
  PackagePlus,
  RefreshCw,
  Printer,
  Edit3,
  ShieldCheck,
  MoreHorizontal,
  FileSpreadsheet,
} from "lucide-react";

// Custom Components & Hooks
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { usePermission } from "@/hooks/use-permission";
import {
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getProductColumns } from "./product-column";
import ProductSkeleton from "@/app/skeletons/products/product-listing-skeleton";
import { OpeningStockSheet } from "./OpeningStockSheet";
import { OpeningStockImportDialog } from "./import/OpeningStockImportDialog";
import { BarcodeGenerator } from "./barcode-generator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// 2. Helper Components
// ----------------------------------------------------------------------

const ProductDetailSheet = ({ product, isOpen, onClose }) => {
  if (!product) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl w-[95vw] p-0 overflow-hidden flex flex-col rounded-l-3xl border-none shadow-2xl">
        <SheetHeader className="p-8 pb-6 bg-linear-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner shrink-0">
              <Package className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-1 overflow-hidden">
              <SheetTitle className="text-2xl font-bold text-foreground tracking-tight uppercase truncate">
                {product.name}
              </SheetTitle>
              <SheetDescription className="text-sm font-medium opacity-60 flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                  {product.main_category?.name || "General"}
                </Badge>
                {product.brand?.name && (
                  <Badge variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-500/20">
                    {product.brand.name}
                  </Badge>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-8 pb-8 no-scrollbar">
          <div className="space-y-8 py-4">
            {/* General Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <Info className="h-4 w-4" />
                <h4 className="text-xs font-bold uppercase tracking-widest">General Information</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Base SKU</p>
                  <p className="text-sm font-mono font-bold text-foreground">{product.sku || "N/A"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Unit Type</p>
                  <p className="text-sm font-bold text-foreground">{product.unit?.name || "Standard"}</p>
                </div>
              </div>
              {product.description && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Description</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>

            {/* Variants Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <Layers className="h-4 w-4" />
                <h4 className="text-xs font-bold uppercase tracking-widest">Variants & Pricing</h4>
              </div>
              
              <div className="space-y-3">
                {product.variants?.map((v, idx) => {
                  const variantTitle = v.name || 
                    (v.attribute_values?.length > 0 
                      ? v.attribute_values.map(av => av.value).join(", ") 
                      : `Variant ${v.barcode || idx + 1}`);

                  return (
                    <div key={v.id} className="p-5 rounded-3xl border border-border/60 bg-card hover:border-emerald-500/30 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-emerald-500" />
                            {variantTitle}
                          </p>
                        <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                          <Barcode className="h-3 w-3" />
                          {v.barcode || "No Barcode"}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/10 font-bold">
                        {v.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10">
                        <p className="text-[9px] font-bold text-emerald-600/70 uppercase mb-1 flex items-center gap-1">
                          <DollarSign className="h-2.5 w-2.5" /> Retail Price
                        </p>
                        <p className="text-lg font-bold text-emerald-600 font-mono">
                          LKR {parseFloat(v.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10">
                        <p className="text-[9px] font-bold text-blue-600/70 uppercase mb-1 flex items-center gap-1">
                          <DollarSign className="h-2.5 w-2.5" /> Wholesale Price
                        </p>
                        <p className="text-lg font-bold text-blue-600 font-mono">
                          LKR {parseFloat(v.wholesale_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {v.attribute_values && v.attribute_values.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {v.attribute_values.map((av, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-muted text-muted-foreground text-[10px] font-bold rounded-lg border-none">
                            {av.attribute?.name}: {av.value}
                          </Badge>
                        ))}
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/**
 * Renders the Title and Icon for the page header.
 */
const HeaderContent = React.memo(({ total }) => (
  <div className="flex items-center gap-4">
    <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
      <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white  leading-none">
          Inventory Catalog
        </h1>
        {total > 0 && (
          <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-none rounded-full">
            {total} Products
          </Badge>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5  opacity-70">
        Master Structural Audit & Stock Control
      </p>
    </div>
  </div>
));

const ProductBulkActions = React.memo(({ table, onDelete, onDeactivate, onActivate, onPrint }) => {
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
        className="text-sm font-medium rounded-lg"
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
});

/**
 * Helper to get initials from name
 */
const getInitials = (name) => {
  if (!name) return "P";
  const words = name.trim().split(/\s+/);
  return words.length > 1
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};



/**
 * Renders a single product card for the Grid View
 */
const ProductGridCard = ({ row, onEdit, onDelete, onToggleStatus, onPrintBarcode, onViewVariants, canEdit, canDelete, canToggleStatus }) => {
  const product = row.original;
  const isSelected = row.getIsSelected();

  let imagePath = null;
  if (product.image) {
    try {
      const images = JSON.parse(product.image);
      if (Array.isArray(images) && images.length > 0) imagePath = images[0];
    } catch (e) {
      imagePath = product.image;
    }
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
  const baseUrl = apiBaseUrl.replace(/\/api\/v[0-9]+/, "");
  const imageUrl = imagePath ? `${baseUrl}/${imagePath}` : null;
  const initials = getInitials(product.name);

  return (
    <div
      onClick={() => onViewVariants(product)}
      className={cn(
        "group relative flex flex-col gap-4 p-5 rounded-[24px] border transition-all duration-300 cursor-pointer",
        isSelected
          ? "bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
          : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/60 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1"
      )}
    >
      {/* Top Action Bar */}
      <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
          className="h-4.5 w-4.5 rounded-lg border-slate-300 dark:border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 transition-all"
        />

        <div className="flex items-center gap-2">
          <StatusBadge value={product.is_active} className="text-xs font-bold  h-5 px-2 rounded-full border-none shadow-none" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-md border-border shadow-2xl p-2 animate-in zoom-in-95">
              <DropdownMenuItem onClick={() => onEdit(product)} className="rounded-md px-3 py-2 focus:bg-slate-50 dark:focus:bg-slate-900 cursor-pointer flex items-center gap-3">
                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Edit Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onPrintBarcode(product)} 
                disabled={!product.variants || product.variants.length === 0}
                className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Print Label</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 opacity-50" />
              <DropdownMenuItem onClick={() => onToggleStatus(product)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{product.is_active ? "Suspend" : "Activate"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(product.id)} className="rounded-md px-3 py-2 cursor-pointer flex items-center gap-3 text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Visual Identity */}
      <div className="flex flex-col items-center text-center mt-2 gap-3">
        <div className="relative">
          <Avatar className="h-20 w-20 ring-4 ring-slate-50 dark:ring-slate-800/50 shadow-inner group-hover:scale-110 transition-transform duration-500 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            {imageUrl && <AvatarImage src={imageUrl} alt={product.name} className="object-cover" />}
            <AvatarFallback className="text-slate-300 dark:text-slate-600 font-bold text-xl bg-transparent">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!product.is_active && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white dark:border-zinc-950 rounded-full animate-pulse shadow-sm" />
          )}
        </div>

        <div className="flex flex-col items-center text-center mt-2 gap-3 px-2">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight  line-clamp-2 group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>
        </div>
      </div>

      {/* Metadata Badges */}
      <div className="mt-auto pt-4 flex flex-wrap justify-center gap-1.5 border-t border-slate-50 dark:border-slate-800/50">
        <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 font-bold  bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-none">
          {product.main_category?.name ?? "General"}
        </Badge>
        <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 font-bold  border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
          {product.unit?.name ?? "Units"}
        </Badge>
        {product.variants?.length > 0 && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 font-bold  border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/5">
            {product.variants.length} Variant{product.variants.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. Main Page Component
// ----------------------------------------------------------------------

export default function ProductsPage() {
  // --- State ---
  const [isNavigating, setIsNavigating] = useState(false);
  const [products, setProducts] = useState([]);
  const [allProductsForExport, setAllProductsForExport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openingStockOpen, setOpeningStockOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Barcode State
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [barcodeData, setBarcodeData] = useState(null);

  // Pagination State
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [pageCount, setPageCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  // Search State
  const [search, setSearch] = useState("");
  // Already debounced in toolbar, so we keep this minimal
  const debouncedSearch = useDebounce(search, 100);

  // Delete confirm state
  const [deleteIds, setDeleteIds] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Detail Sheet State
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [productForDetail, setProductForDetail] = useState(null);

  const [viewMode, setViewMode] = useState("list");
  const [sortValue, setSortValue] = useState("newest");

  // --- Hooks ---
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();

  // --- Authentication Guard ---
  const canCreate = hasPermission(PERMISSIONS.PRODUCT_CREATE);
  const canEdit = hasPermission(PERMISSIONS.PRODUCT_EDIT);
  const canDelete = hasPermission(PERMISSIONS.PRODUCT_DELETE);
  const canToggleStatus = hasPermission(PERMISSIONS.PRODUCT_EDIT);

  // --- Authentication Guard ---
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // --- Data Fetching ---
  const fetchAllProductsForExport = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const params = new URLSearchParams({
        page: "1",
        size: "10000",
        is_variant: "0"
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          setAllProductsForExport(data.data.data || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [session?.accessToken]);

  const fetchProducts = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        size: pagination.pageSize.toString(),
        is_variant: '0'
      });

      const sortMap = {
        newest: { sort_by: "created_at", order: "DESC" },
        oldest: { sort_by: "created_at", order: "ASC" },
        name_asc: { sort_by: "name", order: "ASC" },
        name_desc: { sort_by: "name", order: "DESC" },
      };
      const { sort_by, order } = sortMap[sortValue] || sortMap.newest;
      params.append("sort_by", sort_by);
      params.append("order", order);

      if (debouncedSearch) {
        params.append("name", debouncedSearch);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );

      if (!response.ok) throw new Error("Synchronization failure: Catalog inaccessible");
      const data = await response.json();

      if (data.status === "success") {
        const productList = data.data.data || [];
        const productsWithSearch = productList.map(p => ({
          ...p,
          searchText: `${p.name || ""} ${p.sku || ""} ${p.code || ""} ${p.barcode || ""}`.toLowerCase()
        }));
        setProducts(productsWithSearch);
        // Handle metadata from backend
        if (data.data.pagination) {
          setPageCount(data.data.pagination.pages || 0);
          setTotalProducts(data.data.pagination.total || 0);
        }
        // Fetch all products for export in background
        fetchAllProductsForExport();
      } else {
        throw new Error(data.message || "Failed to parse structural index");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, pagination.pageIndex, pagination.pageSize, debouncedSearch, sortValue, fetchAllProductsForExport]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProducts();
    }
  }, [status, fetchProducts]);

  // Handle Search Change (triggers debouncedSearch)
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to page 1 on search
  }, []);

  // --- API Actions ---
  const performApiAction = async (
    ids,
    urlFn,
    method,
    loadingMsg,
    successMsg
  ) => {
    const idArray = Array.isArray(ids) ? ids : [ids];

    toast.promise(
      Promise.all(
        idArray.map((id) =>
          fetch(urlFn(id), {
            method,
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          })
        )
      ),
      {
        loading: loadingMsg,
        success: () => {
          fetchProducts();
          return successMsg;
        },
        error: "Structural baseline failure: Action aborted",
      }
    );
  };

  const handleDelete = useCallback(
    (ids) => {
      setDeleteIds(Array.isArray(ids) ? ids : [ids]);
      setShowDeleteConfirm(true);
    },
    []
  );

  const confirmDelete = async () => {
    if (!deleteIds) return;

    performApiAction(
      deleteIds,
      (id) => `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${id}`,
      "DELETE",
      "De-allocating assets...",
      "Logical assets removed successfully"
    );

    setShowDeleteConfirm(false);
    setDeleteIds(null);
  };

  const handleBulkDeactivate = useCallback(
    (ids) => {
      performApiAction(
        ids,
        (id) =>
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${id}/deactivate`,
        "PATCH",
        "Suspending assets...",
        "Structural batch deactivated"
      );
    },
    [session, fetchProducts]
  );

  const handleBulkActivate = useCallback(
    (ids) => {
      performApiAction(
        ids,
        (id) =>
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${id}/activate`,
        "PATCH",
        "Activating assets...",
        "Structural batch synchronized online"
      );
    },
    [session, fetchProducts]
  );

  const handleToggleStatus = useCallback(
    async (product) => {
      const action = product.is_active ? "deactivate" : "activate";
      performApiAction(
        product.id,
        (id) =>
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${id}/${action}`,
        "PATCH",
        `${action === "activate" ? "Connecting" : "Suspending"}...`,
        `Asset ${product.name} protocol updated`
      );
    },
    [session, fetchProducts]
  );

  // --- Navigation Handlers ---

  const handleAddClick = useCallback(() => {
    setIsNavigating(true);
    router.push("/products/new");
  }, [router]);

  const handleEditClick = useCallback(
    (product) => {
      setIsNavigating(true);
      router.push(`/products/edit?id=${product.id}`);
    },
    [router]
  );

  const handlePrintBarcode = useCallback(async (productOrItems) => {
    const items = Array.isArray(productOrItems) ? productOrItems : [productOrItems];
    if (items.length === 0) return;

    const base = items[0];
    
    // Fetch product variants
    let variants = [];
    try {
      const toastId = toast.loading("Fetching product variants...");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${base.id}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      const resData = await res.json();
      toast.dismiss(toastId);
      
      if (resData.status === "success" && resData.data && resData.data.variants) {
        variants = resData.data.variants;
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to load variants");
    }

    const barcodeItems = variants.length > 0 ? variants.map(v => {
      // Create a composite name if the variant has attributes
      let variantName = base.name;
      if (v.attribute_values && v.attribute_values.length > 0) {
        variantName += ' - ' + v.attribute_values.map(av => av.value).join(', ');
      }
      return {
        id: v.id,
        title: variantName,
        barcodeValue: v.sku || v.barcode || base.sku || base.code || v.id.substring(0,8),
        price: v.selling_price || base.selling_price ? `${Number(v.selling_price || base.selling_price).toFixed(2)}` : "",
        size: base.unit?.name || "",
      };
    }) : [{
      id: base.id,
      title: base.name,
      barcodeValue: base.sku || base.code || base.id.substring(0,8),
      price: base.selling_price ? `${Number(base.selling_price).toFixed(2)}` : "",
      size: base.unit?.name || "",
    }];

    setBarcodeData({
      id: barcodeItems[0].id,
      title: barcodeItems[0].title,
      barcodeValue: barcodeItems[0].barcodeValue,
      price: barcodeItems[0].price,
      size: barcodeItems[0].size,
      isPreset: true,
      items: barcodeItems 
    });
    setBarcodeOpen(true);
  }, [session?.accessToken]);

  const handleViewVariants = (product) => {
    setProductForDetail(product);
    setIsDetailSheetOpen(true);
  };

  // --- Memoized Table Config ---
  const columns = useMemo(
    () =>
      getProductColumns({
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
        onEdit: handleEditClick,
        onPrintBarcode: handlePrintBarcode,
        onViewVariants: handleViewVariants,
        canEdit,
        canDelete,
        canToggleStatus,
      }),
    [
      handleDelete,
      handleToggleStatus,
      handleEditClick,
      handlePrintBarcode,
      canEdit,
      canDelete,
      canToggleStatus,
    ]
  );

  const bulkActionsComponent = useMemo(
    () => (
      <ProductBulkActions
        onDelete={handleDelete}
        onDeactivate={handleBulkDeactivate}
        onActivate={handleBulkActivate}
        onPrint={handlePrintBarcode}
        table={null} // Table instance will be injected by the Layout
      />
    ),
    [handleDelete, handleBulkDeactivate, handleBulkActivate, handlePrintBarcode]
  );



  const sortOptions = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
    { label: "Name (A-Z)", value: "name_asc" },
    { label: "Name (Z-A)", value: "name_desc" },
  ];

  // --- Render ---
  return (
    <div id="inventory-grid" className="animate-in fade-in duration-700">
      <ResourceManagementLayout
        // Data & Status
        data={products}
        exportData={allProductsForExport}
        exportFileName="Product_Catalog_Archive"
        isLoading={loading || status === "loading"}
        loadingSkeleton={<ProductSkeleton />}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchProducts}

        // Header
        headerTitle={<HeaderContent total={totalProducts} />}

        // Actions
        addButtonLabel="New Product"
        onAddClick={canCreate ? handleAddClick : null}
        isAdding={isNavigating}
        bulkActionsComponent={bulkActionsComponent}
        extraActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="px-6 gap-2 border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:-translate-y-0.5 transition-all duration-300 border-dashed rounded-md font-bold text-sm"
              onClick={() => setImportDialogOpen(true)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden lg:inline text-xs ">Import Catalog</span>
            </Button>
            
            <Button
              id="inventory-opening-stock"
              variant="outline"
              className="px-6 gap-2 border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:-translate-y-0.5 transition-all duration-300 border-dashed rounded-md font-bold text-sm"
              onClick={() => setOpeningStockOpen(true)}
            >
              <PackagePlus className="h-4 w-4" />
              <span className="hidden md:inline text-xs ">Initialize Opening Stock</span>
            </Button>
          </div>
        }

        // Table Config
        columns={columns}
        initialColumnVisibility={useMemo(() => ({
          sku: false,
          barcode: false,
          stock: false,
          wholesale_price: false,
          status: false,
          unit: false,
          searchText: false,
        }), [])}
        searchColumn="searchText"
        searchPlaceholder="Find assets by name, sku or barcode..."
        onSearchChange={handleSearchChange} // Important for server-side search

        // Server-side Pagination
        pageCount={pageCount}
        paginationState={pagination}
        onPaginationChange={setPagination}

        // Sort & View
        sortOptions={sortOptions}
        sortValue={sortValue}
        onSortChange={(val) => {
          setSortValue(val);
          setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        renderGridItem={(row) => (
          <ProductGridCard
            row={row}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onPrintBarcode={handlePrintBarcode}
            onViewVariants={handleViewVariants}
            canEdit={canEdit}
            canDelete={canDelete}
            canToggleStatus={canToggleStatus}
          />
        )}
      >
        <OpeningStockSheet
          open={openingStockOpen}
          onOpenChange={setOpeningStockOpen}
          accessToken={session?.accessToken}
        />

        <OpeningStockImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          accessToken={session?.accessToken}
          onSuccess={fetchProducts}
        />

        <Sheet open={barcodeOpen} onOpenChange={setBarcodeOpen}>
          <SheetContent className="sm:max-w-[1240px] p-0 border-none bg-slate-50 dark:bg-slate-950 overflow-y-auto">
            <div className="flex flex-col h-full">
              {/* Workspace Header */}
              <div className="px-4 py-3 border-b bg-white dark:bg-slate-900 sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                    <Printer className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white  leading-none">
                      Barcode generator
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      Configure and print labels for batch inventory
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="px-2 text-xs font-bold text-slate-400 dark:text-slate-500 ">
                    Roll & A4 Support
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                <BarcodeGenerator
                  data={barcodeData}
                  onDataChange={setBarcodeData}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[28px] p-8 max-w-md">
            <AlertDialogHeader>
              <div className="w-12 h-12 rounded-md bg-rose-500/10 flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-center text-slate-900 dark:text-slate-100 ">Confirm data de-allocation</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-center text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-2">
                You are about to permanently remove {deleteIds?.length > 1 ? ` selected ${deleteIds.length} assets` : " the specified asset"} from the master structural index. This action is irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 sm:justify-center gap-3">
              <AlertDialogCancel
                onClick={() => setDeleteIds(null)}
                className="rounded-md border-slate-200 dark:border-slate-800 px-8 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                Abort Action
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-md px-8 font-bold text-sm border-none shadow-lg shadow-rose-600/20 transition-all active:scale-95"
              >
                Execute Removal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ProductDetailSheet 
          product={productForDetail}
          isOpen={isDetailSheetOpen}
          onClose={() => setIsDetailSheetOpen(false)}
        />
      </ResourceManagementLayout>
    </div>
  );
}
