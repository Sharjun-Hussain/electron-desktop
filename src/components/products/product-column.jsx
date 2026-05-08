"use client";

import { ArrowUpDown, MoreHorizontal, Edit3, Trash2, ShieldCheck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

// --- Constants & Helpers (Moved outside render cycle for performance) ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
const BASE_URL = API_BASE_URL.replace(/\/api\/v[0-9]+/, "");

const getInitials = (name) => {
  if (!name) return "P";
  const words = name.trim().split(/\s+/);
  return words.length > 1
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const getPrimaryImage = (imageString) => {
  if (!imageString) return null;

  let imagePath = imageString;
  // Fast check to avoid expensive try/catch if it's clearly not JSON
  if (typeof imageString === 'string' && imageString.startsWith('[')) {
    try {
      const images = JSON.parse(imageString);
      if (Array.isArray(images) && images.length > 0) imagePath = images[0];
    } catch (e) {
      // Silently fallback to raw string
    }
  }
  return `${BASE_URL}/${imagePath.replace(/^\//, '')}`; // Ensure no double slashes
};


// --- Reusable Components ---

const DataTableColumnHeader = ({ column, title, className }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className={cn(
        "hover:bg-slate-50 dark:hover:bg-zinc-900/50 text-slate-500/90 dark:text-zinc-400 font-semibold text-sm h-8 px-2 -ml-2 transition-all duration-300 group",
        className
      )}
    >
      {title}
      <ArrowUpDown className="ml-2 h-3 w-3 text-slate-300 dark:text-zinc-600 group-hover:text-emerald-500 transition-colors" />
    </Button>
  );
};


// --- Column Definition ---

export const getProductColumns = ({
  onDelete,
  onToggleStatus,
  onEdit,
  onPrintBarcode,
  onViewVariants,
  canEdit = false,
  canDelete = false,
  canToggleStatus = false,
}) => [
    {
      id: "select",
      // Added Select All functionality to the header
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px] transition-all"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => {
        const product = row.original;
        const imageUrl = getPrimaryImage(product.image);

        return (
          <div 
            className="flex items-center gap-3 py-1 group/item max-w-[250px] cursor-pointer"
            onClick={() => onViewVariants(product)}
          >
            <Avatar className="h-10 w-10 shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-transform duration-300 group-hover/item:scale-105 shadow-sm">
              {imageUrl && <AvatarImage src={imageUrl} alt={product.name} className="object-cover" />}
              <AvatarFallback className="text-slate-400 dark:text-slate-500 font-bold text-xs">
                {getInitials(product.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors">
                {product.name}
              </span>
              {/* Optional: Add SKU here if you have it in your data */}
              {product.sku && (
                <span className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                  SKU: {product.sku}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "main_category.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => {
        const product = row.original;
        const mainCat = product.main_category?.name;
        const subCat = product.sub_category?.name;

        if (!mainCat && !subCat) {
          return <span className="text-sm text-slate-400 italic">Uncategorized</span>;
        }

        return (
          <div className="flex flex-col gap-1.5 max-w-[160px] py-1">
            {/* 1. Main Category as a distinct Badge */}
            <Badge
              variant="outline"
              className="w-fit px-2 py-0 text-xs font-semibold bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 truncate"
            >
              {mainCat ?? "General"}
            </Badge>

            {/* 2. Sub Category with a visual tree-branch indent */}
            {subCat && (
              <div className="flex items-end gap-1.5 ml-2">
                {/* CSS-only L-shaped tree branch */}
                <div className="h-3 w-3 border-l-2 border-b-2 border-slate-300 dark:border-slate-700 rounded-bl-sm shrink-0 mb-1" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                  {subCat}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "variants",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Variants" />,
      cell: ({ row }) => {
        const variants = row.original.variants || [];
        const count = variants.length;
        if (count === 0) return <span className="text-sm text-slate-400">0 Variants</span>;
        
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 font-medium px-2 py-0 h-5">
            {count} Variant{count !== 1 ? 's' : ''}
          </Badge>
        );
      },
    },
    {
      accessorKey: "brand.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Brand" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-600 dark:text-zinc-400 max-w-[120px] truncate block">
          {row.original.brand?.name ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "unit.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Unit" />,
      cell: ({ row }) => (
        <div className="text-sm font-medium text-slate-500/80 dark:text-slate-400 italic">
          {row.original.unit?.name ?? "Unit"}
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <StatusBadge
          value={row.original.is_active}
          className="border-none shadow-none font-semibold text-sm"
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        if (!canEdit && !canDelete && !canToggleStatus) return null;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-[180px] rounded-xl p-1.5 shadow-lg border-slate-200 dark:border-slate-800">
                <DropdownMenuLabel className="px-2 py-1.5 text-sm font-bold text-slate-500">
                  Actions
                </DropdownMenuLabel>

                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(product)} className="rounded-lg px-2 py-2 cursor-pointer flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-sm">Edit Product</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem 
                  onClick={() => onPrintBarcode(product)} 
                  disabled={!product.variants || product.variants.length === 0}
                  className="rounded-lg px-2 py-2 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
                  <span className="font-medium text-sm">Print Barcode</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                {canToggleStatus && (
                  <DropdownMenuItem
                    className={cn(
                      "rounded-lg px-2 py-2 cursor-pointer flex items-center gap-2",
                      product.is_active ? "text-slate-600" : "text-emerald-600 focus:text-emerald-700"
                    )}
                    onClick={() => onToggleStatus(product)}
                  >
                    <ShieldCheck className={cn("h-4 w-4", !product.is_active ? "text-emerald-500" : "text-slate-400")} />
                    <span className="font-medium text-sm">{product.is_active ? "Suspend Asset" : "Activate Asset"}</span>
                  </DropdownMenuItem>
                )}

                {canDelete && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50 rounded-lg px-2 py-2 cursor-pointer flex items-center gap-2"
                    onClick={() => onDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium text-sm">Delete</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];