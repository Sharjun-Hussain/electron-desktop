import { ArrowUpDown, MoreHorizontal, Building, MapPin, User, CheckCircle2, XCircle, Clock, Phone } from "lucide-react";
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
import { cn } from "@/lib/utils";

const SortableHeader = ({ column, title }) => (
  <div
    className="flex items-center gap-1.5 cursor-pointer select-none group"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  >
    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
      {title}
    </span>
    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors" />
  </div>
);

export const getBranchColumns = ({ onDelete, onToggleStatus, onEdit, isSuperAdmin }) => {
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-border/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-border/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Branch" />,
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div className="flex items-center gap-3 py-1">
            <div className={cn(
              "h-8 w-8 shrink-0 flex items-center justify-center rounded-lg transition-colors",
              branch.is_main ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/40 text-muted-foreground"
            )}>
              <Building className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                {branch.name}
                {branch.is_main && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/5 text-xs font-medium">
                    Main
                  </Badge>
                )}
              </div>
              <div className="text-xs font-medium text-muted-foreground/60">{branch.code}</div>
            </div>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const name = row.getValue(id)?.toLowerCase() || "";
        const code = row.original.code?.toLowerCase() || "";
        return value.toLowerCase().split(" ").every(t => name.includes(t) || code.includes(t));
      },
    },
    ...(isSuperAdmin
      ? [
          {
            accessorKey: "organization.name",
            header: ({ column }) => <SortableHeader column={column} title="Organization" />,
            cell: ({ row }) => {
              const org = row.original.organization;
              return (
                <div>
                  <div className="text-sm font-medium text-foreground">{org?.name || "—"}</div>
                  <div className="text-xs text-muted-foreground/60">{org?.code || ""}</div>
                </div>
              );
            },
          },
        ]
      : []),
    {
      accessorKey: "city",
      header: ({ column }) => <SortableHeader column={column} title="Location" />,
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              {branch.city || "—"}
            </div>
            {branch.address && (
              <div className="text-xs text-muted-foreground/60 truncate max-w-[200px] ml-5">{branch.address}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: ({ column }) => <SortableHeader column={column} title="Contact" />,
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Phone className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              {branch.phone || "—"}
            </div>
            {branch.email && (
              <div className="text-xs text-muted-foreground/60 ml-5 truncate max-w-[150px]">{branch.email}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "opening_time",
      header: ({ column }) => <SortableHeader column={column} title="Working Hours" />,
      cell: ({ row }) => {
        const branch = row.original;
        if (!branch.opening_time && !branch.closing_time) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              {branch.opening_time || "—"} - {branch.closing_time || "—"}
            </div>
            <div className="text-[10px] text-muted-foreground/60 ml-5 font-bold uppercase tracking-tight">Daily Schedule</div>
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: ({ column }) => <SortableHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const isActive = row.getValue("is_active");
        return (
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium flex items-center gap-1.5 w-fit",
              isActive
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-muted/40 text-muted-foreground/60 border-border/40"
            )}
          >
            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const branch = row.original;
        if (!onEdit && !onDelete && !onToggleStatus) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(branch)}>
                  Edit Branch
                </DropdownMenuItem>
              )}
              {onToggleStatus && (
                <DropdownMenuItem onClick={() => onToggleStatus(branch)}>
                  {branch.is_active ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-600"
                    onClick={() => onDelete(branch.id)}
                  >
                    Delete Branch
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return columns;
};
