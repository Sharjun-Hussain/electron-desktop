"use client";

import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react";
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
import Link from "next/link";
import { format } from "@/lib/date-utils";

// Helper for Currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
  }).format(parseFloat(amount || 0));
};

const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="hover:bg-emerald-500/5 -ml-4 h-10 transition-colors"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
    </Button>
  );
};

export const getColumns = () => [
  {
    accessorKey: "return_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Return Number" />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-emerald-600 text-[13px]">
        {row.getValue("return_number")}
      </span>
    ),
  },
  {
    accessorKey: "supplier.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supplier" />
    ),
    cell: ({ row }) => {
      const name = row.original.supplier?.name || "Unknown";
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground text-[13px]">{name}</span>
          <span className="text-[10px] font-medium text-muted-foreground">Verified Supplier</span>
        </div>
      );
    },
  },
  {
    accessorKey: "return_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Return Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("return_date");
      if (!date) return "-";
      return <span className="text-[13px] font-medium text-foreground/80">{format(new Date(date), "MMM dd, yyyy")}</span>;
    },
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Amount" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col items-start gap-0.5">
        <div className="font-semibold text-emerald-700 text-[13px]">{formatCurrency(row.getValue("total_amount"))}</div>
        <div className="text-[9px] font-medium text-emerald-600/50">Total Value</div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge value={row.getValue("status")} />,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-emerald-500/5 transition-all" asChild>
        <Link href={`/purchase/returns/${row.original.id}`}>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </Link>
      </Button>
    ),
  },
];
