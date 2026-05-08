"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building } from "lucide-react";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getBranchColumns } from "./branches-column";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { business } = useAppSettings();
  const isEssential = business?.subscription_tier === "Essential";

  const fetchBranches = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch branches");
      const data = await response.json();
      if (data.status === "success") {
        setBranches(data?.data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch branches");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchBranches();
  }, [status, session]);

  const handleAddClick = () => router.push("/branches/new");
  const handleEditClick = (branch) => router.push(`/branches/edit?id=${branch.id}`);

  const handleDelete = async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    if (!confirm(`Delete ${idsToDelete.length} branch(es)?`)) return;
    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => { fetchBranches(); return "Branch(es) deleted."; },
        error: "Failed to delete.",
      }
    );
  };

  const handleToggleStatus = async (branchOrIds, actionOverride = null) => {
    let ids = [];
    let action = actionOverride;
    if (Array.isArray(branchOrIds)) {
      ids = branchOrIds;
    } else {
      ids = [branchOrIds.id];
      action = branchOrIds.is_active ? "deactivate" : "activate";
    }
    if (!action) return;
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${id}/${action}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Deactivating"}...`,
        success: () => { fetchBranches(); return `Branch(es) ${action}d.`; },
        error: "Action failed.",
      }
    );
  };

  const isSuperAdmin = session?.user?.roles?.includes("Super Admin");

  const columns = useMemo(
    () =>
      getBranchColumns({
        onDelete: canDelete(MODULES.BRANCH) ? handleDelete : null,
        onToggleStatus: canUpdate(MODULES.BRANCH) ? handleToggleStatus : null,
        onEdit: canUpdate(MODULES.BRANCH) ? handleEditClick : null,
        isSuperAdmin,
      }),
    [canDelete, canUpdate, isSuperAdmin, session]
  );

  return (
    <ResourceManagementLayout
      data={branches}
      columns={columns}
      isLoading={loading || status === "loading"}
      isError={!!error && branches.length === 0}
      errorMessage={error}
      onRetry={fetchBranches}
      headerTitle={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Branches</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your organization's branch locations</p>
          </div>
        </div>
      }
      addButtonLabel={!isEssential ? "Add Branch" : null}
      onAddClick={!isEssential && canCreate(MODULES.BRANCH) ? handleAddClick : null}
      searchColumn="name"
      searchPlaceholder="Search branches by name or code..."
    />
  );
}
