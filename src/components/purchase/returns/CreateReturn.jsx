"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { format } from "@/lib/date-utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronsUpDown,
  Check,
  Plus,
  Trash2,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const returnItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productVariantId: z.string().nullable().optional(),
  name: z.string(),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0),
  reason: z.string().optional(),
  batchNumber: z.string().optional(),
});

const formSchema = z.object({
  returnDate: z.date({ required_error: "Date is required" }),
  branchId: z.string().min(1, "Branch is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  purchaseOrderId: z.string().optional(),
  grnId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(returnItemSchema).min(1, "At least one item is required"),
});

export default function CreateReturn() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [grns, setGrns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [openProductPopovers, setOpenProductPopovers] = useState({});
  const [openBranchPopover, setOpenBranchPopover] = useState(false);
  const [openSupplierPopover, setOpenSupplierPopover] = useState(false);
  const [openPoPopover, setOpenPoPopover] = useState(false);
  const [openGrnPopover, setOpenGrnPopover] = useState(false);
  const [openDatePopover, setOpenDatePopover] = useState(false);

  // Form Setup
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
        returnDate: new Date(),
        branchId: session?.user?.branch_id || "",
        supplierId: "",
        purchaseOrderId: "",
        grnId: "",
        notes: "",
        items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch PO/GRN Items when selected
  useEffect(() => {
    async function fetchItems(selectedPoId, selectedGrnId) {
        if (!session?.accessToken) return;
        
        const poId = selectedPoId || form.getValues("purchaseOrderId");
        const grnId = selectedGrnId || form.getValues("grnId");

        if (!poId && !grnId) return;

        try {
            let url = "";
            if (poId) {
                url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${poId}`;
            } else if (grnId) {
                url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn/${grnId}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const result = await res.json();

            if (result.status === 'success') {
                const data = result.data;
                const fetchedItems = (data.items || []).map(item => ({
                    productId: item.product_id,
                    productVariantId: item.product_variant_id || null,
                    name: (item.variant?.name || item.product?.name) || "",
                    quantity: parseFloat(item.quantity_received || item.quantity || 0),
                    unitCost: parseFloat(item.unit_cost || 0),
                    reason: "",
                    batchNumber: item.batch?.batch_number || item.batch_number || ""
                }));

                // Reset items and append new ones
                replace(fetchedItems);
                
                // Set supplier if not set
                if (data.supplier_id && !form.getValues("supplierId")) {
                    form.setValue("supplierId", data.supplier_id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch PO/GRN items", error);
            toast.error("Failed to load items from selection");
        }
    }

    const subscription = form.watch((value, { name }) => {
        if (name === "supplierId") {
            // Optional: could keep it if user wants to filter POs by supplier first
        } else if (name === "purchaseOrderId") {
            if (value.purchaseOrderId) {
                const selectedPo = purchaseOrders.find(p => p.id === value.purchaseOrderId);
                if (selectedPo && selectedPo.supplier_id) {
                    form.setValue("supplierId", selectedPo.supplier_id);
                }
                form.setValue("notes", `Purchase Return for PO: ${selectedPo?.po_number || value.purchaseOrderId}`);
                fetchItems(value.purchaseOrderId, null);
            }
        } else if (name === "grnId") {
            if (value.grnId) {
                const selectedGrn = grns.find(g => g.id === value.grnId);
                if (selectedGrn) {
                    if (selectedGrn.supplier_id) form.setValue("supplierId", selectedGrn.supplier_id);
                    if (selectedGrn.purchase_order_id) form.setValue("purchaseOrderId", selectedGrn.purchase_order_id);
                }
                form.setValue("notes", `Purchase Return for GRN: ${selectedGrn?.grn_number || value.grnId}`);
                fetchItems(null, value.grnId);
            }
        }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, session, form.setValue]);

  // Initial Fetch for dropdowns
  useEffect(() => {
    async function fetchData() {
        if (!session?.accessToken) {
            if (status === 'unauthenticated') {
                setLoadingInitial(false);
            }
            return;
        }
        try {
            const [suppliersRes, productsRes, branchesRes, posRes, grnsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=100`, { 
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders?size=100`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn?size=100`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                })
            ]);

            const suppliersData = await suppliersRes.json();
            const productsData = await productsRes.json();
            const branchesData = await branchesRes.json();
            const posData = await posRes.json();
            const grnsData = await grnsRes.json();
            if (suppliersData.status === 'success') {
                setSuppliers(suppliersData.data || []);
            }
            if (productsData.status === 'success') {
                setProducts(productsData.data?.data || productsData.data || []);
            }

            if (branchesData.status === 'success') {
                setBranches(branchesData.data || []);
                if (branchesData.data?.length === 1 && !form.getValues("branchId")) {
                    form.setValue("branchId", branchesData.data[0].id);
                }
            }
            
            if (posData.status === 'success') {
                setPurchaseOrders(posData.data?.data || posData.data || []);
            }
            
            if (grnsData.status === 'success') {
                setGrns(grnsData.data?.data || grnsData.data || []);
            }

        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load initial data");
        } finally {
            setLoadingInitial(false);
        }
    }
    if (status === 'authenticated') {
        fetchData();
    }
  }, [session, status, form]);

  // Watch supplierId for linked docs fetch
  const selectedSupplierId = form.watch("supplierId");

  // Fetch POs and GRNs when Supplier is selected
  useEffect(() => {
    async function fetchLinkedDocs() {
        if (!session?.accessToken || !selectedSupplierId) {
            // Don't clear if we already have initial data
            return;
        }

        try {
            const [poRes, grnRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders?supplier_id=${selectedSupplierId}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn?supplier_id=${selectedSupplierId}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                })
            ]);

            const poData = await poRes.json();
            const grnData = await grnRes.json();

            if (poData.status === 'success') {
                setPurchaseOrders(poData.data?.data || poData.data || []);
            }
            if (grnData.status === 'success') {
                setGrns(grnData.data?.data || grnData.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch linked docs", error);
        }
    }
    fetchLinkedDocs();
  }, [selectedSupplierId, session?.accessToken]);

  const onSubmit = async (data) => {
    try {
        // Run a manual validation for variants
        for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];
            const product = products.find(p => p.id === item.productId);
            if (product?.variants?.length > 0 && !item.productVariantId) {
                toast.error(`Please select a variant for "${product.name}" (Row ${i + 1})`);
                return; // Stop submission
            }
        }

        setIsSubmitting(true);
        const payload = {
            return_date: data.returnDate,
            branch_id: data.branchId,
            supplier_id: data.supplierId,
            purchase_order_id: data.purchaseOrderId || null,
            grn_id: data.grnId || null,
            notes: data.notes,
            items: data.items.map(item => ({
                product_id: item.productId,
                product_variant_id: item.productVariantId || null,
                quantity: item.quantity,
                unit_cost: item.unitCost,
                reason: item.reason,
                batch_number: item.batchNumber
            }))
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-returns`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}` 
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || result.status !== 'success') {
            throw new Error(result.message || 'Failed to create return');
        }

        toast.success("Purchase Return Created Successfully");
        router.push("/purchase/returns");

    } catch (error) {
        console.error(error);
        toast.error(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const addItem = () => {
    append({
        productId: "",
        productVariantId: null,
        name: "",
        quantity: 1,
        unitCost: 0,
        reason: "",
        batchNumber: ""
    });
  };

  const watchPoId = form.watch("purchaseOrderId");
  const watchGrnId = form.watch("grnId");
  const isPoOrGrnSelected = !!(watchPoId || watchGrnId);

  if(!session || loadingInitial) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex-1 space-y-6 p-6 bg-background min-h-screen">
      {/* ── Premium Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <RotateCcw className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Create Purchase Return</h1>
              <p className="text-[13px] text-muted-foreground font-medium opacity-80">
                Return goods to supplier
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting} 
                className="gap-2 rounded-xl h-10 px-6 text-[13px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95"
            >
                {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Processing..." : "Create Return"}
            </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Return Metadata */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border border-border/50 shadow-sm sticky top-6">
                  <CardHeader className="border-b border-border/30 pb-4 bg-muted/10">
                      <CardTitle className="text-base font-semibold">Return Details</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Select the supplier and relevant documents to load items.</p>
                  </CardHeader>
                  <CardContent className="grid gap-5 pt-6">
                    <FormField
                        control={form.control}
                        name="returnDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover open={openDatePopover} onOpenChange={setOpenDatePopover}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={(date) => {
                                            field.onChange(date);
                                            setOpenDatePopover(false);
                                        }} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="supplierId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Supplier</FormLabel>
                                <Popover open={openSupplierPopover} onOpenChange={setOpenSupplierPopover}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("justify-between", !field.value && "text-muted-foreground")}>
                                                {field.value ? suppliers.find((s) => s.id === field.value)?.name : "Select supplier"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search supplier..." />
                                            <CommandList>
                                                <CommandEmpty>No supplier found.</CommandEmpty>
                                                <CommandGroup>
                                                    {suppliers.map((supplier) => (
                                                        <CommandItem key={supplier.id} value={supplier.name} onSelect={() => {
                                                            form.setValue("supplierId", supplier.id);
                                                            setOpenSupplierPopover(false);
                                                        }}>
                                                            <Check className={cn("mr-2 h-4 w-4", supplier.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {supplier.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="purchaseOrderId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Purchase Order (Optional)</FormLabel>
                                <Popover open={openPoPopover} onOpenChange={setOpenPoPopover}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("justify-between", !field.value && "text-muted-foreground")}>
                                                {field.value ? purchaseOrders.find((p) => p.id === field.value)?.po_number || field.value : "Select PO"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search PO..." />
                                            <CommandList>
                                                <CommandEmpty>No PO found.</CommandEmpty>
                                                <CommandGroup>
                                                    {purchaseOrders.map((po) => (
                                                        <CommandItem key={po.id} value={po.po_number || po.id} onSelect={() => {
                                                            form.setValue("purchaseOrderId", po.id);
                                                            setOpenPoPopover(false);
                                                        }}>
                                                            <Check className={cn("mr-2 h-4 w-4", po.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {po.po_number}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="grnId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>GRN (Optional)</FormLabel>
                                <Popover open={openGrnPopover} onOpenChange={setOpenGrnPopover}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("justify-between", !field.value && "text-muted-foreground")}>
                                                {field.value ? grns.find((g) => g.id === field.value)?.grn_number || field.value : "Select GRN"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search GRN..." />
                                            <CommandList>
                                                <CommandEmpty>No GRN found.</CommandEmpty>
                                                <CommandGroup>
                                                {grns.map((grn) => (
                                                        <CommandItem key={grn.id} value={grn.grn_number || grn.id} onSelect={() => {
                                                            form.setValue("grnId", grn.id);
                                                            setOpenGrnPopover(false);
                                                        }}>
                                                            <Check className={cn("mr-2 h-4 w-4", grn.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {grn.grn_number} {grn.invoice_number ? `(${grn.invoice_number})` : ""}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="branchId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Branch</FormLabel>
                                <Popover open={openBranchPopover} onOpenChange={setOpenBranchPopover}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("justify-between", !field.value && "text-muted-foreground")}>
                                                {field.value ? branches.find((b) => b.id === field.value)?.name : "Select branch"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search branch..." />
                                            <CommandList>
                                                <CommandEmpty>No branch found.</CommandEmpty>
                                                <CommandGroup>
                                                    {branches.map((branch) => (
                                                        <CommandItem key={branch.id} value={branch.name} onSelect={() => {
                                                            form.setValue("branchId", branch.id);
                                                            setOpenBranchPopover(false);
                                                        }}>
                                                            <Check className={cn("mr-2 h-4 w-4", branch.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {branch.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="col-span-1 border-t border-border/30 pt-5 mt-2">
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Reason for return..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Return Items */}
            <div className="lg:col-span-8 flex flex-col min-h-0">
              <Card className="border border-border/50 shadow-sm flex-1 flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 pb-4 bg-muted/10">
                      <div>
                        <CardTitle className="text-base font-semibold">Return Items</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Add products to return and specify quantities and reasons.</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" disabled className="gap-1.5 rounded-xl border-border/60 bg-background opacity-50 cursor-not-allowed" onClick={addItem}>
                          <Plus className="mr-1 h-4 w-4" /> Add Item
                      </Button>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6 p-6">
                    {isPoOrGrnSelected && fields.length > 0 && (
                      <Alert className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 mb-6">
                        <Check className="h-4 w-4 text-emerald-600!" />
                        <AlertDescription className="text-xs font-medium">
                          Items loaded from the selected document. Remove any items you do NOT wish to return.
                        </AlertDescription>
                      </Alert>
                    )}
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex flex-col gap-5 border border-border/40 bg-muted/5 p-5 rounded-xl transition-colors hover:bg-muted/10 relative group">
                            
                            {/* Top Row: Product + Delete Button */}
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.productId`}
                                        render={({ field: itemField }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="text-[13px] font-medium text-muted-foreground/70">Select Product</FormLabel>
                                                <Popover open={openProductPopovers[index]} onOpenChange={(isOpen) => setOpenProductPopovers(prev => ({ ...prev, [index]: isOpen }))}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant="outline" role="combobox" aria-expanded={openProductPopovers[index]} className={cn("justify-between w-full h-10", !itemField.value && "text-muted-foreground")}>
                                                                {itemField.value ? products.find((p) => p.id === itemField.value)?.name || form.getValues(`items.${index}.name`) : "Search for a product..."}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] xl:w-[400px] p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Search product..." />
                                                            <CommandList>
                                                                <CommandEmpty>No product found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {products.map((product) => (
                                                                        <CommandItem 
                                                                            key={product.id} 
                                                                            value={product.name} 
                                                                            onSelect={() => {
                                                                                form.setValue(`items.${index}.productId`, product.id);
                                                                                form.setValue(`items.${index}.name`, product.name);
                                                                                form.setValue(`items.${index}.unitCost`, product.cost_price || 0);
                                                                                form.setValue(`items.${index}.productVariantId`, null); // Reset variant on product change
                                                                                setOpenProductPopovers(prev => ({ ...prev, [index]: false })); // Close popover
                                                                            }}
                                                                        >
                                                                            <Check className={cn("mr-2 h-4 w-4", product.id === itemField.value ? "opacity-100" : "opacity-0")} />
                                                                            {product.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage className="text-[12px]" />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    {/* Variant Selector (Conditionally Rendered) */}
                                    {form.watch(`items.${index}.productId`) && products.find(p => p.id === form.watch(`items.${index}.productId`))?.variants?.length > 0 && (
                                        <div className="mt-4">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.productVariantId`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className="text-[13px] font-medium text-muted-foreground/70">Select Variant <span className="text-destructive">*</span></FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 bg-background/50">
                                                                    <SelectValue placeholder="Choose a variant" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {products.find(p => p.id === form.watch(`items.${index}.productId`))?.variants?.map((variant) => (
                                                                    <SelectItem key={variant.id} value={variant.id}>
                                                                        {variant.name} (Stock: {variant.stock_quantity || 0})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="text-[12px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}

                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 mt-6 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 shadow-sm" onClick={() => remove(index)} title="Remove Item">
                                    <Trash2 className="h-[18px] w-[18px]" />
                                </Button>
                            </div>

                            {/* Middle Row: Batch, Qty, Cost */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.batchNumber`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[13px] font-medium text-muted-foreground/70">Batch Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional" className="h-10" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[13px] font-medium text-muted-foreground/70">Return Quantity</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" className="h-10" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.unitCost`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[13px] font-medium text-muted-foreground/70">Unit Cost</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm">Rs.</span>
                                                  <Input type="number" step="0.01" className="h-10 pl-8" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            
                            {/* Bottom Row: Reason */}
                            <div>
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.reason`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-[13px] font-medium text-muted-foreground/70">Reason for Return</FormLabel>
                                            <FormControl>
                                                <Input placeholder="E.g., Damaged on arrival, Expired, Wrong item" className="h-10 bg-background/50 focus-visible:bg-background" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </div>
                    ))}
                    {fields.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/5">
                            <RotateCcw className="h-8 w-8 mx-auto mb-2 text-emerald-500/30" />
                            No items added. Click "Add Item" to begin.
                        </div>
                    )}
                  </CardContent>
              </Card>
            </div>
          </div>


        </form>
      </Form>
    </div>
  );
}
