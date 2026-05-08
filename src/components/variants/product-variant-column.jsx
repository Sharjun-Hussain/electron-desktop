"use client";

import { ArrowUpDown, MoreHorizontal, Copy, ImageIcon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// Helper to copy text
const copyToClipboard = (text, label) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
};

const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="hover:bg-muted/50 dark:hover:bg-muted text-muted-foreground font-semibold text-sm h-8 px-2 -ml-2 transition-all duration-300 group"
    >
      <ArrowUpDown className="mr-2 h-3 w-3 text-muted-foreground/50 group-hover:text-emerald-500 transition-colors" />
      {title}
    </Button>
  );
};

export const getProductVariantColumns = ({
  onDelete,
  onToggleStatus,
  onEdit,
  canEdit = false,
  canDelete = false,
  canToggleStatus = false,
}) => [
    {
      id: "select",
      header: null,
      cell: ({ row }) => (
        <div className="flex items-center justify-center w-5 mr-0 pr-0">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      size: 40,
      enableSorting: false,
      enableHiding: false,
    },
    // --- 1. HIDDEN SEARCH COLUMN (Required for search) ---
    {
      accessorKey: "search_text",
      header: null,
      cell: null,
      enableHiding: true, // Hide from view
      filterFn: "includesString",
    },
    {
      accessorKey: "sku",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Variant Asset" />
      ),
      cell: ({ row }) => {
        const variant = row.original;
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

        const imageUrl = getImageUrl(variant.image || variant.parent_image);

        return (
          <div className="flex items-center gap-3 py-0.5 w-[350px] max-w-[350px]">
            <Avatar className="h-9 w-9 border border-border/40 rounded-lg bg-muted/30 shadow-sm shrink-0">
              <AvatarImage src={imageUrl} alt={variant.sku} className="object-cover" />
              <AvatarFallback className="rounded-lg bg-muted">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/30" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 leading-tight">
              <div className="text-foreground text-[13px] font-bold truncate">
                {variant.sku}
              </div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-60 truncate">
                {variant.parent_product_name}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "attribute_values",
      header: "Specifications",
      cell: ({ row }) => {
        const variant = row.original;
        return (
          <div className="flex flex-wrap gap-1.5 max-w-[250px]">
            {variant.attribute_values?.length > 0 ? (
              variant.attribute_values.map((av, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs px-2.5 py-0.5 h-6 font-bold bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 rounded-md">
                  {av.value}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground/40 italic font-medium">Standard</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "identifiers",
      header: "Identifiers",
      cell: ({ row }) => {
        const { code, barcode } = row.original;
        return (
          <div className="flex flex-col gap-1.5">
            {code && (
              <span className=" bg-muted/50 px-2 py-0.5 rounded-md border border-border/40 w-fit">
                Code :    {code}
              </span>
            )}
            {barcode && (
              <span className=" text-emerald-600/70 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10 w-fit flex items-center gap-1.5">

                Barcode :   {barcode}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return <StatusBadge value={isActive} />;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const variant = row.original;
        if (!canEdit && !canDelete && !canToggleStatus) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600 transition-all group">
                <MoreHorizontal className="h-4.5 w-4.5 opacity-40 group-hover:opacity-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => copyToClipboard(variant.sku, "SKU")}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy SKU
              </DropdownMenuItem>

              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(variant)}>
                  Edit Variant
                </DropdownMenuItem>
              )}

              {(canDelete || canToggleStatus) && <DropdownMenuSeparator />}

              {canToggleStatus && (
                <DropdownMenuItem onClick={() => onToggleStatus(variant)}>
                  {variant.is_active ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
              )}

              {canDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700"
                  onClick={() => onDelete(variant)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
