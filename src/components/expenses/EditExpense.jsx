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
  FileEdit
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
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
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
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
          <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Update Expense</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Edit and refine expenditure details</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                  <CardTitle className="text-sm font-semibold text-foreground">
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
                                  "w-full h-9 pl-3 text-left font-normal border-gray-200 hover:border-emerald-200",
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
                        <FormLabel className="text-sm font-medium">Payment Mode</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 border-gray-200">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
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

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="flex-1 h-10 font-semibold text-muted-foreground border-gray-200"
                >
                  Discard
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? "Updating..." : "Update Expense"}
                </Button>
              </div>

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
