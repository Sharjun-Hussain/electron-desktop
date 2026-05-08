import RawMaterialUsageReport from "@/components/reports/manufacturing/RawMaterialUsageReport";
import React from "react";

const page = () => {
  return <RawMaterialUsageReport />;
};

export default page;

export const metadata = {
  title: "Raw Material Usage Report | Manufacturing | Inzeedo POS",
  description: "Analysis of raw material consumption and costs in production.",
};
