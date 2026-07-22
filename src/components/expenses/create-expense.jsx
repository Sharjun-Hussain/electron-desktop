"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "@/lib/date-utils";
import { ArrowLeft, Loader2, Save, Calendar as CalendarIcon, Upload, X, Receipt, Wallet, Banknote, CreditCard as CardIcon, Landmark, Info, Plus, Trash2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useFormRestore } from "@/hooks/use-form-restore";
import { Button } from "@/components/ui/button";
import { AVAILABLE_PAYMENTS } from "@/lib/constants";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ExpenseCategorySheet } from "@/components/expense-categories/expense-category-sheet";

const formSchema = z.object({
  date: z.coerce.date({ required_error: "Date is required" }),
  category_id: z.string().min(1, "Category is required"),
  reference_no: z.string().optional(),
  note: z.string().optional(),
  attachment: z.any().optional(),
});

export default function CreateExpense() {
  const router = useRouter();
  const { data: session } = useSession();
  const { formatCurrency, localization, pos } = useAppSettings();
  const currencySymbol = localization?.currency || "LKR";
  const activeMethods = pos?.activePaymentMethods || ["cash", "card"];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      category_id: "",
      reference_no: "",
      note: "",
    },
  });

  const { clearSavedData } = useFormRestore(form, "create-expense-form");

  const [payments, setPayments] = useState([

    { id: Date.now(), method: "cash", amount: 0, reference_number: "", notes: "", cheque_details: { bank_name: "", cheque_number: "", cheque_date: "" } }
  ]);

  const totalPayments = useMemo(() => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [payments]);

  const addPaymentLine = () => {
    setPayments([...payments, {
      id: Date.now(),
      method: "cash",
      amount: 0,
      reference_number: "",
      notes: "",
      cheque_details: { bank_name: "", cheque_number: "", cheque_date: "" }
    }]);
  };

  const removePaymentLine = (id) => {
    if (payments.length === 1) return;
    setPayments(payments.filter(p => p.id !== id));
  };

  const updatePayment = (id, field, value) => {
    setPayments(payments.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const fetchCategories = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        setCategories(data?.data?.data || data?.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [session]);

  const dateValue = form.watch("date");
  useEffect(() => {
    if (typeof dateValue === "string") {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        form.setValue("date", parsedDate, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [dateValue, form]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function onSubmit(data) {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      const payload = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
        total_amount: totalPayments,
        payments: payments.map(p => ({
          payment_method: p.method,
          amount: parseFloat(p.amount),
          reference_number: p.reference_number,
          notes: p.notes,
          cheque_details: p.method === "cheque" ? p.cheque_details : null
        }))
      };

      if (data.attachment) {
        formData.append("attachment", data.attachment);
        delete payload.attachment;
      }

      formData.append("data", JSON.stringify(payload));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to create expense");
      }

      toast.success("Expense recorded successfully");
      clearSavedData();
      router.push("/expenses");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to record expense");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-sm">
              <Receipt className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Record Expense</h1>
              <p className="text-xs text-muted-foreground mt-0.5 opacity-60">Financial management & expenditure control</p>
            </div>
          </div>
        </div>

      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-xl border border-border shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/30 px-6 py-4">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Header Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm">Expense Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full h-10 pl-3 text-left font-normal border-input hover:border-accent transition-colors bg-background rounded-md",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm">Category</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => setIsCategorySheetOpen(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add New
                          </Button>
                        </div>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 border-input bg-background rounded-md shadow-sm">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
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
                    name="reference_no"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm">Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Invoice #, Receipt #" className="h-10 border-input bg-background rounded-md shadow-sm focus-visible:ring-primary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm">Note</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional details about this expense..."
                            className="resize-none min-h-[100px] border-input bg-background rounded-md shadow-sm focus-visible:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* SPLIT PAYMENTS MATRIX */}
              <Card className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/30 px-6 py-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    <CardTitle className="text-sm font-medium text-foreground">
                      Payment Breakdown
                    </CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPaymentLine}
                    className="h-8 text-[11px] bg-background border-border text-foreground hover:bg-accent rounded-md shadow-sm"
                  >
                    <Plus className="mr-1.5 h-3 w-3" />
                    Add Method
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {payments.map((pmt, idx) => (
                    <div key={pmt.id} className="group relative flex flex-col gap-5 p-5 bg-muted/10 border border-border/40 rounded-xl transition-all hover:bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                          <label className="text-[11px] text-muted-foreground mb-2 block">Payment Method</label>
                          <Select
                            value={pmt.method}
                            onValueChange={(val) => updatePayment(pmt.id, "method", val)}
                          >
                            <SelectTrigger className="h-10 bg-background border-input rounded-md shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-md shadow-lg">
                              {AVAILABLE_PAYMENTS.filter(p => activeMethods.includes(p.id)).map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  <div className="flex items-center gap-2">
                                    <p.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{p.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-5">
                          <label className="text-[11px] text-muted-foreground mb-2 block">Amount ({currencySymbol})</label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={pmt.amount}
                              onChange={(e) => updatePayment(pmt.id, "amount", e.target.value)}
                              className="h-10 text-sm bg-background border-input rounded-md pl-3 shadow-sm focus-visible:ring-primary tabular-nums"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground opacity-40">{currencySymbol}</div>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          {payments.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePaymentLine(pmt.id)}
                              className="h-10 w-full text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {pmt.method === "cheque" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Bank Name</label>
                            <Input
                              placeholder="e.g. HNB"
                              value={pmt.cheque_details?.bank_name}
                              onChange={(e) => updatePayment(pmt.id, "cheque_details", { ...pmt.cheque_details, bank_name: e.target.value })}
                              className="h-9 font-bold text-xs rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Cheque Number</label>
                            <Input
                              placeholder="Serial #"
                              value={pmt.cheque_details?.cheque_number}
                              onChange={(e) => updatePayment(pmt.id, "cheque_details", { ...pmt.cheque_details, cheque_number: e.target.value })}
                              className="h-9 font-bold text-xs rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Cheque Date</label>
                            <Input
                              type="date"
                              value={pmt.cheque_details?.cheque_date}
                              onChange={(e) => updatePayment(pmt.id, "cheque_details", { ...pmt.cheque_details, cheque_date: e.target.value })}
                              className="h-9 font-bold text-xs rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Payee Name</label>
                            <Input
                              placeholder="Optional"
                              value={pmt.cheque_details?.payee_payor_name}
                              onChange={(e) => updatePayment(pmt.id, "cheque_details", { ...pmt.cheque_details, payee_payor_name: e.target.value })}
                              className="h-9 font-bold text-xs rounded-lg"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-xl border border-border shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/30 px-6 py-4">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Attachment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <FormField
                    control={form.control}
                    name="attachment"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-col items-center justify-center border border-dashed border-input rounded-xl p-8 hover:bg-accent/50 transition-all cursor-pointer relative group">
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => onChange(e.target.files?.[0])}
                              {...fieldProps}
                            />
                            {value ? (
                              <div className="flex flex-col items-center gap-3">
                                {value?.type?.startsWith("image/") ? (
                                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border shadow-sm">
                                    <img
                                      src={URL.createObjectURL(value)}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                      onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                    />
                                  </div>
                                ) : (
                                  <Receipt className="h-8 w-8 text-primary" />
                                )}
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-foreground truncate max-w-[150px] font-medium">
                                    {value.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {(value.size / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-destructive hover:bg-destructive/10 text-[11px] underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    onChange(null);
                                  }}
                                >
                                  Remove & Replace
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-muted-foreground text-center">
                                <Upload className="h-8 w-8 opacity-40 group-hover:text-primary group-hover:opacity-100 transition-all" />
                                <div className="space-y-1">
                                  <span className="text-xs text-foreground block">Upload Receipt</span>
                                  <span className="text-[11px] opacity-60 block">JPG, PNG, PDF (Max 5MB)</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="bg-muted/30 border border-border rounded-xl p-6 space-y-4">
                <h3 className="text-xs font-medium text-foreground border-b border-border pb-2">
                  Expense Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Recorded Subtotal</span>
                    <span className="font-medium text-foreground tabular-nums">{formatCurrency(totalPayments)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Estimated Tax</span>
                    <span className="font-medium text-foreground tabular-nums">{formatCurrency(0)}</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Net Expenditure</span>
                    <span className="text-2xl font-bold text-destructive tabular-nums">
                      {formatCurrency(totalPayments)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || totalPayments <= 0}
                  className="w-full h-11 bg-primary text-primary-foreground font-medium rounded-md shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  {isSubmitting ? "Processing..." : "Finalize & Record"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="w-full h-11 text-muted-foreground text-xs tracking-wide rounded-md shadow-sm"
                >
                  Discard & Exit
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      <ExpenseCategorySheet
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        onSuccess={() => {
          fetchCategories();
        }}
      />
    </div>
  );
}

