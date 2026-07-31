import { BRAND } from "@/lib/branding";
import { SettingsPage } from "@/components/settings/settings-page";
import React from "react";

const page = () => {
  return <SettingsPage />;
};

export default page;

export const metadata = {
  title: `Settings | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
