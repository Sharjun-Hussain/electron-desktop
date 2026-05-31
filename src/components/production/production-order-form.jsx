"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Boxes,
  FileText,
  Calendar,
  AlertCircle,
  TrendingUp,
  Package,
  History,
  Info
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  recipe_id: z.string().min(1, "Recipe is required"),
  quantity_planned: z.coerce.number().min(0.001, "Planned quantity must be > 0"),
  branch_id: z.string().min(1, "Branch is required"),
  notes: z.string().optional(),
});

export default function ProductionOrderForm({ showBackButton = true }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [recipes, setRecipes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipe_id: "",
      quantity_planned: 1,
      branch_id: session?.user?.branch_id || "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) return;
      try {
        const [recipesRes, branchesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/recipes?size=100`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        ]);

        const recipesData = await recipesRes.json();
        const branchesData = await branchesRes.json();

        if (recipesData.status === "success") {
            const rList = recipesData.data?.data || recipesData.data || [];
            setRecipes(rList);
        }
        if (branchesData.status === "success") {
            const bList = Array.isArray(branchesData.data) ? branchesData.data : (branchesData.data?.data || []);
            setBranches(bList);
        }
      } catch (err) {
        toast.error("Failed to load metadata");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const selectedRecipe = recipes.find(r => r.id === form.watch("recipe_id"));

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/production/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Production batch scheduled successfully");
        router.push("/production/orders");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to start batch");
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
        <p className="text-sm text-muted-foreground font-medium">Initializing production workspace...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-emerald-50 text-emerald-600">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 animate-pulse">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Initiate Production Batch</h1>
              <p className="text-sm text-muted-foreground font-medium">
                New Manufacturing Run Configuration
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 px-8 transition-all hover:scale-105 active:scale-95"
        >
          {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Commit to Production
        </Button>
      </div>

      <Form {...form}>
        <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-150 fill-mode-both">
            <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card">
              <CardHeader className="border-b border-gray-100 dark:border-white/10">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" /> 
                  Manufacturing Blueprint
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="recipe_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Select Recipe (BOM)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-transparent transition-all focus:ring-2 focus:ring-emerald-500/20">
                              <SelectValue placeholder="Choose a recipe..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {recipes.map(r => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name} ({r.product?.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branch_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Production Site (Branch)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-transparent transition-all focus:ring-2 focus:ring-emerald-500/20">
                              <SelectValue placeholder="Select facility..." />
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
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Batch Internal Notes</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Morning Shift Batch, Priority Order #123" className="h-10 bg-gray-50/50 dark:bg-transparent transition-all focus:ring-2 focus:ring-emerald-500/20" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card">
              <CardHeader className="border-b border-gray-100 dark:border-white/10">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> 
                  Output Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <FormField
                  control={form.control}
                  name="quantity_planned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Target Production Output (Units)</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input type="number" step="0.001" {...field} className="h-24 text-5xl font-black text-center bg-gray-50/50 dark:bg-white/5 border-none focus:ring-0" />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                            {selectedRecipe?.product?.unit?.name || "Units"}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-300 fill-mode-both">
            <Card className="border-none shadow-lg bg-emerald-600 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute -top-6 -right-6 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                <Package className="w-40 h-40" />
              </div>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-emerald-200" /> 
                  BOM Projection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRecipe ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs opacity-80">
                        <span>Target Product</span>
                        <span className="font-bold">{selectedRecipe.product?.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs opacity-80">
                        <span>Standard Yield</span>
                        <span className="font-bold">{selectedRecipe.batch_size} Units</span>
                      </div>
                    </div>
                    <Separator className="bg-white/20" />
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-200" />
                        <p className="text-[11px] leading-relaxed opacity-80 font-medium">
                          Starting this batch will pre-allocate resources. Materials will be formally deducted from stock only upon completion.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center flex flex-col items-center gap-3">
                    <Info className="w-8 h-8 opacity-20" />
                    <p className="text-xs font-medium opacity-60 italic">Select a recipe to view projection.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-5 flex gap-4 animate-bounce-subtle">
              <History className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Scheduling Policy</h4>
                <p className="text-xs leading-relaxed text-amber-800/70 dark:text-amber-400/60 font-medium">
                  Batch execution follows a FIFO batch selection for ingredients. Ensure enough raw material is available at the selected branch.
                </p>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
