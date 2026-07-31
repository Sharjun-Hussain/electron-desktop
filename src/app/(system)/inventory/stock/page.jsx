import { BRAND } from "@/lib/branding";
import StockManagement from "@/components/inventory/StockManagement";

export const metadata = {
  title: `Inventory Management | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Monitor and manage real-time inventory levels across all branches with the ${BRAND.APP_NAME} POS centralized stock tracking module.`,
};

export default function StockPage() {
  return (
    <div className="">
      <StockManagement />
    </div>
  );
}
