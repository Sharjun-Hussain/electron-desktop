import { BRAND } from "@/lib/branding";
import DirectGRNPage from "@/components/purchase/grn/DirectGrnMainPage";
import React from "react";

const page = () => {
  return <DirectGRNPage />;
};

export default page;

export const metadata = {
  title: `Direct GRN | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Create a Direct Goods Received Note",
};
