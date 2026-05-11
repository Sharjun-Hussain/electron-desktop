"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Printer,
  Download,
  Search,
  Package,
  AlertTriangle,
  FileText,
  Check,
  ChevronsUpDown,
  Filter,
  RefreshCw,
  Box,
  Layers,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// ── Pagination — identical to ResourceManagementLayout ──────────────────────
const PaginationControls = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  if (totalPages <= 1) return null;

  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </p>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px] text-xs border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">per page</p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i;
            } else if (currentPage <= 2) {
              pageNum = i;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 5 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            if (pageNum >= 0 && pageNum < totalPages) {
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    currentPage === pageNum
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-border hover:border-emerald-200 hover:bg-emerald-50"
                  )}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            }
            return null;
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function StockSummaryReportPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [branch, setBranch] = useState("all");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [branchOpen, setBranchOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [branchRes, catRes, subCatRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        })
      ]);
      const branchData = await branchRes.json();
      const catData = await catRes.json();
      const subCatData = await subCatRes.json();
      
      if (branchData.status === 'success') setBranches(branchData.data || []);
      if (catData.status === 'success') setCategories(catData.data || []);
      if (subCatData.status === 'success') {
          setSubCategories(subCatData.data?.data || subCatData.data || []);
      }
    } catch (err) { console.error(err); }
  }, [session?.accessToken]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        branch_id: branch,
        main_category_id: category,
        sub_category_id: subCategory,
        limit: 1000
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/summary?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data?.data || result.data || []);
      } else {
        toast.error(result.message || "Failed to fetch stock summary");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load inventory summary");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, branch, category, subCategory]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 0 whenever filters or search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, branch, category, subCategory]);

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      Branch: item.branch?.name,
      Category: item.product?.main_category?.name,
      Product: item.product?.name,
      Variant: item.variant?.name || "Standard",
      SKU: item.variant?.sku || item.product?.code,
      Quantity: item.quantity,
      "Reorder Level": item.product?.reorder_level || 0,
      Status: Number(item.quantity) <= Number(item.product?.reorder_level || 0) ? "Low Stock" : "OK",
    }));
    exportToCSV(exportData, "Inventory_Summary_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      Branch: item.branch?.name,
      Category: item.product?.main_category?.name,
      Product: item.product?.name,
      Variant: item.variant?.name || "Standard",
      SKU: item.variant?.sku || item.product?.code,
      Quantity: item.quantity,
      "Reorder Level": item.product?.reorder_level || 0,
      Status: Number(item.quantity) <= Number(item.product?.reorder_level || 0) ? "Low Stock" : "OK",
    }));
    exportToExcel(exportData, "Inventory_Summary_Report");
  };

  const filteredData = useMemo(() => Array.isArray(data) ? data.filter((item) =>
    item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [], [data, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = useMemo(
    () => filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [filteredData, currentPage, pageSize]
  );

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Derive Stats Dynamically
  const uniqueBranches = new Set(data.map(i => i.branch?.id)).size;
  const uniqueCategories = new Set(data.map(i => i.product?.main_category?.id)).size;
  const totalStockRows = data.length;
  const lowStockRows = data.filter(i => parseFloat(i.quantity) <= parseFloat(i.product?.reorder_level || 0)).length;

  const stats = [
    {
      label: "Branches Mapped",
      val: isLoading ? null : uniqueBranches.toLocaleString(),
      desc: "Storage locations found",
      icon: Building2,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Categories Detected",
      val: isLoading ? null : uniqueCategories.toLocaleString(),
      desc: "Product classifications",
      icon: Layers,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Total Variant Records",
      val: isLoading ? null : totalStockRows.toLocaleString(),
      desc: "Active rows aggregated",
      icon: Box,
      gradient: "from-sky-500 to-cyan-400",
    },
    {
      label: "Low Stock Triggers",
      val: isLoading ? null : lowStockRows.toLocaleString(),
      desc: "Items breaching threshold",
      icon: AlertTriangle,
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-md">
              <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Stock Inventory Summary</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Real-time inventory mapping across all branches and categories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2 border-border hover:border-emerald-200 hover:bg-emerald-50"
              onClick={handleExportCSV} 
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 border-border hover:border-emerald-200 hover:bg-emerald-50"
              onClick={handleExportExcel} 
            >
              <FileText className="h-4 w-4" /> Excel
            </Button>
            <Button 
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="border-border hover:border-emerald-200 hover:bg-emerald-50" 
              onClick={fetchData} 
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((card, idx) => (
            <div
              key={idx}
              className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4"
            >
              <div className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient} text-white shrink-0`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                {isLoading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground truncate">{card.val}</h3>
                )}
                <p className="text-[11px] text-muted-foreground mt-0.5">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Intelligence Filters (Main Table Wrap) ── */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          {/* Card Config Header containing Filters */}
          <div className="bg-muted/10 border-b border-border p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
               {/* Branch Filter */}
               <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <Filter className="h-3.5 w-3.5 text-emerald-600" /> Storage Branch
                  </label>
                  <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 bg-transparent"
                      >
                        <span className="truncate text-sm">
                          {branch === "all" ? "All Branches" : branches.find((b) => String(b.id) === String(branch))?.name || "All Branches"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full min-w-[200px] p-0 rounded-md border-border shadow-lg" align="start">
                      <Command>
                        <CommandInput placeholder="Search branch..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No branch found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setBranch("all");
                                setBranchOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4 text-emerald-600", branch === "all" ? "opacity-100" : "opacity-0")} />
                              All Branches
                            </CommandItem>
                            {branches.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={b.name}
                                onSelect={() => {
                                  setBranch(b.id);
                                  setBranchOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(branch) === String(b.id) ? "opacity-100" : "opacity-0")} />
                                {b.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>
              
               {/* Main Category */}
              <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <Layers className="h-3.5 w-3.5 text-emerald-600" /> Main Category
                  </label>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 bg-transparent"
                      >
                        <span className="truncate text-sm">
                          {category === "all" ? "All Categories" : categories.find((c) => String(c.id) === String(category))?.name || "All Categories"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full min-w-[200px] p-0 rounded-md border-border shadow-lg" align="start">
                      <Command>
                        <CommandInput placeholder="Search category..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setCategory("all");
                                setCategoryOpen(false);
                                setSubCategory("all");
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4 text-emerald-600", category === "all" ? "opacity-100" : "opacity-0")} />
                              All Categories
                            </CommandItem>
                            {categories.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.name}
                                onSelect={() => {
                                  setCategory(c.id);
                                  setCategoryOpen(false);
                                  setSubCategory("all");
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(category) === String(c.id) ? "opacity-100" : "opacity-0")} />
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>

               {/* Sub Category */}
              <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <Layers className="h-3.5 w-3.5 text-emerald-600 opacity-70" /> Sub Category
                  </label>
                  <Popover open={subCategoryOpen} onOpenChange={setSubCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 disabled:opacity-50 bg-transparent"
                        disabled={category === "all"}
                      >
                        <span className="truncate text-sm">
                           {subCategory === "all" ? "All Sub-Categories" : subCategories.find((s) => String(s.id) === String(subCategory))?.name || "All Sub-Categories"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full min-w-[200px] p-0 rounded-md border-border shadow-lg" align="start">
                      <Command>
                        <CommandInput placeholder="Search sub-category..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No sub-category found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setSubCategory("all");
                                setSubCategoryOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4 text-emerald-600", subCategory === "all" ? "opacity-100" : "opacity-0")} />
                              All Sub-Categories
                            </CommandItem>
                            {subCategories
                              .filter(s => String(s.main_category_id) === String(category))
                              .map((s) => (
                              <CommandItem
                                key={s.id}
                                value={s.name}
                                onSelect={() => {
                                  setSubCategory(s.id);
                                  setSubCategoryOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(subCategory) === String(s.id) ? "opacity-100" : "opacity-0")} />
                                {s.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>

               {/* Quick Search */}
              <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <Search className="h-3.5 w-3.5 text-emerald-600" /> Explorer
                  </label>
                  <div className="relative group">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                      <Input 
                          placeholder="Search product or SKU..." 
                          className="pl-9 h-9 rounded-md border-border shadow-none focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm font-normal bg-transparent" 
                          value={searchQuery}
                          onChange={(e)=>setSearchQuery(e.target.value)}
                      />
                  </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 py-3.5 text-[13px] font-semibold text-muted-foreground">Product & Variant Identity</TableHead>
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground">Classification</TableHead>
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground">Location</TableHead>
                  <TableHead className="text-center py-3.5 text-[13px] font-semibold text-muted-foreground">Min Threshold</TableHead>
                  <TableHead className="text-right pr-6 py-3.5 text-[13px] font-semibold text-muted-foreground">Current Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-border animate-pulse">
                      <TableCell className="pl-6 py-4"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-md bg-muted" /><div className="space-y-1.5"><div className="h-4 w-40 bg-muted rounded" /><div className="h-3 w-24 bg-muted/50 rounded" /></div></div></TableCell>
                      <TableCell><div className="h-5 w-24 bg-muted/50 rounded-md" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                      <TableCell className="text-center"><div className="h-4 w-12 bg-muted/50 rounded mx-auto" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-5 w-16 bg-muted rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((item) => {
                    const isLow = parseFloat(item.quantity) <= parseFloat(item.product?.reorder_level || 0);
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border">
                      <TableCell className="pl-6 py-3.5">
                          <div className="flex items-center gap-3">
                              <div className={cn(
                                  "size-8 rounded-md flex items-center justify-center border transition-all",
                                  isLow ? "bg-amber-500/10 text-amber-600 border-amber-200/50" : "bg-muted text-muted-foreground border-border"
                              )}>
                                  <Package className="h-4 w-4" />
                              </div>
                              <div>
                                  <p className="font-semibold text-sm text-foreground">{item.product?.name}</p>
                                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{item.variant?.name || "Standard Unit"} • {item.variant?.sku || item.product?.code}</p>
                              </div>
                          </div>
                      </TableCell>
                      <TableCell>
                          <Badge variant="outline" className="text-[10px] font-medium bg-muted/30 text-muted-foreground border-border px-2 py-0.5 rounded-md shadow-none">
                              {item.product?.main_category?.name || "General"}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground font-medium italic">
                          {item.branch?.name}
                      </TableCell>
                      <TableCell className="text-center text-[13px] text-muted-foreground font-semibold tabular-nums">
                          {item.product?.reorder_level || 0}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                          <div className="flex flex-col items-end">
                              <span className={cn(
                                  "text-[14px] font-semibold tabular-nums",
                                  isLow ? "text-rose-600" : "text-foreground"
                              )}>{parseFloat(item.quantity).toFixed(0)}</span>
                              {isLow && (
                                  <div className="flex items-center gap-1 text-[10px] text-rose-600 font-bold tracking-tight mt-0.5">
                                      <AlertTriangle className="h-3 w-3" /> Warning
                                  </div>
                              )}
                          </div>
                      </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-24 text-center">
                       <div className="flex flex-col items-center justify-center gap-3">
                          <div className="size-14 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                             <Search className="size-8 opacity-20" />
                          </div>
                          <h4 className="font-bold text-foreground">No records detected</h4>
                          <p className="text-sm text-muted-foreground italic">Adjust filters or search query to find specific stock records</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />

        </Card>
      </div>
    </div>
  );
}
