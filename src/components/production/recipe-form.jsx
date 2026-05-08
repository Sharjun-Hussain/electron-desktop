"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  Origami,
  ArrowLeft,
  Loader2,
  Box,
  Scale,
  Activity,
  ChevronsUpDown,
  Check,
  Info,
  DollarSign,
  History
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAppSettings } from "@/app/hooks/useAppSettings";

const itemSchema = z.object({
  raw_material_id: z.string().min(1, "Raw material is required"),
  raw_material_variant_id: z.string().min(1, "Variant is required"),
  quantity: z.coerce.number().min(0.001, "Quantity must be > 0"),
  unit_id: z.string().optional().nullable(),
  waste_percentage: z.coerce.number().min(0).max(100).default(0),
});

const formSchema = z.object({
  product_id: z.string().min(1, "Finished good is required"),
  product_variant_id: z.string().optional().nullable(),
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  batch_size: z.coerce.number().min(1, "Batch size must be at least 1"),
  instructions: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one ingredient"),
});

const ProductSelect = ({ value, onChange, products, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  const selectedProduct = products.find((p) => String(p.variantId) === String(value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full justify-between h-10 bg-gray-50/50 dark:bg-transparent font-medium",
            !value && "text-muted-foreground font-normal"
          )}
        >
          <span className="truncate">
            {selectedProduct ? selectedProduct.fullName : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search product..." className="h-10" />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {products.map((p) => (
                <CommandItem
                  key={p.variantId}
                  value={p.fullName}
                  onSelect={() => {
                    onChange(p.variantId, p);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 p-2 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 text-emerald-600",
                      value === p.variantId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{p.fullName}</span>
                    <span className="text-xs text-muted-foreground">SKU: {p.sku || p.code}</span>
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

export default function RecipeForm({ initialData = null }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatCurrency } = useAppSettings();
  const isEditing = !!initialData;

  const [products, setProducts] = useState([]); 
  const [rawMaterials, setRawMaterials] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      items: initialData.items.map(item => ({
        raw_material_id: item.raw_material_id,
        raw_material_variant_id: item.raw_material_variant_id,
        quantity: item.quantity,
        unit_id: item.unit_id,
        waste_percentage: item.waste_percentage,
      }))
    } : {
      name: "",
      description: "",
      batch_size: 1,
      instructions: "",
      items: [{ raw_material_id: "", raw_material_variant_id: "", quantity: 1, waste_percentage: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const data = await res.json();
        if (data.status === "success") {
          const all = data.data || [];
          
          const flatten = (items) => {
            const list = [];
            items.forEach(p => {
              if (p.variants && p.variants.length > 0) {
                p.variants.forEach(v => {
                  list.push({
                    productId: p.id,
                    variantId: v.id,
                    name: p.name,
                    variantName: v.name,
                    fullName: `${p.name} (${v.name || v.sku || 'Default'})`,
                    sku: v.sku,
                    code: p.code,
                    cost_price: v.cost_price,
                    product_type: p.product_type,
                    can_be_manufactured: p.can_be_manufactured
                  });
                });
              } else {
                list.push({
                  productId: p.id,
                  variantId: p.id, // Fallback if no variants
                  name: p.name,
                  fullName: p.name,
                  sku: p.sku,
                  code: p.code,
                  cost_price: p.cost_price,
                  product_type: p.product_type,
                  can_be_manufactured: p.can_be_manufactured
                });
              }
            });
            return list;
          };

          const flattened = flatten(all);
          
          // Target Products: Anything that can be manufactured or is a Finished Good
          // Using case-insensitive check and handling potential undefined values
          setProducts(flattened.filter(p => {
            const type = (p.product_type || "").toLowerCase();
            const canManufacture = p.can_be_manufactured === true || p.can_be_manufactured === 1;
            return type === 'finished good' || canManufacture;
          }));
          
          // Ingredients (BOM): Anything that is NOT a service can be an ingredient
          setRawMaterials(flattened.filter(p => {
            const type = (p.product_type || "").toLowerCase();
            return type !== 'service';
          }));
        }
      } catch (err) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const watchedItems = form.watch("items");
  const totalCost = useMemo(() => {
    return watchedItems.reduce((acc, item) => {
      const rm = rawMaterials.find(r => r.variantId === item.raw_material_variant_id);
      const cost = rm ? parseFloat(rm.cost_price || 0) : 0;
      return acc + (cost * (parseFloat(item.quantity) || 0));
    }, 0);
  }, [watchedItems, rawMaterials]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/recipes/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/recipes`;
      
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(`Recipe ${isEditing ? "updated" : "created"} successfully`);
        router.push("/production/recipes");
      } else {
        const err = await res.json();
        toast.error(err.message || "Operation failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground font-medium">Initializing recipe builder...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-emerald-50 text-emerald-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 animate-pulse">
              <Origami className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isEditing ? "Refine Recipe" : "New Recipe Builder"}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Define production standards and Bill of Materials
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 px-8 transition-all hover:scale-105 active:scale-95"
        >
          {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {isEditing ? "Update Recipe" : "Commit Recipe"}
        </Button>
      </div>

      <Form {...form}>
        <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-150 fill-mode-both">
            <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card">
              <CardHeader className="border-b border-gray-100 dark:border-white/10">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Box className="w-5 h-5 text-emerald-600" /> 
                  Finished Product Identification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Target Product</FormLabel>
                        <FormControl>
                          <ProductSelect 
                            value={form.watch("product_variant_id") || field.value}
                            products={products}
                            placeholder="Identify target product..."
                            onChange={(variantId, product) => {
                              form.setValue("product_id", product.productId);
                              form.setValue("product_variant_id", product.variantId);
                              if (!form.getValues("name")) {
                                form.setValue("name", `Recipe for ${product.name}`);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Recipe Alias / Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Standard Soda Mix v1" className="h-10 bg-gray-50/50 dark:bg-transparent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="batch_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Standard Yield (Units)</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
                            <Input type="number" {...field} className="pl-10 h-10 bg-gray-50/50 dark:bg-transparent font-medium" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Description / Brief</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Internal notes about this variation..." className="h-10 bg-gray-50/50 dark:bg-transparent" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card overflow-hidden">
              <CardHeader className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" /> 
                  Bill of Materials (Ingredients)
                </CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ raw_material_id: "", raw_material_variant_id: "", quantity: 1, waste_percentage: 0 })}
                  className="h-9 border-emerald-600/20 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 transition-all"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Ingredient
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/5">
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Material / Component</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-32 text-center">Net Qty</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-24 text-center">Waste %</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-32 text-right">Unit Cost</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {fields.map((field, index) => {
                        const currentRm = rawMaterials.find(r => r.variantId === watchedItems[index]?.raw_material_variant_id);
                        return (
                          <tr key={field.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                              <ProductSelect 
                                value={watchedItems[index]?.raw_material_variant_id}
                                products={rawMaterials}
                                placeholder="Select ingredient..."
                                onChange={(variantId, rm) => {
                                  form.setValue(`items.${index}.raw_material_id`, rm.productId);
                                  form.setValue(`items.${index}.raw_material_variant_id`, rm.variantId);
                                }}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <Input 
                                type="number" 
                                step="0.001"
                                className="text-center font-mono h-10 bg-gray-50/50 dark:bg-transparent"
                                {...form.register(`items.${index}.quantity`)} 
                              />
                            </td>
                            <td className="px-6 py-4">
                               <Input 
                                type="number" 
                                className="text-center font-mono h-10 bg-gray-50/50 dark:bg-transparent"
                                {...form.register(`items.${index}.waste_percentage`)} 
                              />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-mono text-sm font-semibold text-muted-foreground">
                                {currentRm ? formatCurrency(currentRm.cost_price) : "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => remove(index)}
                                className="size-9 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {fields.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-gray-50 dark:bg-white/5">
                      <Box className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium italic">
                      No components added yet. Use the "Add Ingredient" button to start.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-300 fill-mode-both">
            <Card className="border-none shadow-lg bg-emerald-600 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute -top-6 -right-6 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                <DollarSign className="w-32 h-32" />
              </div>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-200" /> 
                  Recipe Economics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline border-b border-white/20 pb-4">
                  <span className="text-sm font-medium opacity-80">Batch Cost</span>
                  <span className="text-3xl font-bold tabular-nums">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium opacity-80">Unit Production Cost</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatCurrency(totalCost / (form.watch("batch_size") || 1))}
                  </span>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-200" />
                    <p className="text-[11px] leading-relaxed opacity-80 font-medium">
                      Calculated using current weighted average costs of raw materials. Actual production costs may vary based on specific batch yields.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card">
              <CardHeader className="border-b border-gray-100 dark:border-white/10">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                   Standard Operating Procedure
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Manufacturing Steps</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Detail the step-by-step process..." 
                          className="min-h-[250px] bg-gray-50/50 dark:bg-transparent resize-none text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-5 flex gap-4 animate-bounce-subtle">
              <History className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Version Control</h4>
                <p className="text-xs leading-relaxed text-amber-800/70 dark:text-amber-400/60 font-medium">
                  Saving this recipe will update the manufacturing standards. All new production orders will follow these specifications.
                </p>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
