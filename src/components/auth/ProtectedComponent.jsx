"use client";

import { usePermission } from "@/hooks/use-permission";

/**
 * ProtectedComponent - Conditionally render children based on permissions
 * 
 * @param {string|string[]} permission - Single permission or array of permissions
 * @param {boolean} requireAll - If true, user must have ALL permissions. If false, ANY permission is enough (default: false)
 * @param {ReactNode} children - Content to render if permission check passes
 * @param {ReactNode} fallback - Optional content to render if permission check fails
 * @param {boolean} hideIfUnauthorized - If true, render nothing when unauthorized (default: true)
 */
export function ProtectedComponent({
    permission,
    requireAll = false,
    children,
    fallback = null,
    hideIfUnauthorized = true,
}) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isLoaded } =
        usePermission();

    // Wait for session to load
    if (!isLoaded) {
        return null;
    }

    let hasAccess = false;

    if (Array.isArray(permission)) {
        hasAccess = requireAll
            ? hasAllPermissions(permission)
            : hasAnyPermission(permission);
    } else if (permission) {
        hasAccess = hasPermission(permission);
    } else {
        // No permission specified, render children
        hasAccess = true;
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    // User doesn't have permission
    if (hideIfUnauthorized) {
        return null;
    }

    return <>{fallback}</>;
}
