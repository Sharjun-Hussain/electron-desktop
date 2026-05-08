import ProductionOrderManagement from "@/components/production/production-order-management";

export const metadata = {
  title: "Production Batches | Manufacturing",
  description: "Monitor and manage live manufacturing runs and production yield",
};

export default function ProductionOrdersPage() {
  return <ProductionOrderManagement />;
}
