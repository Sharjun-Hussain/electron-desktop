import { BRAND } from "@/lib/branding";
import { EmployeeForm } from "@/components/employees/new/employee-add-new-form";


export default function AddEmployeePage() {
  return (
    <div className="px-6 pb-6 pt-3">
      <div className="flex items-center justify-between space-y-2 mb-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Add New Employee
          </h2>
          <p className="text-muted-foreground">
            Fill in the details below to add a new employee to your application.
          </p>
        </div>
      </div>
      <EmployeeForm />
    </div>
  );
}

export const metadata = {
  title: `Add New Employee | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
