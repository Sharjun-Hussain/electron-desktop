import { BRAND } from "@/lib/branding";
import CreatePurchaseOrder from "@/components/purchase/Purchase-orders/create/purchase-order-form";

export default function AddPurchaseOrderPage() {
  return (
    <div>
      <CreatePurchaseOrder />
    </div>
  );
}

export const metadata = {
  title: `Create New Purchase Order | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
