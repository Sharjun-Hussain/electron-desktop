import { ProductForm } from "@/components/products/new/product-form";
import { ProductVariantForm } from "@/components/variants/new/variant-form";

export default function AddProductPage() {
  return (
    <div className="">
      {/* <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Create a New Product
          </h2>
          <p className="text-muted-foreground">
            Fill in the details below to add a new product to your inventory.
          </p>
        </div>
      </div> */}
      <ProductVariantForm />
    </div>
  );
}

export const metadata = {
  title: "Add New Product Variant | Inzeedo POS",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
