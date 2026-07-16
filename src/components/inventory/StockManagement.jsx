"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
    Filter,
    Box,
    RefreshCcw,
    Barcode,
    Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "@/lib/date-utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { StockAdjustmentSheet } from "./StockAdjustmentSheet";
import { StockBatchSheet } from "./StockBatchSheet";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getStockColumns } from "./stock-column";
import { Button } from "../ui/button";
import { useDebounce } from "@/hooks/useDebounce";

const HeaderContent = () => (
    <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
            <Box className="w-4.5 h-4.5 text-emerald-600" />
        </div>
        <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-foreground">
                Inventory Management
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium opacity-80">
                Monitor & adjust real-time stock levels
            </p>
        </div>
    </div>
);

const StockManagement = () => {
    const { data: session, status } = useSession();
    const { hasPermission } = usePermission();
    const [loading, setLoading] = useState(true);
    const [stocks, setStocks] = useState([]);
    const [search, setSearch] = useState("");
    // Already debounced in toolbar (300ms), reducing this to 100ms for responsiveness
    const debouncedSearch = useDebounce(search, 100);
    const [branches, setBranches] = useState([]);
    const [error, setError] = useState(null);

    // Filters
    const [selectedBranch, setSelectedBranch] = useState("all");
    const [batchNumber, setBatchNumber] = useState("");
    const [expiryRange, setExpiryRange] = useState({ from: null, to: null });

    // Dialog States
    const [adjustmentOpen, setAdjustmentOpen] = useState(false);
    const [batchSheetOpen, setBatchSheetOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    const hasEditPermission = hasPermission(PERMISSIONS.STOCK_EDIT);

    const fetchData = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: 1,
                size: 500,
                branch_id: selectedBranch !== "all" ? selectedBranch : "",
                batch_number: batchNumber,
                product_name: debouncedSearch, // Use debounced value
                expiry_start: expiryRange?.from ? format(expiryRange.from, 'yyyy-MM-dd') : '',
                expiry_end: expiryRange?.to ? format(expiryRange.to, 'yyyy-MM-dd') : '',
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                const stockList = data.data.data || [];
                const stocksWithSearch = stockList.map(stock => {
                    const attributes = stock.variant?.attribute_values?.map(av => av.value).join(" ") || "";
                    const barcode = stock.variant?.barcode || stock.product?.barcode || "";
                    return {
                        ...stock,
                        searchText: `${stock.product?.name || ""} ${stock.variant?.sku || ""} ${stock.variant?.name || ""} ${barcode} ${attributes}`.toLowerCase()
                    };
                });
                setStocks(stocksWithSearch);
            } else {
                throw new Error("Failed to load stocks");
            }
        } catch (error) {
            console.error("Error fetching stocks:", error);
            setError("Failed to load stock data");
            toast.error("Failed to load stock data");
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, selectedBranch, batchNumber, expiryRange, debouncedSearch]);

    const fetchBranches = async () => {
        if (!session?.accessToken) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                setBranches(data.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchData();
            fetchBranches();
        }
    }, [status, fetchData]);

    // Handle Search Change
    const handleSearchChange = useCallback((value) => {
        setSearch(value);
    }, []);

    const openAdjustment = useCallback((stock) => {
        setSelectedStock(stock);
        setAdjustmentOpen(true);
    }, []);

    const openBatchDetails = useCallback((stock) => {
        setSelectedStock(stock);
        setBatchSheetOpen(true);
    }, []);

    const columns = useMemo(() => getStockColumns({
        onAdjust: openAdjustment,
        onViewBatches: openBatchDetails,
        hasEditPermission
    }), [openAdjustment, openBatchDetails, hasEditPermission]);

    // Custom Filters injected into Layout
    const inventoryFilters = (table) => (
        <div className="flex flex-wrap items-center gap-3">
            {/* Branch Selector */}
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[160px] h-9 bg-background border-border/60 rounded-md font-semibold text-[13px] shadow-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all">
                    <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Batch Selector */}
            <div className="relative group w-[160px]">
                <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                <Input
                    placeholder="Batch No..."
                    className="pl-8 h-9 rounded-md border-border/60 shadow-none focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500/40 text-[13px] font-medium bg-background"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                />
            </div>

            {/* Expiry Range */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-[180px] justify-between h-9 rounded-md border-border/60 font-semibold text-[13px] hover:bg-emerald-50 hover:border-emerald-200 bg-background transition-all"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span className="truncate">
                                {expiryRange?.from ? (
                                    expiryRange.to ? (
                                        <>{format(expiryRange.from, "MMM dd")} - {format(expiryRange.to, "MMM dd")}</>
                                    ) : (
                                        format(expiryRange.from, "MMM dd")
                                    )
                                ) : (
                                    "Expiry Range"
                                )}
                            </span>
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={expiryRange?.from}
                        selected={expiryRange}
                        onSelect={setExpiryRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );

    return (
        <>
            <ResourceManagementLayout
                data={stocks}
                columns={columns}
                isLoading={loading}
                isError={!!error}
                errorMessage={error}
                onRetry={fetchData}
                headerTitle={<HeaderContent />}
                extraActions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchData}
                        disabled={loading}
                        className="h-9 px-4 rounded-md border-border/60 bg-background hover:bg-emerald-500/5 hover:border-emerald-500/30 font-semibold text-xs transition-all gap-2"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 text-muted-foreground/60 ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Reload Catalog</span>
                    </Button>
                }
                searchColumn="searchText"
                initialColumnVisibility={useMemo(() => ({
                    searchText: false,
                }), [])}
                searchPlaceholder="Search products by name, sku or barcode..."
                onSearchChange={handleSearchChange}
                filterComponents={inventoryFilters}
            />

            {adjustmentOpen && (
                <StockAdjustmentSheet
                    open={adjustmentOpen}
                    onOpenChange={setAdjustmentOpen}
                    stock={selectedStock}
                    onSuccess={() => fetchData()}
                />
            )}

            {batchSheetOpen && (
                <StockBatchSheet
                    isOpen={batchSheetOpen}
                    onClose={() => setBatchSheetOpen(false)}
                    stock={selectedStock}
                />
            )}
        </>
    );
};

export default StockManagement;
