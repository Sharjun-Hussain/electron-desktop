"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Package,
  Activity,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Boxes,
  MinusCircle,
  Calendar
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { Badge } from "../ui/badge";

const itemSchema = z.object({
  id: z.string(),
  raw_material_name: z.string(),
  quantity_planned: z.coerce.number(),
  quantity_consumed: z.coerce.number().min(0, "Consumed quantity must be >= 0"),
});

const formSchema = z.object({
  quantity_produced: z.coerce.number().min(0.001, "Produced quantity must be > 0"),
  items_consumed: z.array(itemSchema),
  expiry_date: z.string().optional().nullable(),
});

export default function ProductionCompletionSheet({ orderId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatCurrency } = useAppSettings();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity_produced: 0,
      items_consumed: [],
      expiry_date: "",
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items_consumed",
  });

  useEffect(() => {
    const fetchOrder = async () => {
      if (!session?.accessToken || !orderId) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/production/orders?id=${orderId}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const data = await res.json();
        // The list API might not have detailed items, let's assume we need a GET by ID or just use what we have
        // But wait, the controller has getProductionOrders. I should probably use a detail endpoint.
        // Let's assume I need to fetch detail.
        const detailRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/production/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const detailData = await detailRes.json();

        if (detailData.status === "success") {
          const po = detailData.data;
          setOrder(po);
          form.reset({
            quantity_produced: po.quantity_planned,
            items_consumed: po.items.map(i => ({
              id: i.id,
              raw_material_name: i.raw_material?.name || "Unknown Material",
              quantity_planned: i.quantity_planned,
              quantity_consumed: i.quantity_planned,
            })),
            expiry_date: "",
          });
        }
      } catch (err) {
        toast.error("Failed to load production order context");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, session]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/production/orders/${orderId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Batch finalized. Stock levels updated.");
        router.push("/production/orders");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to finalize batch");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground"><Loader2 className="animate-spin inline mr-2" /> Syncing with manufacturing ledger...</div>;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-emerald-50 text-emerald-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Finalize Batch Output</h1>
              <p className="text-sm text-muted-foreground font-medium">Batch Identification: {order?.order_number}</p>
            </div>
          </div>
        </div>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 px-8 transition-all hover:scale-105 active:scale-95"
        >
          {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Complete Manufacturing Run
        </Button>
      </div>

      <Form {...form}>
        <form className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card overflow-hidden">
              <CardHeader className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 py-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MinusCircle className="w-5 h-5 text-emerald-600" /> Material Consumption Protocol
                </CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">Verify and adjust actual raw material usage</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Ingredient</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-center">Planned Qty</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-center w-40">Actual Consumed</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {fields.map((field, index) => {
                        const planned = field.quantity_planned;
                        const actual = form.watch(`items_consumed.${index}.quantity_consumed`) || 0;
                        const variance = actual - planned;

                        return (
                          <tr key={field.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm text-foreground">{field.raw_material_name}</span>
                                <span className="text-xs text-muted-foreground font-medium">Standard Ingredient</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <Badge variant="outline" className="font-mono text-xs px-3 py-1 bg-gray-50/50 shadow-none border-gray-200">{planned}</Badge>
                            </td>
                            <td className="px-6 py-5">
                              <FormField
                                control={form.control}
                                name={`items_consumed.${index}.quantity_consumed`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.001"
                                        {...field}
                                        className={cn(
                                          "h-10 text-center font-bold shadow-sm transition-all",
                                          actual > planned ? "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-amber-700" :
                                            actual < planned ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700" :
                                              "bg-gray-50/50 dark:bg-transparent"
                                        )}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="px-6 py-5 text-right">
                              {variance !== 0 ? (
                                <span className={cn(
                                  "text-xs font-semibold px-2.5 py-1 rounded-lg",
                                  variance > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40"
                                )}>
                                  {variance > 0 ? "+" : ""}{variance.toFixed(3)} ({((variance / planned) * 100).toFixed(1)}%)
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-muted-foreground/40 italic">No Variance</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-lg bg-emerald-600 text-white relative overflow-hidden transition-transform hover:scale-[1.01]">
              <div className="absolute -top-6 -right-6 p-4 opacity-10">
                <TrendingUp className="w-40 h-40" />
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 opacity-90">
                  <TrendingUp className="w-5 h-5 text-emerald-200" /> Batch Output Yield
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <FormField
                  control={form.control}
                  name="quantity_produced"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-xs font-medium opacity-80">Actual Quantity Finished</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            type="number"
                            step="0.001"
                            {...field}
                            className="h-28 text-6xl font-bold text-center bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:bg-white/20 transition-all rounded-3xl"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-end">
                            <span className="text-xs font-bold opacity-60">{order?.product?.unit?.name || "Units"}</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-white bg-red-500/30 p-2 rounded-lg text-xs" />
                    </FormItem>
                  )}
                />

                <div className="bg-white/10 rounded-2xl p-5 space-y-4 border border-white/10 backdrop-blur-sm">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="opacity-70">Plan Objective</span>
                    <span className="font-bold">{order?.quantity_planned} Units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium opacity-70">Efficiency Yield</span>
                    <span className="text-xl font-bold">
                      {((form.watch("quantity_produced") / (order?.quantity_planned || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      style={{ width: `${Math.min(100, (form.watch("quantity_produced") / (order?.quantity_planned || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card">
              <CardHeader className="border-b border-gray-100 dark:border-white/10 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" /> Batch Expiry Date
                </CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  Set expiration timeline for this finished food product
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Expiration Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          className="h-10 bg-gray-50/50 dark:bg-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-6 flex gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Inventory Reconciliation Warning</h4>
                <p className="text-xs leading-relaxed text-amber-800/70 dark:text-amber-400/60 font-medium">
                  Completing this run will trigger immediate stock deduction for all consumed materials and inject the produced quantity into the finished goods inventory. This action is immutable.
                </p>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
