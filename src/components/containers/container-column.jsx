// app/containers/container-columns.tsx
"use client";

import { ArrowUpDown, MoreHorizontal, Package, Box, Scale, Trash2 } from "lucide-react";
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

export const getContainerColumns = ({ onDelete, onToggleStatus, onEdit }) => [
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
      <DataTableColumnHeader column={column} title="Container name" />
    ),
    cell: ({ row }) => {
      const container = row.original;
      const initials = container.name.substring(0, 2).toUpperCase();

      return (
        <div className="flex items-center gap-3 py-1">
          <div className="size-9 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm shadow-emerald-500/5 transition-transform hover:scale-105">
            <span className="text-xs font-bold text-emerald-600 ">{initials}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground  truncate leading-tight">{container.name}</span>
            <span className="text-xs font-medium text-muted-foreground/40 mt-0.5 truncate">{container.slug || "CONT_0"}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "base_unit.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Base unit" />
    ),
    cell: ({ row }) => {
      const baseUnit = row.original.base_unit;

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Box className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-900 dark:text-foreground leading-tight">{baseUnit?.name || "N/A"}</div>
            <div className="text-xs   font-bold text-slate-400 dark:text-muted-foreground mt-0.5">
              {baseUnit?.short_name || "No identifier"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "measurement_unit.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Measurement unit" />
    ),
    cell: ({ row }) => {
      const measurementUnit = row.original.measurement_unit;

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Scale className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-900 dark:text-foreground leading-tight">
              {measurementUnit?.name || "N/A"}
            </div>
            <div className="text-xs   font-bold text-slate-400 dark:text-muted-foreground mt-0.5">
              {measurementUnit?.short_name || "No identifier"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "capacity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Capacity" />
    ),
    cell: ({ row }) => {
      const container = row.original;
      const measurementUnit = container.measurement_unit;

      return (
        <div className="text-center bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border/50 py-1.5 px-3 rounded-md w-max mx-auto shadow-sm">
          <div className="font-semibold text-slate-900 dark:text-foreground text-sm">{container.capacity}</div>
          <div className="text-xs   font-bold text-slate-500 dark:text-muted-foreground mt-0.5">
            {measurementUnit?.short_name || "Units"}
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
        <div className="max-w-[200px] xl:max-w-[300px] truncate text-sm italic text-slate-400 font-medium py-2">
          {description || "No description provided..."}
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
        <div className="flex items-center justify-end pr-2">
          <StatusBadge value={isActive} className="border-none shadow-none font-semibold text-sm" />
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const container = row.original;

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

            <DropdownMenuItem onClick={() => onEdit(container)} className="cursor-pointer rounded-md px-3 py-2 focus:bg-emerald-500/10 focus:text-emerald-600 group transition-all">
              <div className="flex items-center gap-3">
                <Package className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold ">Edit Container</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer rounded-md px-3 py-2 focus:bg-emerald-500/10 focus:text-emerald-600 group transition-all"
              onClick={() => onToggleStatus(container)}
            >
              <div className="flex items-center gap-3">
                <ArrowUpDown className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold ">
                  {container.is_active ? "Suspend Container" : "Activate Container"}
                </span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border/40 my-1" />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700 focus:bg-red-500/10 cursor-pointer rounded-md px-3 py-2 group transition-all"
              onClick={() => onDelete(container.id)}
            >
              <div className="flex items-center gap-3">
                <Trash2 className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold ">Delete Container</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
