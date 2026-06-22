"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Save,
  PlusCircle,
  RefreshCw,
  Box,
  Settings2,
  LayoutGrid,
  Check,
  ChevronsUpDown,
  Plus,
  Trash2,
  Zap,
  History,
  Palette,
  QrCode,
  Camera,
  Upload,
  ArrowLeft,
  CircleDot,
  Search,
  Barcode,
  ChevronRight,

  SaveAll,
  X,
  Origami,
  DollarSign,
  Coins,
  Warehouse,
  FileText,
  Hash,
  Calendar,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultiSelect } from "@/components/ui/multi-select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";

import { ProductFormSkeleton } from "@/app/skeletons/products/product-form-skeleton";
import { ProductInsightSheet } from "../ProductInsightSheet";
import { BrandSheet } from "@/components/brand/brand-sheet";
import { MainCategorySheet } from "@/components/main-category/main-category-sheet";
import { SubCategorySheet } from "@/components/sub-category/sub-category-sheet";

import { toast } from "sonner";
import { useFormRestore } from "@/hooks/use-form-restore";

const formSchema = z.object({
  code: z.string().min(1, "Product code is required"),
  name: z.string().min(1, "Product name is required"),
  brand_id: z.string().optional().nullable(),
  main_category_id: z.string().optional().nullable(),
  sub_category_id: z.string().optional().nullable(),
  measurement_id: z.string().optional().nullable(),
  unit_id: z.string().min(1, "Unit is required"),
  container_id: z.string().optional().nullable(),
  description: z.string().optional().nullable(), // Allow null for API compatibility
  is_variant: z.boolean().default(false),
  is_active: z.boolean().default(true),
  product_attributes: z.array(z.string()).optional(),
  supplier_id: z.string().optional().nullable(),
  suppliers: z.array(z.string()).optional(),
  product_type: z.enum(['Finished Good', 'Raw Material', 'Semi-Finished', 'Service']).default('Finished Good'),
  can_be_manufactured: z.boolean().default(false),
  // Default Variant Fields
  price: z.string().optional(),
  wholesale_price: z.string().optional(),
  cost_price: z.string().optional(),
  mrp_price: z.string().optional(),
  stock_quantity: z.string().optional(),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
});

const SettingsCard = ({
  label,
  description,
  isActive,
  onToggle,
  icon: Icon,
}) => {
  const switchId = `setting-${label.replace(/\\s+/g, '-').toLowerCase()}`;
  return (
    <Label
      htmlFor={switchId}
      className={cn(
        "flex items-center justify-between rounded-md border p-3 transition-all duration-300 cursor-pointer",
        isActive
          ? "border-emerald-500/20 bg-emerald-500/3 shadow-sm ring-1 ring-emerald-500/10"
          : "border-border bg-muted/20 hover:bg-muted/40"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "size-8 rounded-md flex items-center justify-center border transition-all duration-300",
            isActive
              ? "bg-emerald-500/10 border-emerald-500/20 shadow-sm"
              : "bg-muted/50 border-border/40"
          )}
        >
          <Icon
            className={cn(
              "size-4 transition-colors duration-300",
              isActive ? "text-emerald-600" : "text-muted-foreground/40"
            )}
          />
        </div>
        <div className="space-y-0.5">
          <span className="text-sm font-semibold  text-foreground leading-none block">{label}</span>
          <p className="text-sm text-muted-foreground font-medium">{description}</p>
        </div>
      </div>
      <Switch
        id={switchId}
        checked={isActive}
        onCheckedChange={onToggle}
        className={cn(
          "scale-90",
          isActive && "ring-4 ring-emerald-500/10 shadow-lg"
        )}
      />
    </Label>
  );
}

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useAppSettings } from "@/app/hooks/useAppSettings";

// --- REUSABLE SEARCHABLE SELECT ---
const SearchableSelect = ({
  form,
  name,
  label,
  options,
  placeholder = "Select...",
  disabled = false,
  icon: Icon = CircleDot,
  tooltip = null,
  required = false,
  action = null,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-0.5">
          {(label || action) && (
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5">
                {label && (
                  <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white">
                    {label}
                    {required && <span className="text-red-500 ml-1 font-bold">*</span>}
                  </FormLabel>
                )}
                {tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3 text-slate-400 cursor-help hover:text-emerald-500 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] bg-slate-900 text-white border-none shadow-xl">
                      <p className="font-medium leading-relaxed">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {action && (
                <div className="-my-1">
                  {action}
                </div>
              )}
            </div>
          )}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  className={cn(
                    "h-9 w-full justify-between bg-background border-input px-3 rounded-md font-medium text-sm text-foreground transition-all hover:bg-accent hover:text-accent-foreground",
                    !field.value && "text-muted-foreground font-normal"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-muted-foreground opacity-70" />
                    <span className="truncate">
                      {field.value
                        ? options.find((item) => item.id === field.value)?.name
                        : placeholder}
                    </span>
                  </div>
                  <ChevronsUpDown className="size-3.5 text-muted-foreground opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 rounded-md" align="start">
              <Command>
                <CommandInput
                  placeholder={`Search ${label?.toLowerCase() || "options"}...`}
                  className="h-9"
                />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty className="py-6 text-sm text-center text-muted-foreground">
                    No results found.
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="none"
                      onSelect={() => {
                        form.setValue(name, null);
                        form.clearErrors(name);
                        setOpen(false);
                      }}
                      className="cursor-pointer text-rose-500 font-semibold"
                    >
                      <X className="mr-2 size-3.5" />
                      Clear Selection
                    </CommandItem>
                    {options.map((item) => (
                      <CommandItem
                        value={item.id}
                        key={item.id}
                        className="cursor-pointer"
                        onSelect={() => {
                          form.setValue(name, item.id);
                          form.clearErrors(name);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-3.5",
                            item.id === field.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-sm">{item.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage className="text-xs font-medium text-red-500/80 ml-0.5" />
        </FormItem>
      )}
    />
  );
};

// --- MAIN COMPONENT ---
// Accepts initialData prop for Edit Mode
export function ProductForm({ initialData = null, onSuccess = null, isModal = false, prefillData = null }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [insightData, setInsightData] = useState(null);
  const [isCheckingBarcode, setIsCheckingBarcode] = useState(false);
  const { data: session } = useSession();
  const { business } = useAppSettings();
  const router = useRouter();

  const isEditing = !!initialData; // Boolean flag to check mode

  // --- API DATA STATE ---
  const [options, setOptions] = useState({
    mainCategories: [],
    subCategories: [],
    brands: [],
    units: [],
    measurements: [],
    containers: [],
    attributes: [],
    suppliers: [], // Added suppliers option
  });

  // --- ATTRIBUTE QUICK-CREATE STATE ---
  const [showAttrDialog, setShowAttrDialog] = useState(false);
  const [newAttrName, setNewAttrName] = useState("");
  const [creatingAttr, setCreatingAttr] = useState(false);

  // --- DELETE CONFIRM STATE ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // --- SHEET STATES ---
  const [showBrandSheet, setShowBrandSheet] = useState(false);
  const [showMainCategorySheet, setShowMainCategorySheet] = useState(false);
  const [showSubCategorySheet, setShowSubCategorySheet] = useState(false);

  // --- IMAGE DROPZONE STATE ---
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    if (initialData?.image) {
      try {
        const parsed = JSON.parse(initialData.image);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setImagePreviews(parsed.map(p => `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${p.replace(/\\/g, '/')}`));
        }
      } catch (e) { }
    }
  }, [initialData]);

  const onDrop = useCallback((acceptedFiles) => {
    setImageFiles(acceptedFiles);
    setImagePreviews(acceptedFiles.map(file => URL.createObjectURL(file)));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 5,
  });

  const removeImage = (index, e) => {
    e.stopPropagation();
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- INIT FORM ---
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
        // --- EDIT MODE DEFAULTS ---
        code: initialData.code || "",
        name: initialData.name || "",
        description: initialData.description || "",
        // Ensure these are strings for the Select components (UUIDs)
        brand_id: initialData.brand_id || null,
        main_category_id: initialData.main_category_id || null,
        sub_category_id: initialData.sub_category_id || null,
        measurement_id: initialData.measurement_id || null,
        unit_id: initialData.unit_id || null,
        container_id: initialData.container_id || null,
        supplier_id: initialData.supplier_id || null,
        suppliers: initialData.suppliers?.map(s => s.id) || [],
        // Ensure booleans
        is_active: Boolean(initialData.is_active),
        product_attributes: initialData.attributes?.map(a => a.id) || [],
        product_type: initialData.product_type || "Finished Good",
        can_be_manufactured: Boolean(initialData.can_be_manufactured),
        price: initialData.variants?.[0]?.price?.toString() || "",
        wholesale_price: initialData.variants?.[0]?.wholesale_price?.toString() || "",
        cost_price: initialData.variants?.[0]?.cost_price?.toString() || "",
        mrp_price: initialData.variants?.[0]?.mrp_price?.toString() || "0",
        stock_quantity: (
          (initialData.variants?.[0]?.stocks?.length > 0
            ? initialData.variants[0].stocks.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0)
            : parseFloat(initialData.variants?.[0]?.stock_quantity || 0)) || 0
        ).toString(),
        batch_number: initialData.variants?.[0]?.batches?.[0]?.batch_number || "",
        expiry_date: initialData.variants?.[0]?.batches?.[0]?.expiry_date 
          ? new Date(initialData.variants[0].batches[0].expiry_date).toISOString().split('T')[0] 
          : "",
        sku: initialData.variants?.[0]?.sku || "",
        barcode: initialData.variants?.[0]?.barcode || "",
      }
      : {
        // --- CREATE MODE DEFAULTS ---
        code: "",
        name: "",
        brand_id: null,
        main_category_id: null,
        sub_category_id: null,
        measurement_id: null,
        unit_id: null,
        container_id: null,
        supplier_id: null,
        suppliers: [],
        description: "",
        is_variant: false,
        is_active: true,
        product_attributes: [],
        product_type: "Finished Good",
        can_be_manufactured: false,
        price: "",
        wholesale_price: "",
        cost_price: "",
        mrp_price: "",
        stock_quantity: "",
        batch_number: "",
        expiry_date: "",
        sku: "",
        barcode: prefillData?.barcode || "",
      },
  });

  // Pre-fill effect for modal usage
  useEffect(() => {
    if (prefillData && !loading) {
      if (prefillData.barcode) form.setValue("barcode", prefillData.barcode);
      if (prefillData.sku) form.setValue("sku", prefillData.sku);
      if (prefillData.name) form.setValue("name", prefillData.name);
    }
  }, [prefillData, loading, form]);

  const { clearSavedData } = useFormRestore(form);

  const [codePrefix, setCodePrefix] = useState(
    business?.name ? business.name.substring(0, 3).toUpperCase() : "PRD"
  );

  const generateCode = useCallback(() => {
    // Generate a 7-digit numeric code (e.g., 0000001)
    // Note: In a real sequence, this would fetch the last ID from the server.
    // For now, we generate a high-random numeric to avoid collisions while keeping the 7-digit format.
    const randomNum = Math.floor(1000000 + Math.random() * 8999999).toString();
    const newCode = randomNum.padStart(7, '0');

    form.setValue("code", newCode);
    form.clearErrors("code");
  }, [form]);

  // --- Barcode Insight Logic ---
  const checkBarcodeInsight = useCallback(async (barcode) => {
    if (!barcode || barcode.length < 3 || isEditing) return;

    try {
      setIsCheckingBarcode(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/barcode/${barcode}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          setInsightData(data.data);
          setInsightOpen(true);
        }
      }
    } catch (err) {
      console.error("Barcode check failed", err);
    } finally {
      setIsCheckingBarcode(false);
    }
  }, [session?.accessToken, isEditing]);

  // Auto-trigger insight when barcode is scanned/entered
  const barcodeValue = form.watch("barcode");
  useEffect(() => {
    if (!barcodeValue || barcodeValue.length < 3 || isEditing) return;

    const timer = setTimeout(() => {
      checkBarcodeInsight(barcodeValue);
    }, 500); // 500ms debounce to allow for scanning/typing

    return () => clearTimeout(timer);
  }, [barcodeValue, checkBarcodeInsight, isEditing]);

  const generateNumericBarcode = (length = 5) => {
    // Generate a numeric code (Scale-Ready 5-digit OR Standard 13-digit)
    let numeric = "";
    if (length === 5) {
      numeric = Math.floor(1000 + Math.random() * 9000).toString().padStart(5, '0');
    } else {
      // Generate a 13-digit numeric code for standard items
      // Using 890 as a generic prefix (common in retail)
      numeric = "890" + Math.floor(Math.random() * 1000000000).toString().padStart(10, '0');
    }
    form.setValue("barcode", numeric);
  };

  const hasVariants = form.watch("is_variant");
  const selectedMainCategory = form.watch("main_category_id");

  useEffect(() => {
    let isMounted = true;

    const fetchOptions = async () => {
      try {
        const [commonResponse, suppliersResponse, productsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/common/bulk-options`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.accessToken}`,
            },
          }),
          // Fetch current product count for auto-increment
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=1`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.accessToken}`,
            },
          })
        ]);

        const commonResult = await commonResponse.json();
        const suppliersResult = await suppliersResponse.json();
        const productsResult = await productsResponse.json();

        if (isMounted && commonResponse.ok) {
          const { data } = commonResult;
          setOptions({
            mainCategories: data.mainCategories || [],
            subCategories: data.subCategories || [],
            brands: data.brands || [],
            units: data.units || [],
            measurements: data.measurements || [],
            containers: data.containers || [],
            attributes: data.attributes || [],
            suppliers: suppliersResponse.ok ? suppliersResult.data : [],
          });

          // Intelligence Auto-increment logic
          if (!initialData) {
            const lastCode = data.lastProductCode;
            const orgName = data.organizationName || business?.name || "PRD";
            const orgPrefix = orgName.substring(0, 3).toUpperCase();

            let nextNumber = 1;

            if (lastCode && lastCode.includes('-')) {
              const parts = lastCode.split('-');
              const lastNum = parseInt(parts[parts.length - 1]);
              if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1;
              }
            } else if (productsResult.status === "success") {
              // Fallback to total count if code format is unexpected
              nextNumber = (productsResult.data.total || 0) + 1;
            }

            const nextCode = `${orgPrefix}-${nextNumber.toString().padStart(7, '0')}`;
            form.setValue("code", nextCode);
            
            // Auto-generate SKU in SKU-XXXXX format
            const randomSKU = Math.floor(10000 + Math.random() * 89999).toString();
            form.setValue("sku", `SKU-${randomSKU}`);
            
            setCodePrefix(orgPrefix);

            // Auto-select Base Unit (Pcs/Piece)
            if (data.units?.length > 0) {
              const defaultUnit = data.units.find(u => {
                const name = u.name.toLowerCase();
                return name === 'pcs' || name === 'piece' || name === 'pieces';
              });
              if (defaultUnit) {
                form.setValue("unit_id", defaultUnit.id);
                form.clearErrors("unit_id");
              }
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch form options:", error);
          toast.error("Network Error", {
            description: "Could not load dropdown options.",
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchOptions();
    }

    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleCreateAttribute = async () => {
    if (!newAttrName.trim() || !session?.accessToken) return;
    setCreatingAttr(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attributes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ name: newAttrName.trim() }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Attribute created");
        // Update local options
        setOptions(prev => ({
          ...prev,
          attributes: [...prev.attributes, result.data].sort((a, b) => a.name.localeCompare(b.name))
        }));
        // Select it
        const current = form.getValues("product_attributes") || [];
        form.setValue("product_attributes", [...current, result.data.id]);

        setShowAttrDialog(false);
        setNewAttrName("");
      } else {
        toast.error(result.message || "Failed to create attribute");
      }
    } catch (error) {
      toast.error("Network Error");
    } finally {
      setCreatingAttr(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!initialData?.id || !session?.accessToken) return;
    setDeleting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${initialData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        toast.success("Product deleted successfully");
        router.push("/products");
      } else {
        const result = await response.json();
        toast.error(result.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Network Error");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // --- FILTER SUB-CATEGORIES ---
  const filteredSubCategories = useMemo(() => {
    if (!selectedMainCategory) return [];
    return options.subCategories.filter(
      (sub) => sub.main_category_id === selectedMainCategory
    );
  }, [selectedMainCategory, options.subCategories]);

  // Reset Sub Category when Main Category changes (User Interaction Only)
  useEffect(() => {
    // Only reset if we are not loading initial data for the first time
    // We check if the current value matches the filtered list to allow initial load
    const currentSub = form.getValues("sub_category_id");
    if (currentSub && selectedMainCategory) {
      const isValid = filteredSubCategories.find(
        (sub) => sub.id === currentSub
      );
      if (!isValid && filteredSubCategories.length > 0 && !loading) {
        form.setValue("sub_category_id", null);
      }
    }
  }, [
    selectedMainCategory,
    form.setValue,
    form.getValues,
    filteredSubCategories,
    loading,
  ]);

  // --- SYNC PRODUCT TYPE WITH CATEGORY ---
  useEffect(() => {
    if (selectedMainCategory && !loading) {
      const category = options.mainCategories.find(c => c.id === selectedMainCategory);
      if (category) {
        const catName = category.name.toLowerCase();
        const currentType = form.getValues("product_type");

        if (catName.includes("raw material") && currentType !== "Raw Material") {
          form.setValue("product_type", "Raw Material");
          form.setValue("can_be_manufactured", false);
        } else if (catName.includes("finished good") && currentType !== "Finished Good") {
          form.setValue("product_type", "Finished Good");
          form.setValue("can_be_manufactured", true);
        } else if (catName.includes("semi-finished") && currentType !== "Semi-Finished") {
          form.setValue("product_type", "Semi-Finished");
          form.setValue("can_be_manufactured", false);
        } else if (catName.includes("service") && currentType !== "Service") {
          form.setValue("product_type", "Service");
          form.setValue("can_be_manufactured", false);
        }
      }
    }
  }, [selectedMainCategory, options.mainCategories, loading]);

  // --- SUBMIT HANDLER ---
  const handleServerSubmit = async (data, resetAfter = false) => {
    setSubmitting(true);

    if (!session?.accessToken) {
      toast.error("Authentication Error");
      setSubmitting(false);
      return;
    }

    try {
      // Cleanup: Convert any empty strings for IDs to null to avoid FK constraint errors
      const sanitizeId = (id) => (id === "" ? null : id);

      const payload = {
        ...data,
        brand_id: sanitizeId(data.brand_id),
        main_category_id: sanitizeId(data.main_category_id),
        sub_category_id: sanitizeId(data.sub_category_id),
        measurement_id: sanitizeId(data.measurement_id),
        unit_id: sanitizeId(data.unit_id),
        container_id: sanitizeId(data.container_id),
        supplier_id: sanitizeId(data.supplier_id),
      };

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined) {
          if (Array.isArray(payload[key])) {
            payload[key].forEach(item => formData.append(`${key}[]`, item));
          } else {
            formData.append(key, payload[key]);
          }
        }
      });

      if (imageFiles.length > 0) {
        imageFiles.forEach(file => {
          formData.append('images[]', file);
        });
      } else if (imagePreviews.length === 0 && initialData?.image) {
        formData.append('image', null); // explicit clear
      }

      // --- DYNAMIC URL & METHOD ---
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/products`;

      const method = isEditing ? "PUT" : "POST"; // Use PUT or PATCH based on API

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          `Failed to ${isEditing ? "update" : "create"} product`
        );
      }

      toast.success(isEditing ? "Product Updated" : "Product Created", {
        description: `${data.name} has been ${isEditing ? "updated" : "added"
          }.`,
        duration: 4000,
        icon: "✅",
      });

      if (onSuccess) {
        onSuccess(result.data);
        return;
      }

      if (resetAfter && !isEditing) {
        // Create Mode: Reset and stay
        clearSavedData();
        form.reset({
          code: "",
          name: "",
          description: "",
          is_variant: false,
          is_active: true,
          brand_id: data.brand_id,
          main_category_id: data.main_category_id,
          sub_category_id: data.sub_category_id,
          measurement_id: data.measurement_id,
          unit_id: data.unit_id,
          container_id: data.container_id,
          price: "",
          wholesale_price: "",
          cost_price: "",
          mrp_price: "",
          stock_quantity: "",
          sku: "",
          barcode: "",
        });
        generateCode();
      } else {
        // Edit Mode OR Create & Exit: Go back
        clearSavedData();
        router.push("/products");
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("Error", {
        description: error.message || "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ProductFormSkeleton />;
  }

  return (
    <div className={cn(
      "bg-background",
      !isModal ? "min-h-screen p-4 md:px-8 md:pt-4 md:pb-12" : "p-0"
    )}>
      {!isModal && (
        <div className="fixed inset-0 -z-10 h-full w-full bg-background">
          <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(0,0,0,0))]"></div>
        </div>
      )}
      <Form {...form}>
        <form className="max-w-[1400px] mx-auto">

          {/* Header Section */}
          {!isModal && (
            <div className="mb-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm backdrop-blur-xl sticky top-2 z-30 mx-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
                  <Box className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-base font-bold text-slate-900 dark:text-white  leading-none">
                    {isEditing ? (
                      `Edit ${form.watch("product_type") === "Raw Material" ? "Material" : "Product"}`
                    ) : (
                      `New ${form.watch("product_type") === "Raw Material" ? "Material" : "Product"}`
                    )}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {isEditing
                      ? `Update ${form.watch("product_type")?.toLowerCase() || "product"} specifications`
                      : `Add a new ${form.watch("product_type")?.toLowerCase() || "item"} to your inventory`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Utility Hub */}
                <div className="flex items-center gap-1.5 px-1.5 py-1 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-md mr-2">
                  {/* <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all text-slate-400 hover:text-emerald-600"
                    onClick={() => form.reset()}
                    title="Reset Form"
                  >
                    <RefreshCw className="size-4" />
                  </Button> */}
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-sm transition-all text-slate-400 hover:text-red-500"
                      onClick={() => setShowDeleteConfirm(true)}
                      title="Delete Product"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                <div className="flex gap-2.5 ml-1">
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting}
                      onClick={form.handleSubmit((d) => handleServerSubmit(d, true))}
                      className="h-9 px-4 gap-2 border-emerald-500/10 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all rounded-md text-sm font-semibold"
                    >
                      {submitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <SaveAll className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden md:inline">Save & continue</span>
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    onClick={form.handleSubmit((d) => handleServerSubmit(d, false))}
                    className="px-6 h-9 rounded-md text-sm font-semibold"
                  >
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="ml-2">{isEditing ? "Save Changes" : `Save ${form.watch("product_type") === "Raw Material" ? "Material" : "Product"}`}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

          <div className={cn(
            "grid grid-cols-1 lg:grid-cols-3 gap-6",
            isModal ? "p-6 pt-2 pb-12" : ""
          )}>
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Card 1: Identity */}
              <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                <CardHeader className="py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Box className="size-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold ">Main details</CardTitle>
                      <p className="text-xs text-slate-500 font-medium leading-none mt-0.5">
                        {form.watch("product_type") === "Raw Material" ? "Material" : "Product"} identification
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="code"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="space-y-0.5">
                          <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">
                            {form.watch("product_type") === "Raw Material" ? "Material" : "Product"} code <span className="text-red-500 font-bold">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                placeholder={`${codePrefix}-0000001`}
                                className="h-9 bg-slate-50 dark:bg-slate-900/50 border-border rounded-md px-3 font-bold text-sm text-emerald-600 shadow-none cursor-not-allowed"
                                disabled
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs font-medium text-red-500/80 ml-0.5 " />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="name"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="space-y-0.5">
                          <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">
                            {form.watch("product_type") === "Raw Material" ? "Material" : "Product"} name <span className="text-red-500 font-bold">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Wireless Headphones"
                              className="h-9 bg-background border-border rounded-md px-3 font-medium text-sm text-foreground shadow-sm focus:ring-emerald-500/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs font-medium text-red-500/80 ml-0.5 " />
                        </FormItem>
                      )}
                    />
                    {!hasVariants && (
                      <FormField
                        name="barcode"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">Barcode <span className="text-muted-foreground font-normal">(Scannable)</span></FormLabel>
                            <FormControl>
                              <div className="flex gap-2 group/barcode">
                                <div className="relative flex-1">
                                  <Barcode className={cn("absolute left-3 top-2.5 h-4 w-4 text-muted-foreground", isCheckingBarcode && "animate-pulse text-emerald-500")} />
                                  <Input
                                    placeholder="Scan or enter barcode"
                                    className="pl-9 h-9"
                                    {...field}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateNumericBarcode(5)}
                                  className="h-9 px-3 rounded-md bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-600 shadow-sm transition-all flex items-center gap-2 font-semibold"
                                  title="Generate 5-digit code for weighing scales"
                                >
                                  <RefreshCw className="size-3.5" />
                                  <span className="text-xs">Scale</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateNumericBarcode(13)}
                                  className="h-9 px-3 rounded-md bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 text-blue-600 shadow-sm transition-all flex items-center gap-2 font-semibold"
                                  title="Generate standard 13-digit barcode"
                                >
                                  <Zap className="size-3.5" />
                                  <span className="text-xs">Std</span>
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs font-medium text-red-500/80 ml-0.5 " />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                    {!hasVariants && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          name="sku"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="space-y-0.5">
                              <FormLabel className="text-sm font-semibold">SKU <span className="text-muted-foreground font-normal">(Internal Code)</span></FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="e.g. SKU-00001 (auto if empty)" className="pl-9 h-9" {...field} />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const random = Math.floor(10000 + Math.random() * 89999).toString();
                                      form.setValue("sku", `SKU-${random}`);
                                    }}
                                    className="h-9 px-3 rounded-md bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 shadow-sm transition-all flex items-center gap-2 font-semibold"
                                    title="Generate unique SKU"
                                  >
                                    <RefreshCw className="size-3.5" />
                                    <span className="text-xs">Gen</span>
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-xs font-medium text-red-500/80 ml-0.5 " />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  <FormField
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="space-y-0.5">
                        <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              form.watch("product_type") === "Raw Material"
                                ? "Details about this raw material/ingredient..."
                                : "Detailed product features and specifications..."
                            }
                            className="min-h-[80px] bg-background border-border rounded-md px-3 py-2 font-medium text-sm text-foreground shadow-sm focus:ring-emerald-500/20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs font-medium text-red-500/80 ml-0.5 " />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Card 2: Classification & Specs */}
              <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                <CardHeader className="py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <LayoutGrid className="size-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold ">Classification</CardTitle>
                      <p className="text-xs text-slate-500 font-medium leading-none mt-0.5">Categorization & Measurements</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SearchableSelect
                      form={form}
                      name="brand_id"
                      label="Brand"
                      options={options.brands}
                      placeholder="Select Brand"
                      icon={Palette}
                      action={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBrandSheet(true)}
                          className="h-5 px-1.5 shrink-0 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-[10px] font-semibold flex items-center gap-1"
                          title="Create new brand"
                        >
                          <Plus className="h-3 w-3" />
                          New
                        </Button>
                      }
                    />
                    {!(business?.business_type === 'Manufacturing' && form.watch("product_type") === 'Finished Good') && (
                      <SearchableSelect
                        form={form}
                        name="supplier_id"
                        label="Main Supplier"
                        options={options.suppliers}
                        placeholder="Select Supplier"
                        icon={History}
                      />
                    )}
                  </div>

                  {business?.business_type === 'Manufacturing' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <FormField
                        control={form.control}
                        name="product_type"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold">Product Type</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                {['Finished Good', 'Raw Material', 'Semi-Finished', 'Service'].map((type) => (
                                  <Button
                                    key={type}
                                    type="button"
                                    variant={field.value === type ? "primary" : "outline"}
                                    size="sm"
                                    className="text-[10px] h-7 px-2"
                                    onClick={() => {
                                      field.onChange(type);
                                      // Sync logic:
                                      // 1. Finished Goods are usually manufacturable
                                      if (type === 'Finished Good') {
                                        form.setValue("can_be_manufactured", true);
                                      } else {
                                        form.setValue("can_be_manufactured", false);
                                      }

                                      // 2. Try to auto-select a matching category if it exists
                                      const matchingCategory = options.mainCategories.find(
                                        cat => cat.name.toLowerCase().includes(type.toLowerCase()) ||
                                          type.toLowerCase().includes(cat.name.toLowerCase())
                                      );
                                      if (matchingCategory) {
                                        form.setValue("main_category_id", matchingCategory.id);
                                      }
                                    }}
                                  >
                                    {type}
                                  </Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("product_type") === 'Finished Good' && (
                        <FormField
                          control={form.control}
                          name="can_be_manufactured"
                          render={({ field }) => (
                            <FormItem className="space-y-0.5">
                              <FormLabel className="text-sm font-semibold">Production Status</FormLabel>
                              <FormControl>
                                <SettingsCard
                                  label="Can be Manufactured"
                                  description="Enable internal production for this item"
                                  isActive={field.value}
                                  onToggle={field.onChange}
                                  icon={Origami}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                  {!(business?.business_type === 'Manufacturing' && form.watch("product_type") === 'Finished Good') && (
                    <FormField
                      control={form.control}
                      name="suppliers"
                      render={({ field }) => (
                        <FormItem className="space-y-0.5">
                          <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">Supplier network</FormLabel>
                          <FormControl>
                            <MultiSelect
                              className="bg-background"
                              selected={field.value?.map(id => {
                                const s = options.suppliers.find(op => op.id === id);
                                return s ? { label: s.name, value: s.id } : null;
                              }).filter(Boolean) || []}
                              options={options.suppliers.map(s => ({ label: s.name, value: s.id }))}
                              onChange={(newItems) => {
                                field.onChange(newItems.map(item => item.value));
                              }}
                              placeholder="Select network suppliers..."
                            />
                          </FormControl>
                          <FormMessage className="text-xs font-medium text-red-500/80 ml-0.5" />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <SearchableSelect
                      form={form}
                      name="main_category_id"
                      label="Main Category"
                      options={options.mainCategories}
                      placeholder="Select Category"
                      icon={LayoutGrid}
                      action={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMainCategorySheet(true)}
                          className="h-5 px-1.5 shrink-0 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-[10px] font-semibold flex items-center gap-1"
                          title="Create new main category"
                        >
                          <Plus className="h-3 w-3" />
                          New
                        </Button>
                      }
                    />
                    <SearchableSelect
                      form={form}
                      name="sub_category_id"
                      label="Sub Category"
                      options={filteredSubCategories}
                      placeholder={
                        selectedMainCategory
                          ? "Select Sub Category"
                          : "Select Main Category First"
                      }
                      disabled={!selectedMainCategory}
                      icon={CircleDot}
                      action={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSubCategorySheet(true)}
                          disabled={!selectedMainCategory}
                          className="h-5 px-1.5 shrink-0 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-[10px] font-semibold flex items-center gap-1"
                          title="Create new sub category"
                        >
                          <Plus className="h-3 w-3" />
                          New
                        </Button>
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <SearchableSelect
                      form={form}
                      name="unit_id"
                      label="Base Unit"
                      options={options.units}
                      placeholder="e.g. Piece"
                      icon={QrCode}
                      tooltip="How you count this product (e.g. Piece, Box). Required for all items."
                      required
                    />
                    <SearchableSelect
                      form={form}
                      name="measurement_id"
                      label="Measurement"
                      options={options.measurements}
                      placeholder="e.g. Kg"
                      icon={Palette}
                      tooltip="Used for items sold by weight or volume (e.g. Kg, Liter). Optional for simple pieces."
                    />
                    <SearchableSelect
                      form={form}
                      name="container_id"
                      label="Container Type"
                      options={options.containers}
                      placeholder="e.g. Box"
                      icon={Box}
                      tooltip="The physical packaging of the item (e.g. Glass Bottle, Bag). Optional."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card: Pricing & Inventory (Shown only if no variants) */}
              {!hasVariants && (
                <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                  <CardHeader className="py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <DollarSign className="size-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold ">Pricing & Inventory</CardTitle>
                        <p className="text-xs text-slate-500 font-medium leading-none mt-0.5">Financial details & initial stock</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField
                        name="cost_price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold">Cost Price</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Coins className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" step="0.01" placeholder="0.00" className="pl-9 h-9" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="mrp_price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold">MRP Price</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" step="0.01" placeholder="0.00" className="pl-9 h-9" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-emerald-600">Selling Price</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                                <Input type="number" step="0.01" placeholder="0.00" className="pl-9 h-9 border-emerald-500/20 focus-visible:ring-emerald-500" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="wholesale_price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold">Wholesale Price</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Zap className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" step="0.01" placeholder="0.00" className="pl-9 h-9" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <FormField
                        name="stock_quantity"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold">Opening Stock</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Warehouse className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" placeholder="0" className="pl-9 h-9" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">Initial quantity available in your branch.</FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="batch_number"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold">Batch Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="BT-AUTO-GEN" className="pl-9 h-9 uppercase font-mono" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">Leave empty for auto-generation.</FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="expiry_date"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold">Expiry Date</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="date" className="pl-9 h-9" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">Date of product expiration.</FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Card 3: Attribute Configuration */}
              {hasVariants && (
                <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                  <CardHeader className="py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Settings2 className="size-3.5 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold ">Attributes</CardTitle>
                          <p className="text-xs text-slate-500 font-medium leading-none mt-0.5">Product variations</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-md border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 font-semibold text-xs transition-all px-3"
                        onClick={() => setShowAttrDialog(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add new
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      {options.attributes.map((attr) => (
                        <div
                          key={attr.id}
                          className={cn(
                            "group flex items-center justify-between border rounded-md p-2.5 cursor-pointer transition-all duration-300",
                            form.watch("product_attributes")?.includes(attr.id)
                              ? "bg-emerald-500/10 border-emerald-500/20 shadow-sm"
                              : "bg-background border-slate-100 hover:bg-muted/20"
                          )}
                          onClick={() => {
                            const current = form.getValues("product_attributes") || [];
                            const updated = current.includes(attr.id)
                              ? current.filter(id => id !== attr.id)
                              : [...current, attr.id];
                            form.setValue("product_attributes", updated);
                          }}
                        >
                          <span className={cn(
                            "text-sm font-semibold  transition-colors",
                            form.watch("product_attributes")?.includes(attr.id) ? "text-emerald-700" : "text-slate-500 group-hover:text-foreground"
                          )}>{attr.name}</span>
                          <div className={cn(
                            "size-4.5 rounded-md shadow-sm border flex items-center justify-center transition-all",
                            form.watch("product_attributes")?.includes(attr.id) ? "bg-emerald-500 border-emerald-500/20 text-white scale-110" : "bg-muted/50 border-border/40"
                          )}>
                            {form.watch("product_attributes")?.includes(attr.id) && <Check className="size-3" />}
                          </div>
                        </div>
                      ))}
                    </div>
                    {options.attributes.length === 0 && (
                      <div className="text-center py-10 rounded-2xl border-2 border-dashed border-border/40 bg-muted/10">
                        <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/40">
                          <Settings2 className="size-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm font-bold text-foreground">No attributes available</p>
                        <p className="text-sm text-muted-foreground mt-1">Add attributes to enable product variants</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Attribute Creation Dialog */}
              <Dialog open={showAttrDialog} onOpenChange={setShowAttrDialog}>
                <DialogContent className="sm:max-w-md rounded-3xl border-border bg-background/95 backdrop-blur-xl shadow-2xl">
                  <DialogHeader>
                    <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-sm shadow-emerald-500/10">
                      <Settings2 className="size-6 text-emerald-600" />
                    </div>
                    <DialogTitle className="text-xl font-semibold ">New Attribute</DialogTitle>
                    <DialogDescription className="text-sm font-medium text-muted-foreground">
                      Add a new characteristic for variant management
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    <FormItem className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">Attribute name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Storage Capacity"
                          className="h-9 bg-background border-border rounded-md px-3 font-medium text-sm text-foreground shadow-sm focus:ring-emerald-500/20"
                          value={newAttrName}
                          onChange={(e) => setNewAttrName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateAttribute();
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 px-4 rounded-md font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                      onClick={() => setShowAttrDialog(false)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      type="button"
                      className="h-9 px-6 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-sm transition-all active:scale-95"
                      onClick={handleCreateAttribute}
                      disabled={creatingAttr || !newAttrName.trim()}
                    >
                      {creatingAttr ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                      ) : (
                        <Check className="w-3.5 h-3.5 mr-2" />
                      )}
                      Save attribute
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>              {/* Card 4: Product Images (Asset Hub) */}
              <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                <CardHeader className="py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Camera className="size-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold ">Product images</CardTitle>
                      <p className="text-xs text-slate-500 font-medium leading-none mt-0.5">Gallery assets</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "flex flex-col items-center justify-center py-6 rounded-md border-2 border-dashed transition-all cursor-pointer",
                      isDragActive ? "border-emerald-500 bg-emerald-500/5" : "border-border bg-muted/10 hover:bg-muted/20"
                    )}
                  >
                    <input {...getInputProps()} />

                    {imagePreviews.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5 px-4 justify-center">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative group w-20 h-20 rounded-md border border-border overflow-hidden bg-background shadow-sm">
                            <img src={preview} alt="preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="size-7 rounded-full"
                                onClick={(e) => removeImage(idx, e)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="size-10 rounded-md bg-muted flex items-center justify-center mx-auto mb-3 border border-border">
                          <Upload className="size-5 text-muted-foreground/60" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {isDragActive ? "Drop images here..." : "Drag & drop images here"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 px-8 text-center leading-tight">
                          or click to browse
                        </p>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-4 border-t border-border mt-5">
                    {[
                      "Primary image will be the default view for all variants",
                      "Supports high-fidelity formats: JPG, PNG, WebP",
                      "Recommended minimum resolution: 1000x1000px"
                    ].map((hint, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="size-1 rounded-full bg-emerald-500/50" />
                        <span className="text-xs font-medium text-muted-foreground">{hint}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4">
              {/* Status & Protocol */}
              <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                <CardHeader className="py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <History className="size-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold ">Status & protocol</CardTitle>
                      <p className="text-xs text-slate-500 font-medium leading-none mt-0.5">Control panel</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <SettingsCard
                        label="Active Status"
                        description="Available in POS"
                        icon={Zap}
                        isActive={field.value}
                        onToggle={field.onChange}
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_variant"
                    render={({ field }) => (
                      <SettingsCard
                        label="Has Variants"
                        description="Size, Color, etc."
                        icon={Palette}
                        isActive={field.value}
                        onToggle={field.onChange}
                      />
                    )}
                  />
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Modal Footer (Sticky) */}
          {isModal && (
            <div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex items-center justify-end gap-3 z-50">
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={form.handleSubmit((d) => handleServerSubmit(d, true))}
                  className="h-10 px-6 gap-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 transition-all rounded-xl text-sm font-bold"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveAll className="w-4 h-4" />}
                  Save & continue
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                disabled={submitting}
                onClick={form.handleSubmit((d) => handleServerSubmit(d, false))}
                className="px-8 h-10 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEditing ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          )}
        </form>
      </Form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl border-border bg-background/95 backdrop-blur-xl shadow-2xl p-6">
          <AlertDialogHeader>
            <div className="size-12 rounded-md bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4 shadow-sm mx-auto">
              <Trash2 className="size-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-lg font-bold  text-center">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground text-center leading-relaxed">
              This action cannot be undone. This will permanently delete the
              product and all its variants from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-6">
            <AlertDialogCancel disabled={deleting} className="h-9 px-6 rounded-md font-semibold text-sm border-border hover:bg-slate-50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="h-9 px-6 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 border-none"
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 mr-2" />
              )}
              Confirm delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ProductInsightSheet
        isOpen={insightOpen}
        onClose={() => setInsightOpen(false)}
        insightData={insightData}
      />
      <BrandSheet
        open={showBrandSheet}
        onOpenChange={setShowBrandSheet}
        session={session}
        onSuccess={(newBrand) => {
          setOptions((prev) => ({ ...prev, brands: [...prev.brands, newBrand] }));
          form.setValue("brand_id", newBrand.id);
        }}
      />
      <MainCategorySheet
        open={showMainCategorySheet}
        onOpenChange={setShowMainCategorySheet}
        session={session}
        onSuccess={(newMainCategory) => {
          setOptions((prev) => ({ ...prev, mainCategories: [...prev.mainCategories, newMainCategory] }));
          form.setValue("main_category_id", newMainCategory.id);
        }}
      />
      <SubCategorySheet
        open={showSubCategorySheet}
        onOpenChange={setShowSubCategorySheet}
        session={session}
        onSuccess={(newSubCategory) => {
          setOptions((prev) => ({ ...prev, subCategories: [...prev.subCategories, newSubCategory] }));
          form.setValue("sub_category_id", newSubCategory.id);
        }}
      />
    </div>
  );
}
