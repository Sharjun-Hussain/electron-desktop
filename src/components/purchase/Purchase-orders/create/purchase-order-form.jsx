"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Check,
  ChevronsUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Loader2,
  FileSpreadsheet,
  Upload,
  Paperclip,
  Barcode,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreatePOSkeleton } from "@/app/skeletons/purchases/create-po-skeleton";
import { AddSupplierSheet as CreateSupplierSheet } from "@/components/purchase/suppliers/AddSupplierSheet";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// eslint-disable-next-line no-unused-vars
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ShoppingBag,
  Truck,
  Info,
  Receipt,
  Globe,
  CreditCard,
  MessageSquare,
  MapPin,
  CalendarDays,
  Hash,
  User,
  LayoutGrid
} from "lucide-react";

// --- 2. Zod Schema ---

const itemSchema = z.object({
  productId: z.coerce.string().min(1, "Product is required"),
  unitCost: z.coerce.number().min(0, "Cost must be valid"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  discount: z.coerce.number().min(0).optional().default(0),
  taxRate: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

const formSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier."),
  branchId: z.string().min(1, "Please select a branch."),
  orderDate: z.date({ required_error: "Order date is required." }),
  expectedDate: z.date().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  paymentTerms: z.string().optional(),
  deliveryAddress: z.string().optional(),
});

// --- 3. Helper Component for Product Search (UX Focus) ---
const ProductSelect = ({ value, onChange, products, autoFocus, onSelect }) => {
  const [open, setOpen] = useState(false);

  // Handle both string and number IDs
  const selectedProduct = products.find((p) => String(p.id) === String(value));

  useEffect(() => {
    if (autoFocus) {
      setOpen(true);
    }
  }, [autoFocus]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-transparent border-0 border-b-2 rounded-none shadow-none hover:bg-transparent hover:border-primary/20 focus:border-primary/80 pl-3 text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          {selectedProduct ? (
            <span className="truncate font-medium">{selectedProduct.fullName || selectedProduct.name}</span>
          ) : (
            "Select product/variant..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or SKU..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {products.map((product, idx) => (
                <CommandItem
                  key={`${product.id}-${idx}`}
                  value={`${product.fullName} ${product.sku || ''} ${product.barcode || ''}`}
                  onSelect={() => {
                    onChange(product.id);
                    setOpen(false);
                    if (onSelect) onSelect();
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(value) === String(product.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{product.fullName || product.name}</span>
                      <span className="text-xs text-muted-foreground/60">
                        {product.code}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        Stock:
                        {/* Optional chaining for null safety as requested */}
                        <span
                          className={cn(
                            "ml-1 font-medium",
                            (product?.stock_quantity || 0) === 0
                              ? "text-red-500"
                              : "text-emerald-500"
                          )}
                        >
                          {product?.stock_quantity ?? "N/A"} units
                        </span>
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {/* Assuming cost_price is available, otherwise 0 */}
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

export default function CreatePurchaseOrder({ initialData }) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get("duplicateId");
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItemAdded, setNewItemAdded] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  // Popover States
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [orderDateOpen, setOrderDateOpen] = useState(false);
  const [expectedDateOpen, setExpectedDateOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);

  // New Feature: Filter by Supplier
  const [filterBySupplier, setFilterBySupplier] = useState(true);

  // Refs for focus management
  const unitCostRef = useRef(null);
  const quantityRef = useRef(null);

  const [branches, setBranches] = useState([]);
  const isSuperAdmin = session?.user?.roles?.includes("Super Admin");
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: initialData?.supplier_id ? String(initialData.supplier_id) : "",
      branchId: initialData?.branch_id ? String(initialData.branch_id) : (session?.user?.branch_id ? String(session.user.branch_id) : ""),
      orderDate: initialData?.order_date
        ? new Date(initialData.order_date)
        : new Date(),
      expectedDate: initialData?.expected_delivery_date
        ? new Date(initialData.expected_delivery_date)
        : undefined,
      reference: initialData?.reference_number || initialData?.reference || "",
      notes: initialData?.notes || "",
      paymentTerms: initialData?.payment_terms || "",
      deliveryAddress: initialData?.delivery_address || "",
      items: initialData?.items?.map((item) => ({
        productId: String(item.variant_id || item.variant?.id || item.product_id || item.product?.id || ""),
        unitCost: Number(item.unit_cost) || 0,
        quantity: Number(item.quantity) || Number(item.quantity_ordered) || 1,
        discount: Number(item.discount_percentage) || 0,
        taxRate: Number(item.tax_rate) || 0,
        notes: item.notes || "",
      })) || [
          {
            productId: "",
            unitCost: 0,
            quantity: 1,
            discount: 0,
            taxRate: 0,
            notes: "",
          },
        ],
    },
  });

  // Ensure form resets if initialData changes (extra robustness for Edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset({
        supplierId: initialData.supplier_id ? String(initialData.supplier_id) : "",
        branchId: initialData.branch_id ? String(initialData.branch_id) : (session?.user?.branch_id ? String(session.user.branch_id) : ""),
        orderDate: initialData.order_date ? new Date(initialData.order_date) : new Date(),
        expectedDate: initialData.expected_delivery_date ? new Date(initialData.expected_delivery_date) : undefined,
        reference: initialData.reference_number || initialData.reference || "",
        notes: initialData.notes || "",
        paymentTerms: initialData.payment_terms || "",
        deliveryAddress: initialData.delivery_address || "",
        items: initialData.items?.map((item) => ({
          productId: String(item.variant_id || item.variant?.id || item.product_id || item.product?.id || ""),
          unitCost: Number(item.unit_cost) || 0,
          quantity: Number(item.quantity) || Number(item.quantity_ordered) || 1,
          discount: Number(item.discount_percentage) || 0,
          taxRate: Number(item.tax_rate) || 0,
          notes: item.notes || "",
        })) || [
            {
              productId: "",
              unitCost: 0,
              quantity: 1,
              discount: 0,
              taxRate: 0,
              notes: "",
            },
          ],
      });
    }
  }, [initialData, form, session?.user?.branch_id]);

  const { fields, prepend, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) return;
      try {
        setIsLoadingData(true);
        const [suppliersRes, productsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
        ]);

        if (suppliersRes.ok) {
          const data = await suppliersRes.json();
          setSuppliers(data.data || []);
        }
        if (productsRes.ok) {
          const data = await productsRes.json();
          const allProducts = data.data || [];

          // Flatten products into variants for easier selection
          const flattened = [];
          allProducts.forEach(product => {
            if (product.variants && product.variants.length > 0) {
              product.variants.forEach(variant => {
                flattened.push({
                  ...variant,
                  productName: product.name,
                  fullName: `${product.name} - ${variant.name || variant.sku || variant.barcode || 'Default'}`,
                  parentProduct: product
                });
              });
            } else {
              // If no variants, add the product itself as a virtual variant
              flattened.push({
                id: product.id,
                name: product.name,
                productName: product.name,
                fullName: product.name,
                sku: product.sku,
                barcode: product.barcode,
                cost_price: product.cost_price || 0,
                parentProduct: product
              });
            }
          });
          setProducts(flattened);
        }

        // Fetch branches if Super Admin
        if (isSuperAdmin) {
          const branchesRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });
          if (branchesRes.ok) {
            const data = await branchesRes.json();
            setBranches(data.data || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Failed to load required data");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (session?.accessToken) {
      fetchData();
    }
  }, [session?.accessToken, isSuperAdmin]);

  // Keyboard Shortcut: Ctrl + n to add new item
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        prepend({ productId: "", unitCost: 0, quantity: 1 });
        setNewItemAdded(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prepend]);

  // Keyboard Shortcut: Ctrl + b to focus barcode scanner
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        document.getElementById("barcode-scanner-input")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset newItemAdded after focus is handled (optional, but good for cleanup)
  useEffect(() => {
    if (newItemAdded) {
      const timer = setTimeout(() => setNewItemAdded(false), 500);
      return () => clearTimeout(timer);
    }
  }, [newItemAdded]);

  // Handle URL Prefill (e.g., from Low Stock Report)
  useEffect(() => {
    if (typeof window === "undefined" || isEditing || hasPrefilled || products.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const variantsParam = params.get("variants");

    if (!variantsParam) {
      setHasPrefilled(true);
      return;
    }

    const variantIds = variantsParam.split(",");
    const newItems = variantIds.map(vId => {
      // Find exact variant ID first, falling back to parent product ID
      let p = products.find(prod => String(prod.id) === String(vId));

      if (!p) {
        // If not found in exact IDs, check if vId matches a parent product ID. 
        // `products` array contains flattened variants AND pseudo-variants.
        p = products.find(prod => String(prod.parentProduct?.id) === String(vId));
      }

      if (!p) return null;
      return {
        productId: String(p.id), // Ensure we map to the exact internal ID of the flatten structure
        unitCost: Number(p.cost_price) || 0,
        quantity: 1, // Defaulting to 1 to allow user to adjust
        discount: 0,
        taxRate: 0,
        notes: "",
      };
    }).filter(Boolean);

    if (newItems.length > 0) {
      // Optionally pick supplier from the first matched product if not set
      const firstProduct = products.find(prod => String(prod.id) === String(newItems[0].productId));
      if (firstProduct && !form.getValues('supplierId')) {
        const parent = firstProduct.parentProduct || firstProduct;
        const pSupplierId = parent.supplier_id;
        if (pSupplierId) {
          form.setValue("supplierId", String(pSupplierId));
        } else if (parent.suppliers?.length > 0) {
          form.setValue("supplierId", String(parent.suppliers[0].id));
        }
      }

      form.setValue("items", newItems);
      // Turn off filter by supplier out of caution so all pre-selected products show up in the dropdowns.
      setFilterBySupplier(false);
    }
    setHasPrefilled(true);
  }, [products, isEditing, hasPrefilled, form]);

  // Handle Duplication Pre-fill
  useEffect(() => {
    if (!duplicateId || !session?.accessToken || isEditing || hasPrefilled) return;

    const fetchDuplicateTask = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${duplicateId}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        if (res.ok) {
          const result = await res.json();
          const po = result.data;

          if (po) {
            form.reset({
              supplierId: po.supplier_id ? String(po.supplier_id) : "",
              branchId: po.branch_id ? String(po.branch_id) : (session?.user?.branch_id ? String(session.user.branch_id) : ""),
              orderDate: new Date(), // Always fresh for duplication
              expectedDate: undefined,
              reference: `Duplicate of ${po.po_number}`,
              notes: po.notes || "",
              paymentTerms: po.payment_terms || "",
              deliveryAddress: po.delivery_address || "",
              items: po.items?.map((item) => ({
                productId: String(item.variant_id || item.variant?.id || item.product_id || item.product?.id || ""),
                unitCost: Number(item.unit_cost) || 0,
                quantity: Number(item.quantity) || 1,
                discount: Number(item.discount_percentage) || 0,
                taxRate: Number(item.tax_rate) || 0,
                notes: item.notes || "",
              })),
            });
            toast.success(`Protocol data duplicated from #${po.po_number}`);
            setHasPrefilled(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch duplicate source:", err);
      }
    };

    fetchDuplicateTask();
  }, [duplicateId, session?.accessToken, isEditing, hasPrefilled, form]);

  // Keyboard Shortcut: Ctrl + Enter to submit form
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, onSubmit]);

  // Calculations
  const watchedItems = form.watch("items");
  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((acc, item) => {
      return acc + (Number(item.unitCost) || 0) * (Number(item.quantity) || 0);
    }, 0);
    const taxRate = 0.0;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, total } = calculateTotals();

  // --- Filtered Products Logic ---
  const selectedSupplierId = form.watch("supplierId");

  const filteredProducts = useMemo(() => {
    if (filterBySupplier && selectedSupplierId) {
      // Filter products where product.supplier_id matches
      return products.filter(p => {
        // Check parent product supplier ID (handle string/number mismatch)
        const parent = p.parentProduct || p;
        const pSupplierId = parent.supplier_id || p.supplier_id;
        const pSuppliers = parent.suppliers || [];

        const isPrimary = String(pSupplierId) === String(selectedSupplierId);
        const isSecondary = pSuppliers.some(s => String(s.id) === String(selectedSupplierId));

        return isPrimary || isSecondary;
      });
    }
    return products;
  }, [products, filterBySupplier, selectedSupplierId]);

  // Auto-fill cost when product is selected
  const handleProductSelect = (index, variantId) => {
    const variant = products.find((p) => String(p.id) === String(variantId));
    if (variant) {
      form.setValue(`items.${index}.productId`, variantId);
      form.setValue(`items.${index}.unitCost`, Number(variant.cost_price) || 0);

      // Focus Unit Cost after selection
      if (index === 0 && unitCostRef.current) {
        setTimeout(() => unitCostRef.current.focus(), 100);
      }
    }
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcodeInput.trim();
      if (!code) return;

      const variant = products.find((p) => p.barcode === code || p.sku === code);
      if (variant) {
        const currentItems = form.getValues("items");

        // Check if it exists to increment quantity
        const existingIndex = currentItems.findIndex(item => String(item.productId) === String(variant.id));

        if (existingIndex > -1 && currentItems[existingIndex].productId !== "") {
          const qty = Number(currentItems[existingIndex].quantity) || 0;
          form.setValue(`items.${existingIndex}.quantity`, qty + 1);
          toast.success(`Increased quantity for ${variant.fullName}`);
        } else {
          // If first item is empty, use it. Otherwise prepend.
          if (currentItems.length === 1 && !currentItems[0].productId) {
            form.setValue("items.0.productId", String(variant.id));
            form.setValue("items.0.unitCost", Number(variant.cost_price) || 0);
            toast.success(`Selected ${variant.fullName}`);
          } else {
            prepend({
              productId: String(variant.id),
              unitCost: Number(variant.cost_price) || 0,
              quantity: 1,
              discount: 0,
              taxRate: 0,
              notes: "",
            });
            toast.success(`Added ${variant.fullName}`);
          }
        }
        setBarcodeInput("");
      } else {
        toast.error("Product not found");
        setBarcodeInput("");
      }
    }
  };

  async function onSubmit(data) {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      // Construct Payload
      const payload = {
        supplier_id: data.supplierId,
        organization_id: session.user?.organization_id,
        branch_id: data.branchId || session.user?.branch_id,
        order_date: format(data.orderDate, "yyyy-MM-dd"),
        expected_delivery_date: data.expectedDate
          ? format(data.expectedDate, "yyyy-MM-dd")
          : null,
        payment_terms: data.paymentTerms || "Net 30",
        delivery_address: data.deliveryAddress || "",
        notes: data.notes || "",
        status: initialData?.status || "pending",
        items: data.items.map((item) => ({
          variant_id: item.productId, // This is the variant ID from the flattened list
          quantity_ordered: Number(item.quantity),
          unit_cost: Number(item.unitCost),
          notes: item.notes || "",
        })),
      };

      console.log("Submitting Payload:", payload);

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: (function () {
          const formData = new FormData();
          formData.append("data", JSON.stringify(payload));
          if (selectedFiles.length > 0) {
            selectedFiles.forEach(file => {
              formData.append("attachmentFiles", file);
            });
          }
          return formData;
        })(),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `Purchase Order ${isEditing ? "updated" : "created"} successfully!`
        );
        router.push("/purchase/purchase-orders"); // Redirect to list
      } else {
        toast.error(
          result.message ||
          `Failed to ${isEditing ? "update" : "create"} Purchase Order`
        );
        console.error("API Error:", result);
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  function onInvalid(errors) {
    console.log("Form Validation Errors:", errors);
    toast.error("Please check the form for errors.");
    // Optional: Expand specific errors if needed
    if (errors.supplierId) toast.error(errors.supplierId.message);
    if (errors.items) toast.error("Please add valid items to the order.");
  }

  if (isLoadingData) {
    return <CreatePOSkeleton />;
  }

  return (
    <div className="flex-1 space-y-6 p-6 bg-background min-h-screen">
      {/* ── Premium Header ── */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isEditing ? "Edit Purchase Order" : "Create Purchase Order"}
              </h1>
              <p className="text-[10px] text-muted-foreground font-bold opacity-70">
                {isEditing ? "Update procurement details" : "New procurement & restocking"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-8"
        >
          {/* --- Section 1: Enhanced Order Information --- */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* Column 1: Primary Transaction Details (Vendor & Timeline) */}
            <div className="xl:col-span-8 space-y-6">
              <Card className="border border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/50 dark:bg-muted/20 border-b border-border/40 px-5 py-3 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <CardTitle className="text-[13px] font-bold">Vendor & Branch Registry</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-background text-[10px] font-bold border-border/60">
                    Step 1: Identity & Location
                  </Badge>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    {/* 1. Supplier Selection */}
                    <FormField
                      control={form.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <div className="flex items-center justify-between h-5 ">
                            <FormLabel className="font-semibold text-foreground flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-emerald-600" />
                              Primary Supplier
                            </FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 rounded-lg"
                              onClick={() => setIsCreateSupplierOpen(true)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full  justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? suppliers.find(
                                      (supplier) =>
                                        String(supplier.id) ===
                                        String(field.value)
                                    )?.name
                                    : "Select supplier..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search supplier..." />
                                <CommandList>
                                  <CommandEmpty className="p-3 text-center text-xs text-muted-foreground">
                                    No supplier found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {suppliers.map((supplier) => (
                                      <CommandItem
                                        value={supplier.name}
                                        key={supplier.id}
                                        onSelect={() => {
                                          form.setValue("supplierId", supplier.id);
                                          setSupplierOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            String(supplier.id) === String(field.value)
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {supplier.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    {/* 2. Allocated Branch */}
                    <FormField
                      control={form.control}
                      name="branchId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-emerald-600" />
                            Allocated Destination
                          </FormLabel>
                          <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? branches.find(
                                      (branch) =>
                                        String(branch.id) ===
                                        String(field.value)
                                    )?.name
                                    : "Select Destination Branch..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search branch..." />
                                <CommandList>
                                  <CommandEmpty className="p-3 text-center text-xs text-muted-foreground">
                                    No branch found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {branches.map((branch) => (
                                      <CommandItem
                                        value={branch.name}
                                        key={branch.id}
                                        onSelect={() => {
                                          form.setValue("branchId", String(branch.id));
                                          setBranchOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            String(branch.id) === String(field.value)
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                          <span className="font-medium">{branch.name}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Card */}
              <Card className="border border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/50 dark:bg-muted/20 border-b border-border/40 px-5 py-3 flex flex-row items-center gap-2 space-y-0">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-[13px] font-bold">Transaction Timeline</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    {/* Issuance Date */}
                    <FormField
                      control={form.control}
                      name="orderDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="font-semibold text-foreground mb-1.5">Official Issuance Date</FormLabel>
                          <Popover open={orderDateOpen} onOpenChange={setOrderDateOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-11 pl-3 text-left font-medium border-border/60 hover:border-emerald-500/30 transition-all",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : "Set Date"}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-40 text-emerald-600" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-xl shadow-2xl border-emerald-500/10" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => { field.onChange(date); setOrderDateOpen(false); }}
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    {/* Target Receipt */}
                    <FormField
                      control={form.control}
                      name="expectedDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="font-semibold text-foreground mb-1.5 flex items-center justify-between">
                            Target Receipt Date
                            <Badge variant="outline" className="text-[9px] h-4 py-0 font-normal opacity-60">Optional</Badge>
                          </FormLabel>
                          <Popover open={expectedDateOpen} onOpenChange={setExpectedDateOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-11 pl-3 text-left font-medium border-border/60 hover:border-blue-500/30 transition-all",
                                    !field.value && "text-muted-foreground font-normal"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : "Estimate Delivery Target"}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-40 text-blue-600" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-xl shadow-2xl border-blue-500/10" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={(date) => { field.onChange(date); setExpectedDateOpen(false); }} disabled={(date) => date < new Date()} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Column 2: Logistics, Terms & Administrative (Sidebar) */}
            <div className="xl:col-span-4 space-y-6">
              <Card className="h-full border border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/50 dark:bg-muted/20 border-b border-border/40 px-5 py-3 flex flex-row items-center gap-2 space-y-0">
                  <LayoutGrid className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-[13px] font-bold">Logistics & Compliance</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {/* Reference Number */}
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-emerald-600" />
                          Reference Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. PO-8921-2024"
                            className="h-11 border-border/60 focus:ring-emerald-500/20 hover:border-emerald-500/30 transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  {/* Payment Terms */}
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          Settlement Terms
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Net 30 Days"
                            className="h-11 border-border/60 focus:ring-emerald-500/20 hover:border-emerald-500/30 transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  {/* Delivery Instructions */}
                  <FormField
                    control={form.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          Delivery Instructions
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Specify exact landing location or receipt protocols..."
                            className="min-h-[100px] border-border/60 focus:ring-emerald-500/20 hover:border-emerald-500/30 transition-all resize-none"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Internal Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          Administrative Memos
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Private notes for procurement team..."
                            className="min-h-[100px] border-border/60 focus:ring-emerald-500/20 hover:border-emerald-500/30 transition-all resize-none"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Full Width: Documentation & Protocol Attachments */}
            <div className="xl:col-span-12">
              <Card className="border border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/50 dark:bg-muted/20 border-b border-border/40 px-5 py-3 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    <CardTitle className="text-[13px] font-bold">Documentation & Protocols</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-background text-[10px] font-bold border-border/60">
                    Compliance Artifacts
                  </Badge>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
                    {/* Upload Zone */}
                    <div className="lg:col-span-4 relative group/upload">
                      <Input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setSelectedFiles(prev => [...prev, ...files]);
                        }}
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-2xl p-8 bg-muted/20 hover:bg-emerald-500/5 hover:border-emerald-500/30 cursor-pointer transition-all group"
                      >
                        <div className="bg-background p-3 rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform border border-border/40">
                          <Upload className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-sm font-bold text-foreground">Attach Procurement Artifacts</span>
                        <span className="text-[11px] text-muted-foreground mt-2 text-center max-w-[200px]">Drag and drop or click to upload quotes, agreements or invoices</span>
                      </label>
                    </div>

                    {/* File List */}
                    <div className="lg:col-span-8">
                      {selectedFiles.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                          {selectedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60 shadow-sm group hover:border-emerald-500/30 transition-all animate-in fade-in zoom-in-95 duration-300">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                  <Paperclip className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col truncate">
                                  <span className="text-xs font-bold text-foreground truncate">{file.name}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg transition-colors"
                                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full min-h-[160px] border-2 border-dotted border-border/40 rounded-2xl flex flex-col items-center justify-center bg-muted/10 opacity-60">
                          <div className="p-3 bg-muted/40 rounded-full mb-2">
                            <Info className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <p className="text-xs font-medium text-muted-foreground">No documents attached to this order yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* --- Section 2: Order Items --- */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 border-b border-border/40 bg-muted/30">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                <CardTitle className="text-sm font-semibold text-foreground">Order Items Registry</CardTitle>
              </div>

              <div className="flex items-center gap-4">
                {/* Supplier Filter Checkbox */}
                <div className="flex items-center space-x-2 bg-background px-3 py-1.5 rounded-lg border border-border shadow-sm">
                  <Checkbox
                    id="filterSupplier"
                    checked={filterBySupplier}
                    onCheckedChange={setFilterBySupplier}
                    disabled={!form.watch("supplierId")}
                    className="rounded-md border-border"
                  />
                  <label
                    htmlFor="filterSupplier"
                    className="text-xs font-medium text-foreground cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Filter by Supplier
                  </label>
                </div>

                {/* Barcode Scanner Input */}
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
                    prepend({ productId: "", unitCost: 0, quantity: 1 });
                    setNewItemAdded(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-5">
              {/* Table Header - Desktop (More compact) */}
              <div className="hidden md:grid grid-cols-12 gap-4 mb-3 text-[10px] font-bold text-muted-foreground/60 uppercase px-4">
                <div className="col-span-1 md:col-span-5">Product Discovery & Selection</div>
                <div className="col-span-1 md:col-span-2">Unit cost (LKR)</div>
                <div className="col-span-1 md:col-span-1">QTY</div>
                <div className="col-span-1 md:col-span-2 text-right">Line Subtotal</div>
                <div className="col-span-1 md:col-span-2 text-right">Actions</div>
              </div>

              {/* Dynamic Rows (Compact gaps) */}
              <div className="space-y-2">
                {fields.map((field, index) => {
                  const isFirstItem = index === 0;
                  const currentCost =
                    form.getValues(`items.${index}.unitCost`) || 0;
                  const currentQty =
                    form.getValues(`items.${index}.quantity`) || 0;
                  const lineTotal = (currentCost * currentQty).toLocaleString(
                    "en-LK",
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  );

                  return (
                    <Collapsible
                      key={field.id}
                      className="border border-border/40 rounded-lg bg-card shadow-sm group hover:border-emerald-500/20 transition-all"
                    >
                      <div className="p-2 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* 1. Product Select (Low padding) */}
                          <div className="col-span-1 md:col-span-5">
                            <ProductSelect
                              value={form.watch(`items.${index}.productId`)}
                              products={filteredProducts}
                              autoFocus={isFirstItem && newItemAdded}
                              onChange={(val) =>
                                handleProductSelect(index, val)
                              }
                            />
                          </div>

                          {/* 2. Unit Cost (Compact Input) */}
                          <div className="col-span-1 md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unitCost`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <div className="relative group/input">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                        LKR
                                      </span>
                                      <Input
                                        type="number"
                                        className="pl-12 focus:ring-emerald-500/20"
                                        min="0"
                                        step="0.01"
                                        {...field}
                                        ref={isFirstItem ? unitCostRef : null}
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* 3. Quantity (Compact Input) */}
                          <div className="col-span-1 md:col-span-1">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      className="text-center focus:ring-emerald-500/20"
                                      {...field}
                                      ref={isFirstItem ? quantityRef : null}
                                      onFocus={(e) => e.target.select()}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          prepend({ productId: "", unitCost: 0, quantity: 1 });
                                          setNewItemAdded(true);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* 4. Line Total & Actions */}
                          <div className="col-span-1 md:col-span-2 text-right">
                            <p className="font-bold text-foreground text-[13px]">
                              {lineTotal}
                            </p>
                          </div>

                          <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                              </Button>
                            </CollapsibleTrigger>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8 rounded-lg"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* --- EXPANDABLE SECTION (Accordion) --- */}
                      <CollapsibleContent className="bg-muted/20 border-t border-border/30 px-4 py-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Discount Field */}
                          <FormField
                            control={form.control}
                            name={`items.${index}.discount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">
                                  Discount (%)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="bg-background h-9"
                                    placeholder="0"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Tax Rate Field */}
                          <FormField
                            control={form.control}
                            name={`items.${index}.taxRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">
                                  Tax Rate (%)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="bg-background h-9"
                                    placeholder="0"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Item Specific Notes */}
                          <div className="md:col-span-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.notes`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">
                                    Item Note
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Specific details for this item (e.g. Size L, Blue)"
                                      className="bg-background h-9"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>



              {/* Summary Section (High Density) */}
              <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-lg bg-muted/30 border border-border/30 shadow-inner">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 w-full md:w-auto">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Subtotal (Net)</p>
                    <p className="text-lg font-bold text-foreground leading-none pt-1">
                      LKR {subtotal.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Tax (VAT 0%)</p>
                    <p className="text-lg font-bold text-foreground leading-none pt-1">LKR 0.00</p>
                  </div>
                  <div className="space-y-1 col-span-2 lg:col-span-1">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase">Grand Total Amount</p>
                    <p className="text-2xl font-black text-foreground leading-none pt-1">
                      LKR {total.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="font-bold text-muted-foreground hover:bg-muted/50"
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md active:scale-95 flex flex-col items-center justify-center gap-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span className="text-[13px] leading-tight">{isEditing ? "Update Order" : "Authorize Order"}</span>
                        <span className="text-[9px] opacity-60 leading-tight">Commit to Registry</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <CreateSupplierSheet
        open={isCreateSupplierOpen}
        onOpenChange={setIsCreateSupplierOpen}
        onSuccess={(newSupplier) => {
          setSuppliers(prev => [newSupplier, ...prev]);
          form.setValue("supplierId", newSupplier.id);
          setSupplierOpen(false);
        }}
      />
    </div>
  );
}
