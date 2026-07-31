import { BRAND } from "@/lib/branding";

import SoldItemCountPage from "@/components/reports/sales/item-count/SoldItemCount";
import React from "react";

const page = () => {
  return <SoldItemCountPage />;
};

export default page;

export const metadata = {
  title: `Sales by Item Count | Sales Insights | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
