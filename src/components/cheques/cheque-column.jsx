"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash, Eye, CheckCircle, XCircle } from "lucide-react";
import { format } from "@/lib/date-utils";

export const getChequeColumns = ({ onUpdateStatus, onDelete, onView }) => [
  {
    accessorKey: "cheque_number",
    header: "Cheque #",
    cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{row.getValue("cheque_number")}</span>,
  },
  {
    accessorKey: "bank_name",
    header: "Bank Name",
    cell: ({ row }) => <span className="text-[13px] text-foreground">{row.getValue("bank_name")}</span>,
  },
  {
    accessorKey: "amount",
    header: "Amount (LKR)",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return (
        <div className="text-[13px] font-medium text-foreground tabular-nums">
          LKR {amount.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Instrument Type",
    cell: ({ row }) => {
      const type = row.getValue("type");
      const isReceivable = type === "receivable";
      return (
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 border rounded-md uppercase",
            isReceivable 
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
          )}
        >
          {isReceivable ? "Receivable" : "Payable"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "cheque_date",
    header: "Cheque Date",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-[13px] font-medium text-foreground">
            {format(new Date(row.getValue("cheque_date")), "dd MMM yyyy")}
        </span>
        <span className="text-[10px] text-muted-foreground leading-tight">Maturity Date</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return <StatusBadge value={status} className="shadow-none rounded-md" />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const cheque = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(cheque)}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
            
            {cheque.status === "pending" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUpdateStatus(cheque, "cleared")}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Mark Cleared
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(cheque, "bounced")}>
                  <XCircle className="mr-2 h-4 w-4 text-red-600" /> Mark Bounced
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(cheque.id)}
              className="text-red-600 focus:text-red-700 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10"
              disabled={cheque.status === "cleared"}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
