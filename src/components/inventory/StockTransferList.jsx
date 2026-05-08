"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
    RefreshCcw, 
    ArrowRightLeft,
    Package,
    TrendingUp,
    Activity,
    MapPin,
    ArrowLeftRight,
} from "lucide-react";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import StockTransferCreate from "./StockTransferCreate";
import StockTransferDetails from "./StockTransferDetails";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getTransferColumns } from "./transfer-column";

const HeaderContent = () => (
    <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl border border-emerald-500/10 shadow-sm shadow-emerald-500/5">
            <ArrowLeftRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Inventory Transfers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Logistics manifest for moving stock between business branches.</p>
        </div>
    </div>
);

const TransferStatsCards = ({ transfers }) => {
    const stats = useMemo(() => {
        if (!transfers?.length) return { total: 0, itemsMoved: 0, topOrigin: "—", topDest: "—" };
        
        const originCounts = {};
        const destCounts = {};
        
        transfers.forEach(t => {
            const from = t.from_branch?.name;
            const to = t.to_branch?.name;
            if (from) originCounts[from] = (originCounts[from] || 0) + 1;
            if (to) destCounts[to] = (destCounts[to] || 0) + 1;
        });

        const topOrigin = Object.entries(originCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "—";
        const topDest = Object.entries(destCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "—";

        return {
            total: transfers.length,
            itemsMoved: transfers.length > 0 ? "Live" : 0, // Simplified as we'd need detail fetch for sum
            topOrigin,
            topDest
        };
    }, [transfers]);

    const statItems = [
        { label: "Total Movements", value: stats.total, icon: TrendingUp, iconBg: "bg-slate-100 dark:bg-slate-800", iconColor: "text-slate-600" },
        { label: "Origin Hub", value: stats.topOrigin, icon: MapPin, iconBg: "bg-emerald-100 dark:bg-emerald-500/20", iconColor: "text-emerald-600" },
        { label: "Destination Hub", value: stats.topDest, icon: Package, iconBg: "bg-amber-100 dark:bg-amber-500/20", iconColor: "text-amber-600" },
        { label: "Logistics Health", value: "Optimal", icon: Activity, iconBg: "bg-indigo-100 dark:bg-indigo-500/20", iconColor: "text-indigo-600" },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statItems.map((item, idx) => (
                <Card key={idx} className="group hover:shadow-md transition-all duration-200 border-border/60 hover:border-border overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110", item.iconBg)}>
                                <item.icon className={cn("h-4.5 w-4.5", item.iconColor)} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-0.5">{item.label}</p>
                                <p className="text-lg font-bold text-foreground tabular-nums truncate">{item.value}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const TransferFilters = ({ table }) => {
    if (!table) return null;
    return (
        <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">Status Filter</label>
                <Select
                    value={String(table.getColumn("status")?.getFilterValue() ?? "all")}
                    onValueChange={(value) => {
                        table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value);
                    }}
                >
                    <SelectTrigger className="w-[160px] h-9 shadow-sm bg-background border-border/60 font-semibold text-xs">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

const StockTransferList = () => {
    const { data: session } = useSession();
    const { hasPermission } = usePermission();
    const [loading, setLoading] = useState(true);
    const [transfers, setTransfers] = useState([]);
    const [error, setError] = useState(null);
    
    // Dialog States
    const [createOpen, setCreateOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedTransferId, setSelectedTransferId] = useState(null);

    const fetchData = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        setError(null);
        try {
            // Fetching a large page limit to let ResourceManagementLayout's internal table handle filtering cleanly.
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks/transfers?page=1&size=500`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                setTransfers(data.data.data || []);
            } else {
                throw new Error("Failed to load transfer history");
            }
        } catch (error) {
            console.error("Error fetching transfers:", error);
            setError("Failed to load transfer history");
            toast.error("Failed to load transfer history");
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    const openDetails = useCallback((id) => {
        setSelectedTransferId(id);
        setDetailsOpen(true);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const columns = useMemo(() => getTransferColumns({ onOpenDetails: openDetails }), [openDetails]);

    const canCreate = hasPermission(PERMISSIONS.STOCK_EDIT);

    return (
        <>
            <ResourceManagementLayout
                data={transfers}
                columns={columns}
                isLoading={loading}
                isError={!!error}
                errorMessage={error}
                onRetry={fetchData}
                headerTitle={<HeaderContent />}
                addButtonLabel="Initiate Transfer"
                onAddClick={canCreate ? () => setCreateOpen(true) : undefined}
                statCardsComponent={TransferStatsCards}
                filterComponents={(table) => <TransferFilters table={table} />}
                extraActions={
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={fetchData} 
                        disabled={loading}
                        className="h-9 px-4 rounded-md border border-border/60 bg-background hover:bg-emerald-500/5 hover:border-emerald-500/30 font-bold text-[11px] transition-all gap-2"
                    >
                        <RefreshCcw className={cn("h-3.5 w-3.5 text-muted-foreground/60", loading && "animate-spin")} />
                        <span className="hidden sm:inline">Refresh Logic</span>
                    </Button>
                }
                searchColumn="transfer_number"
                searchPlaceholder="Search manifest numbers..."
                searchLabel="Transfer Archives"
            />

            {createOpen && (
                <StockTransferCreate 
                    open={createOpen} 
                    onOpenChange={setCreateOpen}
                    onSuccess={() => fetchData()}
                />
            )}

            {detailsOpen && (
                <StockTransferDetails 
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    transferId={selectedTransferId}
                />
            )}
        </>
    );
};

export default StockTransferList;
