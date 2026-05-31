"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Save,
  PlusCircle,
  RefreshCw,
  Box,
  ArrowLeft,
  QrCode,
  Search,
  Barcode,
  Upload,
  X,
  History,
  ImagePlus,
  Check,
  ChevronRight,
  Palette,
  Camera,
  Zap,
  Boxes,
  Trash2,
  Edit3,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useFormRestore } from "@/hooks/use-form-restore";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/hooks/useCurrency";
import { ProductFormSkeleton } from "@/app/skeletons/products/product-form-skeleton";
import { Badge } from "@/components/ui/badge";
import { ProductInsightSheet } from "../../products/ProductInsightSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// --- HELPERS ---
const getInitials = (name) => {
  if (!name) return "P";
  const words = name.trim().split(/\s+/);
  if (words.length > 1) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getProductImageUrl = (imagePath) => {
  if (!imagePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/v[0-9]+/, "");
  try {
    const images = JSON.parse(imagePath);
    const path = Array.isArray(images) && images.length > 0 ? images[0] : imagePath;
    return `${baseUrl}/${path}`;
  } catch (e) {
    return `${baseUrl}/${imagePath}`;
  }
};

// --- ZOD SCHEMA ---
const variantFormSchema = z.object({
  product_id: z.string().min(1, "Parent Product is required"),
  sku: z.string().min(1, "SKU is required"),
  code: z.string().min(1, "Code is required"),
  barcode: z.string().optional(),
  price: z.coerce.number().min(0).default(0),
  wholesale_price: z.coerce.number().min(0).default(0),
  cost_price: z.coerce.number().min(0).default(0),
  mrp_price: z.coerce.number().min(0).default(0),
  stock_quantity: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
  images: z.any().optional(),
  attributes: z.array(z.object({
    attribute_id: z.string(),
    name: z.string(),
    value: z.string()
  })).optional()
});

// --- COMPONENT: EXISTING VARIANTS LIST ---
const ExistingVariantsList = ({ variants, detailedParent, onDelete, onEdit, currentEditingId }) => {
  const { formatCurrency } = useCurrency();

  if (!variants || variants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl m-6 group hover:border-emerald-500/30 transition-all duration-500">
        <div className="flex items-center justify-center size-14 rounded-2xl bg-white dark:bg-slate-800 mb-6 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-500">
          <Box className="size-7 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">No variants created yet</h3>
        <p className="text-sm text-slate-500 font-medium max-w-[200px] leading-relaxed">
          Start by selecting a product and defining its properties above.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[450px] w-full px-3 mt-2 py-2">
      <div className="grid grid-cols-1 gap-4 pb-6">
        {variants.map((v) => (
          <div
            key={v.id}
            className="group relative p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-zinc-900/50 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
          >
            {/* Hover Actions Overlay */}
            {currentEditingId === v.id ? (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold py-0.5 px-2">
                  Editing Now
                </Badge>
              </div>
            ) : (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-5px] group-hover:translate-y-0 z-10">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(v)}
                  className="size-8 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg shadow-sm transition-all"
                >
                  <Edit3 className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(v.id)}
                  className="size-8 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg shadow-sm transition-all"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )}

            <div className="flex flex-col h-full gap-3">
              <div className="flex flex-col min-w-0 pr-16">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                  {v.sku}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
                    {detailedParent?.name || "Product"}
                  </span>
                  <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {v.code}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {v.attribute_values?.map((av, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-[10px] px-2 py-0 h-5 font-bold bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-md"
                  >
                    {av.value}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50">
                <Badge
                  variant={v.is_active ? "default" : "secondary"}
                  className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border-none tracking-widest",
                    v.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  )}
                >
                  {v.is_active ? "Active" : "Inactive"}
                </Badge>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(v.selling_price || 0)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

// --- COMPONENT: SETTINGS CARD ---
const SettingsCard = ({
  label,
  description,
  isActive,
  onToggle,
  icon: Icon,
}) => {
  const switchId = `setting-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <Label
      htmlFor={switchId}
      className={cn(
        "flex items-center justify-between rounded-md border p-5 transition-all duration-300 cursor-pointer",
        isActive
          ? "border-emerald-500/20 bg-emerald-500/3 shadow-sm ring-1 ring-emerald-500/10"
          : "border-border bg-muted/20 hover:bg-muted/40"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "size-10 rounded-md flex items-center justify-center border transition-all duration-300",
            isActive
              ? "bg-emerald-500/10 border-emerald-500/20 shadow-sm shadow-emerald-500/10"
              : "bg-muted border-border/40"
          )}
        >
          <Icon
            className={cn(
              "size-4.5 transition-colors duration-300",
              isActive ? "text-emerald-600" : "text-muted-foreground/40"
            )}
          />
        </div>
        <div className="space-y-1">
          <span className="text-sm font-bold  text-foreground leading-tight block">{label}</span>
          <p className="text-xs text-muted-foreground font-medium">{description}</p>
        </div>
      </div>
      <Switch
        id={switchId}
        checked={isActive}
        onCheckedChange={onToggle}
        className={cn(
          isActive && "ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/10"
        )}
      />
    </Label>
  );
};

export function ProductVariantForm({ initialData = null }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [insightData, setInsightData] = useState(null);
  const [isCheckingBarcode, setIsCheckingBarcode] = useState(false);
  const { currency } = useCurrency();
  const [parentProducts, setParentProducts] = useState([]);
  const [detailedParent, setDetailedParent] = useState(null);
  const [currentEditingId, setCurrentEditingId] = useState(initialData?.id || null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Multiple Image State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const { data: session } = useSession();
  const router = useRouter();
  
  // Dynamic isEditing based on whether we have a currentEditingId
  const isEditing = !!currentEditingId;

  const form = useForm({
    resolver: zodResolver(variantFormSchema),
    defaultValues: initialData
      ? { ...initialData, images: [] }
      : {
        product_id: "",
        sku: `SKU-${Math.floor(10000 + Math.random() * 89999)}`,
        code: "",
        barcode: "",
        price: 0,
        wholesale_price: 0,
        cost_price: 0,
        stock_quantity: 0,
        description: "",
        is_active: true,
        is_default: false,
        images: [],
        attributes: [],
      },
  });

  const { clearSavedData } = useFormRestore(form);

  const selectedProductId = form.watch("product_id");

  // Fetch Parent Products
  useEffect(() => {
    let isMounted = true;
    const fetchList = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list`,
          {
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          }
        );
        const json = await res.json();
        if (isMounted && json.data) setParentProducts(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (session?.accessToken) fetchList();
    return () => {
      isMounted = false;
    };
  }, [session]);

  // Fetch Parent Details when product is selected
  const fetchParentDetails = useCallback(async (id) => {
    if (!id) {
      setDetailedParent(null);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${id}`,
        {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      );
      const json = await res.json();
      if (json.status === "success") {
        setDetailedParent(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchParentDetails(selectedProductId);
  }, [selectedProductId, fetchParentDetails]);

  // Sync attributes when detailedParent changes
  useEffect(() => {
    if (detailedParent && detailedParent.attributes) {
      const currentAttrs = form.getValues("attributes") || [];
      const newAttrs = detailedParent.attributes.map(attr => {
        const existing = currentAttrs.find(a => a.attribute_id === attr.id);
        return {
          attribute_id: attr.id,
          name: attr.name,
          value: existing ? existing.value : ""
        };
      });
      form.setValue("attributes", newAttrs);
    }
  }, [detailedParent, form]);

  // --- DRAG & DROP IMAGE HANDLERS ---
  const onDrop = (acceptedFiles) => {
    const updatedFiles = [...selectedFiles, ...acceptedFiles].slice(0, 10);
    setSelectedFiles(updatedFiles);
    form.setValue("images", updatedFiles);

    const newPreviews = acceptedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const removeImage = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
    form.setValue("images", updatedFiles);
  };

  // Populate image previews for existing variant
  useEffect(() => {
    if (initialData && initialData.image) {
      try {
        const images = JSON.parse(initialData.image);
        if (Array.isArray(images)) {
          setImagePreviews(images.map(path => `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${path}`));
        } else {
          setImagePreviews([`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${initialData.image}`]);
        }
      } catch (e) {
        // If not JSON, it's a single path string
        setImagePreviews([`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${initialData.image}`]);
      }
    }
  }, [initialData]);

  const generateUniqueSKU = () => {
    const random = Math.floor(10000 + Math.random() * 89999).toString();
    const sku = `SKU-${random}`;
    form.setValue("sku", sku);
  };

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
    }, 500); // 500ms debounce
    
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

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm("Are you sure you want to delete this variant?")) return;
    if (!detailedParent?.id) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${detailedParent.id}/variants/${variantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      toast.success("Variant deleted successfully");
      // Refresh product details to update list
      fetchParentDetails(detailedParent.id);
    } catch (err) {
      toast.error(err.message || "Failed to delete variant");
    }
  };

  const handleEditExistingVariant = (variant) => {
    // Set editing ID
    setCurrentEditingId(variant.id);
    
    // Reset form with variant data
    form.reset({
      ...variant,
      images: [], // Images are handled separately
    });

    // Setup image previews
    if (variant.image) {
      try {
        const images = JSON.parse(variant.image);
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '');
        if (Array.isArray(images)) {
          setImagePreviews(images.map(path => `${baseUrl}/${path}`));
        } else {
          setImagePreviews([`${baseUrl}/${variant.image}`]);
        }
      } catch (e) {
        setImagePreviews([`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${variant.image}`]);
      }
    } else {
      setImagePreviews([]);
    }

    toast.info(`Editing: ${variant.sku}`);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServerSubmit = async (data, resetAfter = true) => {
    setSubmitting(true);
    if (!session?.accessToken) return;

    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (key === "images") return;

        if (key === "attributes") {
          formData.append(key, JSON.stringify(value));
          return;
        }

        if (typeof value === "boolean") {
          formData.append(key, value ? "1" : "0");
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      selectedFiles.forEach((file) => {
        formData.append("images[]", file);
      });

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${data.product_id}/variants/${currentEditingId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${data.product_id}/variants`;

      if (isEditing) {
        formData.append("_method", "PUT");
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      toast.success(isEditing ? "Variant Updated" : "Variant Created");

      if (resetAfter && !isEditing) {
        clearSavedData();
        form.reset({
          ...data,
          sku: "",
          code: "",
          barcode: "",
          description: "",
          images: [],
        });
        setSelectedFiles([]);
        setImagePreviews([]);
      } else {
        clearSavedData();
        // If we were editing, we might want to stay on the page but reset the editing state
        // or go back to the list. Based on the current flow, we go back to the list.
        router.push("/variants");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save variant");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ProductFormSkeleton />;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 p-4 md:px-8 md:pt-4 md:pb-12">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-slate-950">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(2,6,23,0))]"></div>
      </div>
      <Form {...form}>
        <form className="max-w-[1400px] mx-auto">
          {/* Header Section */}
          {/* --- WORKSTATION HEADER --- */}
          <div className="sticky top-0 z-50 mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-4 backdrop-blur-xl bg-white/70 dark:bg-zinc-950/70 border-b border-slate-200/60 dark:border-slate-800/60 transition-all duration-500">
            <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
                  <Boxes className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white  leading-none">
                    {isEditing ? "Edit Variant" : "New Variant"}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5  opacity-70">
                    {isEditing ? "Update variant specifications" : "Add a new variant to your inventory"}
                  </p>
                </div>
              </div>

              {/* Utility Hub */}
              <div className="flex items-center gap-3">


                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={() => {
                      form.reset();
                      setSelectedFiles([]);
                      setImagePreviews([]);
                      toast.info("Workstation cleared");
                    }}
                    className="h-9 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md font-semibold gap-2"
                  >
                    <RefreshCw className={cn("w-4 h-4", submitting && "animate-spin")} />
                    <span>Reset</span>
                  </Button>
                )}

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  onClick={form.handleSubmit((d) => handleServerSubmit(d, false))}
                  className="h-9 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md shadow-lg shadow-emerald-500/20 border-none transition-all active:scale-95 flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isEditing ? "Save Changes" : "Save Variant"}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Parent Product Selection */}
              <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Box className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold ">Parent Product</CardTitle>
                      <p className="text-sm text-muted-foreground font-medium">Product Information</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white mb-3 ml-0.5">
                          Identification Search
                        </FormLabel>
                        <Popover
                          open={isPopoverOpen}
                          onOpenChange={setIsPopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <div className="w-full cursor-pointer">
                              {detailedParent ? (
                                <div className="bg-emerald-500/3 border border-emerald-500/20 rounded-md p-5 shadow-sm shadow-emerald-500/2 flex items-center justify-between group transition-all hover:bg-emerald-500/5">
                                  <div className="flex items-center gap-5">
                                    <Avatar className="size-14 bg-emerald-500/10 rounded-md flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                      <AvatarImage
                                        src={getProductImageUrl(detailedParent.image)}
                                        alt={detailedParent.name}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="text-emerald-700 font-bold text-lg">
                                        {getInitials(detailedParent.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <h4 className="font-semibold text-base text-foreground  leading-none group-hover:text-emerald-600 transition-colors">
                                        {detailedParent.name}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                                          {detailedParent.code}
                                        </span>
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                                          {detailedParent.variants?.length || 0} variants
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="text-xs font-semibold text-emerald-600 decoration-emerald-600/30 hover:decoration-emerald-600 transition-all hover:translate-x-1"
                                  >
                                    Change <ChevronRight className="size-3 ml-1" />
                                  </Button>
                                </div>
                              ) : (
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isPopoverOpen}
                                    className={cn(
                                      "w-full h-12 justify-between text-left font-bold bg-background/50 border-border/60 rounded-md hover:bg-muted/30 focus:ring-emerald-500/20 text-base shadow-sm ring-offset-background",
                                      !field.value && "text-muted-foreground/40 font-medium"
                                    )}
                                  >
                                    {field.value
                                      ? parentProducts.find(
                                        (p) => p.id === field.value
                                      )?.name
                                      : "Scan or search catalog products..."}
                                    <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 ml-2 animate-pulse">
                                      <Search className="size-4 shrink-0 text-emerald-600" />
                                    </div>
                                  </Button>
                                </FormControl>
                              )}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            side="bottom"
                            sideOffset={8}
                            className="w-[500px] p-0 rounded-md border-border shadow-2xl bg-background/95 backdrop-blur-xl"
                            align="start"
                          >
                            <Command className="rounded-md">
                              <CommandInput
                                placeholder="Type name, SKU, or master code..."
                                className="h-11 font-semibold "
                              />
                              <CommandList className="max-h-[400px]">
                                <CommandEmpty className="py-10 text-center">
                                  <div className="inline-flex size-9 rounded-md bg-muted/50 items-center justify-center mb-4">
                                    <Search className="size-5 text-muted-foreground/40" />
                                  </div>
                                  <p className="text-sm font-semibold text-foreground">No matches found</p>
                                  <p className="text-xs text-muted-foreground mt-1">Try a different keyword</p>
                                </CommandEmpty>
                                <CommandGroup className="px-2 pb-2">
                                  {parentProducts.map((product) => (
                                    <CommandItem
                                      value={`${product.name} ${product.code}`}
                                      key={product.id}
                                      onSelect={() => {
                                        form.setValue("product_id", product.id);
                                        setIsPopoverOpen(false);
                                      }}
                                      className="h-16 cursor-pointer rounded-md px-4 m-1 hover:bg-emerald-500/10 hover:text-emerald-600 transition-all group"
                                    >
                                      <div className="flex items-center gap-4 flex-1">
                                        <Avatar className="size-10 rounded-lg flex items-center justify-center border border-border group-hover:border-emerald-500/20 shadow-sm transition-all">
                                          <AvatarImage
                                            src={getProductImageUrl(product.image)}
                                            alt={product.name}
                                            className="object-cover"
                                          />
                                          <AvatarFallback className="text-foreground/70 font-bold text-xs bg-muted">
                                            {getInitials(product.name)}
                                          </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                          <div className="font-semibold  group-hover:translate-x-1 transition-transform">
                                            {product.name}
                                          </div>
                                          <div className="text-xs font-medium text-muted-foreground mt-0.5 group-hover:text-emerald-600/70 transition-colors">
                                            {product.code}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-xs font-semibold bg-muted group-hover:bg-emerald-500/20 group-hover:text-emerald-700 px-2 py-0.5 rounded-md border border-border transition-all">
                                        {product.variants?.length || 0} VAR
                                      </div>
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
                </CardContent>
              </Card>

              {/* Variant Details */}
              <div className="grid grid-cols-1 gap-4">
                {/* Attributes Section */}
                <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                  <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Palette className="size-4 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold ">Variant Attributes</CardTitle>
                        <p className="text-sm text-muted-foreground font-medium">Custom Specifications</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <FormField
                      name="barcode"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Barcode <span className="text-muted-foreground font-normal">(Scannable)</span></FormLabel>
                          <FormControl>
                            <div className="flex gap-2 group/barcode">
                              <div className="relative flex-1">
                                <Barcode className={cn("absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/30 transition-colors", isCheckingBarcode && "animate-pulse text-emerald-500")} />
                                 <Input 
                                   placeholder="Scan or enter barcode number" 
                                   className="pl-12 h-11 bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold" 
                                   {...field} 
                                 />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => generateNumericBarcode(5)}
                                className="h-11 px-4 rounded-xl bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-600 shadow-sm transition-all flex items-center gap-2 font-bold"
                                title="Generate 5-digit code for weighing scales"
                              >
                                <RefreshCw className="size-4" />
                                <span className="text-xs">Scale</span>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => generateNumericBarcode(13)}
                                className="h-11 px-4 rounded-xl bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 text-blue-600 shadow-sm transition-all flex items-center gap-2 font-bold"
                                title="Generate standard 13-digit barcode"
                                >
                                <Zap className="size-4" />
                                <span className="text-xs">Std</span>
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />

                    <Separator className="bg-slate-100 dark:bg-slate-800" />
                    {/* Redesigned Attributes UX: Property Cards */}
                    {form.watch("attributes")?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {form.watch("attributes").map((attr, index) => (
                          <div
                            key={attr.attribute_id}
                            className={cn(
                              "relative group p-5 border rounded-md transition-all duration-300",
                              form.watch(`attributes.${index}.value`)
                                ? "border-emerald-500/20 bg-emerald-500/3 ring-1 ring-emerald-500/10 shadow-sm"
                                : "border-border bg-muted/20 hover:bg-muted/40"
                            )}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "size-9 rounded-md flex items-center justify-center border transition-all duration-500",
                                  form.watch(`attributes.${index}.value`)
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-sm shadow-emerald-500/10"
                                    : "bg-background border-border/60 text-muted-foreground/40"
                                )}>
                                  <Palette className="size-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className={cn(
                                    "text-xs font-bold leading-none  transition-colors",
                                    form.watch(`attributes.${index}.value`) ? "text-emerald-700" : "text-muted-foreground"
                                  )}>
                                    {attr.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-semibold mt-1">Property Value</span>
                                </div>
                              </div>
                              {form.watch(`attributes.${index}.value`) && (
                                <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center animate-in zoom-in-50 duration-300">
                                  <Check className="size-3 text-white" />
                                </div>
                              )}
                            </div>

                            <Input
                              placeholder={`e.g., ${attr.name === 'Color' ? 'Deep Emerald' : 'XL / 42'}`}
                              className="h-9 bg-background border-border/60 rounded-md focus:ring-emerald-500/20 font-semibold  text-sm shadow-sm transition-all"
                              value={form.watch(`attributes.${index}.value`)}
                              onChange={(e) => {
                                form.setValue(`attributes.${index}.value`, e.target.value);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 py-6 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-slate-500 italic font-medium transition-all hover:bg-slate-50">
                        <Palette className="size-4 opacity-40" />
                        <span className="text-sm">No attributes available. Please select a product with defined properties.</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-4 border-t border-border/40">
                      <FormField
                        name="cost_price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Cost Price</FormLabel>
                            <FormControl>
                              <div className="relative group/field">
                                <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center border-r border-slate-200 dark:border-slate-800 text-slate-400 group-focus-within/field:text-emerald-500 transition-colors">
                                  <span className="text-xs font-bold font-mono">LKR</span>
                                </div>
                                <Input type="number" step="0.01" className="pl-12 h-11 bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="mrp_price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[13px] font-bold text-slate-700 dark:text-slate-300">MRP Price</FormLabel>
                            <FormControl>
                              <div className="relative group/field">
                                <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center border-r border-slate-200 dark:border-slate-800 text-slate-400 group-focus-within/field:text-emerald-500 transition-colors">
                                  <span className="text-xs font-bold font-mono">LKR</span>
                                </div>
                                <Input type="number" step="0.01" className="pl-12 h-11 bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[13px] font-bold text-emerald-600">Selling Price</FormLabel>
                            <FormControl>
                              <div className="relative group/field">
                                <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center border-r border-emerald-100 dark:border-emerald-900/30 text-emerald-500/50 group-focus-within/field:text-emerald-600 transition-colors">
                                  <span className="text-xs font-bold font-mono">LKR</span>
                                </div>
                                <Input type="number" step="0.01" className="pl-12 h-11 bg-emerald-50/10 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/30 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-emerald-700 dark:text-emerald-400 font-bold" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="wholesale_price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Wholesale Price</FormLabel>
                            <FormControl>
                              <div className="relative group/field">
                                <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center border-r border-slate-200 dark:border-slate-800 text-slate-400 group-focus-within/field:text-emerald-500 transition-colors">
                                  <span className="text-xs font-bold font-mono">LKR</span>
                                </div>
                                <Input type="number" step="0.01" className="pl-12 h-11 bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-border/40">
                        <FormField
                          name="stock_quantity"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="space-y-0.5">
                              <FormLabel className="text-xs font-semibold text-slate-900 dark:text-white ml-0.5">
                                Opening Stock {detailedParent?.unit?.name ? `(${detailedParent.unit.name})` : ""}
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Box className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40 group-focus-within:text-emerald-600 transition-colors" />
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    className="h-9 pl-9 bg-background border-border/60 rounded-md focus:ring-emerald-500/20 font-medium text-sm shadow-sm transition-all"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                    {/* Description */}
                    <FormField
                      name="description"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="space-y-0.5">
                          <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">
                            Variant Brief
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Textarea
                                placeholder="Additional nuances, quality markers, or handling notes..."
                                className="min-h-[120px] bg-background border-border/60 rounded-md focus:ring-emerald-500/20 font-medium  text-sm shadow-sm resize-none p-4"
                                {...field}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Identification Section */}
                <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                  <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <QrCode className="size-4 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold ">Identification</CardTitle>
                        <p className="text-sm text-muted-foreground font-medium">SKU & Barcode</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        name="code"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">
                              Variant Code
                            </FormLabel>
                            <div className="flex gap-2 group/code">
                              <FormControl>
                                <div className="relative flex-1">
                                  <Input
                                    placeholder="e.g., SKU-VAR-001"
                                    className="h-9 bg-background border-border/60 rounded-md focus:ring-emerald-500/20 font-medium text-sm shadow-sm group-focus-within/code:border-emerald-500/40 transition-all"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={generateUniqueSKU}
                                className="size-9 rounded-md bg-background border-border/60 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-emerald-600 shadow-sm transition-all animate-in zoom-in-75 duration-300"
                                disabled={!detailedParent}
                              >
                                <RefreshCw className="size-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="sku"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">
                              Stock Keeping Unit (SKU)
                            </FormLabel>
                            <FormControl>
                              <div className="relative group/sku">
                                <Input
                                  placeholder="e.g., SKU-12345"
                                  className="h-9 bg-background border-border/60 rounded-md focus:ring-emerald-500/20 font-medium text-sm shadow-sm group-focus-within/sku:border-emerald-500/40 transition-all"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                  </CardContent>
                </Card>

                {/* Settings Section */}
                <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                  <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Check className="size-4 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold ">Variant Status</CardTitle>
                        <p className="text-sm text-muted-foreground font-medium">Active & Default Settings</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <SettingsCard
                            label="Active Status"
                            description="Make variant available for sales"
                            icon={Zap}
                            isActive={field.value}
                            onToggle={field.onChange}
                          />
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_default"
                        render={({ field }) => (
                          <SettingsCard
                            label="Master Default"
                            description="Primary selection for catalog"
                            icon={Check}
                            isActive={field.value}
                            onToggle={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4">
              {/* Variant History */}
              <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <History className="size-4 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold ">Existing Variants</CardTitle>
                        <p className="text-sm text-muted-foreground font-medium">Product History</p>
                      </div>
                    </div>
                    {detailedParent?.variants?.length > 0 && (
                      <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {detailedParent.variants.length} items
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {detailedParent ? (
                    <ExistingVariantsList
                      variants={detailedParent?.variants || []}
                      detailedParent={detailedParent}
                      onDelete={handleDeleteVariant}
                      onEdit={handleEditExistingVariant}
                      currentEditingId={currentEditingId}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl m-6">
                      <div className="flex items-center justify-center size-14 rounded-2xl bg-white dark:bg-slate-800 mb-6 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <Search className="size-7 text-slate-300 dark:text-slate-600" />
                      </div>
                      <div className="flex flex-col items-center">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">No Product Selected</h3>
                        <p className="text-sm text-slate-500 font-medium max-w-[200px] leading-relaxed">
                          Select a product from the search bar above to view its variants
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Image Upload - Redesigned */}
              <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-md overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-muted/30 border-b border-slate-200/60 dark:border-slate-800/60 px-6 pt-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Camera className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white ">Variant Images</CardTitle>
                      <p className="text-xs text-slate-500 font-semibold  opacity-70">Gallery Assets</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-6">
                    {/* Drag & Drop Zone */}
                    <div
                      {...getRootProps()}
                      className={cn(
                        "relative min-h-[180px] rounded-md border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-6 group overflow-hidden cursor-pointer",
                        isDragActive
                          ? "border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10 scale-[0.99] shadow-inner"
                          : "border-border hover:border-emerald-500/40 hover:bg-emerald-500/2"
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                      <div className="relative size-12 rounded-md bg-muted group-hover:bg-emerald-500/10 flex items-center justify-center border border-border group-hover:border-emerald-500/20 transition-all duration-500 group-hover:scale-110 shadow-sm">
                        <Upload className={cn(
                          "size-6 transition-colors duration-500",
                          isDragActive ? "text-emerald-600 animate-bounce" : "text-slate-400 group-hover:text-emerald-600"
                        )} />
                      </div>

                      <div className="mt-6 text-center">
                        <p className="text-base font-semibold text-foreground  group-hover:text-emerald-600 transition-colors">
                          {isDragActive ? "Drop images here..." : "Drop variant images here"}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium mt-1 group-hover:text-muted-foreground transition-colors">
                          or click to browse your media gallery
                        </p>
                      </div>

                      {/* Status Indicators */}
                      <div className="mt-8 flex items-center gap-4">
                        <div className="h-1.5 w-12 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                            style={{ width: `${(imagePreviews.length / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground  whitespace-nowrap">
                          {imagePreviews.length} / 10 Slots
                        </span>
                      </div>
                    </div>

                    {/* Image Grid */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagePreviews.map((src, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-md border border-border overflow-hidden group hover:ring-2 hover:ring-emerald-500/40 transition-all shadow-sm"
                          >
                            <img
                              src={src}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              className="absolute top-2 right-2 size-8 bg-black/60 backdrop-blur-md text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110 shadow-lg"
                            >
                              <X className="size-4" />
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-semibold rounded-lg shadow-lg">
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {imagePreviews.length === 0 && (
                      <div className="text-center py-10 border border-dashed border-border rounded-3xl bg-muted/10">
                        <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 border border-border/40">
                          <Camera className="size-7 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">No imagery added</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1 px-8 leading-relaxed">
                          Please upload product variant images
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/40">
                      {[
                        "First image will be the primary identification",
                        "High fidelity formats: JPG, PNG, WebP supported",
                        "Maximum file size: 5MB per image"
                      ].map((hint, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="size-1 rounded-full bg-emerald-500/30" />
                          <p className="text-xs font-semibold text-muted-foreground">{hint}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </form>
      </Form>
      <ProductInsightSheet 
        isOpen={insightOpen}
        onClose={() => setInsightOpen(false)}
        insightData={insightData}
      />
    </div>
  );
}
