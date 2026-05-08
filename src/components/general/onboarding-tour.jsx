"use client";

import { usePathname } from "next/navigation";
import { useOnboarding } from "@/hooks/use-onboarding";

// Define steps outside to keep them stable across renders
const TOURS = {
  "/": [
    {
      element: "#dashboard-notifications",
      popover: {
        title: "Notification Center",
        description: "Stay updated with real-time alerts for low stock, expiring batches, and system updates.",
        position: "bottom"
      }
    },
    {
      element: "#dashboard-theme-toggle",
      popover: {
        title: "Interface Comfort",
        description: "Switch between Dark and Light modes instantly to suit your lighting environment.",
        position: "bottom"
      }
    },
    {
      element: "#dashboard-user-menu",
      popover: {
        title: "Personal Profile",
        description: "Manage your account, change your password, and logout securely here.",
        position: "bottom"
      }
    },
    {
      element: "#stats-revenue",
      popover: {
        title: "Financial Pulse",
        description: "Track your Today's Revenue and see how it compares to your daily averages in real-time.",
        position: "bottom"
      }
    },
    {
      element: "#stats-invoices",
      popover: {
        title: "Pending Invoices",
        description: "Monitor your active sales files and invoices that require attention or finalization.",
        position: "bottom"
      }
    },
    {
      element: "#stats-inventory",
      popover: {
        title: "Inventory Health",
        description: "Monitor products that are falling below safety levels. Click here to restock.",
        position: "bottom"
      }
    },
    {
      element: "#stats-expiring",
      popover: {
        title: "Expiry Alerts",
        description: "Critically important: See batches that are about to expire so you can manage waste.",
        position: "bottom"
      }
    },
    {
      element: "#stats-customers",
      popover: {
        title: "Customer Growth",
        description: "Track your new customer acquisitions and total growth within the current period.",
        position: "bottom"
      }
    },
    {
      element: "#quick-pos",
      popover: {
        title: "Point of Sale",
        description: "Jump straight into the sales terminal to start a new transaction instantly.",
        position: "top"
      }
    },
    {
      element: "#quick-inventory",
      popover: {
        title: "Inventory Management",
        description: "Manage your product catalog, categories, and brands from here.",
        position: "top"
      }
    },
    {
      element: "#quick-reports",
      popover: {
        title: "Analytics Hub",
        description: "Access high-level reports on profit, loss, and item performance.",
        position: "top"
      }
    },
    {
      element: "#quick-purchase",
      popover: {
        title: "Purchase Orders",
        description: "Create and manage orders to your suppliers to maintain stock levels.",
        position: "top"
      }
    },
    {
      element: "#quick-employee",
      popover: {
        title: "Staff Management",
        description: "Manage your team members, their permissions, and roles.",
        position: "top"
      }
    },
    {
      element: "#quick-barcodes",
      popover: {
        title: "Barcode Printing",
        description: "Generate and print professional barcodes for your product labels.",
        position: "top"
      }
    },
    {
      element: "#quick-settings",
      popover: {
        title: "System Settings",
        description: "Configure your business identity, preferences, and onboarding options.",
        position: "top"
      }
    },
    {
      element: "#dashboard-quick-access",
      popover: {
        title: "Unlock Full Power",
        description: "While the sidebar isn't visible on this root page, simply click any of these 'Quick Access' buttons to go deep inside the app. Once inside, you'll find the full sidebar navigation and complete system setup waiting for you!",
        position: "top"
      }
    },
    {
      element: "#quick-inventory",
      popover: {
        title: "Ready to Explore?",
        description: "Great start! Please click on the Inventory shortcut here to continue your training in the stock module.",
        position: "top"
      }
    }
  ],
  "/products": [
    {
      element: "#sidebar-main",
      popover: {
        title: "Navigation Center",
        description: "On system pages, this sidebar allows you to navigate between modules easily.",
        position: "right"
      }
    },
    {
      element: "#inventory-search",
      popover: {
        title: "Product Search",
        description: "Instantly find any item in your catalog by its name, SKU, or barcode.",
        position: "bottom"
      }
    },
    {
      element: "#inventory-add-product",
      popover: {
        title: "New Product Creation",
        description: "Add new items to your inventory, including images, variants, and pricing rules.",
        position: "bottom"
      }
    },
    {
      element: "#inventory-opening-stock",
      popover: {
        title: "Opening Stock",
        description: "Initialize your starting stock levels for new products or during setup.",
        position: "bottom"
      }
    },
    {
      element: "#inventory-bulk-actions",
      popover: {
        title: "Bulk Actions",
        description: "Select multiple items to activate, deactivate, or delete them all at once.",
        position: "bottom"
      }
    },
    {
      element: "#inventory-export",
      popover: {
        title: "Data Export",
        description: "Download your entire product catalog as an Excel or PDF file for external reporting.",
        position: "bottom"
      }
    },
    {
      element: "#inventory-sort",
      popover: {
        title: "Smart Sorting",
        description: "Organize your view by newest entries, alphabetical order, or price.",
        position: "bottom"
      }
    },
    {
      element: "#inventory-view-list",
      popover: {
        title: "Grid & List Views",
        description: "Switch between a detailed list view and a visual grid view with product images.",
        position: "bottom"
      }
    },
    {
      element: "#inventory-grid",
      popover: {
        title: "Inventory Master",
        description: "You've mastered the inventory! You can now manage complex stock structures with ease.",
        position: "top"
      }
    },
    {
      element: "#sidebar-main",
      popover: {
        title: "Almost Done!",
        description: "Please click on the Sales category in the sidebar, then select 'POS' to finish your training.",
        position: "right"
      }
    }
  ],
  "/pos": [
    {
      element: "#pos-start-shift-btn",
      popover: {
        title: "Initialize Register",
        description: "Declare your opening cash float to begin your operational shift.",
        position: "bottom"
      }
    },
    {
      element: "#pos-theme-toggle",
      popover: {
        title: "Night Mode",
        description: "Switch to Dark Mode during late-night shifts to reduce eye strain.",
        position: "bottom"
      }
    },
    {
      element: "#pos-branch-selector",
      popover: {
        title: "Multi-Branch Context",
        description: "If you have permissions, you can switch between different branches instantly.",
        position: "bottom"
      }
    },
    {
      element: "#pos-end-shift",
      popover: {
        title: "Shift Closure",
        description: "At the end of your shift, perform a Z-Read here to reconcile your cash drawer.",
        position: "bottom"
      }
    },
    {
      element: "#pos-customer-selector",
      popover: {
        title: "Customer Context",
        description: "Select an existing customer or create a new profile. Defaults to 'Walking Customer'.",
        position: "bottom"
      }
    },
    {
      element: "#pos-search-bar",
      popover: {
        title: "Rapid Product Search",
        description: "Scan a barcode or type a name to instantly add items to the cart.",
        position: "bottom"
      }
    },
    {
      element: "#pos-view-toggle",
      popover: {
        title: "Grid vs. List",
        description: "Switch between a visual product grid and a high-speed list view.",
        position: "bottom"
      }
    },
    {
      element: "#pos-layout-handle",
      popover: {
        title: "Resize Workspace",
        description: "Drag this handle to adjust the balance between your Product Catalog and the Cart.",
        position: "right"
      }
    },
    {
      element: "#pos-terminal-name",
      popover: {
        title: "Terminal Identity",
        description: "You are currently operating on this specific counter.",
        position: "bottom"
      }
    },
    {
      element: "#pos-wholesale-toggle",
      popover: {
        title: "Wholesale Mode",
        description: "Toggle this to switch the entire cart to wholesale pricing instantly.",
        position: "bottom"
      }
    },
    {
      element: "#pos-wholesale-discount",
      popover: {
        title: "Bulk Discount",
        description: "Apply a global percentage discount to the entire wholesale order.",
        position: "bottom"
      }
    },
    {
      element: "#pos-calculator-btn",
      popover: {
        title: "Quick Calculator",
        description: "Access the industrial calculator anytime for complex math.",
        position: "bottom"
      }
    },
    {
      element: "#pos-vertical-handle",
      popover: {
        title: "Vertical Layout",
        description: "Drag this handle to adjust the height of your Checkout action panel.",
        position: "top"
      }
    },
    {
      element: "#pos-hold-btn",
      popover: {
        title: "Hold Sale",
        description: "Pause the current sale and save it as a draft for later.",
        position: "top"
      }
    },
    {
      element: "#pos-history-btn",
      popover: {
        title: "Sales History",
        description: "Review completed sales, reprint receipts, or process returns.",
        position: "top"
      }
    },
    {
      element: "#pos-payment-methods",
      popover: {
        title: "Flexible Payments",
        description: "Support for Cash, Card, and split transactions across multiple methods.",
        position: "top"
      }
    },
    {
      element: "#pos-general-discount-input",
      popover: {
        title: "Global Discount",
        description: "Apply a final percentage discount to the grand total of the sale.",
        position: "top"
      }
    },
    {
      element: "#pos-actions",
      popover: {
        title: "Finalize Sale",
        description: "The primary action center for completing transactions and printing invoices.",
        position: "left"
      }
    }
  ]
};

/**
 * Global Onboarding Controller
 * Manages route-specific tours across the entire POS system.
 */
export function GlobalOnboarding() {
  const pathname = usePathname();
  
  // 1. Normalize pathname: Remove locale prefixes (e.g. /en, /ta) if they exist
  // Matches /en, /en/, /ta/pos etc. but not /employees
  const pathWithoutLocale = pathname.replace(/^\/(en|ta|si)(\/|$)/, "/");
  
  // 2. Ensure it starts with / and remove trailing slash
  let normalizedPath = pathWithoutLocale.startsWith("/") ? pathWithoutLocale : `/${pathWithoutLocale}`;
  if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  const currentSteps = TOURS[normalizedPath] || [];

  console.log("[Onboarding] Path Analysis:", { 
    original: pathname, 
    withoutLocale: pathWithoutLocale, 
    normalized: normalizedPath,
    stepsFound: currentSteps.length 
  });

  // 3. Use the hook with a unique key for each page
  // We use the normalized path for the key to be consistent
  const pageKey = `page${normalizedPath.replace(/\//g, "_")}`;
  useOnboarding(pageKey, currentSteps);

  return null;
}
