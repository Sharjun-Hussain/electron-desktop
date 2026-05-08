import { SupplierForm } from "@/components/purchase/suppliers/new/supplier-form";

export default function AddOrganizationPage() {
  return (
    <div className="px-6 pb-6 pt-3">
      <div className="flex items-center justify-between space-y-2 mb-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Add New Supplier
          </h2>
          <p className="text-muted-foreground">
            Fill in the details below to add a new supplier to your application.
          </p>
        </div>
      </div>
      <SupplierForm />
    </div>
  );
}

export const metadata = {
  title: "Add New Organization | Inzeedo POS",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
