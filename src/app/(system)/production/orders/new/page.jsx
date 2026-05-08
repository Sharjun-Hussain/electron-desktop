import ProductionOrderForm from "@/components/production/production-order-form";

export const metadata = {
  title: "New Production Run | Manufacturing",
  description: "Configure and initiate a new production batch",
};

export default function NewProductionOrderPage() {
  return <ProductionOrderForm />;
}
