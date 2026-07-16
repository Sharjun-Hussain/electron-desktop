"use client";

import { Calendar, ChevronRight, User, FileText, ArrowRight, ArrowUpDown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "@/lib/date-utils";
import { StatusBadge } from "../ui/status-badge";

export const getTransferColumns = ({ onOpenDetails }) => [
  {
    accessorKey: "transfer_number",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 hover:bg-emerald-500/5 group px-3 -ml-3"
      >
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors uppercase tracking-wider">Reference ID</span>
        <ArrowUpDown className="ml-1.5 size-3 text-slate-300 transition-colors group-hover:text-emerald-500/50" />
      </Button>
    ),
    cell: ({ row }) => {
      const transfer = row.original;
      return (
        <div className="flex flex-col min-w-0 pl-1">
          <span className="font-bold text-slate-900 dark:text-white text-[12px] truncate leading-tight tracking-tight">
            {transfer.transfer_number}
          </span>
          <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 mt-0.5 opacity-80">
            <Calendar className="h-2.5 w-2.5 opacity-60" />
            {format(new Date(transfer.transfer_date), "dd MMM, yyyy")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "route",
    header: () => <span className="text-[10px] font-bold text-slate-400 pl-3 uppercase tracking-wider">Logistics Path</span>,
    cell: ({ row }) => {
      const transfer = row.original;
      return (
        <div className="flex items-center gap-2.5 pl-3">
          <div className="flex flex-col max-w-[120px]">
             <span className="text-[9px] font-bold text-slate-400 opacity-60 leading-none mb-1">From</span>
             <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
               {transfer.from_branch?.name}
             </span>
          </div>
          <ArrowRight className="h-3 w-3 text-emerald-500/60 shrink-0 mt-3" />
          <div className="flex flex-col max-w-[120px]">
             <span className="text-[9px] font-bold text-emerald-600/60 leading-none mb-1 text-right">To</span>
             <span className="text-[11px] font-bold text-emerald-600 truncate text-right">
               {transfer.to_branch?.name}
             </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</div>,
    cell: ({ row }) => {
      const transfer = row.original;
      return (
        <div className="flex justify-center">
          <StatusBadge value={transfer.status} className="h-4.5 px-2.5 text-[9px] font-bold border-none shadow-sm" />
        </div>
      );
    },
  },
  {
    accessorKey: "user",
    header: () => <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initiated by</span>,
    cell: ({ row }) => {
      const transfer = row.original;
      return (
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-slate-100 dark:bg-emerald-500/5 border border-slate-200/50 dark:border-emerald-500/10 flex items-center justify-center text-slate-400 dark:text-emerald-500/60 shadow-sm">
            <User className="h-3 w-3" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {transfer.user?.name}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right text-[10px] font-bold text-slate-400 pr-2 uppercase tracking-wider">Actions</div>,
    cell: ({ row }) => {
      const transfer = row.original;
      return (
        <div className="flex justify-end pr-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/5 font-bold text-[10px] rounded-lg transition-all"
            onClick={() => onOpenDetails(transfer.id)}
          >
            <FileText className="h-3.5 w-3.5" />
            Details
          </Button>
        </div>
      );
    },
  },
];
