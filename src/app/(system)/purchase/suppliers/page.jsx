import { BRAND } from "@/lib/branding";
import SupplierPage from "@/components/purchase/suppliers/supplier-management";
import React from "react";

const page = () => {
  return <SupplierPage />;
};

export default page;

export const metadata = {
  title: `Suppliers | ${BRAND.PAGE_TITLE_SUFFIX}  `,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
