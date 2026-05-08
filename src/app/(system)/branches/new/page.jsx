import { BranchForm } from "@/components/branches/new/branches-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";
import { Building } from "lucide-react";

export default function AddBranchPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.BRANCH_CREATE}>
      <div className="flex-1 min-h-screen bg-background p-6 md:p-8 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Add Branch</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create a new branch location for your organization</p>
          </div>
        </div>

        <BranchForm />
      </div>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Add Branch | Inzeedo POS",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
