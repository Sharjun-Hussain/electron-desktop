"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Users,
  RefreshCcw,
  Download,
  Printer,
  ReceiptText,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Star,
  Activity,
  User,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddCustomerSheet } from "./AddCustomerSheet";
import { CustomerStats } from "./customer-stats";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { CustomerLedgerSheet } from "./CustomerLedgerSheet";
import { EditCustomerSheet } from "./EditCustomerSheet";
import { usePermission } from "@/hooks/use-permission";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";
import { Badge } from "@/components/ui/badge";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { StatusBadge } from "../ui/status-badge";

export function CustomersManagement() {
  const { data: session } = useSession();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { formatCurrency } = useAppSettings();
  const CUSTOMER = "customer";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        size: pagination.limit,
        search: searchQuery,
        status: activeTab === "all" ? "" : activeTab
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(Array.isArray(result.data) ? result.data : (result.data.data || []));
        if (result.data.pagination) {
          setPagination(prev => ({ ...prev, ...result.data.pagination }));
        }
      } else {
        toast.error(result.message || "Failed to fetch customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("An error occurred while fetching customers");
    } finally {
      setLoading(false);
    }
  }, [session, searchQuery, activeTab, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Deep Link Handling
  useEffect(() => {
    const customerId = searchParams.get("customerId");
    if (customerId) {
      const customer = data.find((c) => c.id == customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setIsLedgerOpen(true);
      } else if (data.length > 0) {
        // Option to fetch single if not in current page
        const fetchSingle = async () => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customerId}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            const rs = await res.json();
            if (rs.status === "success") {
              setSelectedCustomer(rs.data);
              setIsLedgerOpen(true);
            }
          } catch (e) { }
        };
        fetchSingle();
      }
    } else {
      setIsLedgerOpen(false);
    }
  }, [searchParams, data, session]);

  const exportData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((c) => ({
      Name: c.name,
      Email: c.email || "N/A",
      Phone: c.phone || "N/A",
      Address: c.address || "N/A",
      Status: c.is_active ? "Active" : "Archived",
      "Total Spent": c.totalSpent || 0,
      "Loyalty Points": c.loyaltyPoints || 0,
    }));
  }, [data]);

  const handleDelete = async (id) => {
    if (!session?.accessToken) return;
    if (!confirm("Are you sure you want to delete this customer profile?")) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("Customer profile removed");
        fetchData();
      } else {
        toast.error(result.message || "Failed to delete customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete record");
    }
  };

  const handleViewLedger = (customer) => {
    router.push(pathname + "?" + createQueryString("customerId", customer.id), { scroll: false });
  };

  const handleCloseLedger = (open) => {
    if (!open) router.push(pathname, { scroll: false });
    setIsLedgerOpen(open);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveTab("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar className="h-8 w-8 border border-border shadow-xs">
            <AvatarFallback className="bg-muted text-muted-foreground font-bold text-[10px]">
              {row.getValue("name")?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <button
              onClick={() => handleViewLedger(row.original)}
              className="text-[13px] font-bold text-foreground hover:text-emerald-600 hover:underline cursor-pointer transition-colors text-left leading-none"
            >
              {row.getValue("name")}
            </button>
            <span className="text-[10px] text-muted-foreground font-bold mt-1 opacity-60">
              ID: #{row.original.id}
            </span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "contact",
      header: "Contact Details",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/80 leading-none">
            <Mail className="h-3 w-3 text-muted-foreground/60" />
            {row.original.email || "No Email"}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-black text-emerald-600 leading-none mt-0.5">
            <Phone className="h-3 w-3 text-emerald-600/30" />
            {row.original.phone || "--- --- ----"}
          </div>
        </div>
      )
    },
    {
      accessorKey: "totalSpent",
      header: () => <div className="text-right">Lifetime Value</div>,
      cell: ({ row }) => (
        <div className="text-right flex flex-col items-end">
          <span className="text-[14px] font-black text-foreground tabular-nums leading-none">
            {formatCurrency(parseFloat(row.getValue("totalSpent") || 0))}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground mt-1 leading-none opacity-60">
            {row.original.visits || 0} Invoices
          </span>
        </div>
      )
    },
    {
      accessorKey: "loyaltyPoints",
      header: () => <div className="text-center">Tier Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusBadge
            value={(row.getValue("loyaltyPoints") || 0) >= 1000 ? "Active" : "Neutral"}
            showIcon={(row.getValue("loyaltyPoints") || 0) >= 1000}
            label={`${row.getValue("loyaltyPoints") || 0} Points`}
            className={(row.getValue("loyaltyPoints") || 0) < 1000 && "bg-slate-100/50 text-slate-500 border-slate-200 dark:bg-slate-800/20"}
          />
        </div>
      )
    },
    {
      accessorKey: "is_active",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusBadge
            value={row.getValue("is_active")}
            label={row.getValue("is_active") ? "ACTIVE" : "ARCHIVED"}
          />
        </div>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Operations</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {canUpdate(CUSTOMER) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
              onClick={() => {
                setEditingCustomer(row.original);
                setIsEditOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete(CUSTOMER) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <ResourceManagementLayout
        data={data}
        columns={columns}
        isLoading={loading}
        headerTitle={
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Customer Registry</h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Manage customer relationships, loyalty points, and transaction history</p>
            </div>
          </div>
        }
        statCardsComponent={<CustomerStats customers={data} totalTotal={pagination.total} />}
        searchPlaceholder="Search Name, Email, or Phone..."
        onSearchChange={(v) => {
          setSearchQuery(v);
          setPagination(p => ({ ...p, page: 1 }));
        }}
        onExportClick={null}
        exportData={exportData}
        exportFileName="Customers_Registry_Export"
        isFiltered={searchQuery !== "" || activeTab !== "all"}
        onClearFilters={handleClearFilters}
        extraActions={
          <>
            {canCreate(CUSTOMER) && (
              <Button onClick={() => setIsAddOpen(true)} className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs gap-2">
                <Plus className="h-4 w-4" /> Register Customer
              </Button>
            )}
            <Button onClick={fetchData} variant="outline" size="sm" className="h-9 w-9 p-0 rounded-lg">
              <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </>
        }
        pageCount={pagination.pages}
        paginationState={{
          pageIndex: pagination.page - 1,
          pageSize: pagination.limit
        }}
        onPaginationChange={(updater) => {
          if (typeof updater === 'function') {
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
        filterComponents={() => (
          <div className="flex gap-2">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "vip", label: "VIP Tier" },
              { id: "inactive", label: "Archived" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all border uppercase tracking-wider",
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-emerald-500/30 hover:text-emerald-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      />

      <AddCustomerSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={fetchData}
      />

      <EditCustomerSheet
        customer={editingCustomer}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={fetchData}
      />

      <CustomerLedgerSheet
        customer={selectedCustomer}
        open={isLedgerOpen}
        onOpenChange={handleCloseLedger}
        accessToken={session?.accessToken}
      />
    </>
  );
}
