import { EmployeeForm } from "@/components/employees/new/employee-add-new-form";

// Mock data for dropdowns, which would normally come from an API
const mockCategories = [
  { id: "cat_apparel", name: "Apparel" },
  { id: "cat_electronics", name: "Electronics" },
  { id: "cat_grocery", name: "Groceries" },
];
const mockBrands = [
  { id: "brand_nike", name: "Nike" },
  { id: "brand_apple", name: "Apple" },
  { id: "brand_starbucks", name: "Starbucks" },
];

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
  title: "Add New Employee | Inzeedo POS",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
