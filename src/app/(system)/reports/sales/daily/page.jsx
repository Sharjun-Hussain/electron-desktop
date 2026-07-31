import { BRAND } from "@/lib/branding";

import DailySalesSummaryPage from "@/components/reports/sales/daily/DailySalesReport";
import React from "react";

const page = () => {
  return <DailySalesSummaryPage />;
};

export default page;

export const metadata = {
  title: `Sales Report | Sales Insights | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
