import { BRAND } from "@/lib/branding";

import StockTransferReportPage from "@/components/reports/stocks/transfer/StockTransferReport";
import React from "react";

const page = () => {
  return <StockTransferReportPage />;
};

export default page;

export const metadata = {
  title: `Stock Report | Transfers History | ${BRAND.PAGE_TITLE_SUFFIX}  `,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
