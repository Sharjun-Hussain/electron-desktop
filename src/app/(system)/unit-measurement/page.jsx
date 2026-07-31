import { BRAND } from "@/lib/branding";
import MeasurementUnitPage from "@/components/unit-measurement/unit-measurement-management";
import React from "react";

const page = () => {
  return <MeasurementUnitPage />;
};

export default page;

export const metadata = {
  title: `Unit Measurement | ${BRAND.PAGE_TITLE_SUFFIX}  `,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
