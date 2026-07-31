import { BRAND } from "@/lib/branding";

import SalesReturnReport from "@/components/reports/sales/returns/SalesReturnReport";
import React from "react";

const page = () => {
  return <SalesReturnReport />;
};

export default page;

export const metadata = {
  title: `Sales Return Analysis | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Advanced analytical report for sales returns",
};
