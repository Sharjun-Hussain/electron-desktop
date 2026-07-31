import { BRAND } from "@/lib/branding";
import EmployeesPage from "@/components/employees/employee-management";
import React from "react";

const page = () => {
  return <EmployeesPage />;
};

export default page;

export const metadata = {
  title: `Employees | ${BRAND.PAGE_TITLE_SUFFIX}  `,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
