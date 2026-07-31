import { BRAND } from "@/lib/branding";
import ContainerPage from "@/components/containers/container-management";
import React from "react";

const page = () => {
  return <ContainerPage />;
};

export default page;

export const metadata = {
  title: `Containers | ${BRAND.PAGE_TITLE_SUFFIX}  `,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
