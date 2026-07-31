import { BRAND } from "@/lib/branding";

import NonStockSalesPage from "@/components/reports/sales/non-stock/NonStockSales";
import React from "react";

const page = () => {
  return <NonStockSalesPage />;
};

export default page;

export const metadata = {
  title: `Non-Stock Items Sales | Sales Insights | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
