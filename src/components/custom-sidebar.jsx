"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { getImageUrl } from "@/lib/utils";
import {
  Home,
  ShoppingCart,
  Boxes,
  Truck,
  UserCog,
  History,
  Wallet,
  BarChart3,
  LayoutDashboard,
  Sparkles,
  PieChart,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Settings,
  Undo2,
  Frame,
  Origami,
  X,
  Package,
  Layers,
  Barcode,
  Tags,
  Tag,
  Award,
  ClipboardList,
  ArrowLeftRight,
  Ruler,
  Archive,
  Monitor,
  RotateCcw,
  FileText,
  Users,
  FilePlus,
  FileInput,
  Undo,
  Banknote,
  Shapes,
  Book,
  BookOpen,
  UserCheck,
  UserPlus,
  Ticket,
  Lightbulb,
  Zap,
  Building,
  Network,
  UserCircle,
  ShieldAlert,
  Scale,
  MessageCircle,
  MessageSquare,
  Globe,
  Trash2,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { signOut } from "@/components/auth/DesktopAuthProvider";
import { useTranslation } from "@/hooks/useTranslation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CustomSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { hasPermission, hasAnyPermission } = usePermission();
  const { business, general } = useAppSettings();
  const { t } = useTranslation();
  const isRestaurant = (business?.business_type || session?.user?.organization?.business_type || "").toLowerCase() === 'restaurant';

  const sidebarMode = general?.interface?.sidebar || 'fixed';
  const isCollapsed = sidebarMode === 'collapsed';

  const [activeCategory, setActiveCategory] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const sidebarRef = useRef(null);

  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@example.com",
    avatar: session?.user?.image,
    organizationName: session?.user?.organization?.name || business?.name || "Inzeedo",
    branchName: session?.user?.branches?.[0]?.name || "Main Branch",
  };

  const getProfileAvatar = () => {
    return getImageUrl(user.avatar) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
  };

  const sidebarData = {
    primary: [
      {
        title: t("sidebar.dashboard"),
        url: "/",
        icon: LayoutDashboard,
        requiredPermission: null,
        moduleKey: "dashboard_kpi_live",
      },
      {
        title: t("sidebar.inventory"),
        url: "/products",
        icon: Boxes,
        requiredPermission: PERMISSIONS.PRODUCT_VIEW,
        moduleKey: "inventory_basic",
        items: [
          { title: t("sidebar.products"), url: "/products", icon: Package, requiredPermission: PERMISSIONS.PRODUCT_VIEW, moduleKey: "inventory_basic" },
          { title: t("sidebar.product_variants"), url: "/variants", icon: Layers, requiredPermission: PERMISSIONS.PRODUCT_VIEW, moduleKey: "inventory_basic" },
          { title: t("sidebar.barcodes"), url: "/barcode", icon: Barcode, requiredPermission: PERMISSIONS.PRODUCT_VIEW, moduleKey: "barcode_customization" },
          { title: t("sidebar.main_categories"), url: "/main-category", icon: Tags, requiredPermission: PERMISSIONS.CATEGORY_VIEW, moduleKey: "inventory_basic" },
          { title: t("sidebar.sub_categories"), url: "/sub-category", icon: Tag, requiredPermission: PERMISSIONS.CATEGORY_VIEW, moduleKey: "inventory_basic" },
          { title: t("sidebar.brands"), url: "/brand", icon: Award, requiredPermission: PERMISSIONS.BRAND_VIEW, moduleKey: "inventory_basic" },
          { title: t("sidebar.stock_management"), url: "/inventory/stock", icon: ClipboardList, requiredPermission: PERMISSIONS.STOCK_VIEW, moduleKey: "inventory_basic" },
          { title: t("sidebar.stock_transfers"), url: "/inventory/transfers", icon: ArrowLeftRight, requiredPermission: PERMISSIONS.STOCK_VIEW, moduleKey: "inventory_transfers" },
          { title: t("sidebar.base_units"), url: "/units", icon: Ruler, requiredPermission: PERMISSIONS.UNIT_VIEW, moduleKey: "inventory_basic" },
          { title: t("sidebar.measurements"), url: "/unit-measurement", icon: Scale, requiredPermission: PERMISSIONS.UNIT_VIEW, moduleKey: "inventory_basic" },
          { title: t("sidebar.inventory_containers"), url: "/containers", icon: Archive, requiredPermission: PERMISSIONS.UNIT_VIEW, moduleKey: "inventory_basic" },
        ],
      },
      // Manufacturing / Production Section
      ...(business?.business_type === 'Manufacturing' ? [{
        title: "Production",
        url: "/production/orders",
        icon: Origami,
        requiredPermission: PERMISSIONS.PRODUCTION_VIEW,
        items: [
          { title: "Recipes (BOM)", url: "/production/recipes", icon: FileText, requiredPermission: PERMISSIONS.PRODUCTION_VIEW },
          { title: "Production Orders", url: "/production/orders", icon: ClipboardList, requiredPermission: PERMISSIONS.PRODUCTION_VIEW },
          { title: "Raw Materials", url: "/production/raw-materials", icon: Boxes, requiredPermission: PERMISSIONS.PRODUCTION_VIEW },
          { title: "Distributor Management", url: "/distributors", icon: Network, requiredPermission: PERMISSIONS.CUSTOMER_VIEW },
          { title: "Wastage Log", url: "/production/wastage", icon: Trash2, requiredPermission: PERMISSIONS.PRODUCTION_VIEW },
        ]
      }] : []),
      {
        title: t("sidebar.sales"),
        url: "/sales",
        icon: ShoppingCart,
        requiredPermission: PERMISSIONS.SALE_VIEW,
        moduleKey: "pos_billing",
        items: [
          { title: t("sidebar.pos"), url: "/pos", icon: Monitor, requiredPermission: PERMISSIONS.POS_ACCESS, moduleKey: "pos_billing" },
          ...(isRestaurant ? [
            { title: "Floor Plan (Tables)", url: "/dining", icon: Shapes, requiredPermission: PERMISSIONS.POS_ACCESS, moduleKey: "pos_billing" },
            { title: "Kitchen Display (KDS)", url: "/kitchen", icon: Monitor, requiredPermission: PERMISSIONS.POS_ACCESS, moduleKey: "pos_billing" },
          ] : []),
          { title: t("sidebar.sales_history"), url: "/sales", icon: History, requiredPermission: PERMISSIONS.SALE_VIEW, moduleKey: "pos_billing" },
          { title: t("sidebar.sales_return_history"), url: "/sales/returns", icon: RotateCcw, requiredPermission: PERMISSIONS.SALE_VIEW, moduleKey: "pos_billing" },
          { title: t("sidebar.sales_return_report"), url: "/reports/sales/returns", icon: FileText, requiredPermission: PERMISSIONS.REPORT_VIEW, moduleKey: "pos_billing" },
          { title: t("sidebar.customers"), url: "/customers", icon: Users, requiredPermission: PERMISSIONS.CUSTOMER_VIEW, moduleKey: "pos_billing" },
        ],
      },
      {
        title: t("sidebar.purchases"),
        url: "/purchase/suppliers",
        icon: Truck,
        requiredPermission: PERMISSIONS.SUPPLIER_VIEW,
        moduleKey: "inventory_po",
        items: [
          { title: t("sidebar.suppliers"), url: "/purchase/suppliers", icon: Users, requiredPermission: PERMISSIONS.SUPPLIER_VIEW, moduleKey: "inventory_po" },
          { title: t("sidebar.purchase_orders"), url: "/purchase/purchase-orders", icon: FilePlus, requiredPermission: PERMISSIONS.PURCHASE_VIEW, moduleKey: "inventory_po" },
          { title: t("sidebar.grn"), url: "/purchase/grn", icon: FileInput, requiredPermission: PERMISSIONS.PURCHASE_VIEW, moduleKey: "inventory_po" },
          { title: t("sidebar.purchase_returns"), url: "/purchase/returns", icon: Undo, requiredPermission: PERMISSIONS.PURCHASE_VIEW, moduleKey: "inventory_po" },
          { title: "Purchase History Report", url: "/reports/purchase/history", icon: BarChart3, requiredPermission: PERMISSIONS.REPORT_VIEW, moduleKey: "inventory_po" },
        ],
      },
      {
        title: t("sidebar.finance"),
        url: "/expenses",
        icon: Wallet,
        requiredPermission: PERMISSIONS.EXPENSE_VIEW,
        moduleKey: "accounting_basic",
        items: [
          { title: t("sidebar.expense_categories"), url: "/expense-categories", icon: Shapes, requiredPermission: PERMISSIONS.EXPENSE_VIEW, moduleKey: "accounting_basic" },
          { title: t("sidebar.expenses"), url: "/expenses", icon: Banknote, requiredPermission: PERMISSIONS.EXPENSE_VIEW, moduleKey: "accounting_basic" },
          { title: t("sidebar.chart_of_accounts"), url: "/accounting", icon: Book, requiredPermission: PERMISSIONS.FINANCE_VIEW, moduleKey: "accounting_basic" },
          { title: t("sidebar.manual_journal"), url: "/accounting/journal", icon: BookOpen, requiredPermission: PERMISSIONS.FINANCE_MANAGE, moduleKey: "accounting_ledger_manual" },
          { title: t("sidebar.customer_ledgers"), url: "/accounting/customer-ledgers", icon: UserCheck, requiredPermission: PERMISSIONS.FINANCE_VIEW, moduleKey: "accounting_ledger_customer" },
          { title: t("sidebar.supplier_ledgers"), url: "/accounting/supplier-ledgers", icon: UserPlus, requiredPermission: PERMISSIONS.FINANCE_VIEW, moduleKey: "accounting_ledger_supplier" },
          { title: t("sidebar.cheque_management"), url: "/cheques", icon: Ticket, requiredPermission: PERMISSIONS.FINANCE_VIEW, moduleKey: "accounting_basic" },
          { title: t("sidebar.financial_reports"), url: "/accounting/reports", icon: PieChart, requiredPermission: PERMISSIONS.REPORT_VIEW, moduleKey: "accounting_advanced" },
        ],
      },
      {
        title: t("sidebar.reports"),
        url: "/reports",
        icon: BarChart3,
        requiredPermission: PERMISSIONS.REPORT_VIEW,
        moduleKey: "reports_basic",
        items: [
          { title: t("sidebar.inventory_insights"), url: "/inventory-insights", icon: Lightbulb, requiredPermission: PERMISSIONS.PRODUCT_VIEW, moduleKey: "reports_basic" },
          { title: t("sidebar.intelligent_insights"), url: "/reports", icon: Zap, requiredPermission: PERMISSIONS.REPORT_VIEW, moduleKey: "reports_advanced" },
        ]
      },
      // Apps (Shopify & Custom E-Commerce) Section
      ...(business?.shopify_enabled || business?.custom_ecommerce_enabled ? [{
        title: t("sidebar.apps") || "Apps",
        url: business?.shopify_enabled ? "/settings/shopify" : "/settings/custom-ecommerce",
        icon: Globe,
        requiredPermission: PERMISSIONS.SETTINGS_MANAGE,
        items: [
          ...(business?.shopify_enabled ? [{ title: "Shopify Setup", url: "/settings/shopify", icon: Monitor, requiredPermission: PERMISSIONS.SETTINGS_MANAGE }] : []),
          ...(business?.custom_ecommerce_enabled ? [{ title: "Custom E-Commerce", url: "/settings/custom-ecommerce", icon: Store, requiredPermission: PERMISSIONS.SETTINGS_MANAGE }] : []),
        ]
      }] : []),
      // WhatsApp CRM Section
      ...(business?.whatsapp_enabled ? [{
        title: "WhatsApp CRM",
        url: "/crm/whatsapp",
        icon: MessageCircle,
        requiredPermission: PERMISSIONS.CRM_VIEW,
        items: [
          { title: "Templates", url: "/crm/whatsapp", icon: FileText, requiredPermission: PERMISSIONS.CRM_VIEW },
          { title: "CRM Settings", url: "/crm/whatsapp/settings", icon: Settings, requiredPermission: PERMISSIONS.CRM_MANAGE },
        ]
      }] : []),
      // Text.lk SMS Section
      ...(business?.textlk_enabled ? [{
        title: "Text.lk SMS",
        url: "/crm/text-lk",
        icon: Zap,
        requiredPermission: PERMISSIONS.CRM_VIEW,
        items: [
          { title: "Dashboard", url: "/crm/text-lk?tab=dashboard", icon: LayoutDashboard, requiredPermission: PERMISSIONS.CRM_VIEW },
          { title: "Contacts", url: "/crm/text-lk?tab=contacts", icon: Users, requiredPermission: PERMISSIONS.CRM_VIEW },
          { title: "Messaging", url: "/crm/text-lk?tab=messages", icon: MessageSquare, requiredPermission: PERMISSIONS.CRM_VIEW },
          { title: "API Settings", url: "/crm/text-lk?tab=settings", icon: Settings, requiredPermission: PERMISSIONS.CRM_MANAGE },
        ]
      }] : []),
      // System Settings — always last
      {
        title: t("sidebar.system"),
        url: "/settings",
        icon: Settings,
        requiredPermission: PERMISSIONS.SETTINGS_MANAGE,
        items: [
          { title: t("sidebar.global_settings"), url: "/settings", icon: Settings, requiredPermission: PERMISSIONS.SETTINGS_MANAGE },
          // Master-only items — hidden from all tenant organizations
          { title: t("sidebar.business_profiles"), url: "/organizations", icon: Building, requiredPermission: PERMISSIONS.ORG_VIEW, isMasterOnly: true },
          { title: "Subscription Plans", url: "/super-admin/plans", icon: Sparkles, requiredPermission: PERMISSIONS.ORG_VIEW, isMasterOnly: true },
          { title: t("sidebar.branch_hierarchy"), url: "/branches", icon: Network, requiredPermission: PERMISSIONS.BRANCH_VIEW, moduleKey: "multi_location" },
          { title: t("sidebar.application_users"), url: "/users", icon: UserCog, requiredPermission: [PERMISSIONS.USER_VIEW, PERMISSIONS.ROLE_VIEW], moduleKey: "staff_management" },
          { title: t("sidebar.employees"), url: "/employees", icon: UserCircle, requiredPermission: PERMISSIONS.USER_VIEW, moduleKey: "staff_management" },
          { title: t("sidebar.audit_logs"), url: "/audit-logs", icon: ShieldAlert, requiredPermission: PERMISSIONS.AUDIT_LOG_VIEW, moduleKey: "backup_manual" },
          { title: t("sidebar.report_layout") || "Report Layout Design", url: "/report-layout", icon: FileText, requiredPermission: PERMISSIONS.SETTINGS_MANAGE, moduleKey: "invoice_customization" },
        ]
      },
    ]
  };

  const isModuleEnabled = (moduleKey) => {
    if (!moduleKey) return true;

    // 0. Check Master Organization (Full Bypass)
    if (business?.is_master === true) return true;

    // 0b. Explicitly block Accounting for Essential Tier
    if (business?.subscription_tier === 'Essential' && moduleKey.startsWith('accounting')) {
      return false;
    }

    // 0c. Explicitly block Accounting if disabled for this organization
    if (business?.accounting_enabled === false && moduleKey.startsWith('accounting')) {
      return false;
    }

    // 1. Check Overrides (highest priority for per-org customization)
    if (business?.module_overrides && business.module_overrides[moduleKey] !== undefined) {
      return business.module_overrides[moduleKey];
    }

    // 2. Check Plan features (primary path)
    const planFeatures = business?.plan?.features || [];
    if (planFeatures.length > 0) {
      return planFeatures.includes(moduleKey) || planFeatures.includes('all_features');
    }

    // 3. Fallback: derive access from subscription_tier when plan association is missing
    // This prevents a null plan_id from breaking the entire sidebar
    const tier = business?.subscription_tier;
    if (tier === 'Enterprise') return true; // Enterprise = all features
    if (tier === 'Professional') {
      const proFeatures = [
        'dashboard_kpi_live', 'dashboard_health', 'dashboard_custom', 'reports_basic',
        'reports_advanced', 'pos_billing', 'pos_advanced', 'invoice_customization',
        'pos_payments', 'pos_offline', 'inventory_basic', 'inventory_advanced',
        'inventory_ledger', 'inventory_po', 'inventory_transfers', 'accounting_basic',
        'accounting_advanced', 'accounting_ledger_manual', 'accounting_ledger_supplier',
        'accounting_ledger_customer', 'accounting_reconciliation', 'staff_management',
        'multi_location', 'barcode_customization', 'backup_manual', 'data_export'
      ];
      return proFeatures.includes(moduleKey);
    }
    if (tier === 'Essential') {
      const essentialFeatures = [
        'pos_billing', 'inventory_basic', 'inventory_po',
        'barcode_customization', 'reports_basic',
        'dashboard_kpi_live', 'dashboard_health'
      ];
      return essentialFeatures.includes(moduleKey);
    }

    return false;
  };

  const filterItems = (items) => {
    return items
      .map((item) => {
        // Check Master-only restriction on parent item
        if (item.isMasterOnly && business?.is_master !== true) return null;

        // Check module availability for parent item
        if (item.moduleKey && !isModuleEnabled(item.moduleKey)) return null;

        if (item.items) {
          const filteredSubItems = item.items.filter((subItem) => {
            // Check Master-only restriction on sub-item
            if (subItem.isMasterOnly && business?.is_master !== true) return false;

            // Check module availability for sub-item
            if (subItem.moduleKey && !isModuleEnabled(subItem.moduleKey)) return false;

            if (!subItem.requiredPermission) return true;
            if (Array.isArray(subItem.requiredPermission)) {
              return hasAnyPermission(subItem.requiredPermission);
            }
            return hasPermission(subItem.requiredPermission);
          });
          if (filteredSubItems.length === 0) return { ...item, items: null };
          return { ...item, items: filteredSubItems };
        }

        if (!item.requiredPermission) return item;
        if (Array.isArray(item.requiredPermission)) {
          return hasAnyPermission(item.requiredPermission) ? item : null;
        }
        return hasPermission(item.requiredPermission) ? item : null;
      })
      .filter(Boolean);
  };

  const filteredPrimary = filterItems(sidebarData.primary);

  const handleCategoryClick = (category) => {
    if (category.items) {
      if (activeCategory?.title === category.title) {
        setIsPanelOpen(!isPanelOpen);
      } else {
        setActiveCategory(category);
        setIsPanelOpen(true);
      }
    } else {
      setIsPanelOpen(false);
      setActiveCategory(category);
      if (category.url) {
        router.push(category.url);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={sidebarRef} className="flex h-screen sticky top-0 z-50 gap-0 transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] group/sidebar overflow-visible">
      <aside 
        id="sidebar-main" 
        className={cn(
          "flex flex-col items-center py-6 bg-(--sidebar-bg-custom) border-r border-sidebar-border/40 z-50 relative pointer-events-auto shrink-0 transition-all duration-500 ease-in-out",
          isCollapsed ? "w-20" : "w-30"
        )}
      >
        <div className="mb-8 flex shrink-0">
          <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <Sparkles className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <nav className="flex-1 w-full  flex flex-col gap-1 overflow-y-auto thin-scrollbar items-center">
          {filteredPrimary.map((item) => {
            // 1. Find all possible matches for this specific item and its sub-items
            const matches = [];
            const itemUrlBase = item.url.split("?")[0];
            if (pathname === itemUrlBase || pathname.startsWith(`${itemUrlBase}/`)) {
              matches.push(itemUrlBase);
            }
            if (item.items) {
              item.items.forEach(sub => {
                const subUrlBase = sub.url.split("?")[0];
                if (pathname === subUrlBase || pathname.startsWith(`${subUrlBase}/`)) {
                  matches.push(subUrlBase);
                }
              });
            }

            // 2. Find the best (longest) match across the ENTIRE sidebar to ensure only one item is "Active"
            // We compare the longest match for this item against the longest match possible in the whole sidebar
            const thisItemLongestMatch = matches.sort((a, b) => b.length - a.length)[0] || "";

            const allPossibleMatches = filteredPrimary.flatMap(p => {
              const pMatches = [];
              const pUrlBase = p.url.split("?")[0];
              if (pathname === pUrlBase || pathname.startsWith(`${pUrlBase}/`)) pMatches.push(pUrlBase);
              if (p.items) {
                p.items.forEach(s => {
                  const sUrlBase = s.url.split("?")[0];
                  if (pathname === sUrlBase || pathname.startsWith(`${sUrlBase}/`)) pMatches.push(sUrlBase);
                });
              }
              return pMatches;
            });
            const globalLongestMatch = allPossibleMatches.sort((a, b) => b.length - a.length)[0] || "";

            // An item is active only if its longest match is the best match overall
            const isActive = thisItemLongestMatch !== "" && thisItemLongestMatch === globalLongestMatch;
            const isSelected = activeCategory?.title === item.title;

            return (
              <TooltipProvider key={item.title} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      id={
                        item.url === "/products" ? "sidebar-inventory" :
                          item.url === "/purchase/suppliers" ? "sidebar-purchases" :
                            item.url === "/reports" ? "sidebar-reports" : undefined
                      }
                      onClick={() => handleCategoryClick(item)}
                      className={cn(
                        "w-16 group relative flex flex-col items-center justify-center py-3 px-1 transition-all duration-300 rounded-xl mb-1 outline-none",
                        isActive ? "bg-emerald-500/10 text-emerald-600" :
                          isSelected ? "text-emerald-600/70" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("size-6 transition-transform group-hover:scale-105", isCollapsed ? "" : "mb-1.5", isActive ? "text-emerald-600" : isSelected ? "text-emerald-600/70" : "text-muted-foreground group-hover:text-foreground")} />
                      {!isCollapsed && (
                        <span className={cn("text-[9px] font-bold text-center leading-none px-1 transition-all duration-300", isActive ? "text-emerald-600" : isSelected ? "text-emerald-600/70" : "text-muted-foreground group-hover:text-foreground transition-colors")}>
                          {item.title}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" sideOffset={10} className="bg-emerald-600 text-white border-none font-bold text-[10px] uppercase tracking-wider px-3 py-1.5">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 shrink-0 px-2 pb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative h-10 w-10 outline-none group">
                <div className="size-full rounded-xl overflow-hidden border border-border group-hover:border-emerald-500/50 transition-all shadow-sm">
                  <div className="size-full bg-muted flex items-center justify-center text-foreground text-xs font-bold">
                    <img
                      src={getProfileAvatar()}
                      alt={user.name}
                      className="size-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                      }}
                    />
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-background z-10 shadow-sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" sideOffset={20} className="w-56 rounded-xl p-2 bg-card border border-border shadow-md">
              <div className="px-2 py-3 border-b border-border mb-2">
                <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate mb-1">{user.email}</p>

                <div className="flex flex-col gap-1 mt-2 border-t border-border/50 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                    <Building className="size-3" />
                    {user.organizationName}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    <Store className="size-3" />
                    {user.branchName}
                  </div>
                </div>
              </div>

              <DropdownMenuItem
                onClick={() => router.push('/profile')}
                className="cursor-pointer rounded-lg p-3 text-xs font-bold gap-3 text-foreground hover:bg-muted mb-1"
              >
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                {t("sidebar.profile")}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-lg p-3 text-xs font-bold gap-3"
              >
                <LogOut className="h-4 w-4" />
                {t("sidebar.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Sidebar Panel */}
      <div
        className={cn(
          "h-full bg-background transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] z-40 overflow-hidden border-l border-border shrink-0",
          isPanelOpen ? "w-64 opacity-100 pl-0 shadow-xl" : "w-0 opacity-0 pl-0"
        )}
      >
        <div className="flex flex-col h-full py-8 px-5 w-64">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[11px] font-bold text-foreground">{activeCategory?.title}</h2>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto thin-scrollbar pr-1">
            <div className="space-y-1.5">
              {(() => {
                const allPossibleMatches = filteredPrimary.flatMap(p => {
                  const pMatches = [];
                  const pUrlBase = p.url.split("?")[0];
                  if (pathname === pUrlBase || pathname.startsWith(`${pUrlBase}/`)) pMatches.push(pUrlBase);
                  if (p.items) {
                    p.items.forEach(s => {
                      const sUrlBase = s.url.split("?")[0];
                      if (pathname === sUrlBase || pathname.startsWith(`${sUrlBase}/`)) pMatches.push(sUrlBase);
                    });
                  }
                  return pMatches;
                });
                const globalLongestMatch = allPossibleMatches.sort((a, b) => b.length - a.length)[0] || "";

                return activeCategory?.items?.map((sub) => {
                  const subUrlBase = sub.url.split("?")[0];
                  let isActive = subUrlBase === globalLongestMatch && (pathname === subUrlBase || pathname.startsWith(`${subUrlBase}/`));

                  if (isActive && sub.url.includes("?")) {
                    const params = new URLSearchParams(sub.url.split("?")[1]);
                    const targetTab = params.get("tab");
                    const currentTab = searchParams ? searchParams.get("tab") : null;
                    if (targetTab) {
                      isActive = (currentTab === targetTab) || (!currentTab && targetTab === "dashboard");
                    }
                  } else if (isActive && !sub.url.includes("?") && pathname === "/crm/text-lk") {
                    const currentTab = searchParams ? searchParams.get("tab") : null;
                    if (currentTab && currentTab !== "dashboard") {
                      isActive = false;
                    }
                  }

                  return (
                    <Link
                      key={sub.title}
                      id={sub.url === "/pos" ? "sidebar-pos-link" : undefined}
                      href={sub.url}
                      onClick={() => {
                        if (window.innerWidth < 1024) setIsPanelOpen(false);
                      }}
                      className={cn(
                        "flex items-center h-11 px-4 rounded-xl transition-all duration-300 group",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-foreground hover:bg-muted font-semibold"
                      )}
                    >
                      {sub.icon && (
                        <sub.icon className={cn("size-4 mr-3 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                      )}
                      <span className="text-[13px]">{sub.title}</span>
                      <ChevronRight className={cn("size-3.5 ml-auto transition-transform", isActive ? "translate-x-1" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1")} />
                    </Link>
                  );
                });
              })()}
            </div>
          </div>

          {/* Business Name Branding */}
          <div className="mt-auto pt-6 border-t border-border flex items-center gap-3">
            <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-foreground truncate">{user.organizationName}</span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">{user.branchName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

