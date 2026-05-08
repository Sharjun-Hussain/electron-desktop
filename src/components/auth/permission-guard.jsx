"use client";

import { usePermission } from "@/hooks/use-permission";

export const PermissionGuard = ({
  permission,
  children,
  fallback = null,
  requireAll = false,
}) => {
  const { hasPermission, isLoaded } = usePermission();

  if (!isLoaded) return null; // Or a skeleton?

  if (!permission) return children;

  const permissions = Array.isArray(permission) ? permission : [permission];

  const isAuthorized = requireAll
    ? permissions.every((p) => hasPermission(p))
    : permissions.some((p) => hasPermission(p));

  if (isAuthorized) {
    return children;
  }

  return fallback;
};
