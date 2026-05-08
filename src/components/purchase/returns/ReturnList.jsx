"use client"
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PlusCircle,
  Search,
  RotateCcw,
  Undo2,
  Clock,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Users,
  Check,
  ChevronsUpDown,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { getColumns } from "./columns";

export default function ReturnList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [filters, setFilters] = useState({
    supplier_id: "all",
    status: "all",
    search: ""
  });

  const fetchSuppliers = useCallback(async () => {
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
  }, [session?.accessToken]);

  const fetchReturns = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-returns`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch purchase returns");
      const result = await response.json();

      if (result.status === "success") {
        const returns = Array.isArray(result.data)
          ? result.data
          : result.data?.data || [];
        setData(returns);
      } else {
        throw new Error(result.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session) {
      fetchReturns();
      fetchSuppliers();
    }
  }, [session, fetchReturns, fetchSuppliers]);

  const columns = useMemo(() => getColumns(), []);

  const stats = useMemo(() => {
    const compactCurrency = (val) =>
      new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(val);

    const totalValue = data.reduce((acc, d) => acc + parseFloat(d.total_amount || 0), 0);

    return [
      {
        label: "All Returns",
        val: data.length,
        icon: Undo2,
        gradient: "from-emerald-500 to-teal-400",
        desc: "Total return records"
      },
      {
        label: "Pending Verification",
        val: data.filter(d => d.status === 'pending').length,
        icon: Clock,
        gradient: "from-blue-500 to-indigo-400",
        desc: "Awaiting supplier check"
      },
      {
        label: "Completed",
        val: data.filter(d => d.status === 'completed').length,
        icon: CheckCircle2,
        gradient: "from-purple-500 to-violet-400",
        desc: "Successfully finalized"
      },
      {
        label: "Total Value",
        val: compactCurrency(totalValue),
        icon: TrendingDown,
        gradient: "from-amber-500 to-orange-400",
        desc: "Total cumulative value"
      },
    ];
  }, [data]);

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

  const handleClearFilters = () => {
    setFilters({
      supplier_id: "all",
      status: "all",
      search: ""
    });
  };

  const selectedSupplierName = suppliers.find(s => s.id === filters.supplier_id)?.name || "All Suppliers";
  const selectedStatusLabel = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ].find(s => s.value === filters.status)?.label || "Select Status";

  const isFiltered = filters.supplier_id !== "all" || filters.status !== "all" || !!filters.search;

  return (
    <ResourceManagementLayout
      data={data}
      columns={columns}
      isLoading={loading}
      isFiltered={isFiltered}
      onClearFilters={handleClearFilters}
      headerTitle={
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/5 transition-transform hover:scale-105 active:scale-95 cursor-default">
            <RotateCcw className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-foreground">Purchase Returns</h1>
            <p className="text-[13px] text-muted-foreground font-medium opacity-70">Manage all product returns to suppliers</p>
          </div>
        </div>
      }
      addButtonLabel="Initiate Return"
      onAddClick={() => router.push("/purchase/returns/create")}
      searchLabel="Search Returns"
      searchPlaceholder="Filter by return number..."
      searchColumn="return_number"
      statCardsComponent={statCards}
      filterComponents={(table) => (
        <div className="flex flex-col md:flex-row gap-5 items-end w-full">
          {/* Supplier Combobox */}
          <div className="w-full md:w-[280px] space-y-2">
            <div className="flex items-center gap-2 ml-1">
              <Users className="size-3.5 text-emerald-600/70" />
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Supplier</label>
            </div>
            <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full h-10 justify-between font-medium text-[13px] shadow-sm"
                >
                  <span className="truncate">{selectedSupplierName}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search supplier..." className="h-9 text-[13px]" />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty className="py-6 text-[12px] text-muted-foreground">No supplier found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setFilters(prev => ({ ...prev, supplier_id: "all" }));
                          setSupplierOpen(false);
                        }}
                        className="text-[13px] py-2 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
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
                            setFilters(prev => ({ ...prev, supplier_id: s.id }));
                            setSupplierOpen(false);
                          }}
                          className="text-[13px] cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
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

          {/* Status Combobox */}
          <div className="w-full md:w-[200px] space-y-2">
            <div className="flex items-center gap-2 ml-1">
              <RotateCcw className="size-3.5 text-emerald-600/70" />
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Status</label>
            </div>
            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full h-10 justify-between font-medium text-[13px] shadow-sm text-left"
                >
                  <span className="truncate">{selectedStatusLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search status..." className="h-9 text-[13px]" />
                  <CommandList>
                    <CommandEmpty className="py-4 text-[12px] text-muted-foreground">No status found.</CommandEmpty>
                    <CommandGroup>
                      {[
                        { value: "all", label: "All Status" },
                        { value: "pending", label: "Pending" },
                        { value: "completed", label: "Completed" },
                        { value: "cancelled", label: "Cancelled" },
                      ].map((status) => (
                        <CommandItem
                          key={status.value}
                          value={status.value}
                          onSelect={() => {
                            setFilters(prev => ({ ...prev, status: status.value }));
                            table.getColumn("status")?.setFilterValue(status.value === "all" ? undefined : status.value);
                            setStatusOpen(false);
                          }}
                          className="text-[13px] py-2 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.status === status.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {status.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    />
  );
}
