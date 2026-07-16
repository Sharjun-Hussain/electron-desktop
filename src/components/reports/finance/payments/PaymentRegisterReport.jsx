"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect, useMemo, useCallback } from "react";
import { subDays, startOfMonth, endOfMonth } from "date-fns";
import { format } from "@/lib/date-utils";
import {
    Printer,
    Download,
    Calendar as CalendarIcon,
    RefreshCw,
    Search,
    CreditCard,
    Receipt,
    Wallet,
    Building2,
    Users,
    ChevronDown,
    MoreHorizontal,
    TrendingUp,
    Activity,
    Clock
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";

export default function PaymentRegisterReport() {
    const { data: session } = useSession();
    const { formatCurrency, formatDate } = useAppSettings();

    const [date, setDate] = useState({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");

    const fetchData = useCallback(async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
                end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
                type: filterType
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/payments?${queryParams}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            const result = await res.json();

            if (result.status === 'success') {
                setData(result.data || []);
            } else {
                toast.error(result.message || "Failed to fetch payment register");
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            toast.error("Failed to load payment register");
        } finally {
            setIsLoading(false);
        }
    }, [session?.accessToken, date, filterType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        if (!searchQuery) return data;
        const q = searchQuery.toLowerCase();
        return data.filter(item =>
            item.voucher_number?.toLowerCase().includes(q) ||
            item.payee?.toLowerCase().includes(q) ||
            item.type?.toLowerCase().includes(q)
        );
    }, [data, searchQuery]);

    const stats = useMemo(() => {
        const total = filteredData.reduce((sum, item) => sum + Number(item.total_amount), 0);
        const supplierTotal = filteredData.filter(i => i.type.includes('Supplier')).reduce((sum, item) => sum + Number(item.total_amount), 0);
        const expenseTotal = filteredData.filter(i => i.type.includes('Expense')).reduce((sum, item) => sum + Number(item.total_amount), 0);
        
        return { total, supplierTotal, expenseTotal, count: filteredData.length };
    }, [filteredData]);

    const columns = [
        {
            accessorKey: "payee",
            header: "Transaction Entity",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "size-9 rounded-lg flex items-center justify-center font-bold text-sm text-white",
                        row.original.type.includes('Supplier') 
                            ? "bg-indigo-600" 
                            : "bg-rose-600"
                    )}>
                        {row.original.payee?.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-foreground leading-none mb-1 group-hover:text-emerald-600 transition-colors uppercase">{row.original.payee}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 leading-none opacity-60">
                            {row.original.type.includes('Supplier') ? <Building2 className="h-2.5 w-2.5" /> : <Users className="h-2.5 w-2.5" />}
                            {row.original.type}
                        </span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "date",
            header: "Timeline & Reference",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-foreground tabular-nums leading-none">{formatDate(row.original.date)}</span>
                    <div className="mt-1.5 flex items-center gap-1.5 leading-none">
                       <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter opacity-50">REF:</span>
                       <span className="text-[10px] font-black text-emerald-600 tabular-nums uppercase">{row.original.voucher_number}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "methods",
            header: "Payment Details",
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.methods?.map((m, idx) => (
                        <Badge key={idx} variant="outline" className="bg-muted/30 text-muted-foreground border-border font-bold text-[9px] uppercase px-1.5 py-0 shadow-none">
                            {m.method} • {formatCurrency(m.amount)}
                        </Badge>
                    ))}
                    {(!row.original.methods || row.original.methods.length === 0) && (
                         <span className="text-[10px] text-muted-foreground font-bold uppercase italic opacity-40">Standard</span>
                    )}
                </div>
            )
        },
        {
            accessorKey: "total_amount",
            header: () => <div className="text-right pr-2">Amount</div>,
            cell: ({ row }) => (
                <div className="text-right pr-2 font-bold tabular-nums text-[14px]">
                    {formatCurrency(row.original.total_amount)}
                </div>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right">Audit</div>,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border shadow-lg p-1">
                            <DropdownMenuItem className="font-bold text-[10px] uppercase tracking-wider py-2 cursor-pointer">
                                <Printer className="mr-2 h-3.5 w-3.5" /> Print Voucher
                            </DropdownMenuItem>
                            <DropdownMenuItem className="font-bold text-[10px] uppercase tracking-wider py-2 cursor-pointer text-blue-600">
                                <CreditCard className="mr-2 h-3.5 w-3.5" /> View Ledger
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    const StatCards = () => {
        const statItems = [
            { label: "Total Outflow", value: formatCurrency(stats.total), icon: Wallet, gradient: "from-slate-700 to-slate-900" },
            { label: "Suppliers", value: formatCurrency(stats.supplierTotal), icon: Building2, gradient: "from-blue-600 to-indigo-500" },
            { label: "Expenses", value: formatCurrency(stats.expenseTotal), icon: TrendingUp, gradient: "from-rose-600 to-red-500" },
            { label: "Voucher Count", value: stats.count, icon: Activity, gradient: "from-emerald-600 to-teal-500" }
        ];

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                {statItems.map((item, idx) => (
                    <div key={idx} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                        <div className={`p-3 rounded-lg bg-linear-to-br ${item.gradient} text-white`}>
                            <item.icon className="w-5 h-5 shadow-sm" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider leading-none mb-1.5">{item.label}</p>
                            <h3 className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{item.value}</h3>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <ResourceManagementLayout
            data={filteredData}
            columns={columns}
            isLoading={isLoading}
            headerTitle={
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
                        <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">Payment Register</h1>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5 opacity-60">Strategic Disbursement & Reconciliation Hub</p>
                    </div>
                </div>
            }
            statCardsComponent={<StatCards />}
            searchPlaceholder="Search Payee or Reference..."
            onSearchChange={setSearchQuery}
            searchColumn="payee"
            exportData={filteredData}
            exportFileName="Payment_Audit_Journal"
            isFiltered={filterType !== "all" || searchQuery !== ""}
            onClearFilters={() => {
                setFilterType("all");
                setSearchQuery("");
            }}
            extraActions={
                <Button onClick={fetchData} variant="outline" size="sm" className="h-9 w-9 p-0 rounded-lg border-border bg-transparent">
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
            }
            filterComponents={() => (
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest pl-1">Audit Window</label>
                         <Popover>
                            <PopoverTrigger asChild>
                                 <Button variant="outline" className="h-9 px-4 rounded-lg border-border bg-transparent hover:bg-muted text-[12px] font-bold transition-all gap-2.5 shadow-xs w-[240px] justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-indigo-500 opacity-70" />
                                        {date?.from ? (date.to ? <>{format(date.from, "MMM dd")} - {format(date.to, "MMM dd")}</> : format(date.from, "MMM dd")) : "Temporal Range"}
                                    </div>
                                    <ChevronDown className="h-3.5 w-3.5 opacity-40" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-xl shadow-2xl border-border" align="start">
                                <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest pl-1">Disbursement Category</label>
                         <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[180px] h-9 text-[12px] font-bold rounded-lg shadow-xs">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-lg border-border">
                                <SelectItem value="all" className="text-[12px] font-medium">All Disbursements</SelectItem>
                                <SelectItem value="supplier" className="text-[12px] font-bold text-indigo-600">Supplier Settlements</SelectItem>
                                <SelectItem value="expense" className="text-[12px] font-bold text-rose-600">Operating Expenses</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                </div>
            )}
        />
    );
}



