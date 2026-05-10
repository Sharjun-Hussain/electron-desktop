"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Calendar as CalendarIcon, 
  Upload, 
  Receipt,
  FileEdit,
  Wallet,
  Banknote,
  CreditCard as CardIcon,
  Landmark
} from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAppSettings } from "@/app/hooks/useAppSettings";

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

export default function EditExpense({ id }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState([]);
  const [initialData, setInitialData] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      category_id: "",
      amount: 0,
      payment_method: "cash",
      reference_no: "",
      note: "",
      cheque_details: {
        bank_name: "",
        cheque_number: "",
        cheque_date: "",
        payee_payor_name: "",
      },
    },
  });

  useEffect(() => {
    async function fetchData() {
      if (!session?.accessToken || !id) return;
      try {
        setFetching(true);
        const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const catData = await catRes.json();
        if (catData.status === "success") {
          setCategories(catData?.data?.data || catData?.data || []);
        }

        const expRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses/${id}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const expData = await expRes.json();
        if (expData.status === "success") {
          const exp = expData.data;
          setInitialData(exp);
          form.reset({
            date: new Date(exp.expense_date),
            category_id: exp.category_id?.toString() || exp.expense_category_id?.toString(),
            amount: parseFloat(exp.amount),
            payment_method: exp.payment_method,
            reference_no: exp.reference_no || "",
            note: exp.notes || "",
            cheque_details: exp.cheque_details || {
              bank_name: "",
              cheque_number: "",
              cheque_date: "",
              payee_payor_name: "",
            },
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load data");
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [session, id, form]);

  async function onSubmit(data) {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        expense_date: format(data.date, "yyyy-MM-dd"),
        notes: data.note,
        expense_category_id: data.category_id
      };
      
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      if (data.attachment) {
        formData.append("attachment", data.attachment);
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to update expense");
      }

      toast.success("Expense updated successfully");
      router.push("/expenses");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update expense");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-sm">
              <FileEdit className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Update Expense</h1>
              <p className="text-xs text-muted-foreground mt-0.5 opacity-60">Edit and refine expenditure details</p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-9 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Directory
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Expense Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-medium">Expense Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full h-10 pl-3 text-left font-normal border-input hover:border-accent transition-colors bg-background rounded-md shadow-sm",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                        <FormLabel className="text-sm font-medium">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 border-gray-200">
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Amount (LKR)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            className="h-9 border-gray-200 shadow-none focus-visible:ring-emerald-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Payment Mode</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 border-input bg-background rounded-md shadow-sm">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-md shadow-lg">
                            <SelectItem value="cash">
                              <div className="flex items-center gap-2">
                                <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Cash</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="bank_transfer">
                              <div className="flex items-center gap-2">
                                <Landmark className="h-3.5 w-3.5 text-blue-500" />
                                <span>Bank Transfer</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="cheque">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-3.5 w-3.5 text-amber-500" />
                                <span>Cheque</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="credit_card">
                              <div className="flex items-center gap-2">
                                <CardIcon className="h-3.5 w-3.5 text-purple-500" />
                                <span>Credit Card</span>
                              </div>
                            </SelectItem>
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
                        <FormLabel className="text-sm font-medium">Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Invoice #, Receipt #" className="h-9 border-gray-200 shadow-none focus-visible:ring-emerald-500" {...field} />
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
                        <FormLabel className="text-sm font-medium">Expenditure Note</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="resize-none min-h-[80px] border-gray-200 bg-background shadow-none focus-visible:ring-emerald-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-6 space-y-4">
                <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider border-b border-emerald-100 pb-2">
                  Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-foreground">LKR {form.watch("amount")?.toLocaleString() || "0.00"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-semibold text-foreground">LKR 0.00</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-100 flex justify-between items-center">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-xl font-bold text-red-600 tabular-nums">LKR {form.watch("amount")?.toLocaleString() || "0.00"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary text-primary-foreground font-medium rounded-md shadow-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  {isSubmitting ? "Updating..." : "Finalize Changes"}
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
              
              <Card className="rounded-xl border border-border shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/30 px-6 py-4">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Upload New Receipt
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <FormField
                    control={form.control}
                    name="attachment"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-col items-center justify-center border border-dashed border-input rounded-xl p-6 hover:bg-accent/50 transition-all cursor-pointer relative group">
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => onChange(e.target.files?.[0])}
                              {...fieldProps}
                            />
                            {value ? (
                              <div className="flex flex-col items-center gap-3">
                                {value.type?.startsWith("image/") ? (
                                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border shadow-sm">
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
                                  Clear
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-muted-foreground text-center">
                                <Upload className="h-6 w-6 opacity-40 group-hover:text-primary transition-all" />
                                <span className="text-xs text-foreground block">Click to replace receipt</span>
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

              {initialData?.receipt_image && (
                <Card className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                   <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Current Receipt
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${initialData.receipt_image}`} 
                      alt="Current receipt" 
                      className="rounded-lg border border-gray-100 w-full h-40 object-cover"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
