import { BRAND } from "@/lib/branding";
// import OrganizationsPage from "@/components/organizations/organizations-management";
import OrganizationPage from "@/components/organizations/organization-management";
import React from "react";

const page = () => {
  return <OrganizationPage />;
};

export default page;

export const metadata = {
  title: `Organizations | ${BRAND.PAGE_TITLE_SUFFIX}  `,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
