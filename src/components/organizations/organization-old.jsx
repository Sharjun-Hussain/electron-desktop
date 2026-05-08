"use client"; // Required for useState

import { useState, useEffect } from "react";
import { DataTable } from "@/components/general/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Search,
  Download,
  Filter,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Briefcase,
  Building,
  LoaderIcon,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columns } from "./columns-old";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import OrganizationPageSkeleton from "@/app/skeletons/organization-skeleton";
import { useOrganizations } from "@/app/hooks/swr/useOrganization";

const OrganizationBulkActions = ({ table }) => {
  const numSelected = table.getFilteredSelectedRowModel().rows.length;
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleDeactivate = () => {
    const selectedIds = selectedRows.map((row) => row.original.id);
    console.log("Deactivating organizations:", selectedIds);
    // Add your API call logic here
    table.resetRowSelection(); // Clear selection after action
  };

  const handleDelete = () => {
    const selectedIds = selectedRows.map((row) => row.original.id);
    console.log("Deleting organizations:", selectedIds);
    // Add your API call logic here
    table.resetRowSelection();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Actions ({numSelected})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDeactivate}>
          Deactivate Selected
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-500" onClick={handleDelete}>
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const OrganizationTableToolbar = ({ table, bulkActionsComponent }) => {
  const numSelected = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex items-center justify-between space-x-4 mb-4">
      <div className="flex flex-1 items-center space-x-2">
        {/* Filter by Name (Search Input) */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter organizations by name..."
            value={table.getColumn("name")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-10"
          />
        </div>

        {/* Filter by Multi-Branch Status */}
        {/* <Select
          value={table.getColumn("is_multi_branch")?.getFilterValue() ?? ""}
          onValueChange={(value) => {
            table
              .getColumn("is_multi_branch")
              ?.setFilterValue(value === "" ? undefined : value === "true");
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Multi-Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={undefined}>All Types</SelectItem>
            <SelectItem value="true">Multi-Branch</SelectItem>
            <SelectItem value="false">Single Branch</SelectItem>
          </SelectContent>
        </Select> */}

        {/* Filter by Status */}
        {/* <Select
          value={table.getColumn("is_active")?.getFilterValue() ?? ""}
          onValueChange={(value) => {
            table
              .getColumn("is_active")
              ?.setFilterValue(value === "" ? undefined : value === "true");
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={undefined}>All Statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select> */}
      </div>

      {numSelected > 0 && bulkActionsComponent}
    </div>
  );
};

// Statistics for organizations
const calculateOrganizationStats = (organizations) => ({
  totalOrganizations: organizations.length,
  activeOrganizations: organizations.filter((org) => org.is_active).length,
  inactiveOrganizations: organizations.filter((org) => !org.is_active).length,
  multiBranchOrganizations: organizations.filter((org) => org.is_multi_branch)
    .length,
});

// Main page component
export default function OrganizationPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  // const { organizations, isLoading, isError } = useOrganizations();

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // API fetch function
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        setOrganizations(data.data.data);
      } else {
        throw new Error(data.message || "Failed to fetch organizations");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching organizations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // const organizationStats = calculateOrganizationStats(organizations);

  const table = useReactTable({
    data: organizations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  if (loading) {
    return <OrganizationPageSkeleton />;
  }

  if (error) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-6 px-6 pb-6 pt-3 md:flex">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <Button onClick={fetchOrganizations}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden h-full flex-1 flex-col space-y-6 px-6 pb-6 pt-3 md:flex">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Organization Management
          </h1>
          <p className="text-muted-foreground">
            Manage your organizations, branches, and settings.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/organizations/new" passHref>
            <Button
              onClick={() => setIsNavigating(true)}
              disabled={isNavigating}
              className="gap-2"
            >
              {isNavigating ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              Add Organization
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Organizations
                </p>
                <p className="text-2xl font-bold">
                  {organizationStats.totalOrganizations}
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Organizations
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {organizationStats.activeOrganizations}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Multi-Branch
                </p>
                <p className="text-2xl font-bold">
                  {organizationStats.multiBranchOrganizations}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Inactive
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {organizationStats.inactiveOrganizations}
                </p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Organizations Table Section */}
      <Card>
        <CardContent className="">
          <OrganizationTableToolbar
            table={table}
            bulkActionsComponent={<OrganizationBulkActions table={table} />}
          />

          <DataTable table={table} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
