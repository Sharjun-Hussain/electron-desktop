"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserCheck, UserX, Briefcase, Building, CheckCircle2, XCircle, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import OrganizationPageSkeleton from "@/app/skeletons/organization-skeleton";
import { ResourceManagementLayout } from "../general/resource-management-layout";
import { getOrganizationColumns } from "./organization-column";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";
import OrganizationDetailSheet from "./organization-detail-sheet";

const calculateOrganizationStats = (organizations) => ({
  totalOrganizations: organizations?.length,
  activeOrganizations: organizations?.filter((org) => org.is_active).length,
  inactiveOrganizations: organizations?.filter((org) => !org.is_active).length,
  multiBranchOrganizations: organizations?.filter((org) => org.is_multi_branch)
    .length,
});

const OrganizationFilters = ({ table }) => {
  return (
    <>
      <Select
        value={String(
          table.getColumn("is_multi_branch")?.getFilterValue() ?? "all"
        )}
        onValueChange={(value) => {
          table
            .getColumn("is_multi_branch")
            ?.setFilterValue(value === "all" ? undefined : value === "true");
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="true">Multi-Branch</SelectItem>
          <SelectItem value="false">Single Branch</SelectItem>
        </SelectContent>
      </Select>

      {/* Filter by Status */}
      <Select
        value={String(table.getColumn("is_active")?.getFilterValue() ?? "all")}
        onValueChange={(value) => {
          table
            .getColumn("is_active")
            ?.setFilterValue(value === "all" ? undefined : value === "true");
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
};

const OrganizationBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const numSelected = selectedIds.length;

  if (numSelected === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto h-9">
          Actions ({numSelected}) <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => {
            onActivate(selectedIds);
            table.resetRowSelection();
          }}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Activate Selected
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            onDeactivate(selectedIds);
            table.resetRowSelection();
          }}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Deactivate Selected
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-500 focus:text-red-600"
          onClick={() => {
            onDelete(selectedIds);
            table.resetRowSelection();
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function OrganizationPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { ORG } = MODULES;
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  const fetchOrganizations = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access Denied: You do not have the required authority to perform this action.");
        }
        throw new Error("Failed to fetch");
      }
      const data = await response.json();
      if (data.status === "success") {
        setOrganizations(data?.data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrganizations();
    }
  }, [status, session]); // Re-run when session is ready

  const handleAddClick = () => {
    setIsNavigating(true);
    router.push("/organizations/new");
  };

  const handleDelete = async (ids) => {
    // This now works for single or bulk!
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchOrganizations(); // Refetch data
          return "Organization(s) deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  };

  const handleToggleStatus = async (organization) => {
    const action = organization?.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organization?.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
        success: () => {
          fetchOrganizations(); // Refetch data
          return `Organization ${action}d successfully!`;
        },
        error: "Action failed.",
      }
    );
  };

  const handleBulkActivate = async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}/activate`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Activating...",
        success: () => {
          fetchOrganizations();
          return "Organizations activated successfully!";
        },
        error: "Action failed.",
      }
    );
  };

  const handleBulkDeactivate = async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}/deactivate`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Deactivating...",
        success: () => {
          fetchOrganizations(); // Refetch data
          return "Organizations deactivated successfully!";
        },
        error: "Action failed.",
      }
    );
  };

  const columns = getOrganizationColumns({
    onDelete: canDelete(ORG) ? handleDelete : null,
    onToggleStatus: canUpdate(ORG) ? handleToggleStatus : null,
  });

  const organizationStats = calculateOrganizationStats(organizations);
  const stats = [
    {
      label: "Total Organizations",
      val: organizationStats?.totalOrganizations || 0,
      icon: Building,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Active Profiles",
      val: organizationStats?.activeOrganizations || 0,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Multi-Branch",
      val: organizationStats?.multiBranchOrganizations || 0,
      icon: Briefcase,
      gradient: "from-violet-500 to-purple-400",
    },
    {
      label: "Inactive",
      val: organizationStats?.inactiveOrganizations || 0,
      icon: XCircle,
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  const statCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {stats.map((card, idx) => (
        <div 
          key={idx} 
          className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4"
        >
          <div className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} text-white`}>
            <card.icon className="w-5 h-5 shadow-sm" />
          </div>
          <div className="flex flex-col">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
            <h3 className="text-2xl font-bold text-foreground">
              {card.val}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );

  const handleRowClick = (org) => {
    setSelectedOrgId(org.id);
    setIsDetailSheetOpen(true);
  };

  return (
    <>
      <ResourceManagementLayout
        data={organizations}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchOrganizations}
        headerTitle={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Organization Profiles</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage your organization details and branches</p>
            </div>
          </div>
        }
        addButtonLabel="Add Profile"
        onAddClick={canCreate(ORG) ? handleAddClick : null}
        isAdding={isNavigating}
        onExportClick={() => console.log("Export clicked")}
        statCardsComponent={statCards}
        onRowClick={handleRowClick}
        bulkActionsComponent={
          canDelete(ORG) ? (
            <OrganizationBulkActions
              onDelete={handleDelete}
              onDeactivate={handleBulkDeactivate}
              onActivate={handleBulkActivate}
            />
          ) : null
        }
        searchColumn="name"
        searchPlaceholder="Search profiles..."
        loadingSkeleton={<OrganizationPageSkeleton />}
        filterComponents={(table) => (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              value={String(table.getColumn("is_multi_branch")?.getFilterValue() ?? "all")}
              onValueChange={(value) => table.getColumn("is_multi_branch")?.setFilterValue(value === "all" ? undefined : value === "true")}
            >
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="true">Multi-Branch</SelectItem>
                <SelectItem value="false">Single Branch</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(table.getColumn("is_active")?.getFilterValue() ?? "all")}
              onValueChange={(value) => table.getColumn("is_active")?.setFilterValue(value === "all" ? undefined : value === "true")}
            >
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      />
      
      <OrganizationDetailSheet
        isOpen={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
        organizationId={selectedOrgId}
        accessToken={session?.accessToken}
        onUpdate={fetchOrganizations}
      />
    </>
  );
}
