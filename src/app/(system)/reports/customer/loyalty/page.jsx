import { BRAND } from "@/lib/branding";
import LoyaltyReport from "@/components/reports/loyalty/LoyaltyReport";
import React from "react";

const page = () => {
  return <LoyaltyReport />;
};

export default page;

export const metadata = {
  title: `Loyalty Report | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Customer loyalty points and redemption audit report.",
};
