"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Eye,
  Loader2,
  Filter,
  ClipboardList,
  TrendingUp,
  Users,
  ReceiptText,
  X,
  Calendar as CalendarIcon,
  ArrowUpDown,
  Check,
  ChevronsUpDown,
  FileSpreadsheet,
  Building2,
  Package,
  DollarSign,
  Trash2,
  Clock
} from "lucide-react";
import { exportToCSV } from "@/lib/exportUtils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { DataTable } from "@/components/general/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount || 0));
};

const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="hover:bg-emerald-50 -ml-4 h-8 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );
};

export default function GRNReportPage() {
  const { data: session } = useSession();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [filters, setFilters] = useState({
    supplier_id: "all",
    start_date: "",
    end_date: "",
    search: ""
  });
  const [drafts, setDrafts] = useState([]);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDrafts = JSON.parse(localStorage.getItem("direct-grn-drafts") || "[]");
      setDrafts(savedDrafts);
    }
  }, []);

  const deleteDraft = (id) => {
    const newDrafts = drafts.filter(d => d.id !== id);
    localStorage.setItem("direct-grn-drafts", JSON.stringify(newDrafts));
    setDrafts(newDrafts);
    toast.success("Draft deleted successfully");
  };

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Fetch Suppliers for dropdown
  useEffect(() => {
    async function fetchSuppliers() {
      if (!session?.accessToken) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers?size=200`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const result = await response.json();
        if (result.status === "success") {
          setSuppliers(result.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch suppliers", error);
      }
    }
    fetchSuppliers();
  }, [session]);

  const fetchGRNs = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("size", pagination.limit);
      if (filters.supplier_id !== "all") params.append("supplier_id", filters.supplier_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const result = await response.json();

      if (result.status === "success") {
        setGrns(result.data.data);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to fetch GRNs");
      }
    } catch (error) {
      console.error("GRN fetch error:", error);
      toast.error("An error occurred while fetching GRNs");
    } finally {
      setLoading(false);
    }
  }, [session, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchGRNs();
  }, [fetchGRNs]);

  // Memoized stats calculations
  const stats = useMemo(() => {
    const totalValue = grns.reduce((acc, g) => acc + parseFloat(g.total_amount || 0), 0);
    const uniqueSuppliers = new Set(grns.map(g => g.supplier_id)).size;
    const totalRecords = pagination.total;
    const averageValue = grns.length > 0 ? totalValue / grns.length : 0;

    const compactCurrency = (val) =>
      new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(val);

    return [
      {
        label: "Total Value",
        val: compactCurrency(totalValue),
        desc: "Total received inventory value",
        icon: DollarSign,
        gradient: "from-emerald-500 to-teal-400",
      },
      {
        label: "Active Suppliers",
        val: uniqueSuppliers,
        desc: "Verified supplier units",
        icon: Users,
        gradient: "from-blue-500 to-indigo-400",
      },
      {
        label: "Total Documents",
        val: totalRecords,
        desc: "Total GRN records",
        icon: ReceiptText,
        gradient: "from-amber-500 to-orange-400",
      },
      {
        label: "Average Value",
        val: compactCurrency(averageValue),
        desc: "Per GRN average",
        icon: TrendingUp,
        gradient: "from-violet-500 to-purple-400",
      },
    ];
  }, [grns, pagination.total]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportData = useMemo(() => {
    if (grns.length === 0) return [];
    return grns.map((grn) => ({
      "GRN Number": grn.grn_number,
      "Received Date": format(new Date(grn.received_date), "yyyy-MM-dd"),
      Supplier: grn.supplier?.name || "N/A",
      Branch: grn.branch?.name || "Main Warehouse",
      "Total Amount (LKR)": grn.total_amount,
      Status:
        grn.status?.charAt(0).toUpperCase() + grn.status?.slice(1) || "N/A",
      "Created By": grn.created_by_user?.name || "System",
    }));
  }, [grns]);

  const exportFileName = useMemo(
    () => `GRN_Registry_${format(new Date(), "yyyyMMdd")}`,
    [],
  );

  const columns = [
    {
      accessorKey: "grn_number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="GRN Number" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold text-emerald-600">
          {row.getValue("grn_number")}
        </span>
      ),
    },
    {
      accessorKey: "received_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Received Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("received_date");
        return <span className="text-sm text-foreground">{format(new Date(date), "MMM dd, yyyy")}</span>;
      },
    },
    {
      accessorKey: "supplier.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Supplier" />
      ),
      cell: ({ row }) => {
        const name = row.original.supplier?.name || "Unknown";
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground text-sm">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "branch.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Branch" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.branch?.name || "Main Warehouse"}
        </span>
      ),
    },
    {
      accessorKey: "total_amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Amount" />
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-600 text-sm">
          {formatCurrency(row.getValue("total_amount"))}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge value={row.getValue("status")} />,
    },
  ];

  const router = useRouter();
  const selectedSupplierName = suppliers.find(s => s.id === filters.supplier_id)?.name || "All Suppliers";
  const isFiltered = filters.supplier_id !== "all" || !!filters.start_date || !!filters.end_date || !!filters.search;

  const handleClearFilters = () => {
    setFilters({
      supplier_id: "all",
      start_date: "",
      end_date: "",
      search: ""
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Cleaned Stats Cards Element (Standard Shadcn Style)
  const statCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((card, idx) => (
        <div 
          key={idx} 
          className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4"
        >
          <div className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} text-white`}>
            <card.icon className="w-5 h-5 shadow-sm" />
          </div>
          <div className="flex flex-col">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
            <h3 className="text-2xl font-bold text-foreground">
              {card.val}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full">
      {drafts.length > 0 && (
        <div className="px-6 pt-6 pb-2">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-900 dark:text-amber-500">Unsaved Direct GRN Drafts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drafts.map(draft => (
                <div key={draft.id} className="bg-background border border-border/50 rounded-lg p-3 flex justify-between items-center shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{draft.summary}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(draft.updatedAt), "MMM dd, yyyy - hh:mm a")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/purchase/grn/direct?draftId=${draft.id}`)} className="text-xs h-7 text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                      Resume
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteDraft(draft.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    <ResourceManagementLayout
      data={grns}
      columns={columns}
      isLoading={loading}
      isFiltered={isFiltered}
      onRowClick={(row) => router.push(`/purchase/grn/view/${row.id}`)}
      onClearFilters={handleClearFilters}
      addButtonLabel="New GRN"
      onAddClick={() => router.push("/purchase/purchase-orders")}
      extraActions={
        <Button onClick={() => router.push("/purchase/grn/direct")} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border-0">
          <Package className="h-4 w-4" />
          Direct GRN (Skip PO)
        </Button>
      }
      exportData={exportData}
      exportFileName={exportFileName}
      pageCount={pagination.pages}
      paginationState={{
        pageIndex: pagination.page - 1,
        pageSize: pagination.limit
      }}
      onPaginationChange={(updater) => {
        if (typeof updater === "function") {
          const newState = updater({
            pageIndex: pagination.page - 1,
            pageSize: pagination.limit
          });
          setPagination(prev => ({
            ...prev,
            page: newState.pageIndex + 1,
            limit: newState.pageSize
          }));
        }
      }}
      headerTitle={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">GRN Registry</h1>
            <p className="text-sm text-muted-foreground mt-0.5">View and manage all goods received notes</p>
          </div>
        </div>
      }
      searchLabel="Search GRNs"
      searchPlaceholder="Search by GRN number..."
      searchColumn="grn_number"
      statCardsComponent={statCards}
      filterComponents={(table) => (
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {/* Supplier Filter */}
          <div className="w-full md:w-[280px] space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-emerald-600" />
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Supplier
              </label>
            </div>
            <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={supplierOpen}
                  className="w-full justify-between border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30"
                >
                  <span className="truncate text-sm">{selectedSupplierName}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full min-w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search supplier..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No supplier found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          handleFilterChange("supplier_id", "all");
                          setSupplierOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-emerald-600",
                            filters.supplier_id === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Suppliers
                      </CommandItem>
                      {suppliers.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={s.name}
                          onSelect={() => {
                            handleFilterChange("supplier_id", s.id);
                            setSupplierOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-emerald-600",
                              filters.supplier_id === s.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {s.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Start Date Filter */}
          <div className="w-full md:w-[200px] space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 text-emerald-600" />
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                From Date
              </label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-gray-200 hover:border-emerald-200",
                    !filters.start_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.start_date ? format(new Date(filters.start_date), "PPP") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.start_date ? new Date(filters.start_date) : undefined}
                  onSelect={(date) => handleFilterChange("start_date", date ? format(date, "yyyy-MM-dd") : "")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date Filter */}
          <div className="w-full md:w-[200px] space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 text-emerald-600" />
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                To Date
              </label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-gray-200 hover:border-emerald-200",
                    !filters.end_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.end_date ? format(new Date(filters.end_date), "PPP") : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.end_date ? new Date(filters.end_date) : undefined}
                  onSelect={(date) => handleFilterChange("end_date", date ? format(date, "yyyy-MM-dd") : "")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    />
    </div>
  );
}