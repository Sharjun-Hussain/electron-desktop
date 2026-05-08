import { EmployeeForm } from "@/components/employees/new/employee-add-new-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";
import { UserPlus } from "lucide-react";

export default function AddEmployeePage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_CREATE}>
      <div className="flex-1 min-h-screen bg-background p-6 md:p-8 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Add Employee</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create a new employee profile</p>
          </div>
        </div>

        <EmployeeForm />
      </div>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Add New Employee | Inzeedo POS",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
