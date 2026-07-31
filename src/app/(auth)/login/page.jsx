import { BRAND } from "@/lib/branding";
import LoginPage from "@/components/login/login";
import { LoaderIcon } from "lucide-react";
import React, { Suspense } from "react";

const Login = () => {
  return <LoginPage />;
};
export default Login;

export const metadata = {
  title: `Login | ${BRAND.PAGE_TITLE_SUFFIX}  `,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};
