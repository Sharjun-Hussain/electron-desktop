import StockTransferList from "@/components/inventory/StockTransferList";

export const metadata = {
  title: "Inventory Transfers | Inzeedo POS",
  description: "Track and manage movement of inventory between business locations with the Inzeedo POS centralized transfer module.",
};

export default function TransfersPage() {
  return (
    <div className="">
      <StockTransferList />
    </div>
  );
}
