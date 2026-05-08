/**
 * Permission Constants
 * 
 * Centralized permission definitions matching backend permission names.
 * Use these constants throughout the app for permission checks.
 */

// Access Management Permissions
export const PERMISSIONS = {
    // Role & Permission Management (Combined in this system)
    PERMISSION_VIEW: "role:view",
    PERMISSION_CREATE: "role:create",
    PERMISSION_EDIT: "role:edit",
    PERMISSION_UPDATE: "role:edit",
    PERMISSION_DELETE: "role:delete",

    // Role Management
    ROLE_VIEW: "role:view",
    ROLE_CREATE: "role:create",
    ROLE_EDIT: "role:edit",
    ROLE_UPDATE: "role:edit",
    ROLE_DELETE: "role:delete",

    // User Management
    USER_VIEW: "user:view",
    USER_CREATE: "user:create",
    USER_EDIT: "user:edit",
    USER_UPDATE: "user:edit",
    USER_DELETE: "user:delete",

    // Branch Management
    BRANCH_VIEW: "branch:view",
    BRANCH_CREATE: "branch:create",
    BRANCH_EDIT: "branch:edit",
    BRANCH_UPDATE: "branch:edit",
    BRANCH_DELETE: "branch:delete",

    // Organization Management
    ORG_VIEW: "org:view",
    ORG_CREATE: "org:create",
    ORG_EDIT: "org:edit",
    ORG_UPDATE: "org:edit",
    ORG_DELETE: "org:delete",

    // Attribute Management
    ATTR_VIEW: "attr:view",
    ATTR_CREATE: "attr:create",
    ATTR_EDIT: "attr:edit",
    ATTR_DELETE: "attr:delete",

    // Unit Management
    UNIT_VIEW: "unit:view",
    UNIT_CREATE: "unit:create",
    UNIT_EDIT: "unit:edit",
    UNIT_DELETE: "unit:delete",
    UNIT_MANAGE: "unit:manage",

    // Container Management
    CONTAINER_VIEW: "container:view",
    CONTAINER_CREATE: "container:create",
    CONTAINER_EDIT: "container:edit",
    CONTAINER_DELETE: "container:delete",

    // Brand Management
    BRAND_VIEW: "brand:view",
    BRAND_CREATE: "brand:create",
    BRAND_EDIT: "brand:edit",
    BRAND_UPDATE: "brand:edit",
    BRAND_DELETE: "brand:delete",
    BRAND_MANAGE: "brand:manage",

    // Product Management
    PRODUCT_VIEW: "product:view",
    PRODUCT_CREATE: "product:create",
    PRODUCT_EDIT: "product:edit",
    PRODUCT_UPDATE: "product:edit",
    PRODUCT_DELETE: "product:delete",
    PRODUCT_VARIANT_STATUS: "product:variant_status",
    
    // Product Variant
    VARIANT_VIEW: "product_variant:view",
    VARIANT_CREATE: "product_variant:create",
    VARIANT_EDIT: "product_variant:edit",

    // Category Management
    CATEGORY_VIEW: "category:view",
    CATEGORY_CREATE: "category:create",
    CATEGORY_EDIT: "category:edit",
    CATEGORY_UPDATE: "category:edit",
    CATEGORY_DELETE: "category:delete",
    CATEGORY_MANAGE: "category:manage",
    CATEGORY_MANAGE_MAIN: "category:manage_main",
    CATEGORY_MANAGE_SUB: "category:manage_sub",

    // Supplier Management
    SUPPLIER_VIEW: "supplier:view",
    SUPPLIER_CREATE: "supplier:create",
    SUPPLIER_EDIT: "supplier:edit",
    SUPPLIER_UPDATE: "supplier:edit",
    SUPPLIER_DELETE: "supplier:delete",

    // Purchase Management
    PURCHASE_VIEW: "purchase:view",
    PURCHASE_CREATE: "purchase:create",
    PURCHASE_EDIT: "purchase:edit",
    PURCHASE_UPDATE: "purchase:edit",
    PURCHASE_DELETE: "purchase:delete",
    PURCHASE_RETURN_VIEW: "purchase_return:view",
    PURCHASE_RETURN_CREATE: "purchase_return:create",

    // Finance Management
    FINANCE_VIEW: "finance:view",
    FINANCE_MANAGE: "finance:manage",
    ACCOUNT_MANAGE: "account:manage",
    CHEQUE_MANAGE: "cheque:manage",

    // Expense Management
    EXPENSE_VIEW: "expense:view",
    EXPENSE_CREATE: "expense:create",
    EXPENSE_EDIT: "expense:edit",
    EXPENSE_UPDATE: "expense:edit",
    EXPENSE_DELETE: "expense:delete",
    EXPENSE_MANAGE: "expense:manage",

    // Sale Management
    SALE_VIEW: "sale:view",
    SALE_CREATE: "sale:create",
    SALE_EDIT: "sale:edit",
    SALE_UPDATE: "sale:edit",
    SALE_DELETE: "sale:delete",
    SALE_RETURN_VIEW: "sale_return:view",
    SALE_RETURN_CREATE: "sale_return:create",
    
    // POS & Shift
    POS_ACCESS: "pos:access",
    SHIFT_VIEW: "shift:view",
    SHIFT_CREATE: "shift:create",
    SHIFT_MANAGE: "shift:manage",

    // Report & System
    REPORT_VIEW: "report:view",
    REPORT_SALES: "report:sales",
    REPORT_INVENTORY: "report:inventory",
    REPORT_FINANCIAL: "report:financial",
    
    SETTINGS_MANAGE: "system:settings",
    SETTINGS_GENERAL: "settings:general:update",
    SETTINGS_BUSINESS: "settings:business:update",
    SETTINGS_POS: "settings:pos:update",
    SETTINGS_COMMUNICATION: "settings:communication:update",
    SETTINGS_IMPORT: "settings:import:update",
    SETTINGS_AI: "settings:ai:update",
    SETTINGS_HEALTH: "settings:health:update",
    SETTINGS_REPORT: "settings:report:update",
    SYSTEM_AUDIT_LOG: "system:audit_log",
    
    // Stock Management
    STOCK_VIEW: "stock:view",
    STOCK_CREATE: "stock:create",
    STOCK_EDIT: "stock:edit",
    STOCK_UPDATE: "stock:edit",
    STOCK_DELETE: "stock:delete",
    STOCK_TRANSFER: "stock:transfer",
    STOCK_ADJUST: "stock:adjust",

    // CRM & WhatsApp
    CRM_VIEW: "crm:view",
    CRM_MANAGE: "crm:manage",

    // Backup Management
    BACKUP_MANUAL: "backup:manual",
    BACKUP_CONFIG: "backup:config",
    BACKUP_ADMIN: "backup:admin",

    // Production & Manufacturing
    PRODUCTION_VIEW: "production:view",
    PRODUCTION_CREATE: "production:create",
    PRODUCTION_EDIT: "production:edit",
    PRODUCTION_DELETE: "production:delete",
    PRODUCTION_MANAGE: "production:manage",
};

// Permission groups for easier management
export const PERMISSION_GROUPS = {
    ACCESS_MANAGEMENT: [
        PERMISSIONS.ROLE_VIEW,
        PERMISSIONS.ROLE_CREATE,
        PERMISSIONS.ROLE_EDIT,
        PERMISSIONS.ROLE_DELETE,
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_EDIT,
        PERMISSIONS.USER_DELETE,
    ],
    BRANCH_MANAGEMENT: [
        PERMISSIONS.BRANCH_VIEW,
        PERMISSIONS.BRANCH_CREATE,
        PERMISSIONS.BRANCH_EDIT,
        PERMISSIONS.BRANCH_DELETE,
    ],
    BRAND_MANAGEMENT: [
        PERMISSIONS.BRAND_VIEW,
        PERMISSIONS.BRAND_CREATE,
        PERMISSIONS.BRAND_EDIT,
        PERMISSIONS.BRAND_DELETE,
    ],
    PRODUCT_MANAGEMENT: [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_EDIT,
        PERMISSIONS.PRODUCT_DELETE,
    ],
    PURCHASE_MANAGEMENT: [
        PERMISSIONS.SUPPLIER_VIEW,
        PERMISSIONS.SUPPLIER_CREATE,
        PERMISSIONS.SUPPLIER_EDIT,
        PERMISSIONS.SUPPLIER_DELETE,
        PERMISSIONS.PURCHASE_VIEW,
        PERMISSIONS.PURCHASE_CREATE,
        PERMISSIONS.PURCHASE_EDIT,
        PERMISSIONS.PURCHASE_DELETE,
    ],
    SETTINGS: [
        PERMISSIONS.SETTINGS_GENERAL,
        PERMISSIONS.SETTINGS_BUSINESS,
        PERMISSIONS.SETTINGS_POS,
        PERMISSIONS.SETTINGS_COMMUNICATION,
        PERMISSIONS.SETTINGS_IMPORT,
        PERMISSIONS.SETTINGS_AI,
        PERMISSIONS.SETTINGS_HEALTH,
        PERMISSIONS.SETTINGS_REPORT,
        PERMISSIONS.BACKUP_MANUAL,
        PERMISSIONS.BACKUP_CONFIG,
    ],
    CRM_MANAGEMENT: [
        PERMISSIONS.CRM_VIEW,
        PERMISSIONS.CRM_MANAGE,
    ],
    PRODUCTION_MANAGEMENT: [
        PERMISSIONS.PRODUCTION_VIEW,
        PERMISSIONS.PRODUCTION_CREATE,
        PERMISSIONS.PRODUCTION_EDIT,
        PERMISSIONS.PRODUCTION_DELETE,
        PERMISSIONS.PRODUCTION_MANAGE,
    ],
};

/**
 * Helper function to generate CRUD permission names for a module
 * @param {string} moduleAlias - Alias of the module (e.g., "user", "product")
 * @returns {Object} Object with view, create, edit, delete permission names
 */
export function generateModulePermissions(moduleAlias) {
    return {
        VIEW: `${moduleAlias}:view`,
        CREATE: `${moduleAlias}:create`,
        EDIT: `${moduleAlias}:edit`,
        DELETE: `${moduleAlias}:delete`,
    };
}

/**
 * Module name aliases for use with permission hook shortcuts
 */
export const MODULES = {
    USER: "user",
    ROLE: "role",
    BRANCH: "branch",
    ORG: "org",
    BRAND: "brand",
    PRODUCT: "product",
    CATEGORY: "category",
    SUPPLIER: "supplier",
    PURCHASE: "purchase",
    SALE: "sale",
    EXPENSE: "expense",
    FINANCE: "finance",
    UNIT: "unit",
    ATTR: "attr",
    CONTAINER: "container",
    CRM: "crm",
    PRODUCTION: "production",
};
