import { BRAND } from "@/lib/branding";

import SalesByProductPage from "@/components/reports/sales/product/SalesByProductReport";
import React from "react";

const page = () => {
  return <SalesByProductPage />;
};

export default page;

export const metadata = {
  title: `Product Sales Analytics | Sales Insights | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
