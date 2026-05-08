

export const ROLE_PERMISSIONS = {
  super_admin: [
    "manage_branches",
    "manage_users",
    "manage_products",
    "manage_inventory",
    "process_sales",
    "view_reports",
    "manage_customers",
    "manage_settings",
    "transfer_inventory",
    "manage_pricing",
    "generate_qr",
    "customize_prints",
  ],
  client_admin: [
    "manage_branches",
    "manage_users",
    "manage_products",
    "manage_inventory",
    "process_sales",
    "view_reports",
    "manage_customers",
    "manage_settings",
    "transfer_inventory",
    "manage_pricing",
    "generate_qr",
    "customize_prints",
  ],
  branch_manager: [
    "manage_users",
    "manage_products",
    "manage_inventory",
    "process_sales",
    "view_reports",
    "manage_customers",
    "transfer_inventory",
    "manage_pricing",
    "generate_qr",
  ],
  inventory_manager: ["manage_products", "manage_inventory", "view_reports", "transfer_inventory", "generate_qr"],
  cashier: ["process_sales", "manage_customers"],
  accountant: ["view_reports"],
}

export function hasPermission(userRole, permission, customPermissions) {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  const allPermissions = [...rolePermissions, ...(customPermissions || [])]
  return allPermissions.includes(permission)
}

export function canAccessRoute(userRole, route, customPermissions) {
  const routePermissions = {
    "/pos": "process_sales",
    "/products": "manage_products",
    "/inventory": "manage_inventory",
    "/customers": "manage_customers",
    "/analytics": "view_reports",
    "/branches": "manage_branches",
    "/users": "manage_users",
    "/settings": "manage_settings",
    "/permissions": "manage_users", // Added permissions route mapping
    "/qr-generator": "generate_qr",
    "/print-templates": "customize_prints",
  }

  const requiredPermission = routePermissions[route]
  if (!requiredPermission) return true

  return hasPermission(userRole, requiredPermission, customPermissions)
}

export function checkMultiplePermissions(
  userRole,
  permissions,
  customPermissions,
) {
  return permissions.some((permission) => hasPermission(userRole, permission, customPermissions))
}

export function hasHigherRole(userRole, targetRole) {
  const roleHierarchy = {
    super_admin: 6,
    client_admin: 5,
    branch_manager: 4,
    inventory_manager: 3,
    accountant: 2,
    cashier: 1,
  }

  return (roleHierarchy[userRole] || 0) > (roleHierarchy[targetRole] || 0)
}
