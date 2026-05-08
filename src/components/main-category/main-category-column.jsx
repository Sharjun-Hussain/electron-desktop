// app/main-categories/main-category-columns.tsx
"use client";

import { ArrowUpDown, MoreHorizontal, Folder, Trash2 } from "lucide-react";
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

export const getMainCategoryColumns = ({
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
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      const category = row.original;

      return (
        <div className="flex items-center gap-4 py-1">
          <div className="size-10 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm shadow-emerald-500/5 transition-transform hover:scale-105">
            <Folder className="size-5 text-emerald-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground  truncate leading-tight">{category.name}</span>
            <span className="text-xs font-semibold text-muted-foreground/50 mt-0.5 truncate">{category.slug || "No identifier"}</span>
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
      return <StatusBadge value={isActive} className="text-xs font-semibold h-6" />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original;

      // If no actions are allowed, don't render the menu
      if (!canEdit && !canDelete && !canToggleStatus) return null;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-8 p-0 hover:bg-emerald-500/5 rounded-full group transition-all">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-4 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-md border-border bg-card shadow-2xl p-1.5 transition-all duration-300">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground/70">Quick actions</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />

            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(category)} className="cursor-pointer rounded-md px-3 py-2 focus:bg-sidebar-accent group transition-all">
                <div className="flex items-center gap-3">
                  <Folder className="size-4 opacity-40 group-hover:scale-110 transition-transform text-foreground" />
                  <span className="text-sm font-semibold  text-foreground/80 group-focus:text-foreground">Edit details</span>
                </div>
              </DropdownMenuItem>
            )}

            {canToggleStatus && (
              <DropdownMenuItem
                className={cn(
                  "cursor-pointer rounded-md px-3 py-2 group transition-all focus:bg-sidebar-accent",
                  category.is_active ? "text-amber-600 focus:text-amber-700" : "text-emerald-600 focus:text-emerald-700"
                )}
                onClick={() => onToggleStatus(category)}
              >
                <div className="flex items-center gap-3">
                  <ArrowUpDown className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold ">
                    {category.is_active ? "Deactivate" : "Activate"}
                  </span>
                </div>
              </DropdownMenuItem>
            )}

            {canDelete && (
              <>
                <DropdownMenuSeparator className="bg-border/50 my-1" />
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-600 focus:bg-red-500/10 cursor-pointer rounded-md px-3 py-2 group transition-all"
                  onClick={() => onDelete(category.id)}
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold ">Delete category</span>
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
