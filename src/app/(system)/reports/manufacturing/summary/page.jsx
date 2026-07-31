import { BRAND } from "@/lib/branding";
import ProductionSummaryReport from "@/components/reports/manufacturing/ProductionSummaryReport";
import React from "react";

const page = () => {
  return <ProductionSummaryReport />;
};

export default page;

export const metadata = {
  title: `Production Summary Report | Manufacturing | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Detailed overview of manufacturing batches and yields.",
};
