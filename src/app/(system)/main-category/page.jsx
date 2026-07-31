import { BRAND } from "@/lib/branding";
import MainCategoryPage from "@/components/main-category/main-category-management";
import React from "react";

const page = () => {
  return <MainCategoryPage />;
};

export default page;

export const metadata = {
  title: `Category Management | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Organize and manage your product categories efficiently with the ${BRAND.APP_NAME} POS high-performance catalog system.`,
};
