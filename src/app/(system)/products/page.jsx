import { BRAND } from "@/lib/branding";
import ProductsPage from "@/components/products/product-management";
import React from "react";

const page = () => {
  return <ProductsPage />;
};

export default page;

export const metadata = {
  title: `Products Inventory | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
