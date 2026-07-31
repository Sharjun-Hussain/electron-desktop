import { BRAND } from "@/lib/branding";

import InventoryInsightsDashboard from "@/components/inventory/InventoryInsightsDashboard";
import React from "react";

const page = () => {
  return <InventoryInsightsDashboard />;
};

export default page;

export const metadata = {
  title: `Inventory Intelligence | One Eye View | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Real-time product status and stock alerts dashboard.",
};
