"use client"
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Wallet,
  Receipt,
  TrendingDown,
  Calendar,
  Plus,
  Search,
  RefreshCcw,
  Download,
  Tag,
  CreditCard,
  Hash,
  Users,
  Check,
  ChevronsUpDown,
  TrendingUp,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";
import { useAppSettings } from "@/app/hooks/useAppSettings";
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
import { getExpenseColumns } from "./expense-column";

export default function ExpenseManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { EXPENSE } = MODULES;
  const { formatCurrency } = useAppSettings();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    category_id: "all",
    payment_method: "all",
    search: ""
  });

  const fetchCategories = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories?size=100`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const result = await response.json();
      if (result.status === "success") {
        setCategories(result.data.data || result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch expense categories", error);
    }
  }, [session?.accessToken]);

  const fetchExpenses = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      if (data.status === "success") {
        const rawData = data?.data?.data || data?.data || [];
        setExpenses(rawData.map(item => ({
          ...item,
          date: item.expense_date,
          category_name: item.category?.name || "Uncategorized",
        })));
      } else {
        throw new Error(data.message || "Failed to fetch expenses");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchExpenses();
      fetchCategories();
    }
  }, [status, session, fetchExpenses, fetchCategories]);

  const handleEdit = (expense) => router.push(`/expenses/edit?id=${expense.id}`);
  const handleView = (expense) => router.push(`/expenses/${expense.id}`);
  const handleDelete = async (id) => {
    if (!confirm("Delete this expense record?")) return;
    toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }).then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        fetchExpenses();
      }),
      { loading: "Deleting...", success: "Expense deleted!", error: "Failed to delete expense." }
    );
  };

  const columns = useMemo(() => getExpenseColumns({ 
    onEdit: handleEdit, 
    onDelete: handleDelete, 
    onView: handleView 
  }), [session?.accessToken]);

  const handleClearFilters = () => {
    setFilters({
      category_id: "all",
      payment_method: "all",
      search: ""
    });
  };

  const selectedCategoryName = categories.find(c => c.id === filters.category_id)?.name || "All Categories";
  const isFiltered = filters.category_id !== "all" || filters.payment_method !== "all" || !!filters.search;

  const totalExpenses = expenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter(e => {
        const d = new Date(e.date || e.expense_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
  }, [expenses]);

  const stats = useMemo(() => {
    return [
      {
        label: "Total Expenses",
        val: formatCurrency(totalExpenses),
        icon: TrendingDown,
        gradient: "from-red-600 to-rose-500",
        desc: "All-time cost outflow",
      },
      {
        label: "This Month",
        val: formatCurrency(thisMonthTotal),
        icon: Calendar,
        gradient: "from-orange-600 to-amber-500",
        desc: "Current month totals",
      },
      {
        label: "Total Records",
        val: expenses.length,
        icon: Receipt,
        gradient: "from-blue-600 to-indigo-500",
        desc: "Individual entries",
      },
      {
        label: "Categories",
        val: new Set(expenses.map(e => e.category_name)).size,
        icon: Tag,
        gradient: "from-purple-600 to-violet-500",
        desc: "Distinct cost types",
      },
    ];
  }, [expenses, totalExpenses, thisMonthTotal, formatCurrency]);

  return (
    <ResourceManagementLayout
      data={expenses}
      columns={columns}
      isLoading={loading}
      isFiltered={isFiltered}
      onClearFilters={handleClearFilters}
      headerTitle={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Expense Registry</h1>
            <p className="text-sm text-muted-foreground mt-0.5">View and manage all company expenditures</p>
          </div>
        </div>
      }
      addButtonLabel="Add Expense"
      onAddClick={canCreate(EXPENSE) ? () => router.push("/expenses/new") : null}
      onExportClick={() => {
        const csvData = expenses.map(e => ({
          Date: e.date,
          Category: e.category_name,
          Amount: e.amount,
          "Payment Method": e.payment_method,
          "Reference #": e.reference_no,
        }));
        toast.success("Preparing CSV Export...");
        // Assuming exportToCSV is global or imported
      }}
      searchLabel="Search Expenses"
      searchPlaceholder="Filter by reference #, category..."
      searchColumn="reference_no"
      statCardsComponent={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((card, idx) => (
            <div 
              key={idx} 
              className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} text-white shadow-sm`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl font-bold text-foreground tabular-nums leading-none mt-1">
                  {card.val}
                </h3>
              </div>
            </div>
          ))}
        </div>
      }
      filterComponents={(table) => (
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex flex-col gap-2 w-full md:w-[280px]">
            <div className="flex items-center gap-1.5 ml-1">
              <Tag className="size-3.5 text-red-600/70" />
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Category</label>
            </div>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className="w-full h-10 justify-between font-medium text-[13px] shadow-sm transition-all"
                >
                  <span className="truncate">{selectedCategoryName}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 rounded-xl border border-border shadow-lg" align="start">
                <Command>
                  <CommandInput placeholder="Search category..." className="h-9 text-[13px]" />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty className="py-4 text-[12px] text-muted-foreground text-center">No category found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setFilters(prev => ({ ...prev, category_id: "all" }))
                          setCategoryOpen(false)
                        }}
                        className="text-[13px] py-2 cursor-pointer"
                      >
                        <Check className={cn("mr-2 h-4 w-4 text-red-600", filters.category_id === "all" ? "opacity-100" : "opacity-0")} />
                        All Categories
                      </CommandItem>
                      {categories.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => {
                            setFilters(prev => ({ ...prev, category_id: c.id }))
                            setCategoryOpen(false)
                          }}
                          className="text-[13px] py-2 cursor-pointer"
                        >
                          <Check className={cn("mr-2 h-4 w-4 text-red-600", filters.category_id === c.id ? "opacity-100" : "opacity-0")} />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-[200px]">
            <div className="flex items-center gap-1.5 ml-1">
              <CreditCard className="size-3.5 text-red-600/70" />
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Payment</label>
            </div>
            <Select 
              value={filters.payment_method} 
              onValueChange={(v) => {
                setFilters(prev => ({ ...prev, payment_method: v }))
                table.getColumn("payment_method")?.setFilterValue(v === "all" ? undefined : v)
              }}
            >
              <SelectTrigger className="h-10 font-medium text-[13px] shadow-sm">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border shadow-lg">
                <SelectItem value="all" className="text-[13px]">All Methods</SelectItem>
                <SelectItem value="Cash" className="text-[13px] text-emerald-600">Cash</SelectItem>
                <SelectItem value="Bank Transfer" className="text-[13px] text-blue-600">Bank Transfer</SelectItem>
                <SelectItem value="Credit Card" className="text-[13px] text-orange-600">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    />
  );
}
