"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Box,
    PlusCircle,
    MinusCircle,
    Equal,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    History,
    Barcode
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const StockAdjustmentSheet = ({ open, onOpenChange, stock, onSuccess }) => {
    const { data: session } = useSession();
    const [submitting, setSubmitting] = useState(false);
    const [batches, setBatches] = useState([]);
    const [fetchingBatches, setFetchingBatches] = useState(false);
    const [formData, setFormData] = useState({
        type: "addition",
        quantity: "",
        reason: "",
        batchId: "all"
    });

    useEffect(() => {
        const fetchBatches = async () => {
            if (!stock || !open || !session?.accessToken) return;

            setFetchingBatches(true);
            try {
                const params = new URLSearchParams({
                    branch_id: stock.branch_id,
                });
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/variants/${stock.product_variant_id}/batches?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                const data = await res.json();
                if (data.status === "success") {
                    setBatches(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching batches:", error);
            } finally {
                setFetchingBatches(false);
            }
        };

        fetchBatches();
    }, [stock, open, session]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
            toast.error("Please enter a valid quantity");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks/adjust`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({
                    branch_id: stock.branch_id,
                    product_id: stock.product_id,
                    product_variant_id: stock.product_variant_id,
                    product_batch_id: formData.batchId === "all" ? null : formData.batchId,
                    quantity: formData.quantity,
                    type: formData.type,
                    reason: formData.reason
                }),
            });

            const data = await res.json();
            if (data.status === "success") {
                toast.success("Stock adjusted successfully");
                onSuccess?.();
                onOpenChange(false);
                // Reset form
                setFormData({
                    type: "addition",
                    quantity: "",
                    reason: "",
                    batchId: "all"
                });
            } else {
                toast.error(data.message || "Failed to adjust stock");
            }
        } catch (error) {
            console.error("Error adjusting stock:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!stock) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-[460px] border-l border-border/40 bg-card/95 backdrop-blur-xl p-0 flex flex-col shadow-2xl">
                <SheetHeader className="p-6 pb-4 border-b border-border/40">
                    <div className="flex items-center gap-4">
                        <div className="size-9 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm shadow-emerald-500/10 transition-transform hover:scale-105 active:scale-95 cursor-default">
                            <Box className="size-4.5 text-emerald-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <SheetTitle className="text-lg font-bold text-foreground truncate">
                                Adjust Inventory
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-muted-foreground/60 leading-relaxed truncate mt-1">
                                Manually reconcile stock levels for accuracy.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto space-y-6">
                    <div className="bg-emerald-500/5 p-4 rounded-md border border-emerald-500/10 transition-all hover:bg-emerald-500/10">
                        <div className="flex justify-between items-start">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-emerald-600/60 mb-1">Product Identity</p>
                                <h4 className="font-bold text-foreground text-sm leading-tight truncate">{stock.product?.name}</h4>
                                {stock.variant && (
                                    <p className="text-xs text-emerald-600 font-bold mt-2 max-w-min px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap">
                                        {stock.variant.name}
                                    </p>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs font-semibold text-emerald-600/60 mb-1">Current Balance</p>
                                <p className="text-xl font-extrabold text-foreground">{parseFloat(stock.quantity).toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-emerald-500/10 text-xs text-muted-foreground font-semibold flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500/70" />
                            <span>Recording for <strong className="text-foreground font-bold">{stock.branch?.name}</strong> warehouse.</span>
                        </div>
                    </div>

                    <form id="stock-adjust-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Adjustment Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger className="h-11 bg-background border-border/60 rounded-xl px-4 shadow-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-top-2 duration-200">
                                    <SelectItem value="addition" className="cursor-pointer py-2.5">
                                        <div className="flex items-center gap-3">
                                            <PlusCircle className="h-4 w-4 text-emerald-500" />
                                            <span className="font-semibold text-sm">Stock Addition</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="subtraction" className="cursor-pointer py-2.5">
                                        <div className="flex items-center gap-3">
                                            <MinusCircle className="h-4 w-4 text-rose-500" />
                                            <span className="font-semibold text-sm">Stock Subtraction</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="set_to" className="cursor-pointer py-2.5">
                                        <div className="flex items-center gap-3">
                                            <Equal className="h-4 w-4 text-indigo-600" />
                                            <span className="font-semibold text-sm">Inventory Override</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Target Batch (Optional)</Label>
                            <Select
                                value={formData.batchId}
                                onValueChange={(val) => setFormData({ ...formData, batchId: val })}
                                disabled={fetchingBatches}
                            >
                                <SelectTrigger className="h-11 bg-background border-border/60 rounded-xl px-4 shadow-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all">
                                    <SelectValue placeholder="Select batch" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-top-2 duration-200">
                                    <SelectItem value="all" className="cursor-pointer py-2.5">
                                        <div className="flex items-center gap-3">
                                            <History className="h-4 w-4 text-slate-500" />
                                            <span className="font-semibold text-sm">General Inventory</span>
                                        </div>
                                    </SelectItem>
                                    {batches.map((batch) => (
                                        <SelectItem key={batch.id} value={batch.id} className="cursor-pointer py-2.5">
                                            <div className="flex items-center gap-3">
                                                <Barcode className="h-4 w-4 text-indigo-600" />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">Batch #{batch.batch_number}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Qty: {parseFloat(batch.quantity).toFixed(2)} {batch.expiry_date && `• Exp: ${format(new Date(batch.expiry_date), 'dd MMM')}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fetchingBatches && <p className="text-[10px] text-indigo-600 font-bold animate-pulse mt-1 ml-1 flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Synchronizing batch data...</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground/70 ml-1">Quantity</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="h-9 bg-background border-border/60 rounded-md px-4 font-bold text-sm shadow-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground/70 ml-1">Reason / Notes</Label>
                            <Textarea
                                placeholder="State the reason for this adjustment..."
                                className="min-h-[100px] bg-background border-border/60 rounded-md px-4 py-3 font-semibold text-sm shadow-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all resize-none leading-relaxed"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </div>
                    </form>
                </div>

                <SheetFooter className="p-6 pt-4 pb-6 bg-muted/20 border-t border-border/40 grid grid-cols-2 gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="h-9 rounded-md font-bold text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all active:scale-95 border border-border/40"
                    >
                        Dismiss
                    </Button>
                    <Button
                        type="submit"
                        form="stock-adjust-form"
                        className="h-9 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 gap-2"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin opacity-60" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5 opacity-70" />
                                <span>Confirm Adjustment</span>
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
