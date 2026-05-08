"use client";

import { ArrowUpDown, MoreHorizontal, User, Mail, Phone, Shield, ShieldCheck, Building2, Pencil, Power, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getImageUrl } from "@/lib/utils";

// Reusable component for sortable column headers
export const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-3 h-8 hover:bg-transparent font-semibold text-xs text-muted-foreground"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
    </Button>
  );
};

export const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px] border-slate-200 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px] border-slate-200 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Staff Member" />,
    cell: ({ row, table }) => {
      const staff = row.original;
      return (
        <div
          className="flex items-center gap-4 py-1 cursor-pointer group/name"
          onClick={() => table.options.meta?.onView(staff)}
        >
          <div className="relative group">
            <Avatar className="h-10 w-10 border border-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={getImageUrl(staff.user?.profile_image)} />
              <AvatarFallback className="bg-emerald-50 text-emerald-600 font-semibold text-xs">
                {staff.name?.split(" ").map(n => n[0]).join("").toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            {staff.is_active && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
            )}
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground flex items-center gap-2 group-hover/name:text-emerald-600 transition-colors">
              {staff.name}
              {staff.user?.roles?.some(r => r.name === 'Super Admin') && (
                <Shield className="h-3 w-3 text-emerald-600 fill-emerald-500/10" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Mail className="h-3 w-3 opacity-70" />
              {staff.email}
            </div>
            {staff.primaryBranch && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600/70 mt-1">
                <Building2 className="h-2.5 w-2.5" />
                {staff.primaryBranch.name}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "branches",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assignments" />,
    cell: ({ row }) => {
      const branches = row.original.branches || [];
      const primaryBranchId = row.original.branch_id;

      return (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {branches.map((branch) => {
            const isPrimary = branch.id === primaryBranchId;
            return (
              <Badge
                key={branch.id}
                variant={isPrimary ? "default" : "secondary"}
                className={cn(
                  "text-[11px] font-semibold px-2 py-0 leading-tight rounded-md",
                  isPrimary
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm"
                    : "bg-slate-100 text-slate-600 border-none"
                )}
              >
                {isPrimary && <ShieldCheck className="h-2.5 w-2.5 mr-1" />}
                {branch.name}
              </Badge>
            );
          })}
          {branches.length === 0 && <span className="text-xs text-muted-foreground opacity-50 italic">Unassigned</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Phone className="h-3 w-3 text-muted-foreground/40" />
          {row.getValue("phone") || "N/A"}
        </div>
        {row.original.nic && (
          <div className="text-[11px] font-medium text-muted-foreground/60 ml-4.5">
            NIC: {row.original.nic}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <Badge
          variant="outline"
          className={cn(
            "rounded-md px-2 py-0.5 border text-xs font-semibold",
            isActive
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-slate-50 text-slate-500 border-slate-200"
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const staff = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100 min-w-[200px]">
            <DropdownMenuItem onClick={() => table.options.meta?.onEdit(staff)} className="font-medium text-sm">
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit Profile
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => table.options.meta?.onToggleStatus(staff)} className="font-medium text-sm">
              <Power className={cn("mr-2 h-3.5 w-3.5", staff.is_active ? "text-red-500" : "text-emerald-500")} />
              {staff.is_active ? "Deactivate Staff" : "Activate Staff"}
            </DropdownMenuItem>

            {staff.user_id && (
              <DropdownMenuItem onClick={() => table.options.meta?.onToggleAccess(staff)} className="font-medium text-sm">
                <KeyRound className={cn("mr-2 h-3.5 w-3.5", staff.user?.is_active ? "text-orange-500" : "text-emerald-500")} />
                {staff.user?.is_active ? "Revoke System Access" : "Grant System Access"}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => table.options.meta?.onDelete(staff.id)} 
              className="text-red-500 focus:text-red-600 font-medium text-sm"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Remove Staff
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
