"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
    Filter, 
    Box,
    RefreshCcw
} from "lucide-react";
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
    const { data: session } = useSession();
    const { hasPermission } = usePermission();
    const [loading, setLoading] = useState(true);
    const [stocks, setStocks] = useState([]);
    const [branches, setBranches] = useState([]);
    const [error, setError] = useState(null);
    
    // Filters
    const [selectedBranch, setSelectedBranch] = useState("all");
    
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
            // Note: Since ResourceManagementLayout manages client-side filtering via searchColumn="name", 
            // we'll fetch a wider dataset, or rely on its built-in filtering for now.
            // Using size=100 as a temporary compromise if API requires pagination, or you can implement 
            // full server-side state in the layout if needed.
            const branchQuery = selectedBranch !== "all" ? `&branch_id=${selectedBranch}` : "";
            const searchParams = new URLSearchParams({
                page: 1,
                size: 500, // Fetching enough to allow client-side layout filtering
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks?${searchParams.toString()}${branchQuery}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                const stockList = data.data.data || [];
                const stocksWithSearch = stockList.map(stock => {
                    const attributes = stock.variant?.attribute_values?.map(av => av.value).join(" ") || "";
                    return {
                        ...stock,
                        searchText: `${stock.product?.name || ""} ${stock.variant?.sku || ""} ${stock.variant?.name || ""} ${attributes}`.toLowerCase()
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
    }, [session?.accessToken, selectedBranch]);

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
        fetchData();
        fetchBranches();
    }, [fetchData]);

    const openAdjustment = useCallback((stock) => {
        setSelectedStock(stock);
        setAdjustmentOpen(true);
    }, []);

    const openBatchSheet = useCallback((stock) => {
        setSelectedStock(stock);
        setBatchSheetOpen(true);
    }, []);

    const columns = useMemo(() => getStockColumns({ 
        onAdjust: openAdjustment, 
        onViewBatches: openBatchSheet,
        hasEditPermission 
    }), [openAdjustment, openBatchSheet, hasEditPermission]);

    // Custom Branch Filter injected into Layout
    const branchFilter = (table) => (
        <div className="flex items-center gap-2">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[180px] h-9 bg-background border-border/60 rounded-md font-semibold text-[13px] shadow-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all">
                    <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
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
                searchPlaceholder="Search products by name..."
                filterComponents={branchFilter}
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
