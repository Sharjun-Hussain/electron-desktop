"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { Loader2, Building } from "lucide-react";
import { OrganizationForm } from "@/components/organizations/new/organization-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";
import { AccessDenied } from "@/components/general/access-denied";

import { Suspense } from "react";

function EditOrganizationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const organizationId = searchParams.get('id');
  const { setBreadcrumb } = useBreadcrumbStore();

  const [organizationData, setOrganizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken || !organizationId) return;

    const fetchOrganization = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch");
        const data = await res.json();
        if (data.status === "success") {
          setOrganizationData(data.data);
          const label = data.data.name || `Organization #${data.data.id}`;
          setBreadcrumb(organizationId, label);
          document.title = `Edit ${label} | Inzeedo POS`;
        } else {
          throw new Error(data.message || "Failed to fetch");
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message || "Failed to load organization data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [status, accessToken, organizationId, setBreadcrumb]);

  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading organization details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <AccessDenied 
        errorMessage={error} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  return (
    <ProtectedRoute permission={PERMISSIONS.ORG_UPDATE}>
      <div className="flex-1 min-h-screen bg-background p-6 md:p-8 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Edit Organization</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {organizationData?.name ? `Editing "${organizationData.name}"` : "Update organization details"}
            </p>
          </div>
        </div>

        {organizationData && <OrganizationForm initialData={organizationData} />}
      </div>
    </ProtectedRoute>
  );
}

export default function EditOrganizationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading organization details...</span>
      </div>
    }>
      <EditOrganizationContent />
    </Suspense>
  );
}
