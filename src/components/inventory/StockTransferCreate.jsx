"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
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
    Boxes,
    ArrowRightLeft,
    CheckCircle2,
    Loader2,
    ArrowRight,
    Search,
    AlertCircle,
    Package,
    Plus,
    Trash2,
    MapPin,
    Building2,
    Save,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

const StockTransferCreate = ({ open, onOpenChange, onSuccess }) => {
    const { data: session } = useSession();
    const [submitting, setSubmitting] = useState(false);
    const [branches, setBranches] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // Form State
    const [fromBranchId, setFromBranchId] = useState("");
    const [toBranchId, setToBranchId] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([]); // Array of { product_id, product_variant_id, quantity, name, variant_name }

    useEffect(() => {
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
        fetchBranches();
    }, [session?.accessToken]);

    const handleSearch = async (val) => {
        setSearchQuery(val);
        
        if (!fromBranchId) {
            if (val.length > 0) toast.error("Please select an origin branch first");
            setSearchResults([]);
            return;
        }

        try {
            // If no search term, fetch the first few items to 'browse'
            const searchParams = val.length >= 1 ? `&product_name=${val}&sku=${val}` : '';
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks?branch_id=${fromBranchId}${searchParams}&size=20`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                const stockList = data.data.data || [];
                const results = stockList.map(s => {
                    const p = s.product || {};
                    const v = s.variant;
                    const productImage = p.image ? (p.image.startsWith('[') ? JSON.parse(p.image)[0] : p.image) : null;
                    
                    return {
                        product_id: p.id,
                        product_variant_id: v ? v.id : null,
                        name: p.name || "Unknown Product",
                        variant_name: v ? v.name : null,
                        display_name: v ? `${p.name} (${v.name})` : p.name,
                        sku: v ? (v.sku || p.code) : (p.sku || p.code),
                        barcode: v ? (v.barcode || p.barcode) : p.barcode,
                        image: v ? (v.image || productImage) : productImage,
                        available_stock: s.quantity !== undefined ? parseFloat(s.quantity) : 0
                    };
                });

                // --- AUTO-SCAN LOGIC ---
                const exactMatches = val.length >= 2 ? results.filter(r => 
                    (r.barcode && r.barcode.toLowerCase() === val.toLowerCase()) || 
                    (r.sku && r.sku.toLowerCase() === val.toLowerCase())
                ) : [];

                if (exactMatches.length === 1) {
                    addItem(exactMatches[0]);
                    setSearchResults([]);
                    return;
                }

                setSearchResults(results);
            }
        } catch (error) {
            console.error("Search error:", error);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
    };

    const addItem = (result) => {
        const exists = items.find(i =>
            i.product_id === result.product_id &&
            i.product_variant_id === result.product_variant_id
        );
        if (exists) {
            toast.error("Item already manifest identified");
            return;
        }

        setItems([...items, { ...result, quantity: 1 }]);
        clearSearch();
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateQuantity = (index, val) => {
        const newItems = [...items];
        newItems[index].quantity = val;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!fromBranchId || !toBranchId) {
            toast.error("Verify workspace endpoints");
            return;
        }
        if (fromBranchId === toBranchId) {
            toast.error("Circular transfer detected");
            return;
        }
        if (items.length === 0) {
            toast.error("Manifest entry required");
            return;
        }
        if (items.some(i => !i.quantity || parseFloat(i.quantity) <= 0)) {
            toast.error("Invalid quantity identified");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks/transfers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({
                    from_branch_id: fromBranchId,
                    to_branch_id: toBranchId,
                    notes,
                    items: items.map(i => ({
                        product_id: i.product_id,
                        product_variant_id: i.product_variant_id,
                        quantity: i.quantity
                    }))
                }),
            });

            const data = await res.json();
            if (data.status === "success") {
                toast.success("Stock transfer created successfully");
                onSuccess?.();
                onOpenChange(false);
            } else {
                toast.error(data.message || "Failed to create transfer");
            }
        } catch (error) {
            console.error("Transfer error:", error);
            toast.error("Network communication failure");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-3xl w-full p-0 flex flex-col h-full bg-background border-l shadow-2xl">
                {/* HEADER */}
                <SheetHeader className="px-8 py-6 border-b border-border bg-background shrink-0">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                            <ArrowRightLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <SheetTitle className="text-xl font-bold text-foreground">
                            Create Stock Transfer
                        </SheetTitle>
                    </div>
                    <SheetDescription className="text-sm text-muted-foreground">
                        Initialize a new movement of inventory between business locations.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scrollbar-none">
                    {/* --- WORKSPACE ENDPOINTS --- */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-sm font-bold text-foreground">Transfer Locations</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                             <div className="space-y-2">
                                <Label className="font-semibold text-foreground">Origin Branch</Label>
                                <Select value={fromBranchId} onValueChange={setFromBranchId}>
                                    <SelectTrigger className="shadow-sm">
                                        <SelectValue placeholder="Select Origin" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-2xl border-border/50 bg-card">
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id} className="text-sm font-medium">{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                             </div>
                             <div className="space-y-2">
                                <Label className="font-semibold text-foreground">Destination Branch</Label>
                                <Select value={toBranchId} onValueChange={setToBranchId}>
                                    <SelectTrigger className="shadow-sm">
                                        <SelectValue placeholder="Select Destination" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-2xl border-border/50 bg-card">
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id} className="text-sm font-medium">
                                                {b.name} {fromBranchId === b.id && "(Duplicate)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                             </div>
                        </div>
                    </div>

                    {/* --- MANIFEST SEARCH --- */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-sm font-bold text-foreground">Item Selection</h3>
                        </div>
 
                        <div className="relative group/search">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products by name or SKU..."
                                className="pl-10 shadow-sm"
                                value={searchQuery}
                                onFocus={() => !searchQuery && handleSearch("")}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
 
                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-card border border-border/50 shadow-2xl rounded-xl max-h-80 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {searchResults.map((result, idx) => (
                                        <button
                                            key={idx}
                                            className="w-full text-left p-3 hover:bg-emerald-500/5 rounded-lg flex items-center justify-between group transition-all"
                                            onClick={() => addItem(result)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-11 rounded-lg bg-muted flex items-center justify-center text-muted-foreground overflow-hidden border border-border/40">
                                                    {result.image ? (
                                                        <img 
                                                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "")}/${result.image}`} 
                                                            className="h-full w-full object-cover" 
                                                            alt={result.display_name} 
                                                        />
                                                    ) : (
                                                        <Package className="h-5 w-5 opacity-40" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground leading-tight">{result.display_name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {result.sku && (
                                                            <span className="text-[9px] font-bold text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                SKU: {result.sku}
                                                            </span>
                                                        )}
                                                        {result.barcode && (
                                                            <span className="text-[9px] font-bold text-emerald-600/60 bg-emerald-500/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                BC: {result.barcode}
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-500/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                            STOCK: {result.available_stock}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Plus className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- MANIFEST TABLE --- */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <Boxes className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-sm font-bold text-foreground">Transfer Manifest</h3>
                            {items.length > 0 && (
                                <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 border-none font-bold text-[10px] h-5 px-2">
                                    {items.length} Items Selected
                                </Badge>
                            )}
                        </div>

                        <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm bg-card">
                            <Table>
                                <TableHeader className="bg-muted/50 border-b border-border/60">
                                    <TableRow className="border-none hover:bg-transparent">
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest h-9 px-4 w-12 text-center">Img</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest h-9 px-4">Description</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest h-9 w-24 px-4 text-center">Available</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest h-9 w-28 px-4 text-center">Quantity</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest h-9 w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={5} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 opacity-30 grayscale">
                                                    <Boxes className="h-7 w-7 text-muted-foreground" />
                                                    <p className="text-xs font-semibold">No items added to transfer</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item, idx) => (
                                            <TableRow key={idx} className="border-border/30 hover:bg-muted/40 transition-colors group">
                                                <TableCell className="py-2 px-4">
                                                    <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground overflow-hidden border border-border/20">
                                                        {item.image ? (
                                                            <img 
                                                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "")}/${item.image}`} 
                                                                className="h-full w-full object-cover" 
                                                                alt={item.name} 
                                                            />
                                                        ) : (
                                                            <Package className="h-4 w-4 opacity-30" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold text-foreground">{item.name}</span>
                                                            {item.variant_name && (
                                                                <Badge variant="secondary" className="px-1.5 py-0 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider">
                                                                    {item.variant_name}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {item.sku && (
                                                                <span className="text-[9px] font-bold text-muted-foreground/50 tracking-tight">
                                                                    SKU: {item.sku}
                                                                </span>
                                                            )}
                                                            {item.barcode && (
                                                                <span className="text-[9px] font-bold text-muted-foreground/50 tracking-tight">
                                                                    • BC: {item.barcode}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className={cn(
                                                        "text-sm font-bold tabular-nums",
                                                        item.available_stock <= 0 ? "text-red-500" : "text-amber-600"
                                                    )}>
                                                        {item.available_stock}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <Input
                                                        type="number"
                                                        className="h-9 w-full text-center font-bold tabular-nums shadow-sm"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(idx, e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-3 px-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-full"
                                                        onClick={() => removeItem(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-sm font-bold text-foreground">Additional Remarks</h3>
                        </div>
                        <Textarea
                            placeholder="Add reason for transfer or reference codes..."
                            className="min-h-[100px] shadow-sm resize-none"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
 
                <SheetFooter className="px-8 py-5 border-t border-border bg-background flex flex-row items-center justify-end gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto font-semibold shadow-sm"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        disabled={submitting}
                        onClick={handleSubmit}
                        className="w-full sm:w-auto min-w-[150px] font-semibold shadow-sm"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Transfer
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default StockTransferCreate;
