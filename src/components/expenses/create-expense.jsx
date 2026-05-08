"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Save, Calendar as CalendarIcon, Upload, X, Receipt } from "lucide-react";
import { useFormRestore } from "@/hooks/use-form-restore";
import { Button } from "@/components/ui/button";
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

const formSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  category_id: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  payment_method: z.string().min(1, "Payment method is required"),
  reference_no: z.string().optional(),
  note: z.string().optional(),
  attachment: z.any().optional(),
  cheque_details: z.object({
    bank_name: z.string().optional(),
    cheque_number: z.string().optional(),
    cheque_date: z.string().optional(),
    payee_payor_name: z.string().optional(),
  }).optional(),
});

export default function CreateExpense() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      category_id: "",
      amount: 0,
      payment_method: "cash",
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

  useEffect(() => {
    async function fetchCategories() {
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
    }
    fetchCategories();
  }, [session]);

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
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
          <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Record Expense</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Record business expenditure details</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-xl border border-border shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/30 px-6 py-4">
                  <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Header Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Expense Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full h-11 pl-3 text-left font-bold border-border/60 hover:border-emerald-500 transition-colors bg-background rounded-xl",
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
                        <FormLabel className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-border/60 font-bold bg-background rounded-xl">
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
                        <FormLabel className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Invoice #, Receipt #" className="h-11 border-border/60 font-bold bg-background rounded-xl shadow-none focus-visible:ring-emerald-500" {...field} />
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
                        <FormLabel className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Note</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional details about this expense..."
                            className="resize-none min-h-[100px] border-border/60 font-medium bg-background rounded-xl shadow-none focus-visible:ring-emerald-500"
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
              <Card className="rounded-xl border border-border shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/30 px-6 py-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Payment Breakdown
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addPaymentLine} className="h-8 text-[10px] font-black uppercase">
                    Add Method
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {payments.map((pmt, idx) => (
                    <div key={pmt.id} className="group relative flex flex-col gap-4 p-4 bg-muted/10 border border-border/40 rounded-2xl transition-all hover:border-emerald-500/30">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">Method</label>
                          <select
                            value={pmt.method}
                            onChange={(e) => updatePayment(pmt.id, "method", e.target.value)}
                            className="h-10 px-3 text-xs font-bold rounded-xl bg-background border border-border/60 outline-none focus:ring-1 focus:ring-emerald-500 min-w-[140px]"
                          >
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="card">Card Terminal</option>
                            <option value="cheque">Cheque</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">Amount (LKR)</label>
                          <Input
                            type="number"
                            value={pmt.amount}
                            onChange={(e) => updatePayment(pmt.id, "amount", e.target.value)}
                            className="h-10 font-black text-sm bg-background border-border/60 rounded-xl"
                          />
                        </div>
                        {payments.length > 1 && (
                          <div className="pt-5">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removePaymentLine(pmt.id)} className="h-9 w-9 text-red-500 hover:bg-red-50">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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
                  <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
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
                          <div className="flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl p-8 hover:border-emerald-500/50 hover:bg-emerald-50/10 transition-all cursor-pointer relative group">
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => onChange(e.target.files?.[0])}
                              {...fieldProps}
                            />
                            {value ? (
                              <div className="flex flex-col items-center gap-2">
                                <Receipt className="h-8 w-8 text-emerald-600" />
                                <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
                                  {value.name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] font-black uppercase underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    onChange(null);
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-muted-foreground text-center">
                                <Upload className="h-8 w-8 opacity-40 group-hover:text-emerald-500 group-hover:opacity-100 transition-all" />
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-foreground block uppercase">Upload Receipt</span>
                                  <span className="text-[10px] font-medium opacity-60 block">JPG, PNG, PDF (Max 5MB)</span>
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

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
                <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest border-b border-emerald-500/10 pb-2">
                  Expense Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Recorded Subtotal</span>
                    <span className="font-bold text-foreground tabular-nums">LKR {totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Estimated Tax</span>
                    <span className="font-bold text-foreground tabular-nums">LKR 0.00</span>
                  </div>
                  <div className="pt-3 border-t border-emerald-500/20 flex justify-between items-center">
                    <span className="font-black text-xs uppercase text-foreground">Net Expenditure</span>
                    <span className="text-2xl font-black text-red-500 tabular-nums drop-shadow-sm">
                      LKR {totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || totalPayments <= 0}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  {isSubmitting ? "Processing..." : "Finalize & Record"}
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="w-full h-11 font-bold text-muted-foreground uppercase text-[11px] hover:bg-muted/50"
                >
                  Discard Entry
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

