import { BRAND } from "@/lib/branding";
import ProfilePage from "@/components/profile/ProfilePage";
import React from "react";

export const metadata = {
  title: `My Profile | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Update your name, profile photo, and password.",
};

const page = () => {
  return <ProfilePage />;
};

export default page;
