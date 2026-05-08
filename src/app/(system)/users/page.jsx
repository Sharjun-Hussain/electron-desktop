import UserManagement from "@/components/users-roles/UserRoleMainPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";
import React from "react";

const page = () => {
  return (
    <ProtectedRoute
      permission={[
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.ROLE_VIEW,
        PERMISSIONS.PERMISSION_VIEW,
      ]}
      requireAll={false}
    >
      <UserManagement />
    </ProtectedRoute>
  );
};

export default page;

export const metadata = {
  title: "User Management | Inzeedo POS",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
