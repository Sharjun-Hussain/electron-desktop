"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import {
  Search,
  Star,
  Filter,
  FileText,
  BarChart3,
  PieChart,
  MoreHorizontal,
  ChevronDown,
  ArrowUpRight,
  LayoutGrid,
  ShoppingBag,
  Users,
  Package,
  CreditCard,
  Briefcase,
  Factory,
} from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Gift } from "lucide-react";
import { useAppSettings } from "@/app/hooks/useAppSettings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

// --- MOCK DATA ---
const REPORTS_DATA = [
  // Sales Category
  {
    id: "sales-daily",
    name: "Daily Sales Summary",
    href: "/reports/sales/daily",
    category: "Sales",
    description: "Overview of daily sales transactions and revenue.",
    isFavorite: true,
  },
  {
    id: "sales-product",
    name: "Sales by Product",
    href: "/reports/sales/product",
    category: "Sales",
    description: "Detailed sales performance breakdown per product.",
    isFavorite: false,
  },
  {
    id: "sales-supplier",
    name: "Sales by Supplier",
    href: "/reports/sales/supplier",
    category: "Sales",
    description: "Detailed sales performance breakdown per supplier.",
    isFavorite: false,
  },
  {
    id: "sales-returns",
    name: "Sales Return Report",
    href: "/reports/sales/returns",
    category: "Sales",
    description: "Detailed analysis and summary of customer sales returns.",
    isFavorite: true,
  },
  {
    id: "sales-employee",
    name: "Employee Performance",
    href: "/reports/employee-performance",
    category: "Sales",
    description: "Track sales performance, total revenue, and customer counts by employee.",
    isFavorite: true,
  },
  {
    id: "sales-profit-loss",
    name: "Profit & Loss",
    href: "/reports/sales/profit-loss",
    category: "Sales",
    description: "Summary of revenues, costs, and net expenses.",
    isFavorite: false,
  },
  {
    id: "sales-tax",
    name: "Tax Liability Report",
    href: "/reports/sales/tax",
    category: "Sales",
    description: "Calculated tax collected vs tax payable.",
    isFavorite: false,
  },
  {
    id: "sales-card-recon",
    name: "Card Reconciliation",
    href: "/reports/sales/card-reconsile",
    category: "Sales",
    description: "Settlement verification and discrepancy tracking for card payments.",
    isFavorite: false,
  },
  {
    id: "sales-main-cat",
    name: "Main Category Sales",
    href: "/reports/sales/main-category",
    category: "Sales",
    description: "Sales performance grouped by main product categories.",
    isFavorite: false,
  },
  {
    id: "sales-sub-cat",
    name: "Sub Category Sales",
    href: "/reports/sales/sub-category",
    category: "Sales",
    description: "Sales performance grouped by sub-categories.",
    isFavorite: false,
  },
  {
    id: "sales-item-count",
    name: "Sold Item Count",
    href: "/reports/sales/item-count",
    category: "Sales",
    description: "Total quantity of items sold across all products.",
    isFavorite: false,
  },
  {
    id: "sales-supplier-prof",
    name: "Supplier Profitability",
    href: "/reports/sales/supplier-profit",
    category: "Sales",
    description: "Profit generation analysis per supplier.",
    isFavorite: false,
  },
  {
    id: "sales-non-stock",
    name: "Non-Stock Sales",
    href: "/reports/sales/non-stock",
    category: "Sales",
    description: "Summary of sales for items not tracked in inventory.",
    isFavorite: false,
  },

  // Stocks Category
  {
    id: "stocks-value",
    name: "Current Stock Value",
    href: "/reports/stocks/current-value",
    category: "Stocks",
    description: "Total valuation of current inventory assets.",
    isFavorite: true,
  },
  {
    id: "stocks-low",
    name: "Low Stock Summary",
    href: "/reports/stocks/low-stock",
    category: "Stocks",
    description: "List of items below re-order level threshold.",
    isFavorite: false,
  },
  {
    id: "stocks-summary",
    name: "Current Stock Summary",
    href: "/reports/stocks/summary",
    category: "Stocks",
    description: "Comprehensive list of current stock counts and levels.",
    isFavorite: false,
  },
  {
    id: "stocks-insights",
    name: "Stock Reports",
    href: "/reports/stocks/insights",
    category: "Stocks",
    description: "Advanced analytics on stock aging, ROI performance, and turnover ratios.",
    isFavorite: true,
  },
  {
    id: "stocks-transfer",
    name: "Stock Transfers",
    href: "/reports/stocks/transfer",
    category: "Stocks",
    description: "History of internal stock movements between branches.",
    isFavorite: false,
  },

  // Finance Category
  {
    id: "finance-capital",
    name: "Capital Balance",
    href: "/reports/finance/capital",
    category: "Finance",
    description: "Overall financial position (Assets vs Liabilities).",
    isFavorite: true,
  },
  {
    id: "finance-cheques",
    name: "Cheque Summary",
    href: "/reports/finance/cheques",
    category: "Finance",
    description: "Overview of all receivable and payable cheques.",
    isFavorite: false,
  },
  {
    id: "finance-payments",
    name: "Payment Register",
    href: "/reports/finance/payments",
    category: "Finance",
    description: "Detailed log of all outgoing payments to suppliers and for expenses.",
    isFavorite: true,
  },


  // Customer Category
  {
    id: "customer-history",
    name: "Customer Purchase History",
    href: "/reports/customer/history",
    category: "Customer",
    description: "View detailed purchase logs for each customer.",
    isFavorite: false,
  },
  {
    id: "loyalty-summary",
    name: "Loyalty Points Ledger",
    href: "/reports/customer/loyalty",
    category: "Loyalty",
    description: "Track loyalty points earned and redeemed across your customer base.",
    isFavorite: true,
  },

  // Staff Category
  {
    id: "staff-shifts",
    name: "Shift History & Audits",
    href: "/reports/shifts",
    category: "Staff",
    description: "Audited logs of cashier shifts, session variances and cash reconciliation.",
    isFavorite: true,
  },

  // Purchase Category
  {
    id: "purchase-supplier-perf",
    name: "Supplier Performance",
    href: "/reports/purchase/supplier-performance",
    category: "Purchase",
    description: "Analysis of supplier delivery times and costs.",
    isFavorite: false,
  },
  
  // Manufacturing Category
  {
    id: "manufacturing-summary",
    name: "Production Summary",
    href: "/reports/manufacturing/summary",
    category: "Manufacturing",
    description: "Overview of production batches, yields, and overall efficiency.",
    isFavorite: true,
  },
  {
    id: "manufacturing-raw-usage",
    name: "Raw Material Usage",
    href: "/reports/manufacturing/raw-material-usage",
    category: "Manufacturing",
    description: "Detailed breakdown of ingredients and raw materials consumed.",
    isFavorite: false,
  },
  {
    id: "manufacturing-distribution",
    name: "Distribution Channel Report",
    href: "/reports/manufacturing/distribution",
    category: "Manufacturing",
    description: "Wholesale performance, shipment tracking, and distributor volume analysis.",
    isFavorite: true,
  },
];

const CATEGORIES_BASE = [
  { id: "Stocks", label: "Stocks", icon: Package },
  { id: "Sales", label: "Sales", icon: BarChart3 },
  { id: "Finance", label: "Finance", icon: CreditCard },
  { id: "Customer", label: "Customer", icon: Users },
  { id: "Loyalty", label: "Loyalty", icon: Gift },
  { id: "Staff", label: "Staff", icon: Briefcase },
  { id: "Purchase", label: "Purchase", icon: ShoppingBag },
  { id: "Manufacturing", label: "Manufacturing", icon: Factory },
];

export default function ReportsHubPage({ isNested = false }) {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    }>
      <ReportsContent isNested={isNested} />
    </Suspense>
  );
}

function ReportsContent({ isNested }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const { business } = useAppSettings();
  const isLoyaltyEnabled = business?.loyalty_enabled;

  const CATEGORIES = useMemo(() => {
    let list = CATEGORIES_BASE;
    if (!isLoyaltyEnabled) list = list.filter(c => c.id !== "Loyalty");
    return list;
  }, [isLoyaltyEnabled]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState(REPORTS_DATA);

  // Sync favorites with initial data if needed, but here we just manage it locally
  // However, we must filter out loyalty reports if disabled
  const visibleReports = useMemo(() => {
    let list = reports;
    if (!isLoyaltyEnabled) list = list.filter(r => r.category !== "Loyalty");
    return list;
  }, [reports, isLoyaltyEnabled]);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      const matchedCategory = CATEGORIES.find(
        (c) => c.id.toLowerCase() === tabFromUrl.toLowerCase()
      );
      if (matchedCategory) {
        setActiveCategory(matchedCategory.id);
      } else if (tabFromUrl.toLowerCase() === "favorites") {
        setActiveCategory("Favorites");
      } else if (tabFromUrl.toLowerCase() === "all") {
        setActiveCategory("All");
      }
    }
  }, [searchParams]);

  const handleCategoryChange = (catId) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", catId);
    router.push(`${pathname}?${params.toString()}`);
    setActiveCategory(catId);
  };

  // --- HANDLERS ---

  const toggleFavorite = (id) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  // Filter Logic
  const filteredReports = useMemo(() => {
    return visibleReports.filter((report) => {
      const matchesSearch = report.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) || 
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesCategory =
        activeCategory === "All"
          ? true
          : activeCategory === "Favorites"
          ? report.isFavorite
          : report.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [visibleReports, searchQuery, activeCategory]);

  // Grouping Logic for "All" view
  const groupedReports = useMemo(() => {
    const groups = {};
    filteredReports.forEach(report => {
      if (!groups[report.category]) groups[report.category] = [];
      groups[report.category].push(report);
    });
    return groups;
  }, [filteredReports]);

  // Sidebar counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    visibleReports.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [visibleReports]);

  return (
    <div className="flex flex-col h-full bg-background font-sans text-foreground overflow-hidden">
      {/* Page Header */}
      {!isNested && (
        <header className="bg-background border-b border-border px-8 py-5 shrink-0">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Reports Hub
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Business Intelligence • Data Analysis & Exports
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-4 font-semibold shadow-sm text-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Documentation
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0 border-l border-border bg-card">
                  <div className="p-6 pb-4 border-b border-border bg-background">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Report Documentation
                      </SheetTitle>
                      <SheetDescription className="text-sm font-medium">
                        Reference guide for all available business intelligence modules.
                      </SheetDescription>
                    </SheetHeader>
                  </div>
                  <div className="flex-1 overflow-y-auto w-full">
                    <div className="p-6 space-y-8">
                      {CATEGORIES.map((cat) => {
                        const items = REPORTS_DATA.filter(r => r.category === cat.id);
                        if (items.length === 0) return null;
                        return (
                          <div key={cat.id} className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                                <cat.icon className="h-4 w-4" />
                              </div>
                              <h3 className="text-base font-bold text-foreground">{cat.label} Reports</h3>
                            </div>
                            <div className="space-y-3">
                              {items.map(report => (
                                <div key={report.id} className="p-4 rounded-xl border border-border bg-muted/20">
                                  <h4 className="text-sm font-bold text-foreground mb-1">{report.name}</h4>
                                  <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-3">
                                    {report.description}
                                  </p>
                                  <div className="flex justify-start">
                                    <Badge variant="secondary" className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100">
                                      {report.id}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 gap-6">
        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-64 bg-card border border-border flex flex-col shrink-0 rounded-xl overflow-hidden shadow-xs">
          <div className="flex-1 overflow-y-auto thin-scrollbar">
          <div className="p-5">
            <div className="mb-6">
              <p className="text-sm font-semibold text-muted-foreground mb-4 px-2">View Filters</p>
              
              <div className="space-y-1">
                <button
                  onClick={() => handleCategoryChange("All")}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group",
                    activeCategory === "All"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-emerald-600"
                  )}
                >
                  <LayoutGrid className={cn("h-4 w-4", activeCategory === "All" ? "text-white" : "text-muted-foreground group-hover:text-emerald-600")} />
                  All Reports
                </button>

                <button
                  onClick={() => handleCategoryChange("Favorites")}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group",
                    activeCategory === "Favorites"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-emerald-600"
                  )}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      activeCategory === "Favorites" ? "fill-white text-white" : "text-muted-foreground group-hover:text-amber-500"
                    )}
                  />
                  My Favorites
                </button>
              </div>
            </div>

            <Separator className="my-6 bg-border" />

            <div className="mb-4">
              <p className="text-sm font-semibold text-muted-foreground mb-4 px-2">Library Categories</p>

              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const originalCount = categoryCounts[cat.id] || 0;
                  const isActive = activeCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={cn(
                        "flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-emerald-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <cat.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground group-hover:text-emerald-600")} />
                        {cat.label}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-md font-semibold",
                          isActive 
                            ? "bg-white/20 text-white border-none" 
                            : "bg-muted text-muted-foreground border-none group-hover:bg-emerald-600/10 group-hover:text-emerald-600"
                        )}
                      >
                        {originalCount}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          </div>
          
          <div className="p-4 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground text-center font-semibold">
              {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'} available
            </p>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-card rounded-xl border border-border shadow-xs">
          {/* Toolbar */}
          <div className="px-8 py-5 flex justify-between items-center gap-4 bg-background border-b border-border z-10 relative">
            <div className="relative flex-1 max-w-lg group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
              <Input
                placeholder="Search report library..."
                className="h-10 pl-11 bg-white border-border focus:bg-white shadow-sm rounded-lg font-medium text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 placeholder:text-muted-foreground/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select defaultValue="most-used">
                <SelectTrigger className="w-[140px] h-10 border-border shadow-xs text-sm font-medium">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most-used">Most Used</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 bg-muted/5 relative">
            <div className="px-8 py-8 pb-20 space-y-10">
              {activeCategory === "All" ? (
                // Grouped All View
                CATEGORIES.map((cat) => {
                  const items = groupedReports[cat.id] || [];
                  if (items.length === 0 && searchQuery) return null;
                  if (items.length === 0 && !searchQuery) return null; // Don't show empty categories
                  
                  return (
                    <section key={cat.id} className="space-y-4">
                      <div className="flex items-center gap-3 px-1">
                        <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                          <cat.icon className="h-4 w-4" />
                        </div>
                        <h2 className="text-sm font-semibold text-foreground">
                          {cat.label} Reports
                          <span className="ml-2 text-muted-foreground font-medium">({items.length})</span>
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {items.map((report) => (
                          <ReportCard key={report.id} report={report} toggleFavorite={toggleFavorite} />
                        ))}
                      </div>
                    </section>
                  );
                })
              ) : activeCategory === "Favorites" ? (
                 <section className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                      <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                      <h2 className="text-sm font-semibold text-foreground">Starred Reports</h2>
                    </div>
                    {filteredReports.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredReports.map((report) => (
                          <ReportCard key={report.id} report={report} toggleFavorite={toggleFavorite} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="You haven't added any favorites yet." />
                    )}
                 </section>
              ) : (
                // Single Category View
                <section className="space-y-4">
                  <div className="flex items-center gap-3 px-1">
                    <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                      {(() => {
                        const Icon = CATEGORIES.find(c => c.id === activeCategory)?.icon || LayoutGrid;
                        return <Icon className="h-4 w-4" />;
                      })()}
                    </div>
                    <h2 className="text-sm font-semibold text-foreground">
                      {activeCategory} Reports
                    </h2>
                  </div>
                  {filteredReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredReports.map((report) => (
                        <ReportCard key={report.id} report={report} toggleFavorite={toggleFavorite} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </section>
              )}
              
              {filteredReports.length === 0 && searchQuery && <EmptyState />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ReportCard({ report, toggleFavorite }) {
  const getCategoryIcon = (category) => {
    const cat = CATEGORIES_BASE.find(c => c.id === category);
    if (!cat) return <FileText className="h-4 w-4" />;
    const Icon = cat.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card className="group relative bg-card border border-border shadow-xs hover:shadow-sm hover:border-emerald-500/30 transition-all duration-300 flex flex-col h-full rounded-xl overflow-hidden">
      <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-muted rounded-md text-muted-foreground group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-300">
              {getCategoryIcon(report.category)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(report.id);
              }}
              className={cn(
                "h-8 w-8 rounded-md transition-all relative z-10",
                report.isFavorite 
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100" 
                  : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"
              )}
            >
              <Star className={cn("h-4 w-4", report.isFavorite && "fill-current")} />
            </Button>
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-emerald-600 transition-colors tracking-tight">
              {report.name}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              {report.description}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <Link 
              href={report.href} 
              className="text-xs font-semibold text-muted-foreground group-hover:text-emerald-600 transition-colors flex items-center gap-1.5 group/link after:absolute after:inset-0 after:z-0"
            >
              Generate Report
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </Link>
            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground/50 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm relative z-10">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-border border-dashed">
      <div className="h-14 w-14 bg-muted rounded-xl flex items-center justify-center mb-4 shadow-inner">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground tracking-tight">No Reports Found</h3>
      <p className="text-xs text-muted-foreground max-w-[240px] mt-1.5 font-medium leading-relaxed">
        {message || "Try adjusting your search or category filters to find the data you need."}
      </p>
    </div>
  );
}
