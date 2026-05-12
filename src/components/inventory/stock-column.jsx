"use client";

import { Package, Warehouse, AlertCircle, SlidersHorizontal, MoreHorizontal, ArrowUpDown, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getImageUrl(imageField) {
  if (!imageField) return null;
  try {
    const images = typeof imageField === 'string' && imageField.startsWith('[') ? JSON.parse(imageField) : imageField;
    if (Array.isArray(images) && images.length > 0) {
      const path = images[0];
      if (path.startsWith("http")) return path;
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "");
      return `${baseUrl}/${encodeURI(path.replace(/\\/g, "/"))}`;
    }
    if (typeof imageField === "string") {
      if (imageField.startsWith("http")) return imageField;
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "");
      return `${baseUrl}/${encodeURI(imageField.replace(/\\/g, "/"))}`;
    }
  } catch (e) {
    if (typeof imageField === "string" && imageField.startsWith("http")) return imageField;
  }
  return null;
}

export const getStockColumns = ({ onAdjust, onViewBatches, hasEditPermission }) => [
  {
    accessorKey: "searchText",
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "product",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-9 hover:bg-emerald-500/5 group px-3 -ml-3"
      >
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-emerald-600 transition-colors">Product & Variant</span>
        <ArrowUpDown className="ml-2 size-3.5 text-muted-foreground/30 transition-colors group-hover:text-emerald-500/50" />
      </Button>
    ),
    cell: ({ row }) => {
      const stock = row.original;
      const resolvedImage = getImageUrl(stock.product?.image);
      const attributes = stock.variant?.attribute_values?.map(av => 
        `${av.attribute?.name}: ${av.value}`
      ).join(", ");

      return (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground overflow-hidden border border-border/40 shrink-0">
            {resolvedImage ? (
              <img
                src={resolvedImage}
                className="w-full h-full object-cover"
                alt={stock.product?.name}
              />
            ) : (
              <Package className="h-5 w-5 opacity-40" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-foreground text-[13px] leading-tight truncate">
                {stock.product?.name}
              </h4>
              {attributes && (
                <Badge
                  variant="outline"
                  className="text-[9px] h-4 font-semibold bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-1.5"
                >
                  {attributes}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-muted-foreground font-medium truncate">
                {stock.variant?.sku || stock.product?.code}
              </p>
              {stock.variant?.name && (
                <>
                  <span className="text-[10px] text-muted-foreground/30">•</span>
                  <p className="text-[10px] text-muted-foreground font-semibold truncate italic">
                    {stock.variant.name}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "branch",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-9 hover:bg-emerald-500/5 group px-3 -ml-3"
      >
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-emerald-600 transition-colors">Branch</span>
        <ArrowUpDown className="ml-2 size-3.5 text-muted-foreground/30 transition-colors group-hover:text-emerald-500/50" />
      </Button>
    ),
    cell: ({ row }) => {
      const stock = row.original;
      return (
        <div className="flex items-center gap-2">
          <Warehouse className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            {stock.branch?.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-9 hover:bg-emerald-500/5 group px-3 -mr-3"
        >
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-emerald-600 transition-colors">Inventory</span>
          <ArrowUpDown className="ml-2 size-3.5 text-muted-foreground/30 transition-colors group-hover:text-emerald-500/50" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const stock = row.original;
      const qty = parseFloat(stock.quantity);
      return (
        <div className="flex flex-col items-end">
          <span
            className={cn(
              "text-[13px] font-bold",
              qty <= 0
                ? "text-red-500"
                : qty <= 10
                ? "text-amber-500"
                : "text-emerald-600"
            )}
          >
            {qty.toFixed(2)}
          </span>
          {qty <= 0 && (
            <span className="text-[9px] text-red-500 font-semibold flex items-center gap-0.5">
              <AlertCircle className="h-2.5 w-2.5" /> Depleted
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const stock = row.original;

      if (!hasEditPermission) return null;

      return (
        <div className="flex justify-end pr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-2 animate-in slide-in-from-top-2 duration-200">
              <DropdownMenuItem
                onClick={() => onViewBatches(stock)}
                className="cursor-pointer rounded-xl px-3 py-2 focus:bg-indigo-500/10 focus:text-indigo-600 group transition-all"
              >
                <div className="flex items-center gap-3">
                  <Layers className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                  <span className="text-[12px] font-bold">View Batch Details</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onAdjust(stock)}
                className="cursor-pointer rounded-xl px-3 py-2 focus:bg-emerald-500/10 focus:text-emerald-600 group transition-all"
              >
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                  <span className="text-[12px] font-bold">Adjust Inventory</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
