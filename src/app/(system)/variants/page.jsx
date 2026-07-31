import { BRAND } from "@/lib/branding";
import ProductVariantsPage from "@/components/variants/product-variant-management";
import React from "react";

const page = () => {
  return <ProductVariantsPage />;
};

export default page;

export const metadata = {
  title: `Products Variants | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
