"use client";

import {
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Activity,
  CreditCard,
  CheckCircle2,
  XCircle
} from "lucide-react";
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
import { cn } from "@/lib/utils";

// Standardized Header Component
const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="hover:bg-muted/50 -ml-4 h-8 px-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground/60 transition-colors"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
    </Button>
  );
};

export const getSupplierColumns = ({ onDelete, onToggleStatus, onEdit, onViewLedger, onSettle, onViewDetails }) => [
  {
    id: "select",
    header: null,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supplier Entity" />
    ),
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div
          className="flex flex-col cursor-pointer group"
          onClick={() => onViewDetails(supplier)}
        >
          <span className="font-bold text-[13px] text-foreground group-hover:text-emerald-600 transition-colors">
            {supplier.name}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold mt-0.5 opacity-60">
            PID: #{String(supplier.id).substring(0, 8).toUpperCase()}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "contact_person",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Direct Representative" />
    ),
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="flex flex-col">
          <span className="text-[12px] font-bold text-foreground/80 uppercase tracking-tight">
            {supplier.contact_person || "Unassigned"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Account Access" />
    ),
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-black text-emerald-600 tabular-nums leading-none">
            {supplier.phone || "--- --- ----"}
          </span>
          {supplier.email && (
            <span className="text-[10px] font-bold text-muted-foreground opacity-60">
              {supplier.email}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "address",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Logistics Address" />
    ),
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <span
          className="text-[11px] font-medium text-muted-foreground/80 truncate max-w-[180px] inline-block"
          title={supplier.address}
        >
          {supplier.address || "No physical address provided"}
        </span>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Operational Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active");
      return (
        <div className="flex justify-center md:justify-start">
          <StatusBadge 
            value={isActive} 
            label={isActive ? "ACTIVE" : "SUSPENDED"}
          />
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-md border-border">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                Actions
              </DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => onEdit(supplier)}
                className="cursor-pointer text-sm font-medium"
              >
                <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                Edit Supplier
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onViewLedger(supplier)}
                className="cursor-pointer text-sm font-medium"
              >
                <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                View Ledger
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onSettle(supplier)}
                className="cursor-pointer text-sm font-medium"
              >
                <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                Record Payment
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer text-sm font-medium"
                onClick={() => onToggleStatus(supplier)}
              >
                {supplier.is_active ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4 text-amber-600" />
                    <span className="text-amber-600">Suspend Supplier</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-600">Activate Supplier</span>
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer text-sm font-medium text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-500/10 mt-1"
                onClick={() => onDelete(supplier.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Supplier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];