"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ChevronsUpDown,
  Paperclip,
  SlidersHorizontal,
  Building2,
  Search,
  Plus,
  Trash2,
  Barcode
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
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMemo, useRef } from "react";

const ProductSelect = ({ value, onChange, products, autoFocus, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedProduct = products.find((p) => String(p.id || p.product_id) === String(value));

  useEffect(() => {
    if (autoFocus) {
      setOpen(true);
    }
  }, [autoFocus]);

  const filteredItems = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return products.slice(0, 50);

    return products
      .filter(p =>
        (p.name || "").toLowerCase().includes(search) ||
        (p.sku || "").toLowerCase().includes(search) ||
        (p.barcode || "").toLowerCase().includes(search)
      )
      .slice(0, 50);
  }, [products, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-transparent border-0 rounded-none shadow-none hover:bg-transparent hover:border-primary/20 focus:border-primary/80 pl-3 text-left font-normal h-10",
            !value && "text-muted-foreground"
          )}
        >
          {selectedProduct ? (
            <span className="font-medium whitespace-normal line-clamp-2 text-sm">{selectedProduct.name}</span>
          ) : (
            "Select product..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty className="py-6 flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">No product found.</p>
            </CommandEmpty>
            <CommandGroup>
              {filteredItems.map((product, idx) => (
                <CommandItem
                  key={`${product.id || product.product_id}-${idx}`}
                  value={`${product.name} ${product.sku || ''} ${product.barcode || ''}`}
                  onSelect={() => {
                    onChange(product.id || product.product_id, product);
                    setOpen(false);
                    setSearchQuery("");
                    if (onSelect) onSelect();
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(value) === String(product.id || product.product_id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground text-sm">{product.name}</span>
                      <span className="text-[11px] text-muted-foreground/60">{product.sku || product.barcode || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[11px] text-muted-foreground">
                        Stock:
                        <span
                          className={cn(
                            "ml-1 font-medium",
                            (product?.stock_quantity || 0) <= 0
                              ? "text-red-500"
                              : "text-emerald-500"
                          )}
                        >
                          {product?.stock_quantity ?? "0"} units
                        </span>
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        LKR {(Number(product.cost_price) || 0).toLocaleString()}
                      </span>
                    </div>
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

// --- ZOD SCHEMA ---
const grnItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productVariantId: z.string().nullable().optional(),
  name: z.string(),
  sku: z.string(),
  orderedQty: z.number(),
  receivedQty: z.coerce.number().min(0.01, "Quantity required"),
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
  supplierId: z.string().min(1, "Supplier is required"),
  grnDate: z.date({ required_error: "Date is required" }),
  branchId: z.string().min(1, "Branch is required"),
  invoiceNumber: z.string().min(1, "Invoice # is required"),
  attachmentFiles: z.any().optional(),
  remarks: z.string().optional(),
  items: z.array(grnItemSchema).min(1, "At least one item is required"),
});

export default function DirectGRNPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [newItemAdded, setNewItemAdded] = useState(false);

  const [barcodeInput, setBarcodeInput] = useState("");
  const [notFoundBarcode, setNotFoundBarcode] = useState(null);
  const [multipleMatches, setMultipleMatches] = useState([]);
  const [isMultipleMatchesOpen, setIsMultipleMatchesOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("direct-grn-visible-columns");
      if (saved) return JSON.parse(saved);
    }
    return {
      batch: false,
      expiry: false,
      bonus: false,
      wholesale: false,
    };
  });

  useEffect(() => {
    localStorage.setItem("direct-grn-visible-columns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: "",
      grnDate: new Date(),
      branchId: "",
      invoiceNumber: "",
      remarks: "",
      items: [
        {
          productId: "",
          productVariantId: null,
          name: "",
          sku: "",
          orderedQty: 0,
          receivedQty: 1,
          freeQty: 0,
          unitCost: 0,
          wholesalePrice: 0,
          profitMargin: 30,
          mrpPrice: 0,
          sellingPrice: 0,
          batchNumber: "",
          expiryDate: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Set default branch
  useEffect(() => {
    if (session?.user?.branches?.length === 1) {
      form.setValue("branchId", session.user.branches[0].id);
    }
  }, [session, form]);

  useEffect(() => {
    async function fetchSuppliers() {
      if (!session?.accessToken) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers?size=500`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const result = await response.json();
        if (result.status === "success") {
          setSuppliers(result.data.data.filter(s => s.is_active));
        }
      } catch (error) {
        console.error("Failed to fetch suppliers", error);
      } finally {
        setIsDataLoading(false);
      }
    }
    if (status === "authenticated") {
      fetchSuppliers();
    }
  }, [status, session]);

  const watchedBranchId = form.watch("branchId");

  useEffect(() => {
    async function fetchProducts() {
      if (!session?.accessToken || !watchedBranchId) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list?branch_id=${watchedBranchId}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const result = await response.json();
        if (result.status === "success") {
          const allProducts = result.data || [];
          const flattened = [];
          allProducts.forEach(product => {
            if (product.variants && product.variants.length > 0) {
              product.variants.forEach(variant => {
                flattened.push({
                  ...variant,
                  product_id: product.id,
                  variant_id: variant.id,
                  name: `${product.name} - ${variant.name || variant.sku || variant.barcode || 'Default'}`,
                  parentProduct: product
                });
              });
            } else {
              flattened.push({
                ...product,
                product_id: product.id,
                variant_id: null,
                parentProduct: product
              });
            }
          });
          setProducts(flattened);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    }

    if (status === "authenticated" && watchedBranchId) {
      fetchProducts();
    }
  }, [status, session, watchedBranchId]);

  // Handle Keyboard Shortcut (F2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        append({
          productId: "",
          productVariantId: null,
          name: "",
          sku: "",
          orderedQty: 0,
          receivedQty: 1,
          freeQty: 0,
          unitCost: 0,
          wholesalePrice: 0,
          profitMargin: 30,
          mrpPrice: 0,
          sellingPrice: 0,
          batchNumber: "",
          expiryDate: undefined,
        });
        setNewItemAdded(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [append]);

  useEffect(() => {
    if (newItemAdded) {
      const timer = setTimeout(() => setNewItemAdded(false), 500);
      return () => clearTimeout(timer);
    }
  }, [newItemAdded]);

  const processBarcodeMatch = (product) => {
    const currentItems = form.getValues("items");
    const pId = String(product.id || product.product_id);

    const existingIndex = currentItems.findIndex(item => String(item.productId) === pId);

    if (existingIndex > -1 && currentItems[existingIndex].productId !== "") {
      const qty = Number(currentItems[existingIndex].receivedQty) || 0;
      form.setValue(`items.${existingIndex}.receivedQty`, qty + 1);
    } else {
      const cost = Number(product.cost_price) || 0;
      const defaultSelling = Number(product.selling_price) || Number((cost / 0.70).toFixed(2));

      if (currentItems.length > 0 && !currentItems[currentItems.length - 1].productId) {
        const lastIdx = currentItems.length - 1;
        form.setValue(`items.${lastIdx}.productId`, pId);
        form.setValue(`items.${lastIdx}.productVariantId`, product.variant_id || null);
        form.setValue(`items.${lastIdx}.name`, product.name);
        form.setValue(`items.${lastIdx}.sku`, product.sku || product.barcode || "");
        form.setValue(`items.${lastIdx}.unitCost`, cost);
        form.setValue(`items.${lastIdx}.wholesalePrice`, Number(product.wholesale_price) || 0);
        form.setValue(`items.${lastIdx}.profitMargin`, cost > 0 && defaultSelling > 0 ? Number((((defaultSelling - cost) / defaultSelling) * 100).toFixed(2)) : 30);
        form.setValue(`items.${lastIdx}.mrpPrice`, Number(product.mrp_price) || defaultSelling);
        form.setValue(`items.${lastIdx}.sellingPrice`, defaultSelling);
      } else {
        append({
          productId: pId,
          productVariantId: product.variant_id || null,
          name: product.name,
          sku: product.sku || product.barcode || "",
          orderedQty: 0,
          receivedQty: 1,
          freeQty: 0,
          unitCost: cost,
          wholesalePrice: Number(product.wholesale_price) || 0,
          profitMargin: cost > 0 && defaultSelling > 0 ? Number((((defaultSelling - cost) / defaultSelling) * 100).toFixed(2)) : 30,
          mrpPrice: Number(product.mrp_price) || defaultSelling,
          sellingPrice: defaultSelling,
          batchNumber: "",
          expiryDate: undefined,
        });
      }
    }
    setBarcodeInput("");
    setTimeout(() => {
      document.getElementById("barcode-scanner-input")?.focus();
    }, 50);
  };

  useEffect(() => {
    if (!barcodeInput) return;
    const handler = setTimeout(() => {
      const code = barcodeInput.trim();
      if (!code) return;
      const matching = products.filter((p) =>
        String(p.barcode || "").trim() === code ||
        String(p.sku || "").trim() === code ||
        String(p.id).trim() === code
      );
      if (matching.length === 1) {
        processBarcodeMatch(matching[0]);
      } else if (matching.length > 1) {
        setMultipleMatches(matching);
        setIsMultipleMatchesOpen(true);
        setBarcodeInput("");
      } else {
        if (code.length >= 4) {
          setNotFoundBarcode(code);
          setBarcodeInput("");
        }
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [barcodeInput, products, form, append]);

  const handleBarcodeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcodeInput.trim();
      if (!code) return;
      const matching = products.filter((p) =>
        String(p.barcode || "").trim() === code ||
        String(p.sku || "").trim() === code ||
        String(p.id).trim() === code
      );
      if (matching.length === 1) {
        processBarcodeMatch(matching[0]);
      } else if (matching.length > 1) {
        setMultipleMatches(matching);
        setIsMultipleMatchesOpen(true);
        setBarcodeInput("");
      } else {
        setNotFoundBarcode(code);
        setBarcodeInput("");
      }
    }
  };

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        document.getElementById("barcode-scanner-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      document.getElementById("barcode-scanner-input")?.focus();
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const handleProductSelect = (index, variantId, product) => {
    if (!product) return;
    const cost = Number(product.cost_price) || 0;
    const defaultSelling = Number(product.selling_price) || Number((cost / 0.70).toFixed(2));

    form.setValue(`items.${index}.productId`, product.product_id || product.id);
    form.setValue(`items.${index}.productVariantId`, product.variant_id || null);
    form.setValue(`items.${index}.name`, product.name);
    form.setValue(`items.${index}.sku`, product.sku || product.barcode || "");
    form.setValue(`items.${index}.unitCost`, cost);
    form.setValue(`items.${index}.wholesalePrice`, Number(product.wholesale_price) || 0);
    form.setValue(`items.${index}.profitMargin`, cost > 0 && defaultSelling > 0 ? Number((((defaultSelling - cost) / defaultSelling) * 100).toFixed(2)) : 30);
    form.setValue(`items.${index}.mrpPrice`, Number(product.mrp_price) || defaultSelling);
    form.setValue(`items.${index}.sellingPrice`, defaultSelling);
  };

  if (status === "loading" || isDataLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  if (status === "unauthenticated") {
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    return null;
  }

  const handlePreSubmit = (e) => {
    e.preventDefault();
    const currentItems = form.getValues("items");
    // Auto-remove trailing untouched rows to improve UX
    const cleanedItems = currentItems.filter(
      item => item.productId || item.receivedQty > 0
    );
    if (cleanedItems.length !== currentItems.length) {
      form.setValue("items", cleanedItems);
    }
    form.handleSubmit(onSubmit)(e);
  };

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
        branch_id: data.branchId,
        supplier_id: data.supplierId,
        grn_date: format(data.grnDate, "yyyy-MM-dd"),
        invoice_number: data.invoiceNumber,
        remarks: data.remarks,
        total_amount: grandTotal,
        items: data.items.filter(item => item.productId).map((item) => ({
          product_id: item.productId,
          product_variant_id: item.productVariantId || null,
          quantity_received: item.receivedQty,
          ordered_qty: item.receivedQty,
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn/direct`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to create Direct GRN");
      }

      toast.success("Direct GRN & PO Created Successfully");
      router.push("/purchase/grn");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create GRN");
    } finally {
      setIsSubmitting(false);
    }
  }

  const watchedItems = form.watch("items");
  const grandTotal = watchedItems?.reduce((acc, item) => acc + (item.unitCost || 0) * (item.receivedQty || 0), 0) || 0;

  return (
    <div className="flex-1 space-y-6 p-6 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-border/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Direct GRN </h1>
              <p className="text-[13px] text-muted-foreground font-medium opacity-70">Simultaneous PO & Receipt</p>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handlePreSubmit} className="space-y-6">
          <Card className="border border-border/40 bg-card shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-[13px] font-bold text-foreground">Supplier & Receipt Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1.5">
                      <FormLabel className="text-sm font-medium">Supplier <span className="text-red-500">*</span></FormLabel>
                      <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between h-9",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <span className="truncate">
                                {field.value
                                  ? suppliers.find((s) => s.id === field.value)?.name
                                  : "Select supplier"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search supplier..." />
                            <CommandList>
                              <CommandEmpty>No supplier found.</CommandEmpty>
                              <CommandGroup>
                                {suppliers.map((s) => (
                                  <CommandItem
                                    value={s.name}
                                    key={s.id}
                                    onSelect={() => {
                                      form.setValue("supplierId", s.id);
                                      setSupplierOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        s.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {s.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-foreground">Branch <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={session?.user?.branches?.length <= 1}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Target Branch" />
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
                        <Input placeholder="e.g. INV-99887" {...field} />
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
                      <FormLabel className="text-sm font-medium text-foreground">Date <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel className="text-sm font-medium text-foreground">Attachments</FormLabel>
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
                          <label htmlFor="grn-file-upload" className="flex items-center justify-center gap-2 h-9 px-4 border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm shadow-sm transition-colors">
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

          <Card className="border border-border/40 shadow-sm rounded-lg overflow-hidden mt-6">
            <CardHeader className="bg-muted/10 border-b border-border/40 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base font-semibold text-foreground">Received Items</CardTitle>
                  <p className="text-[13px] text-muted-foreground font-medium opacity-60 underline underline-offset-4 decoration-emerald-500/30">Direct Stock Intake</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex items-center">
                    <Input
                      id="barcode-scanner-input"
                      placeholder="Scan barcode..."
                      className="h-9 w-48 text-[11px] font-medium pl-8 border-emerald-500/30 focus-visible:ring-emerald-500/20 bg-background rounded-lg shadow-sm"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={handleBarcodeKeyDown}
                    />
                    <Barcode className="absolute left-2.5 h-3.5 w-3.5 text-emerald-600 opacity-60" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] gap-1.5 transition-all"
                    onClick={() => {
                      append({
                        productId: "",
                        productVariantId: null,
                        name: "",
                        sku: "",
                        orderedQty: 0,
                        receivedQty: 1,
                        freeQty: 0,
                        unitCost: 0,
                        wholesalePrice: 0,
                        profitMargin: 30,
                        mrpPrice: 0,
                        sellingPrice: 0,
                        batchNumber: "",
                        expiryDate: undefined,
                      });
                      setNewItemAdded(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Row (F2)
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 gap-2 border-border/60 shadow-sm hidden sm:flex">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Columns
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
                    <th className="px-3 py-5 text-[13px] font-semibold text-blue-600 opacity-80 w-[110px] bg-blue-500/5">Qty Recvd</th>
                    {visibleColumns.bonus && <th className="px-3 py-5 text-[13px] font-medium text-muted-foreground opacity-80 w-[90px] text-center">Bonus</th>}
                    <th className="px-3 py-5 text-[13px] font-medium opacity-80 w-[130px]">Unit Cost</th>
                    <th className="px-3 py-5 text-[13px] font-semibold text-purple-600 opacity-80 w-[100px]">Margin %</th>
                    {visibleColumns.wholesale && <th className="px-3 py-5 text-[13px] font-semibold text-amber-600 opacity-80 w-[120px]">Whls. Prc</th>}
                    <th className="px-3 py-5 text-[13px] font-semibold text-blue-600 opacity-80 w-[120px]">MRP</th>
                    <th className="px-3 py-5 text-[13px] font-semibold text-emerald-600 opacity-80 w-[120px]">Sell. Prc</th>
                    <th className="px-6 py-5 text-[13px] font-medium text-muted-foreground opacity-80 w-[140px] text-right">Net Ext.</th>
                    <th className="px-3 py-5 text-[13px] font-medium text-muted-foreground opacity-80 w-[60px] text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {fields.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-muted-foreground">
                        No products added yet. Click "Add Product" to begin.
                      </td>
                    </tr>
                  )}
                  {fields.map((field, index) => {
                    const qty = form.watch(`items.${index}.receivedQty`) || 0;
                    const total = qty * (form.watch(`items.${index}.unitCost`) || 0);

                    return (
                      <tr key={field.id} className="bg-card hover:bg-muted/30 transition-colors group">
                        <td className="px-3 py-3 relative">
                          <ProductSelect
                            value={form.watch(`items.${index}.productId`)}
                            products={products}
                            autoFocus={index === fields.length - 1 && newItemAdded}
                            onChange={(val, product) =>
                              handleProductSelect(index, val, product)
                            }
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
                        <td className="px-3 py-3 bg-blue-500/5">
                          <Input
                            type="number"
                            className="h-9 focus:ring-emerald-500/20"
                            {...form.register(`items.${index}.receivedQty`, { valueAsNumber: true })}
                          />
                        </td>
                        {visibleColumns.bonus && (
                          <td className="px-3 py-3 text-center">
                            <Input type="number" className="h-9 focus:ring-emerald-500/20" {...form.register(`items.${index}.freeQty`, { valueAsNumber: true })} />
                          </td>
                        )}
                        <td className="px-3 py-3">
                          <Input
                            type="number"
                            className="h-9 focus:ring-emerald-500/20"
                            step="0.01"
                            {...form.register(`items.${index}.unitCost`, {
                              valueAsNumber: true,
                              onChange: (e) => {
                                const newCost = parseFloat(e.target.value) || 0;
                                const margin = form.getValues(`items.${index}.profitMargin`) || 0;
                                const newSellingPrice = margin >= 100 ? newCost : (newCost / (1 - margin / 100));
                                form.setValue(`items.${index}.sellingPrice`, Number(newSellingPrice.toFixed(2)));
                              }
                            })}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <Input
                            type="number"
                            className="h-9 focus:ring-emerald-500/20"
                            step="0.01"
                            {...form.register(`items.${index}.profitMargin`, {
                              valueAsNumber: true,
                              onChange: (e) => {
                                const cost = form.getValues(`items.${index}.unitCost`) || 0;
                                const margin = parseFloat(e.target.value) || 0;
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
                        <td className="px-3 py-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {form.formState.errors.items && (
                <div className="text-red-500 text-sm p-4 text-center">
                  {form.formState.errors.items.message}
                </div>
              )}
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
      <Dialog open={isMultipleMatchesOpen} onOpenChange={setIsMultipleMatchesOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-2xl border-border/50 shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/20">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Multiple Products Found</DialogTitle>
            <DialogDescription className="text-xs mt-1 text-muted-foreground/80 font-medium">
              Several variants share this exact barcode. Please select the correct item below to add to the order.
            </DialogDescription>
          </DialogHeader>
          <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto bg-muted/5">
            {multipleMatches.map((product) => (
              <button
                key={product.id || product.product_id}
                onClick={() => {
                  processBarcodeMatch(product);
                  setIsMultipleMatchesOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-emerald-500/10 rounded-xl transition-colors border border-transparent hover:border-emerald-500/20 group"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground text-sm group-hover:text-emerald-700 transition-colors">{product.name}</span>
                  <span className="text-xs text-muted-foreground font-mono bg-muted/50 w-fit px-1.5 py-0.5 rounded">{product.sku}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-emerald-600">LKR {Number(product.cost_price || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Unit Cost</span>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!notFoundBarcode} onOpenChange={(open) => !open && setNotFoundBarcode(null)}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-border/50 shadow-2xl">
          <div className="px-6 pt-8 pb-6 bg-red-500/5">
            <DialogHeader className="flex flex-col items-center">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight">Product Not Found</DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground mt-2 max-w-[85%] text-center leading-relaxed">
                We couldn"t find any item matching the scanned barcode <strong className="text-foreground bg-muted px-1.5 py-0.5 rounded font-mono mx-1">{notFoundBarcode}</strong> in your inventory system.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-4 bg-muted/10 flex justify-end gap-3 border-t border-border/40">
            <Button
              variant="outline"
              className="rounded-xl border-border/60 hover:bg-muted"
              onClick={() => setNotFoundBarcode(null)}
            >
              Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}