import { BRAND } from "@/lib/branding";

import SalesBySupplierPage from "@/components/reports/sales/supplier/SalesBySupplierReport";
import React from "react";

const page = () => {
  return <SalesBySupplierPage />;
};  

export default page;

export const metadata = {
  title: `Sales Report | Sales By Supplier | ${BRAND.PAGE_TITLE_SUFFIX}  `,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
