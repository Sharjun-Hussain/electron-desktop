import { BRAND } from "@/lib/branding";
import PurchaseOrderPage from "@/components/purchase/Purchase-orders/purchase-orders-management";
import React from "react";

const page = () => {
  return <PurchaseOrderPage />;
};

export default page;

export const metadata = {
  title: `Purchase Orders | ${BRAND.PAGE_TITLE_SUFFIX}  `,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
