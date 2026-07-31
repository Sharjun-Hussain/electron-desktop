import { BRAND } from "@/lib/branding";
import StockTransferList from "@/components/inventory/StockTransferList";

export const metadata = {
  title: `Inventory Transfers | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Track and manage movement of inventory between business locations with the ${BRAND.APP_NAME} POS centralized transfer module.`,
};

export default function TransfersPage() {
  return (
    <div className="">
      <StockTransferList />
    </div>
  );
}
