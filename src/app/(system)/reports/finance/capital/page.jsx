import { BRAND } from "@/lib/branding";

import CapitalBalancePage from "@/components/reports/finance/capital/CapitalBalance";
import React from "react";

const page = () => {
  return <CapitalBalancePage />;
};

export default page;

export const metadata = {
  title: `Capital Balance | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
