"use client";

import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";

/**
 * ProtectedButton - Button that automatically hides based on permissions
 * 
 * @param {string|string[]} permission - Single permission or array of permissions (ANY match renders button)
 * @param {boolean} disabled - Additional disabled state
 * @param {ReactNode} children - Button content
 * @param {object} props - All other Button props
 */
export function ProtectedButton({
    permission,
    disabled = false,
    children,
    ...props
}) {
    const { hasPermission, hasAnyPermission, isLoaded } = usePermission();

    // Wait for session to load
    if (!isLoaded) {
        return null;
    }

    let hasAccess = false;

    if (Array.isArray(permission)) {
        hasAccess = hasAnyPermission(permission);
    } else if (permission) {
        hasAccess = hasPermission(permission);
    } else {
        // No permission specified, show button
        hasAccess = true;
    }

    // Don't render button if user lacks permission
    if (!hasAccess) {
        return null;
    }

    return (
        <Button disabled={disabled} {...props}>
            {children}
        </Button>
    );
}
