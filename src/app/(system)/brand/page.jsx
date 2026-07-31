import { BRAND } from "@/lib/branding";
import BrandPage from "@/components/brand/brand-management";
import React from "react";

const page = () => {
  return <BrandPage />;
};

export default page;

export const metadata = {
  title: `Brand Management | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Track and organize your manufacturers and label brands within the ${BRAND.APP_NAME} POS centralized catalog.`,
};
