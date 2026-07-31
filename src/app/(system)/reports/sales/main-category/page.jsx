import { BRAND } from "@/lib/branding";

import CategorySalesReportPage from "@/components/reports/sales/categories/CategorySalesReport";
import React from "react";

const page = () => {
  return <CategorySalesReportPage type="main" />;
};

export default page;

export const metadata = {
  title: `Main Category Sales | Sales Insights | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
