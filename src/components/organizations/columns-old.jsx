"use client";

import { ArrowUpDown, MoreHorizontal, Building } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { useOrganizationActions } from "@/app/hooks/swr/useOrganizationAction";

const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4 text-gray-700 opacity-60" />
    </Button>
  );
};

export const columns = [
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
      <DataTableColumnHeader column={column} title="Organization" />
    ),
    cell: ({ row }) => {
      const organization = row.original;
      const logoUrl = organization.logo
        ? `https://apipos.inzeedo.lk/${organization.logo}`
        : null;

      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={logoUrl} alt={organization.name} />
            <AvatarFallback>
              <Building className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{organization.name}</div>
            <div className="text-sm text-muted-foreground">
              {organization.email || "No email"}
            </div>
          </div>
        </div>
      );
    },
  },
  // {
  //   accessorKey: "code",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Org Code" />
  //   ),
  //   cell: ({ row }) => {
  //     return <Badge variant="outline">{row.getValue("code")}</Badge>;
  //   },
  // },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="City" />
    ),
    cell: ({ row }) => {
      const city = row.getValue("city");
      return city || "Not specified";
    },
  },
  {
    accessorKey: "is_multi_branch",
    header: "Multi-Branch",
    cell: ({ row }) => {
      return row.getValue("is_multi_branch") ? (
        <Badge variant="default">Yes</Badge>
      ) : (
        <Badge variant="destructive">No</Badge>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active");
      return (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const organization = row.original;
      const { data: session, status } = useSession();
      const { deleteOrganization, toggleOrganizationStatus } =
        useOrganizationActions();
      const router = useRouter();

      const handleDeactivate = async (id) => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}/deactivate`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}`,
              },
            }
          );

          if (!response.ok) {
            toast.error(
              "There is something wrong with reqiest please check again and send this request!"
            );
          } else {
            toast.success("Organization Deactivated Successfully!");
          }
        } catch (e) {
          toast.error("Action Failed Please Try Again Later!");
        }
      };

      const handleActivate = async (id) => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}/activate`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}`,
              },
            }
          );

          if (!response.ok) {
            toast.error(
              "There is something wrong with reqiest please check again and send this request!"
            );
          } else {
            toast.success("Organization Activated Successfully!");
          }
        } catch (e) {
          toast.error("Action Failed Please Try Again Later!");
        }
      };

      const handleDelete = async (id) => {
        const result = await deleteOrganization(id);
        if (result.success) {
          toast.success("Organization Deleted Successfully!");
          window.location.reload();
        } else {
          toast.error(result.error || "Action Failed Please Try Again Later!");
        }
      };

      // const handleDelete = async (id) => {
      //   try {
      //     const response = await fetch(
      //       `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}`,
      //       {
      //         method: "DELETE",
      //         headers: {
      //           "Content-Type": "application/json",
      //           Authorization: `Bearer ${session.accessToken}`,
      //         },
      //       }
      //     );

      //     if (!response.ok) {
      //       toast.error(
      //         "There is something wrong with reqiest please check again and send this request!"
      //       );
      //     } else {
      //       toast.success("Organization Deleted Successfully!");
      //       mutate("/organizations");
      //     }
      //   } catch (e) {
      //     toast.error("Action Failed Please Try Again Later!");
      //   }
      // };
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
            <Link href={`/organizations/edit?id=${organization.id}`} passHref>
              <DropdownMenuItem>Edit Settings</DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-800"
              onClick={() => handleDelete(organization.id)}
            >
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onClick={() =>
                organization.is_active
                  ? handleDeactivate(organization.id)
                  : handleActivate(organization.id)
              }
            >
              {organization.is_active ? "Suspend" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
