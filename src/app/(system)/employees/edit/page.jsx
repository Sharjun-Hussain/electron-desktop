"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { Loader2, UserCircle } from "lucide-react";
import { EmployeeForm } from "@/components/employees/new/employee-add-new-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

export default function EditEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const employeeId = searchParams.get('id');
  const { setBreadcrumb } = useBreadcrumbStore();

  const [employeeData, setEmployeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    const fetchEmployee = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/employees/${employeeId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch");
        const data = await res.json();
        if (data.status === "success") {
          setEmployeeData(data.data);
          const label = data.data.name || `Employee #${data.data.id}`;
          setBreadcrumb(employeeId, label);
          document.title = `Edit ${label} | Inzeedo POS`;
        } else {
          throw new Error(data.message || "Failed to fetch");
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message || "Failed to load employee data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [status, accessToken, employeeId, setBreadcrumb]);

  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading employee details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-2">
        <p className="text-sm font-medium text-red-500">Failed to load employee data.</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_UPDATE}>
      <div className="flex-1 min-h-screen bg-background p-6 md:p-8 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <UserCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Edit Employee</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {employeeData?.first_name ? `Editing profile for ${employeeData.first_name} ${employeeData.last_name || ""}` : "Update personnel credentials"}
            </p>
          </div>
        </div>

        {employeeData && <EmployeeForm initialData={employeeData} />}
      </div>
    </ProtectedRoute>
  );
}
