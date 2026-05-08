"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Network,
  RefreshCcw,
  Edit,
  Trash2,
  Mail,
  Phone,
  Truck,
  TrendingUp,
  ExternalLink,
  MapPin,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddDistributorSheet } from "./AddDistributorSheet";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { DistributorLedgerSheet } from "./DistributorLedgerSheet";
import { EditDistributorSheet } from "./EditDistributorSheet";
import { usePermission } from "@/hooks/use-permission";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { StatusBadge } from "../ui/status-badge";

export function DistributorsManagement() {
  const { data: session } = useSession();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { formatCurrency } = useAppSettings();
  const CUSTOMER = "customer"; // Use customer permission for distributors

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
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState(null);
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
        name: searchQuery,
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors?${queryParams}`,
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
        toast.error(result.message || "Failed to fetch distributors");
      }
    } catch (error) {
      console.error("Error fetching distributors:", error);
      toast.error("An error occurred while fetching distributor network");
    } finally {
      setLoading(false);
    }
  }, [session, searchQuery, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!session?.accessToken) return;
    if (!confirm("Are you sure you want to remove this distributor profile?")) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("Distributor profile removed");
        fetchData();
      } else {
        toast.error(result.message || "Failed to delete distributor");
      }
    } catch (error) {
      console.error("Error deleting distributor:", error);
      toast.error("Failed to delete record");
    }
  };

  const handleViewLedger = (distributor) => {
    router.push(pathname + "?" + createQueryString("distributorId", distributor.id), { scroll: false });
  };

  const handleCloseLedger = (open) => {
    if (!open) router.push(pathname, { scroll: false });
    setIsLedgerOpen(open);
  };

  useEffect(() => {
    const distributorId = searchParams.get("distributorId");
    if (distributorId) {
      const distributor = data.find((c) => c.id == distributorId);
      if (distributor) {
        setSelectedDistributor(distributor);
        setIsLedgerOpen(true);
      }
    } else {
      setIsLedgerOpen(false);
    }
  }, [searchParams, data]);

  const columns = [
    {
      accessorKey: "name",
      header: "Distributor Partner",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar className="h-9 w-9 border border-emerald-100 shadow-xs">
            <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold text-[10px]">
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
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold border-emerald-200 text-emerald-700 bg-emerald-50/50 uppercase tracking-tighter">
                Wholesale Partner
              </Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "contact",
      header: "Distribution Logistics",
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
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium mt-0.5 truncate max-w-[200px]">
            <MapPin className="h-2.5 w-2.5 text-muted-foreground/50" />
            {row.original.address || "No Address Provided"}
          </div>
        </div>
      )
    },
    {
      accessorKey: "totalSpent",
      header: () => <div className="text-right">Total Distribution Volume</div>,
      cell: ({ row }) => (
        <div className="text-right flex flex-col items-end">
          <span className="text-[14px] font-black text-foreground tabular-nums leading-none">
            {formatCurrency(parseFloat(row.getValue("totalSpent") || 0))}
          </span>
          <span className="text-[10px] font-bold text-emerald-600 mt-1 leading-none opacity-80 flex items-center gap-1">
            <Truck className="h-2.5 w-2.5" />
            {row.original.visits || 0} Bulk Shipments
          </span>
        </div>
      )
    },
    {
      accessorKey: "is_active",
      header: () => <div className="text-center">Active Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusBadge
            value={row.getValue("is_active")}
            label={row.getValue("is_active") ? "AUTHORIZED" : "SUSPENDED"}
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
                setEditingDistributor(row.original);
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

  const stats = [
    { label: "Total Distributors", value: pagination.total, icon: Network, gradient: "from-emerald-500 to-teal-400" },
    { label: "Active Partners", value: data.filter(d => d.is_active).length, icon: Activity, gradient: "from-blue-500 to-indigo-400" },
    { label: "High Volume", value: data.filter(d => (parseFloat(d.totalSpent) || 0) > 100000).length, icon: TrendingUp, gradient: "from-amber-500 to-orange-400" },
    { label: "Total Distributed", value: formatCurrency(data.reduce((acc, d) => acc + (parseFloat(d.totalSpent) || 0), 0)), icon: Truck, gradient: "from-violet-500 to-purple-400" },
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
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Distributor Management</h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Oversee wholesale partners, distribution logistics, and network performance</p>
            </div>
          </div>
        }
        statCardsComponent={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((card, idx) => (
              <div key={idx} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                <div className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} text-white`}>
                  <card.icon className="w-5 h-5 shadow-sm" />
                </div>
                <div className="flex flex-col text-sm font-medium">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <h3 className="text-xl font-bold text-foreground tabular-nums">{card.value}</h3>
                </div>
              </div>
            ))}
          </div>
        }
        searchPlaceholder="Search Distributor Name, Email, or Phone..."
        onSearchChange={(v) => {
          setSearchQuery(v);
          setPagination(p => ({ ...p, page: 1 }));
        }}
        isFiltered={searchQuery !== ""}
        onClearFilters={() => setSearchQuery("")}
        extraActions={
          <>
            {canCreate(CUSTOMER) && (
              <Button onClick={() => setIsAddOpen(true)} className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs gap-2">
                <Plus className="h-4 w-4" /> Register Distributor
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
      />

      <AddDistributorSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={fetchData}
      />

      <EditDistributorSheet
        distributor={editingDistributor}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={fetchData}
      />

      <DistributorLedgerSheet
        distributor={selectedDistributor}
        open={isLedgerOpen}
        onOpenChange={handleCloseLedger}
        accessToken={session?.accessToken}
      />
    </>
  );
}
