import ProductionSummaryReport from "@/components/reports/manufacturing/ProductionSummaryReport";
import React from "react";

const page = () => {
  return <ProductionSummaryReport />;
};

export default page;

export const metadata = {
  title: "Production Summary Report | Manufacturing | Inzeedo POS",
  description: "Detailed overview of manufacturing batches and yields.",
};
