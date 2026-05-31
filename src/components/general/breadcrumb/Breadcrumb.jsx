"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
  ArrowLeft, Home, Settings, Users, Package,
  ShoppingCart, Calculator, LayoutDashboard,
  Plus, Monitor, PlusCircle, Tag, Wallet,
  UserPlus, Truck, Sun, Moon, Maximize, Minimize
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import ZoomControl from "@/components/common/ZoomControl";

import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";
import { useNavigationStore } from "@/store/useNavigationStore";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function SystemBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
  const [showBackButton, setShowBackButton] = useState(false);
  const { breadcrumbs } = useBreadcrumbStore();
  const { getBackPath } = useNavigationStore();
  const { theme, setTheme } = useTheme();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const getSegmentIcon = (segment) => {
    const iconCls = "h-3.5 w-3.5 opacity-60";
    switch (segment.toLowerCase()) {
      case "home": return <Home className={iconCls} />;
      case "inventory": return <Package className={iconCls} />;
      case "purchase": return <ShoppingCart className={iconCls} />;
      case "accounting": return <Calculator className={iconCls} />;
      case "settings": return <Settings className={iconCls} />;
      case "users": return <Users className={iconCls} />;
      case "dashboard": return <LayoutDashboard className={iconCls} />;
      default: return null;
    }
  };

  const formatSegmentName = (segment) => {
    if (breadcrumbs[segment]) return breadcrumbs[segment];
    return segment.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  useEffect(() => {
    if (pathname === "/" || pathname === "/pos" || pathname === "/dashboard") {
      setBreadcrumbItems([]);
      setShowBackButton(false);
      return;
    }

    const pathSegments = pathname.split("/").filter((segment) => segment !== "" && segment !== "pos");
    if (pathSegments.length === 0) {
      setBreadcrumbItems([]);
      setShowBackButton(false);
      return;
    }

    setShowBackButton(pathSegments.length >= 1);
    const items = [];

    items.push(
      <BreadcrumbItem key="home">
        <BreadcrumbLink asChild>
          <Link href="/" className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
            <Home className="h-3.5 w-3.5 opacity-60" />
            <span className="hidden md:inline text-[13px] font-medium">Home</span>
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    );

    if (pathSegments.length > 0) items.push(<BreadcrumbSeparator key="sep-home" />);

    pathSegments.forEach((segment, index) => {
      let href = "/" + pathSegments.slice(0, index + 1).join("/");
      const isLast = index === pathSegments.length - 1;
      const formattedName = formatSegmentName(segment);
      const icon = getSegmentIcon(segment);

      // Intelligent Redirection for Reports Hub
      // If we are at /reports/[category]/[report-name], and this segment is [category]
      if (pathSegments[0] === "reports" && index === 1 && !isLast) {
        const categoryMap = {
          stocks: "Stocks",
          sales: "Sales",
          finance: "Finance",
          customer: "Customer",
          purchase: "Purchase"
        };
        const mappedTab = categoryMap[segment.toLowerCase()];
        if (mappedTab) {
          href = `/reports?tab=${mappedTab}`;
        }
      }

      items.push(
        <BreadcrumbItem key={href}>
          {!isLast ? (
            <BreadcrumbLink asChild>
              <Link href={href} className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                {icon}
                <span className="text-[13px] font-medium">{formattedName}</span>
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1.5 font-semibold text-foreground">
              {icon}
              <span className="text-[13px]">{formattedName}</span>
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>
      );

      if (!isLast) items.push(<BreadcrumbSeparator key={`sep-${href}`} />);
    });

    setBreadcrumbItems(items);
  }, [pathname, breadcrumbs]);

  const renderHeader = (content) => (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-6">
        <div className="flex items-center">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // 1. Try to go back using stored history
                const backPath = getBackPath();
                if (backPath) {
                  return router.push(backPath);
                }

                // 2. Fallback to Intelligent Logical Parent Redirection
                if (pathname.startsWith('/purchase/')) {
                  if (pathname === '/purchase/suppliers') return router.push('/');
                  return router.push('/purchase/suppliers');
                }
                
                if (pathname.startsWith('/inventory/')) {
                  return router.push('/products');
                }

                if (pathname.startsWith('/reports/')) {
                  // If we are deep in a report, go back to the main reports hub
                  const segments = pathname.split('/').filter(Boolean);
                  if (segments.length > 2) {
                     // Try to map back to the specific tab if possible
                     const category = segments[1].toLowerCase();
                     const categoryMap = { stocks: "Stocks", sales: "Sales", finance: "Finance", customer: "Customer", purchase: "Purchase" };
                     return router.push(`/reports?tab=${categoryMap[category] || 'Sales'}`);
                  }
                  return router.push('/reports');
                }

                if (pathname.startsWith('/settings/')) {
                  return router.push('/settings');
                }

                // 2. Default Hierarchy Popping
                const segments = pathname.split("/").filter((segment) => segment !== "" && segment !== "pos");
                if (segments.length > 1) {
                  segments.pop();
                  router.push("/" + segments.join("/"));
                } else {
                  router.push("/");
                }
              }}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span className="text-xs font-medium">Back</span>
            </Button>
          )}
        </div>

        <div className="flex-1">
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap">
              {content}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions Actions */}
          <div className="hidden lg:flex items-center gap-2 mr-2">
            <Button variant="outline" size="sm" asChild className="h-8 text-xs font-semibold gap-2">
              <Link href="/pos">
                <Monitor className="h-3.5 w-3.5 text-emerald-600" />
                <span>POS Hub</span>
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Quick Action</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-tight px-3 py-2">Create New</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/pos" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-emerald-600" />
                    <span>New Sale</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/products/new" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-blue-500" />
                    <span>New Product</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/brand" className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-indigo-500" />
                    <span>New Brand</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/expenses/new" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    <span>New Expense</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/customers" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-orange-500" />
                    <span>New Customer</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ZoomControl className="h-8 border-none bg-transparent hover:bg-accent" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 text-muted-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-muted-foreground hidden sm:flex"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );

  if (breadcrumbItems.length === 0 && pathname !== "/dashboard") return null;
  return renderHeader(breadcrumbItems);
}
