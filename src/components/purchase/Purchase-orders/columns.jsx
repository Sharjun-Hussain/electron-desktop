"use client";

import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Printer,
  Download,
  Copy,
  Mail,
  XCircle,
  FileText,
  Zap,
  Loader2,
  ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Helper for Currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR", // Change this to your currency
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

export const getColumns = ({ onDelete, session }) => [
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
    accessorKey: "po_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PO Number" />
    ),
    cell: ({ row }) => {
      const po = row.original;
      return (
        <Link href={`/purchase/purchase-orders/view?poid=${po.id}`}>
          <span className="font-bold text-emerald-600 text-[14px] hover:underline cursor-pointer">
            {row.getValue("po_number")}
          </span>
        </Link>
      );
    },
  },
  {
    accessorKey: "supplier.name", // Accessing nested object
    header: "Supplier",
    cell: ({ row }) => {
      const name = row.original.supplier?.name || "Unknown";
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-foreground text-[14px]">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "order_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("order_date");
      if (!date) return "-";
      return <span className="font-medium text-[14px] text-foreground/80">{format(new Date(date), "MMM dd, yyyy")}</span>;
    },
  },
  {
    accessorKey: "expected_delivery_date",
    header: "Expected Delivery",
    cell: ({ row }) => {
      const date = row.getValue("expected_delivery_date");
      if (!date) return "-";
      return (
        <span className="text-muted-foreground text-[13px] font-medium">
          {format(new Date(date), "MMM dd, yyyy")}
        </span>
      );
    },
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("total_amount");
      return (
        <div className="flex flex-col items-start gap-0.5">
          <div className="font-semibold text-emerald-700 text-[14px]">{formatCurrency(amount)}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return <StatusBadge value={status} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const po = row.original;
      const canReceive = po.status !== 'cancelled' && po.status !== 'received';
      
      return (
        <div className="flex items-center justify-end gap-2">
          {canReceive && (
            <Link href={`/purchase/grn/${po.id}`}>
              <Button size="sm" className="h-8 gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold text-[11px] px-3 transition-all active:scale-95">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Receive Goods
              </Button>
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-muted transition-colors">
                <span className="sr-only">Open actions</span>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              PO Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <Link href={`/purchase/purchase-orders/view?poid=${po.id}`} passHref>
              <DropdownMenuItem className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>View PO</span>
              </DropdownMenuItem>
            </Link>

            {po.status !== 'cancelled' && po.status !== 'received' && (
              <Link href={`/purchase/purchase-orders/edit?id=${po.id}`} passHref>
                <DropdownMenuItem className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Edit PO</span>
                </DropdownMenuItem>
              </Link>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async () => {
                if (!session?.accessToken) {
                  toast.error("Authentication required");
                  return;
                }
                const toastId = toast.loading("Generating PDF...");
                try {
                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${po.id}/pdf`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                  });
                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `PO-${po.po_number}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                    toast.success("PDF downloaded successfully", { id: toastId });
                  } else {
                    toast.error("Failed to generate PDF", { id: toastId });
                  }
                } catch (error) {
                  toast.error("Error downloading PDF", { id: toastId });
                }
              }}
            >
              <Download className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Download PDF</span>
            </DropdownMenuItem>

            {/* <DropdownMenuItem
              className="rounded-lg gap-2 cursor-pointer py-2 text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50/50"
              onClick={() => {
                // This will be handled by a dialog or state update in the parent component
                if (window.onSendPOWhatsApp) window.onSendPOWhatsApp(po);
              }}
            >
              <Zap className="h-4 w-4" />
              <span className="font-medium">Send via WhatsApp</span>
            </DropdownMenuItem> */}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-700"
              onClick={() => {
                if (window.onDeletePO) window.onDeletePO(po);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span>Delete PO</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      );
    },
  },
];