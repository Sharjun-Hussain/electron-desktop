import { BRAND } from "@/lib/branding";
import UnitsPage from "@/components/units/units-management";
import React from "react";

const page = () => {
  return <UnitsPage />;
};

export default page;

export const metadata = {
  title: `Units | ${BRAND.PAGE_TITLE_SUFFIX}  `,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
