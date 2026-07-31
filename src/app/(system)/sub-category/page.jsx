import { BRAND } from "@/lib/branding";
import SubCategoryPage from "@/components/sub-category/sub-category-management";
import React from "react";

const page = () => {
  return <SubCategoryPage />;
};

export default page;

export const metadata = {
  title: `Sub-Category Management | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Manage granular product sub-categories to maintain a perfectly organized and searchable inventory catalog.",
};
