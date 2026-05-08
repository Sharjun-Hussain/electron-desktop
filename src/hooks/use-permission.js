"use client";

import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useCallback, useMemo } from "react";

export function usePermission() {
    const { data: session } = useSession();

    const userPermissions = useMemo(() => {
        if (!session?.user?.permissions) return new Set();
        return new Set(session.user.permissions);
    }, [session]);

    const userRoles = useMemo(() => {
        if (!session?.user?.roles) return new Set();
        return new Set(session.user.roles);
    }, [session]);

    const hasPermission = useCallback(
        (permissionName) => {
            // Super Admin bypass
            if (userRoles.has("Super Admin")) return true;

            // Direct match
            if (userPermissions.has(permissionName)) return true;

            // Wildcard match (* or module:*)
            return Array.from(userPermissions).some((perm) => {
                if (perm === "*") return true;
                if (perm.endsWith(":*")) {
                    const module = perm.split(":")[0];
                    return permissionName.startsWith(`${module}:`);
                }
                return false;
            });
        },
        [userPermissions, userRoles]
    );

    const hasRole = useCallback(
        (roleName) => {
            return userRoles.has(roleName);
        },
        [userRoles]
    );

    // Check if user has ANY of the provided permissions
    const hasAnyPermission = useCallback(
        (permissionNames) => {
            if (!Array.isArray(permissionNames)) return false;
            // Super Admin bypass
            if (userRoles.has("Super Admin")) return true;

            return permissionNames.some((name) => hasPermission(name));
        },
        [hasPermission, userRoles]
    );

    // Check if user has ALL of the provided permissions
    const hasAllPermissions = useCallback(
        (permissionNames) => {
            if (!Array.isArray(permissionNames)) return false;
            // Super Admin bypass
            if (userRoles.has("Super Admin")) return true;

            return permissionNames.every((name) => hasPermission(name));
        },
        [hasPermission, userRoles]
    );

    // CRUD operation shortcuts
    const canView = useCallback(
        (moduleName) => {
            return hasPermission(`${moduleName.toLowerCase()}:view`);
        },
        [hasPermission]
    );

    const canCreate = useCallback(
        (moduleName) => {
            return hasPermission(`${moduleName.toLowerCase()}:create`);
        },
        [hasPermission]
    );

    const canUpdate = useCallback(
        (moduleName) => {
            return hasPermission(`${moduleName.toLowerCase()}:edit`);
        },
        [hasPermission]
    );

    const canDelete = useCallback(
        (moduleName) => {
            return hasPermission(`${moduleName.toLowerCase()}:delete`);
        },
        [hasPermission]
    );

    return {
        hasPermission,
        hasRole,
        hasAnyPermission,
        hasAllPermissions,
        canView,
        canCreate,
        canUpdate,
        canDelete,
        isLoaded: !!session,
        userPermissions: Array.from(userPermissions),
        userRoles: Array.from(userRoles),
    };
}
