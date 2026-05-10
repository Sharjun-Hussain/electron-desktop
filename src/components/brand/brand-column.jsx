// app/brands/brand-columns.tsx
"use client";

import { ArrowUpDown, MoreHorizontal, Tag, Trash2 } from "lucide-react";
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
import Link from "next/link";
import { cn } from "@/lib/utils";

// Reusable Header Component
const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 text-slate-500/90 dark:text-zinc-400 font-semibold text-sm h-8 px-2 -ml-2 transition-all duration-300 group"
    >
      <ArrowUpDown className="mr-2 h-3 w-3 text-slate-300 dark:text-zinc-600 group-hover:text-emerald-500 transition-colors" />
      {title}
    </Button>
  );
};

export const getBrandColumns = ({
  onDelete,
  onToggleStatus,
  onEdit,
  canEdit = false,
  canDelete = false,
  canToggleStatus = false,
}) => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Brand" />
    ),
    cell: ({ row }) => {
      const brand = row.original;
      const initials = brand.name.substring(0, 2).toUpperCase();
      
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="size-9 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm shadow-emerald-500/5 transition-transform hover:scale-105">
            <span className="text-sm font-bold text-emerald-600 ">{initials}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground  truncate leading-tight">{brand.name}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description");
      return (
        <div className="max-w-[300px] truncate text-sm font-medium text-muted-foreground/60 italic leading-relaxed">
          {description || "Awaiting catalog details..."}
        </div>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active");
      return (
        <StatusBadge 
          value={isActive ? "active" : "inactive"} 
          className="animate-in fade-in zoom-in duration-300"
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const brand = row.original;

      if (!canEdit && !canDelete && !canToggleStatus) return null;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-8 p-0 hover:bg-emerald-500/5 rounded-full group transition-all">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-4 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-md border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-2 animate-in slide-in-from-top-2 duration-200">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground/40">Authority Actions</DropdownMenuLabel>

            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(brand)} className="cursor-pointer rounded-md px-3 py-2 focus:bg-emerald-500/10 focus:text-emerald-600 group transition-all">
                <div className="flex items-center gap-3">
                  <Tag className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold ">Edit Brand</span>
                </div>
              </DropdownMenuItem>
            )}

            {canToggleStatus && (
              <DropdownMenuItem
                className="cursor-pointer rounded-md px-3 py-2 focus:bg-emerald-500/10 focus:text-emerald-600 group transition-all"
                onClick={() => onToggleStatus(brand)}
              >
                <div className="flex items-center gap-3">
                  <ArrowUpDown className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold ">
                    {brand.is_active ? "Suspend Brand" : "Activate Brand"}
                  </span>
                </div>
              </DropdownMenuItem>
            )}

            {canDelete && (
              <>
                <DropdownMenuSeparator className="bg-border/40 my-1" />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-500/10 cursor-pointer rounded-md px-3 py-2 group transition-all"
                  onClick={() => onDelete(brand.id)}
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold ">Delete Brand</span>
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
