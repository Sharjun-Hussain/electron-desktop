"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  PackageCheck,
  Check,
  Loader2,
  AlertTriangle,
  ChevronsUpDown,
  Paperclip,
  SlidersHorizontal,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useFormRestore } from "@/hooks/use-form-restore";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
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
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import CreateGRNSkeleton from "@/app/skeletons/purchases/create-grn-skeleton";

// --- ZOD SCHEMA ---
const grnItemSchema = z.object({
  poItemId: z.string().optional(),
  productId: z.string(),
  productVariantId: z.string().nullable().optional(),
  name: z.string(),
  sku: z.string(),
  orderedQty: z.number(),
  receivedQty: z.coerce.number().min(0),
  freeQty: z.coerce.number().min(0).default(0),
  unitCost: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0).default(0),
  profitMargin: z.coerce.number().min(0).default(0),
  mrpPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  expiryDate: z.date().nullable().optional(),
  batchNumber: z.string().optional(),
});

const formSchema = z.object({
  grnDate: z.date({ required_error: "Date is required" }),
  branchId: z.string().min(1, "Branch is required"),
  invoiceNumber: z.string().min(1, "Invoice # is required"),
  attachmentFiles: z.any().optional(),
  remarks: z.string().optional(),
  items: z.array(grnItemSchema).min(1),
});

// --- HELPER COMPONENT ---
const RestrictedProductSelect = ({ value, onChange, availableProducts }) => {
  const [open, setOpen] = useState(false);
  const selectedProduct = availableProducts.find((p) => (p.poItemId || p.productId) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-card min-h-9 h-auto py-2", !value && "text-muted-foreground")}
        >
          {selectedProduct ? (
            <span className="font-medium text-sm text-left whitespace-normal line-clamp-3">{selectedProduct.name}</span>
          ) : (
            <span className="text-sm">Select Item...</span>
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[310px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search within order..." className="text-sm" />
          <CommandList>
            <CommandEmpty>Item not found.</CommandEmpty>
            <CommandGroup>
              {availableProducts.map((product) => (
                <CommandItem
                  key={product.poItemId || product.productId}
                  value={product.name}
                  onSelect={() => {
                    onChange(product.poItemId || product.productId);
                    setOpen(false);
                  }}
                  className="rounded-xl focus:bg-emerald-500/10 focus:text-emerald-700"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === (product.poItemId || product.productId) ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-[11px] text-muted-foreground">Ordered: {product.orderedQty} Units</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// --- MAIN PAGE ---

export default function GRNPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poData, setPoData] = useState(null);

  const [visibleColumns, setVisibleColumns] = useState({
    batch: false,
    expiry: false,
    bonus: false,
    wholesale: false,
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grnDate: new Date(),
      branchId: "",
      invoiceNumber: "",
      remarks: "",
      items: [],
    },
  });

  const { clearSavedData } = useFormRestore(form);

  // Set default branch if user has only one
  useEffect(() => {
    if (session?.user?.branches?.length === 1) {
      form.setValue("branchId", session.user.branches[0].id);
    } else if (poData?.branch_id && session?.user?.branches?.find(b => b.id === poData.branch_id)) {
      // If PO has a branch and user has access to it, pre-select it
      form.setValue("branchId", poData.branch_id);
    }
  }, [session, poData, form]);

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    async function loadData() {
      if (!params.poid || status !== "authenticated" || !session?.accessToken) {
        if (params.poid === undefined || session?.accessToken === undefined) {
          // Still initializing
        } else {
          setIsDataLoading(false);
        }
        return;
      }
      try {
        setIsDataLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${params.poid}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });

        if (!response.ok) throw new Error("Failed to fetch Purchase Order");

        const result = await response.json();
        if (result.status !== "success") throw new Error(result.message || "Failed to fetch PO");

        const data = result.data;
        setPoData(data);

        // Map PO items to GRN items
        const mappedItems = data.items.map((item) => {
          const productName = item.product?.name || item.product_name || 'Unknown Product';
          const variantName = item.variant?.name || item.variant?.sku || '';
          const fullName = variantName ? `${productName} - ${variantName}` : productName;

          const cost = Number(item.unit_cost || item.unitCost || item.unit_price || item.cost) || 0;
          const defaultSelling = Number((cost / 0.70).toFixed(2));

          return {
            poItemId: item.id,
            productId: item.product_id || item.productId,
            productVariantId: item.product_variant_id || item.variantId,
            name: fullName,
            sku: item.variant?.sku || item.product?.sku || item.sku || "",
            orderedQty: Number(item.quantity || item.orderedQty) || 0,
            receivedQty: Number(item.quantity || item.orderedQty) || 0,
            freeQty: 0,
            unitCost: cost,
            wholesalePrice: 0,
            profitMargin: 30,
            mrpPrice: defaultSelling,
            sellingPrice: defaultSelling,
            batchNumber: "",
            expiryDate: undefined,
          };
        });
        const currentItems = form.getValues("items");
        if (!currentItems || currentItems.length === 0) {
          replace(mappedItems);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Purchase Order details");
      } finally {
        setIsDataLoading(false);
      }
    }

    if (status === "authenticated") {
      loadData();
    }
  }, [params.poid, replace, status, session]);

  if (status === "loading" || isDataLoading) {
    return <CreateGRNSkeleton />;
  }

  if (status === "unauthenticated") {
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    return null;
  }

  async function onSubmit(data) {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      if (data.attachmentFiles) {
        Array.from(data.attachmentFiles).forEach(file => {
          formData.append("attachmentFiles", file);
        });
      }

      const payload = {
        purchase_order_id: poData.id,
        branch_id: data.branchId,
        supplier_id: poData.supplier?.id || poData.supplier_id,
        grn_date: format(data.grnDate, "yyyy-MM-dd"),
        invoice_number: data.invoiceNumber,
        remarks: data.remarks,
        total_amount: grandTotal,
        items: data.items.map((item) => ({
          product_id: item.productId,
          product_variant_id: item.productVariantId || null,
          quantity_received: item.receivedQty,
          ordered_qty: item.orderedQty,
          free_qty: item.freeQty,
          unit_cost: item.unitCost,
          mrp_price: item.mrpPrice,
          selling_price: item.sellingPrice,
          wholesale_price: item.wholesalePrice,
          batch_number: item.batchNumber,
          expiry_date: item.expiryDate ? format(item.expiryDate, "yyyy-MM-dd") : null,
        })),
      };

      formData.append("data", JSON.stringify(payload));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to create GRN");
      }

      toast.success("GRN Created Successfully");
      clearSavedData();
      router.push("/purchase/grn"); // Redirect to GRN list
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create GRN");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculations
  const watchedItems = form.watch("items");
  const grandTotal = watchedItems?.reduce((acc, item) => acc + (item.unitCost || 0) * (item.receivedQty || 0), 0) || 0;

  const handleProductSelect = (index, poItemId) => {
    const poItem = poData.items.find((p) => p.id === poItemId);
    if (poItem) {
      const productName = poItem.product?.name || poItem.product_name || 'Unknown Product';
      const variantName = poItem.variant?.name || poItem.variant?.sku || '';
      const fullName = variantName ? `${productName} - ${variantName}` : productName;

      const current = form.getValues(`items.${index}`);
      form.setValue(`items.${index}`, {
        ...current,
        poItemId: poItem.id,
        productId: poItem.product_id,
        productVariantId: poItem.product_variant_id,
        name: fullName,
        sku: poItem.variant?.sku || poItem.product?.sku || poItem.sku || "",
        unitCost: Number(poItem.unit_cost || poItem.unit_price || poItem.cost) || 0,
        orderedQty: Number(poItem.quantity || poItem.orderedQty) || 0,
        receivedQty: Number(poItem.quantity || poItem.orderedQty) || 0
      });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 bg-background min-h-screen">
      {/* ── Premium Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-border/40">
        <div className="flex items-center gap-4">

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create GRN </h1>
              <p className="text-[13px] text-muted-foreground font-medium opacity-70">Authenticated Receipt Protocol</p>
            </div>
          </div>
        </div>
      </div>

      {poData?.supplier && !poData.supplier.is_active && (
        <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/20 text-amber-900 animate-in fade-in slide-in-from-top-2 duration-500 rounded-2xl shadow-lg border-2 mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-sm font-semibold mb-1">Supplier Suspended</AlertTitle>
          <AlertDescription className="text-[13px] font-medium opacity-80 leading-relaxed">
            Caution: The supplier associated with this Purchase Order ({poData.supplier.name}) is currently suspended. Recording this GRN may require administrative override or prior verification.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* --- Protocol Source Card --- */}
            <Card className="lg:col-span-1 border border-border/40 bg-card shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40 px-5 py-3">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-[13px] font-bold text-foreground">Supplier details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-muted-foreground uppercase opacity-70">Issuing Vendor</span>
                    <div className="font-semibold text-base text-foreground leading-tight">{poData?.supplier?.name || poData?.supplier_name}</div>
                    <div className="text-sm text-muted-foreground font-medium">{poData?.supplier?.email || poData?.supplier_email || poData?.supplier?.phone}</div>
                  </div>
                  <div className="pt-3 border-t border-border/40 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium opacity-70">Order Reference</span>
                      <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{poData?.po_number || "Draft"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium opacity-70">Issuance Date</span>
                      <span className="font-semibold text-foreground/80">{poData?.order_date ? format(new Date(poData.order_date), "MMM dd, yyyy") : (poData?.created_at ? format(new Date(poData.created_at), "MMM dd, yyyy") : "-")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* --- Logistics Configuration Card --- */}
            <Card className="lg:col-span-2 border border-border/40 bg-card shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40 px-5 py-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-base font-bold text-foreground">Logistics Configuration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-foreground">Recipient Unit <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={session?.user?.branches?.length <= 1}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Target Recipient Unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                            {session?.user?.branches?.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id} className="rounded-xl focus:bg-emerald-500/10 focus:text-emerald-700">
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-foreground">Invoice Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. INV-99887"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grnDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-foreground">Temporal Receipt Date <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                {field.value ? format(field.value, "PPP") : <span>Pick arrival date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-2xl border border-border/40 shadow-2xl" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attachmentFiles"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-foreground">Documentary Evidence</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Input
                              {...fieldProps}
                              type="file"
                              multiple
                              id="grn-file-upload"
                              accept=".jpg,.png,.pdf"
                              onChange={(e) => onChange(e.target.files)}
                              className="hidden"
                            />
                            <label
                              htmlFor="grn-file-upload"
                              className="flex items-center justify-center gap-2 h-9 px-4 border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm shadow-sm transition-colors"
                            >
                              <Paperclip className="h-4 w-4 shrink-0" />
                              <span className="truncate">{value && value.length > 0 ? `${value.length} files selected` : "Attach Document"}</span>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border/40 shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/40 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base font-semibold text-foreground">Active Logistics Inventory</CardTitle>
                  <p className="text-[13px] text-muted-foreground font-medium opacity-60 underline underline-offset-4 decoration-emerald-500/30">Registry of Receipt Protocol</p>
                </div>
                <div className="text-right flex items-center gap-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-2 border-border/60 shadow-sm hidden sm:flex">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        View Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                      <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem checked={visibleColumns.batch} onCheckedChange={(c) => setVisibleColumns((prev) => ({ ...prev, batch: c }))}>Batch #</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={visibleColumns.expiry} onCheckedChange={(c) => setVisibleColumns((prev) => ({ ...prev, expiry: c }))}>Ref. Expiry</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={visibleColumns.bonus} onCheckedChange={(c) => setVisibleColumns((prev) => ({ ...prev, bonus: c }))}>Bonus (Free Qty)</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={visibleColumns.wholesale} onCheckedChange={(c) => setVisibleColumns((prev) => ({ ...prev, wholesale: c }))}>Wholesale Price</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex flex-col items-end">
                    <span className="text-[13px] font-medium text-muted-foreground opacity-60">Session Valuation</span>
                    <span className="text-2xl font-bold text-foreground tabular-nums">LKR {grandTotal.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/5 border-b border-border/40">
                  <tr className="hover:bg-transparent">
                    <th className="px-6 py-5 text-[13px] font-medium text-muted-foreground opacity-80 min-w-[220px]">Product Identity</th>
                    {visibleColumns.batch && <th className="px-3 py-5 text-[13px] font-medium text-muted-foreground opacity-80 w-[140px]">Batch #</th>}
                    {visibleColumns.expiry && <th className="px-3 py-5 text-[13px] font-medium text-muted-foreground opacity-80 w-[140px]">Ref. Expiry</th>}
                    <th className="px-3 py-5 text-[13px] font-semibold text-emerald-600 opacity-80 w-[100px] text-center bg-emerald-500/5">Ordered</th>
                    <th className="px-3 py-5 text-[13px] font-semibold text-blue-600 opacity-80 w-[110px] bg-blue-500/5">Now Receiving</th>
                    {visibleColumns.bonus && <th className="px-3 py-5 text-[13px] font-medium text-muted-foreground opacity-80 w-[90px] text-center">Bonus</th>}
                    <th className="px-3 py-5 text-[13px] font-medium opacity-80 w-[130px]">Unit Cost</th>
                    <th className="px-3 py-5 text-[13px] font-semibold text-purple-600 opacity-80 w-[100px]">Margin %</th>
                    {visibleColumns.wholesale && <th className="px-3 py-5 text-[13px] font-semibold text-amber-600 opacity-80 w-[120px]">Whls. Prc</th>}
                    <th className="px-3 py-5 text-[13px] font-semibold text-blue-600 opacity-80 w-[120px]">MRP</th>
                    <th className="px-3 py-5 text-[13px] font-semibold text-emerald-600 opacity-80 w-[120px]">Sell. Prc</th>
                    <th className="px-6 py-5 text-[13px] font-medium text-muted-foreground opacity-80 w-[140px] text-right">Net Ext.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {fields.map((field, index) => {
                    const qty = form.watch(`items.${index}.receivedQty`) || 0;
                    const ordered = form.watch(`items.${index}.orderedQty`) || 0;
                    const total = qty * (form.watch(`items.${index}.unitCost`) || 0);
                    const isOver = qty > ordered;

                    return (
                      <tr key={field.id} className="bg-card hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3">
                          <RestrictedProductSelect
                            value={form.watch(`items.${index}.poItemId`)}
                            availableProducts={poData.items.map(i => {
                              const productName = i.product?.name || i.product_name || 'Unknown Product';
                              const variantName = i.variant?.name || i.variant?.sku || '';
                              const fullName = variantName ? `${productName} - ${variantName}` : productName;

                              return {
                                ...i,
                                poItemId: i.id,
                                productId: i.product_id || i.productId,
                                name: fullName,
                                orderedQty: i.quantity || i.orderedQty
                              };
                            })}
                            onChange={(val) => handleProductSelect(index, val)}
                          />
                        </td>
                        {visibleColumns.batch && (
                          <td className="px-3 py-3">
                            <Input className="h-9 focus:ring-emerald-500/20" placeholder="Auto" {...form.register(`items.${index}.batchNumber`)} />
                          </td>
                        )}
                        {visibleColumns.expiry && (
                          <td className="px-3 py-3">
                            <Input type="date" className="h-9 focus:ring-emerald-500/20" {...form.register(`items.${index}.expiryDate`, { valueAsDate: true })} />
                          </td>
                        )}
                        <td className="px-3 py-3 text-center bg-emerald-500/5 font-semibold text-foreground/80 tabular-nums border-x border-border/10">
                          <span className="text-[14px]">{ordered}</span>
                        </td>
                        <td className="px-3 py-3 bg-blue-500/5">
                          <Input
                            type="number"
                            className={cn(
                              "h-9 focus:ring-emerald-500/20",
                              isOver && "border-destructive focus-visible:ring-destructive"
                            )}
                            {...form.register(`items.${index}.receivedQty`, { valueAsNumber: true })}
                          />
                        </td>
                        {visibleColumns.bonus && (
                          <td className="px-3 py-3 text-center">
                            <Input type="number" className="h-9 focus:ring-emerald-500/20" {...form.register(`items.${index}.freeQty`, { valueAsNumber: true })} />
                          </td>
                        )}
                        <td className="px-3 py-3">
                          <Input type="number" className="h-9 focus:ring-emerald-500/20" step="0.01" {...form.register(`items.${index}.unitCost`, { valueAsNumber: true })} />
                        </td>
                        <td className="px-3 py-3">
                          <Input
                            type="number"
                            className="h-9 focus:ring-emerald-500/20"
                            step="0.1"
                            {...form.register(`items.${index}.profitMargin`, {
                              valueAsNumber: true,
                              onChange: (e) => {
                                const cost = form.getValues(`items.${index}.unitCost`) || 0;
                                const margin = parseFloat(e.target.value) || 0;
                                // True Retail Margin: Selling Price = Cost / (1 - Margin%)
                                const newSellingPrice = margin >= 100 ? cost : (cost / (1 - margin / 100));
                                form.setValue(`items.${index}.sellingPrice`, Number(newSellingPrice.toFixed(2)));
                              }
                            })}
                          />
                        </td>
                        {visibleColumns.wholesale && (
                          <td className="px-3 py-3">
                            <Input type="number" className="h-9 focus:ring-emerald-500/20" step="0.01" {...form.register(`items.${index}.wholesalePrice`, { valueAsNumber: true })} />
                          </td>
                        )}
                        <td className="px-3 py-3">
                          <Input type="number" className="h-9 focus:ring-emerald-500/20" step="0.01" {...form.register(`items.${index}.mrpPrice`, { valueAsNumber: true })} />
                        </td>
                        <td className="px-3 py-3">
                          <Input
                            type="number"
                            className="h-9 focus:ring-emerald-500/20"
                            step="0.01"
                            {...form.register(`items.${index}.sellingPrice`, {
                              valueAsNumber: true,
                              onChange: (e) => {
                                const cost = form.getValues(`items.${index}.unitCost`) || 0;
                                const newSellingPrice = parseFloat(e.target.value) || 0;
                                if (cost > 0 && newSellingPrice > 0) {
                                  // True Retail Margin: Margin% = ((Selling Price - Cost) / Selling Price) * 100
                                  const newMargin = ((newSellingPrice - cost) / newSellingPrice) * 100;
                                  form.setValue(`items.${index}.profitMargin`, Number(newMargin.toFixed(2)));
                                } else if (newSellingPrice === 0) {
                                  form.setValue(`items.${index}.profitMargin`, 0);
                                }
                              }
                            })}
                          />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="font-semibold text-foreground opacity-90 text-[15px] tabular-nums">
                            {total.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex gap-4 justify-end mt-8 pb-10">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel Protocol
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <PackageCheck className="h-4 w-4" />
                  Confirm Logistics
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}