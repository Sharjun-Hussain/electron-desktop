import { BRAND } from "@/lib/branding";

import SupplierProfitPage from "@/components/reports/sales/supplier-profit/SupplierProfit";
import React from "react";

const page = () => {
  return <SupplierProfitPage />;
};

export default page;

export const metadata = {
  title: `Supplier Profit Analysis | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
