"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  Save,
  AlertTriangle,
  Package,
  History,
  Info,
  Check,
  ChevronsUpDown
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const formSchema = z.object({
  branch_id: z.string().min(1, "Branch is required"),
  product_id: z.string().min(1, "Product is required"),
  product_variant_id: z.string().optional().nullable(),
  quantity: z.coerce.number().min(0.001, "Quantity must be > 0"),
  wastage_type: z.enum(['raw_material', 'finished_good', 'semi_finished']),
  reason: z.string().min(3, "Reason is required"),
  notes: z.string().optional(),
});

export default function WastageForm() {
  const { data: session } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branch_id: "",
      product_id: "",
      product_variant_id: null,
      quantity: 1,
      wastage_type: "finished_good",
      reason: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) return;
      try {
        const [prodRes, branchRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list?branch_id=${form.getValues("branch_id") || ""}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        ]);

        const prodData = await prodRes.json();
        const branchData = await branchRes.json();

        if (prodData.status === "success") {
          const list = [];
          const prodList = Array.isArray(prodData.data) ? prodData.data : (prodData.data?.data || []);
          
          prodList.forEach(p => {
            const getWastageType = (type) => {
              if (!type) return 'finished_good';
              const t = type.toLowerCase();
              if (t.includes('raw')) return 'raw_material';
              if (t.includes('semi')) return 'semi_finished';
              return 'finished_good';
            };

            const wType = getWastageType(p.product_type);

            if (p.variants && p.variants.length > 0) {
              p.variants.forEach(v => {
                list.push({
                  productId: p.id,
                  variantId: v.id,
                  name: p.name,
                  variantName: v.name,
                  fullName: `${p.name} (${v.name || v.sku || 'Default'})`,
                  sku: v.sku,
                  type: wType
                });
              });
            } else {
              list.push({
                productId: p.id,
                variantId: p.id,
                name: p.name,
                fullName: p.name,
                sku: p.sku,
                type: wType
              });
            }
          });
          setProducts(list);
        }

        if (branchData.status === "success") {
          const bList = Array.isArray(branchData.data) ? branchData.data : (branchData.data?.data || []);
          setBranches(bList);
          if (bList.length > 0) {
            form.setValue("branch_id", bList[0].id);
          }
        }
      } catch (err) {
        toast.error("Failed to initialize form data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session, form.watch("branch_id")]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wastages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Wastage recorded successfully");
        router.push("/production/wastage");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to record wastage");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => 
    p.variantId === form.watch("product_variant_id") || 
    (p.productId === form.watch("product_id") && !p.variantId)
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground font-medium">Initializing wastage protocol...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/20 animate-pulse">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Record Wastage</h1>
              <p className="text-sm text-muted-foreground font-medium">
                Log production losses and inventory reconciliation
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
          Commit Record
        </Button>
      </div>

      <Form {...form}>
        <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-150 fill-mode-both">
            <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-gray-100 dark:border-white/10">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" /> 
                  Loss Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="branch_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Branch / Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-transparent transition-all focus:ring-2 focus:ring-emerald-500/20">
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.map(b => (
                              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-medium">Lost Product / Material</FormLabel>
                        <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between h-10 bg-gray-50/50 dark:bg-transparent font-medium transition-all focus:ring-2 focus:ring-emerald-500/20",
                                  !field.value && "text-muted-foreground font-normal"
                                )}
                              >
                                {selectedProduct ? selectedProduct.fullName : "Select product..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search products..." className="h-10" />
                              <CommandList className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <CommandEmpty>No product found.</CommandEmpty>
                                <CommandGroup>
                                  {products.map((p) => (
                                    <CommandItem
                                      key={p.variantId}
                                      value={p.fullName}
                                      onSelect={() => {
                                        form.setValue("product_id", p.productId);
                                        form.setValue("product_variant_id", p.variantId === p.productId ? null : p.variantId);
                                        form.setValue("wastage_type", p.type);
                                        setProductSearchOpen(false);
                                      }}
                                      className="flex items-center gap-2 p-2 cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          "h-4 w-4 text-emerald-600",
                                          (form.watch("product_id") === p.productId && form.watch("product_variant_id") === (p.variantId === p.productId ? null : p.variantId)) ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium text-sm">{p.fullName}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {p.sku || p.code} • {p.type.replace('_', ' ')}
                                        </span>
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

                  <FormField
                    control={form.control}
                    name="wastage_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-transparent transition-all focus:ring-2 focus:ring-emerald-500/20">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="raw_material">Raw Material</SelectItem>
                            <SelectItem value="finished_good">Finished Product</SelectItem>
                            <SelectItem value="semi_finished">Semi-Finished</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Lost Quantity</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input type="number" step="0.001" {...field} className="h-10 bg-gray-50/50 dark:bg-transparent font-medium pl-10 transition-all focus:ring-2 focus:ring-emerald-500/20" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 group-focus-within:scale-110 transition-transform">
                              <Trash2 className="w-4 h-4" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Reason for Loss</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Describe why this wastage occurred..." className="h-10 bg-gray-50/50 dark:bg-transparent transition-all focus:ring-2 focus:ring-emerald-500/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Add any extra information here..." className="bg-gray-50/50 dark:bg-transparent resize-none min-h-[100px] transition-all focus:ring-2 focus:ring-emerald-500/20" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-300 fill-mode-both">
            <Card className="border-none shadow-lg bg-emerald-600 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute -top-6 -right-6 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                <History className="w-40 h-40" />
              </div>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-emerald-200" /> 
                  Inventory Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm opacity-90 leading-relaxed font-medium">
                  Recording this wastage will immediately deduct the specified quantity from your active stock and update batch records.
                </p>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm shadow-inner">
                  <div className="text-xs font-medium opacity-70 mb-2">Quantity to Deduct</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tabular-nums">-{form.watch("quantity") || 0}</span>
                    <span className="text-sm font-medium opacity-70">Units</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-5 flex gap-4 animate-bounce-subtle">
              <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Audit Trail Notice</h4>
                <p className="text-xs leading-relaxed text-amber-800/70 dark:text-amber-400/60 font-medium">
                  Every wastage record is permanently stored and linked to your profile for reporting and audit compliance.
                </p>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
