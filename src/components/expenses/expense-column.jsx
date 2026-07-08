"use client";

import Link from "next/link";

import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

export const getExpenseColumns = ({ onEdit, onDelete, onView, formatCurrency }) => [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const dateVal = row.getValue("date") || row.original.expense_date;
      if (!dateVal) return <div className="text-[13px] font-medium text-foreground/40">-</div>;
      
      const dateObj = new Date(dateVal);
      const isInvalid = isNaN(dateObj.getTime());
      
      return (
        <div className="text-[13px] font-medium text-foreground/80">
          {isInvalid ? "-" : format(dateObj, "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    accessorKey: "category_name",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-[10px] font-bold border-border/40 bg-muted/20 text-muted-foreground uppercase tracking-widest px-3 py-1">
        {row.getValue("category_name") || row.original.category?.name || "Uncategorized"}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return (
        <div className="flex flex-col items-start gap-0.5">
          <div className="font-semibold text-red-600 text-[13px] tabular-nums">{formatCurrency ? formatCurrency(amount) : amount}</div>
          <div className="text-[9px] font-medium text-red-600/40 uppercase tracking-widest">Expenditure</div>
        </div>
      );
    },
  },
  {
    accessorKey: "payment_method",
    header: "Payment Method",
    cell: ({ row }) => (
      <div className="text-[12px] font-bold text-muted-foreground/70 uppercase tracking-tight">
        {row.getValue("payment_method") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "reference_no",
    header: "Reference Number",
    cell: ({ row }) => (
      <div className="text-[11px] font-bold text-[#10b981] tabular-nums tracking-widest">
        {row.getValue("reference_no") || "-"}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/expenses/${expense.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-emerald-500/5 transition-all">
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <Link href={`/expenses/${expense.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-emerald-500/5 transition-all text-[#10b981]">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-red-500/5 transition-all text-red-500" onClick={() => onDelete(expense.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
