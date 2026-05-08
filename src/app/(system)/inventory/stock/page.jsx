import StockManagement from "@/components/inventory/StockManagement";

export const metadata = {
  title: "Inventory Management | Inzeedo POS",
  description: "Monitor and manage real-time inventory levels across all branches with the Inzeedo POS centralized stock tracking module.",
};

export default function StockPage() {
  return (
    <div className="">
      <StockManagement />
    </div>
  );
}
