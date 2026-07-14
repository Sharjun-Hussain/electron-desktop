"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Barcode,
  Save,
  AlertTriangle,
  FileStack,
  Clock
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
import { ProductForm } from "@/components/products/new/product-form";
import { AddSupplierSheet as CreateSupplierSheet } from "@/components/purchase/suppliers/AddSupplierSheet";
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
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [isNavigationWarningOpen, setIsNavigationWarningOpen] = useState(false);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [newItemAdded, setNewItemAdded] = useState(false);

  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [prefillProductData, setPrefillProductData] = useState(null);
  const [pendingItemIndex, setPendingItemIndex] = useState(null);

  const [barcodeInput, setBarcodeInput] = useState("");
  const [notFoundBarcode, setNotFoundBarcode] = useState(null);
  const [multipleMatches, setMultipleMatches] = useState([]);
  const [isMultipleMatchesOpen, setIsMultipleMatchesOpen] = useState(false);

  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [submitData, setSubmitData] = useState(null);

  // Drafts Modal States
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [savedDraftsList, setSavedDraftsList] = useState([]);
  const [isDraftsLoading, setIsDraftsLoading] = useState(false);

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
          profitMargin: 0,
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

  const loadedDraftIdRef = useRef(null);

  // Load Draft on Mount
  useEffect(() => {
    async function loadDraft() {
      if (status !== "authenticated" || !session?.accessToken) return;
      const draftIdParam = searchParams.get("draftId");
      const isLocalParam = searchParams.get("local") === "true";

      if (draftIdParam) {
        if (loadedDraftIdRef.current === draftIdParam) return;
        loadedDraftIdRef.current = draftIdParam;
        
        setCurrentDraftId(draftIdParam);
        
        if (isLocalParam && typeof window !== "undefined") {
          try {
            const savedDrafts = JSON.parse(localStorage.getItem("direct-grn-drafts") || "[]");
            const savedDraft = savedDrafts.find(d => String(d.id) === String(draftIdParam));
            if (savedDraft) {
              let draftData = savedDraft.payload || savedDraft.formData || savedDraft.data || savedDraft;
              if (typeof draftData === "string") {
                try { draftData = JSON.parse(draftData); } catch (e) {}
              }
              if (draftData.grnDate) draftData.grnDate = new Date(draftData.grnDate);
              draftData.items?.forEach(item => {
                if (item.expiryDate) item.expiryDate = new Date(item.expiryDate);
              });
              form.reset(draftData);
              toast.success("Draft loaded from local storage");
            }
          } catch(e) {}
          return;
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/drafts?form_type=DirectGRN`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          });
          const result = await res.json();
          if (result.status === "success" && result.data?.length > 0) {
            const savedDraft = result.data.find(d => d.id === draftIdParam);
            if (savedDraft && savedDraft.payload) {
              let draftData = savedDraft.payload;
              if (typeof draftData === "string") {
                try {
                  draftData = JSON.parse(draftData);
                } catch (e) {
                  console.error("Failed to parse draft payload", e);
                }
              }
              if (draftData.grnDate) draftData.grnDate = new Date(draftData.grnDate);
              draftData.items?.forEach(item => {
                if (item.expiryDate) item.expiryDate = new Date(item.expiryDate);
              });
              form.reset(draftData);
              toast.success("Draft loaded from cloud");
            }
          }
        } catch (e) {
          console.error("Failed to fetch draft", e);
        }
      } else {
        if (loadedDraftIdRef.current === 'new') return;
        loadedDraftIdRef.current = 'new';
        
        // Generate a new draft ID if none in URL
        setCurrentDraftId(crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
      }
    }
    if (typeof window !== "undefined") {
      loadDraft();
    }
  }, [searchParams, form, status, session]);

  // Save Draft Action
  const handleSaveDraft = async () => {
    if (!currentDraftId || status !== "authenticated" || !session?.accessToken) return;

    const currentData = form.getValues();
    
    // Find supplier name for summary
    const supplier = suppliers.find(s => String(s.id) === String(currentData.supplierId));
    const supplierName = supplier ? supplier.name : "Unknown Supplier";
    const itemCount = currentData.items.filter(i => i.productId).length;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          id: currentDraftId,
          form_type: 'DirectGRN',
          summary: `${supplierName} - ${itemCount} item(s)`,
          payload: currentData
        })
      });

      if (response.ok) {
        form.reset({}, { keepValues: true, keepDirty: false }); // Reset dirty state
        toast.success("Draft saved securely to cloud");
      } else {
        toast.error("Failed to save draft");
      }
    } catch (e) {
      console.error("Failed to save draft API", e);
      toast.error("Network error while saving draft");
    }
  };

  const fetchSavedDrafts = async () => {
    if (status !== "authenticated" || !session?.accessToken) return;
    try {
      setIsDraftsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/drafts?form_type=DirectGRN`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      
      let localDrafts = [];
      if (typeof window !== "undefined") {
        try {
          localDrafts = JSON.parse(localStorage.getItem("direct-grn-drafts") || "[]");
          localDrafts = localDrafts.map(d => ({ ...d, isLocal: true, updated_at: d.updatedAt }));
        } catch(e) {}
      }

      if (result.status === "success") {
        setSavedDraftsList([...(result.data || []), ...localDrafts]);
      } else {
        setSavedDraftsList(localDrafts);
      }
    } catch (error) {
      console.error("Failed to fetch drafts list", error);
      toast.error("Failed to load drafts");
    } finally {
      setIsDraftsLoading(false);
    }
  };

  const handleDeleteDraft = async (id, isLocal) => {
    if (isLocal) {
        if (typeof window !== "undefined") {
            try {
                let localDrafts = JSON.parse(localStorage.getItem("direct-grn-drafts") || "[]");
                localDrafts = localDrafts.filter(d => d.id !== id);
                localStorage.setItem("direct-grn-drafts", JSON.stringify(localDrafts));
                setSavedDraftsList(prev => prev.filter(d => d.id !== id));
                toast.success("Local draft deleted");
            } catch(e) {}
        }
        return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/drafts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      if (res.ok) {
        setSavedDraftsList(prev => prev.filter(d => d.id !== id));
        toast.success("Draft deleted");
      }
    } catch (error) {
      toast.error("Failed to delete draft");
    }
  };

  // Prevent Refresh/Navigate if Dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const isDirty = form.formState.isDirty;
      const currentItems = form.getValues().items;
      const hasAddedItems = currentItems.length > 1 || (currentItems.length === 1 && currentItems[0].productId !== "");
      
      if (isDirty && hasAddedItems) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.formState.isDirty, form]);

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
                const variantLabel = variant.name || variant.sku || variant.barcode || 'Default';
                const finalName = (variant.name && variant.name === product.name) || variantLabel === 'Default'
                  ? product.name
                  : `${product.name} - ${variantLabel}`;

                flattened.push({
                  ...variant,
                  product_id: product.id,
                  variant_id: variant.id,
                  name: finalName,
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
          profitMargin: 0,
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

  const handleProductCreated = (newProduct) => {
    const newVariant = newProduct.variants?.[0] || newProduct;
    const cost = Number(newVariant.cost_price) || 0;
    // New product: use saved selling price, or compute 30% margin as default
    const defaultSelling = Number(newVariant.selling_price) || Number((cost / 0.70).toFixed(2));

    const formattedProduct = {
      ...newVariant,
      id: newVariant.id || newProduct.id,
      product_id: newProduct.id,
      variant_id: newVariant.id !== newProduct.id ? newVariant.id : null,
      name: newProduct.name || newVariant.name,
      sku: newVariant.sku || newVariant.barcode || "",
      cost_price: cost,
      selling_price: defaultSelling,
      wholesale_price: Number(newVariant.wholesale_price) || 0,
      mrp_price: Number(newVariant.mrp_price) || defaultSelling,
    };

    // Add to the products list so it can be found by the select
    setProducts(prev => [...prev, formattedProduct]);

    // Auto-add to form items
    const currentItems = form.getValues("items");
    const pId = String(formattedProduct.product_id);
    const vId = formattedProduct.variant_id ? String(formattedProduct.variant_id) : null;

    if (currentItems.length > 0 && !currentItems[currentItems.length - 1].productId) {
      const lastIdx = currentItems.length - 1;
      form.setValue(`items.${lastIdx}.productId`, pId);
      form.setValue(`items.${lastIdx}.productVariantId`, vId);
      form.setValue(`items.${lastIdx}.name`, formattedProduct.name);
      form.setValue(`items.${lastIdx}.sku`, formattedProduct.sku);
      form.setValue(`items.${lastIdx}.unitCost`, cost);
      form.setValue(`items.${lastIdx}.wholesalePrice`, formattedProduct.wholesale_price);
      form.setValue(`items.${lastIdx}.mrpPrice`, formattedProduct.mrp_price);
      form.setValue(`items.${lastIdx}.sellingPrice`, defaultSelling);
      form.setValue(`items.${lastIdx}.profitMargin`, cost > 0 && defaultSelling > 0 ? Number((((defaultSelling - cost) / defaultSelling) * 100).toFixed(2)) : 30);
    } else {
      append({
        productId: pId,
        productVariantId: vId,
        name: formattedProduct.name,
        sku: formattedProduct.sku,
        orderedQty: 0,
        receivedQty: 1,
        freeQty: 0,
        unitCost: cost,
        wholesalePrice: formattedProduct.wholesale_price,
        profitMargin: cost > 0 && defaultSelling > 0 ? Number((((defaultSelling - cost) / defaultSelling) * 100).toFixed(2)) : 30,
        mrpPrice: formattedProduct.mrp_price,
        sellingPrice: defaultSelling,
        batchNumber: "",
        expiryDate: undefined,
      });
    }

    setIsCreateProductOpen(false);
    setPrefillProductData(null);
    setPendingItemIndex(null);
    setTimeout(() => document.getElementById("barcode-scanner-input")?.focus(), 100);
  };

  const processBarcodeMatch = (product) => {
    const currentItems = form.getValues("items");
    const pId = String(product.id || product.product_id);

    const existingIndex = currentItems.findIndex(item => String(item.productId) === pId);

    if (existingIndex > -1 && currentItems[existingIndex].productId !== "") {
      const qty = Number(currentItems[existingIndex].receivedQty) || 0;
      form.setValue(`items.${existingIndex}.receivedQty`, qty + 1);
    } else {
      const cost = Number(product.cost_price) || 0;
      // API returns selling price as 'price' for variants; fall back to selling_price for other shapes
      const sellingPrice = Number(product.price || product.selling_price) || 0;
      const mrpPrice = Number(product.mrp_price) || 0;
      const wholesalePrice = Number(product.wholesale_price) || 0;
      const profitMargin = cost > 0 && sellingPrice > 0
        ? Number((((sellingPrice - cost) / sellingPrice) * 100).toFixed(2))
        : 0;

      if (currentItems.length > 0 && !currentItems[currentItems.length - 1].productId) {
        const lastIdx = currentItems.length - 1;
        form.setValue(`items.${lastIdx}.productId`, pId);
        form.setValue(`items.${lastIdx}.productVariantId`, product.variant_id || null);
        form.setValue(`items.${lastIdx}.name`, product.name);
        form.setValue(`items.${lastIdx}.sku`, product.sku || product.barcode || "");
        form.setValue(`items.${lastIdx}.unitCost`, cost);
        form.setValue(`items.${lastIdx}.wholesalePrice`, wholesalePrice);
        form.setValue(`items.${lastIdx}.profitMargin`, profitMargin);
        form.setValue(`items.${lastIdx}.mrpPrice`, mrpPrice);
        form.setValue(`items.${lastIdx}.sellingPrice`, sellingPrice);
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
          wholesalePrice,
          profitMargin,
          mrpPrice,
          sellingPrice,
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
    // API returns selling price as 'price' for variants; fall back to selling_price for other shapes
    const sellingPrice = Number(product.price || product.selling_price) || 0;
    const mrpPrice = Number(product.mrp_price) || 0;
    const wholesalePrice = Number(product.wholesale_price) || 0;
    const profitMargin = cost > 0 && sellingPrice > 0
      ? Number((((sellingPrice - cost) / sellingPrice) * 100).toFixed(2))
      : 0;

    form.setValue(`items.${index}.productId`, product.product_id || product.id);
    form.setValue(`items.${index}.productVariantId`, product.variant_id || null);
    form.setValue(`items.${index}.name`, product.name);
    form.setValue(`items.${index}.sku`, product.sku || product.barcode || "");
    form.setValue(`items.${index}.unitCost`, cost);
    form.setValue(`items.${index}.wholesalePrice`, wholesalePrice);
    form.setValue(`items.${index}.profitMargin`, profitMargin);
    form.setValue(`items.${index}.mrpPrice`, mrpPrice);
    form.setValue(`items.${index}.sellingPrice`, sellingPrice);
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
    const cleanedItems = currentItems.filter(
      item => item.productId && String(item.productId).trim() !== ""
    );
    if (cleanedItems.length !== currentItems.length) {
      form.setValue("items", cleanedItems);
    }
    form.handleSubmit(onSubmit, (errors) => {
      console.error("Form validation errors:", errors);
      toast.error("Please fill all required fields correctly. Check the highlighted inputs.", {
        description: "Some rows may have missing quantities, costs, or other required details.",
      });
    })(e);
  };

  const onSubmit = (data) => {
    setSubmitData(data);
    setIsConfirmSubmitOpen(true);
  };

  async function processSubmit() {
    if (!submitData || isSubmitting) return;
    const data = submitData;
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

      if (currentDraftId) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/drafts/${currentDraftId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${session.accessToken}` }
          });
        } catch (e) {
          console.error("Failed to delete draft after submit", e);
        }
      }
      
      setIsConfirmSubmitOpen(false);
      toast.success("Direct GRN & PO Created Successfully");
      router.push("/purchase/grn");
    } catch (error) {
      console.error(error);
      setIsConfirmSubmitOpen(false);
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
                      <div className="flex items-center justify-between h-5">
                        <FormLabel className="text-sm font-medium">Supplier <span className="text-red-500">*</span></FormLabel>
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
                        <td className="px-3 py-3 relative align-top">
                          <ProductSelect
                            value={form.watch(`items.${index}.productVariantId`) || form.watch(`items.${index}.productId`)}
                            products={products}
                            autoFocus={index === fields.length - 1 && newItemAdded}
                            onChange={(val, product) =>
                              handleProductSelect(index, val, product)
                            }
                          />
                          {(() => {
                            const pId = form.watch(`items.${index}.productVariantId`) || form.watch(`items.${index}.productId`);
                            if (!pId) return null;
                            const p = products.find(prod => String(prod.id || prod.product_id) === String(pId));
                            if (!p) return null;
                            return (
                              <div className="mt-2 text-[11px] text-muted-foreground font-medium flex items-center justify-between px-1">
                                <div className="flex items-center gap-1.5">
                                  <span>Current Stock:</span>
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded font-bold",
                                    (p.stock_quantity || 0) <= 0 
                                      ? "bg-red-500/10 text-red-600 dark:text-red-400" 
                                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  )}>
                                    {p.stock_quantity || 0}
                                  </span>
                                </div>
                                {(p.barcode || p.sku) && (
                                  <span className="font-mono bg-muted/80 px-1.5 py-0.5 rounded flex items-center gap-1 text-muted-foreground opacity-100">
                                    <span className="text-[9px] uppercase tracking-wider font-sans">Barcode:</span>
                                    <span className="font-semibold text-foreground">{p.barcode || p.sku}</span>
                                  </span>
                                )}
                              </div>
                            );
                          })()}
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
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => {
                const isDirty = form.formState.isDirty;
                const currentItems = form.getValues().items;
                const hasAddedItems = currentItems.length > 1 || (currentItems.length === 1 && currentItems[0].productId !== "");
                
                if (isDirty && hasAddedItems) {
                  setIsNavigationWarningOpen(true);
                } else {
                  router.back();
                }
              }}
            >
              Cancel Protocol
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                fetchSavedDrafts();
                setIsDraftsModalOpen(true);
              }}
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <FileStack className="h-4 w-4" />
              View Drafts
            </Button>
            <Button 
              variant="secondary" 
              type="button" 
              onClick={handleSaveDraft}
              className="gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
            >
              <Save className="h-4 w-4" />
              Save Draft
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
      
      {/* View Drafts Modal */}
      <Dialog open={isDraftsModalOpen} onOpenChange={setIsDraftsModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-border/50 shadow-2xl bg-card">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/20">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileStack className="h-5 w-5 text-emerald-600" />
              Saved Drafts
            </DialogTitle>
            <DialogDescription className="text-xs mt-1 text-muted-foreground/80 font-medium">
              Recover a previously saved Direct GRN draft or delete drafts you no longer need.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto bg-muted/5">
            {isDraftsLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                <span className="text-sm text-muted-foreground font-medium">Loading drafts...</span>
              </div>
            ) : savedDraftsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                  <FileStack className="h-6 w-6 text-emerald-600/60" />
                </div>
                <p className="text-sm font-semibold text-foreground">No saved drafts found</p>
                <p className="text-xs text-muted-foreground">Drafts you save will appear here.</p>
              </div>
            ) : (
              savedDraftsList.map((draft) => (
                <div
                  key={draft.id}
                  className="w-full flex items-center justify-between p-4 bg-background border border-border/60 hover:border-emerald-500/30 rounded-xl transition-all shadow-sm"
                >
                  <div className="flex flex-col gap-1.5 overflow-hidden pr-4">
                    <span className="font-semibold text-foreground text-sm flex items-center gap-2 truncate">
                      {draft.summary || "Untitled Draft"}
                      {draft.isLocal && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">Local</span>}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(draft.updated_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-emerald-600 transition-colors"
                      onClick={() => {
                        router.push(`/purchase/grn/direct?draftId=${draft.id}${draft.isLocal ? '&local=true' : ''}`);
                        setIsDraftsModalOpen(false);
                      }}
                    >
                      Load Draft
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => handleDeleteDraft(draft.id, draft.isLocal)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!notFoundBarcode} onOpenChange={(open) => !open && setNotFoundBarcode(null)}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-border/50 shadow-2xl">
          <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/5 p-6 border-b border-border/40 text-center flex flex-col items-center pt-8">
            <div className="h-16 w-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mb-4 shadow-sm border border-rose-200 dark:border-rose-500/30">
              <Barcode className="h-8 w-8 text-rose-600 dark:text-rose-400" />
            </div>
            <DialogHeader className="flex flex-col items-center">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight">Product Not Found</DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground mt-2 max-w-[85%] text-center leading-relaxed">
                We couldn&apos;t find any item matching the scanned barcode <strong className="text-foreground bg-muted px-1.5 py-0.5 rounded font-mono mx-1">{notFoundBarcode}</strong> in your inventory system.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5 bg-card flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="outline"
              className="h-11 px-6 font-bold hover:bg-muted/50 transition-colors"
              onClick={() => setNotFoundBarcode(null)}
            >
              Cancel Scan
            </Button>
            <Button
              className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
              onClick={() => {
                const code = notFoundBarcode;
                setNotFoundBarcode(null);
                setPrefillProductData({ barcode: code, sku: code });
                setIsCreateProductOpen(true);
                setPendingItemIndex(null);
              }}
            >
              <Plus className="h-4 w-4" />
              Create Product Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Product Modal */}
      <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
        <DialogContent className="max-w-none sm:max-w-none w-[90vw] max-w-[1200px] h-[90vh] flex flex-col p-0 border-none rounded-xl shadow-2xl bg-background overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b border-border/40 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create New Product</DialogTitle>
              <DialogDescription className="text-xs">
                Add a new product to your inventory and include it in this GRN.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ProductForm
              isModal={true}
              onSuccess={handleProductCreated}
              prefillData={prefillProductData}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation Warning Modal */}
      <Dialog open={isNavigationWarningOpen} onOpenChange={setIsNavigationWarningOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl border-border/50 shadow-2xl">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 border-b border-border/40 text-center flex flex-col items-center pt-8">
            <div className="h-16 w-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mb-4 shadow-sm border border-amber-200 dark:border-amber-500/30">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogHeader className="flex flex-col items-center">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight">Unsaved Changes</DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground mt-2 max-w-[85%] text-center leading-relaxed">
                You have unsaved changes in your GRN form. If you leave now, this data will be lost. What would you like to do?
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5 bg-card flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full h-11 font-bold"
              onClick={() => {
                setIsNavigationWarningOpen(false);
                router.back();
              }}
            >
              Discard Changes & Leave
            </Button>
            <Button
              variant="secondary"
              className="w-full h-11 font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
              onClick={() => {
                handleSaveDraft();
                setIsNavigationWarningOpen(false);
                router.back();
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft & Leave
            </Button>
            <Button
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={() => {
                setIsNavigationWarningOpen(false);
                // Trigger form submission
                form.handleSubmit(onSubmit)();
              }}
            >
              <PackageCheck className="h-4 w-4 mr-2" />
              Confirm Logistics Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmSubmitOpen} onOpenChange={setIsConfirmSubmitOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden rounded-2xl border-border/50 shadow-2xl">
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-6 border-b border-border/40 text-center flex flex-col items-center pt-8">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mb-4 shadow-sm border border-blue-200 dark:border-blue-500/30">
              <PackageCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogHeader className="flex flex-col items-center">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight">Finalize Receipt?</DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground mt-2 max-w-[90%] text-center leading-relaxed">
                You are about to process a Direct GRN. 
                <div className="my-3 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[12px] font-bold uppercase tracking-wider">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Irreversible Action
                  </span>
                </div>
                This will immediately update inventory quantities and ledger balances. Please ensure all products and prices are strictly accurate before proceeding.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5 bg-card flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 font-bold"
              onClick={() => setIsConfirmSubmitOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={processSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Yes, Create GRN
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <CreateSupplierSheet
        open={isCreateSupplierOpen}
        onOpenChange={setIsCreateSupplierOpen}
        onSuccess={(newSupplier) => {
          setSuppliers(prev => [newSupplier, ...prev]);
          form.setValue("supplierId", String(newSupplier.id));
          setSupplierOpen(false);
        }}
      />
    </div>
  );
}