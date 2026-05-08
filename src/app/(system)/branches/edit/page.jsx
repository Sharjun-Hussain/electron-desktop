"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { Loader2, Building } from "lucide-react";
import { BranchForm } from "@/components/branches/new/branches-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";

export default function EditBranchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const branchId = searchParams.get('id');

  const [branchData, setBranchData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    const fetchBranch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${branchId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch");
        const data = await res.json();
        if (data.status === "success") {
          setBranchData(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch");
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message || "Failed to load branch data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranch();
  }, [status, accessToken, branchId]);

  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading branch details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-2">
        <p className="text-sm font-medium text-red-500">Failed to load branch data.</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <ProtectedRoute permission={PERMISSIONS.BRANCH_UPDATE}>
      <div className="flex-1 min-h-screen bg-background p-6 md:p-8 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Edit Branch</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {branchData?.name ? `Editing "${branchData.name}"` : "Update branch details"}
            </p>
          </div>
        </div>

        {branchData && <BranchForm initialData={branchData} />}
      </div>
    </ProtectedRoute>
  );
}
