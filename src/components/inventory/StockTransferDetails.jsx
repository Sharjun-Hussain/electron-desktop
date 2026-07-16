"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowRightLeft,
    Calendar,
    Warehouse,
    User,
    Package,
    ArrowRight,
    FileText,
    History
} from "lucide-react";
import { format } from "@/lib/date-utils";
import { toast } from "sonner";
import { StatusBadge } from "../ui/status-badge";
import { Card } from "../ui/card";


const StockTransferDetails = ({ open, onOpenChange, transferId }) => {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [transfer, setTransfer] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!transferId || !session?.accessToken) return;
            setLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks/transfers/${transferId}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                const data = await res.json();
                if (data.status === "success") {
                    setTransfer(data.data);
                } else {
                    toast.error("Failed to load transfer details");
                }
            } catch (error) {
                console.error("Error fetching transfer details:", error);
                toast.error("An error occurred while fetching details");
            } finally {
                setLoading(false);
            }
        };

        if (open) fetchDetails();
    }, [open, transferId, session?.accessToken]);

    if (!transfer && loading) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/50 backdrop-blur-xl border border-border/60 shadow-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-border/40 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-3 text-lg font-bold tracking-tight text-foreground">
                            <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                <FileText className="h-4.5 w-4.5 text-emerald-600" />
                            </div>
                            Transfer Shipment Details
                        </DialogTitle>
                        <StatusBadge value={transfer?.status} className="h-5 px-3" />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none bg-white dark:bg-slate-950">
                    {/* --- SHIPMENT INTELLIGENCE GRID --- */}
                    <Card className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-none">
                        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-3.5 space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 leading-none">IDENTIFIER</p>
                                <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate">{transfer?.transfer_number}</p>
                            </div>
                            <div className="p-3.5 space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 leading-none">CHRONOLOGY</p>
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                    <Calendar className="h-3 w-3 opacity-40" />
                                    <span className="text-[11px] font-bold">{transfer?.transfer_date ? format(new Date(transfer.transfer_date), "dd MMM, yyyy") : "—"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-3.5 space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 leading-none">OPERATIVE</p>
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                    <User className="h-3 w-3 opacity-40" />
                                    <span className="text-[11px] font-bold">{transfer?.user?.name || "SYS"}</span>
                                </div>
                            </div>
                            <div className="p-3.5 space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 leading-none">LOGISTICS PATH</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[80px]">{transfer?.from_branch?.name}</span>
                                    <ArrowRight className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                                    <span className="text-[11px] font-bold text-emerald-600 truncate max-w-[80px]">{transfer?.to_branch?.name}</span>
                                </div>
                            </div>
                        </div>
                        {transfer?.notes && (
                            <div className="p-3 bg-white/50 dark:bg-slate-800/50">
                                <p className="text-[9px] font-bold text-slate-400 mb-1">MANIFEST NOTES</p>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed font-mono">{transfer.notes}</p>
                            </div>
                        )}
                    </Card>

                    {/* --- INVENTORY MANIFEST --- */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            <Package className="h-3.5 w-3.5 text-emerald-600" />
                            <h3 className="text-[10px] font-bold text-slate-500">Inventory Manifest</h3>
                        </div>
                        <Card className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-none bg-white dark:bg-slate-900">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="text-[9px] font-bold text-slate-400 h-8 px-4">ITEM DESCRIPTION</TableHead>
                                        <TableHead className="text-[9px] font-bold text-slate-400 h-8 text-right pr-4">QUANTITY</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfer?.items?.map((item, idx) => (
                                        <TableRow key={idx} className="border-slate-100 dark:border-slate-800 last:border-none hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="py-2.5 px-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-[12px] font-bold text-slate-900 dark:text-white leading-none">{item.product?.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {item.variant && (
                                                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{item.variant.name}</span>
                                                        )}
                                                        <span className="text-[9px] text-slate-400 font-bold opacity-60">{item.variant?.sku || item.product?.code}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5 text-right pr-4">
                                                <span className="text-[13px] font-bold text-slate-950 dark:text-white tabular-nums">{parseFloat(item.quantity).toFixed(2)}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-4 pb-6 bg-muted/20 border-t border-border/40">
                    <Button onClick={() => onOpenChange(false)} variant="outline" className="h-9 px-8 rounded-md font-bold text-xs text-muted-foreground border border-border bg-background hover:text-foreground hover:bg-background transition-all active:scale-95 shadow-sm">
                        Dismiss Details
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Utility function for conditional class names if not globally available in this context
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default StockTransferDetails;
