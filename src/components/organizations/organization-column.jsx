// app/organizations/organization-columns.tsx
"use client";

import { ArrowUpDown, MoreHorizontal, Building, Copy, Hash } from "lucide-react";
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
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-4 h-8 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );
};

export const getOrganizationColumns = ({ onDelete, onToggleStatus }) => [
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
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Organization" />
    ),
    cell: ({ row }) => {
      const organization = row.original;
      const logoUrl = organization.logo
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${organization.logo}`
        : null;

      return (
        <div className="flex items-center gap-3 py-1">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={logoUrl} alt={organization.name} className="object-cover" />
            <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-semibold text-xs">
              {organization.name.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground">
              {organization.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {organization.email || "No email provided"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Org ID" />
    ),
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div 
          className="group flex items-center gap-2 cursor-pointer max-w-[120px]"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(id);
            toast.success("Organization ID copied to clipboard!");
          }}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-bold text-muted-foreground group-hover:text-emerald-600 transition-colors truncate">
                {id.substring(0, 8)}...
              </span>
              <Copy className="h-3 w-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
            </div>
            <span className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-tighter group-hover:text-emerald-500/60 transition-colors">
              Click to copy
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone");
      return (
        <div className="text-sm text-foreground">
          {phone || <span className="text-muted-foreground">N/A</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      const city = row.getValue("city");
      return (
        <span className="text-sm text-foreground">
          {city || <span className="text-muted-foreground">Not Set</span>}
        </span>
      );
    },
  },
  {
    accessorKey: "business_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("business_type");
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-none font-medium text-[10px]">
          {type || "Retail"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "branches",
    header: "Branches",
    cell: ({ row }) => {
      const branchCount = row.original.branches?.length || 0;
      return (
        <Badge variant="secondary" className="font-normal">
          {branchCount} {branchCount === 1 ? "Branch" : "Branches"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "subscription_tier",
    header: "Subscription",
    cell: ({ row }) => {
      const tier = row.original.subscription_tier;
      
      if (!tier) {
        return <span className="text-sm text-muted-foreground">Not Set</span>;
      }
      
      return (
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 shadow-none font-medium">
          {tier}
        </Badge>
      );
    },
  },
  {
    accessorKey: "billing_cycle",
    header: "Billing Cycle",
    cell: ({ row }) => {
      const cycle = row.original.billing_cycle;
      
      if (!cycle) {
        return <span className="text-sm text-muted-foreground">-</span>;
      }
      
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {cycle}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-bold">
            Period
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "subscription_status",
    header: "Sub. Status",
    cell: ({ row }) => {
      const status = row.original.subscription_status;
      
      const isTrial = !status || status === "Trial";
      const isExpired = status === "Expired";
      
      return (
        <Badge 
          variant={isTrial ? "outline" : isExpired ? "destructive" : "default"}
          className={!isTrial && !isExpired ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-transparent shadow-none font-normal" : "font-normal shadow-none"}
        >
          {status || "Trial"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "subscription_expiry_date",
    header: "Expiry Date",
    cell: ({ row }) => {
      const expiryDate = row.original.subscription_expiry_date;
      
      if (!expiryDate) {
        return <span className="text-sm text-muted-foreground">-</span>;
      }
      
      const date = new Date(expiryDate);
      const now = new Date();
      const isExpired = date < now;
      const daysUntilExpiry = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
      
      return (
        <div className="flex flex-col">
          <span className={`text-sm ${isExpired ? 'text-red-500 font-medium' : 'text-foreground'}`}>
            {date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
          {!isExpired && daysUntilExpiry <= 30 && (
            <span className="text-xs text-amber-600 font-medium mt-0.5">
              {daysUntilExpiry} days left
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
      const isActive = row.getValue("is_active");
      return <StatusBadge value={isActive} />;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Registered" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-sm text-foreground">
            {date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const organization = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <Link href={`/organizations/edit?id=${organization.id}`} passHref>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Edit Details</DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(organization);
            }}>
              {organization.is_active ? "Suspend Access" : "Activate Access"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
