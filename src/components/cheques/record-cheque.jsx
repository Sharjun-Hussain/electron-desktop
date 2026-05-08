"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Save, Calendar as CalendarIcon, Landmark, Check } from "lucide-react";
import { useFormRestore } from "@/hooks/use-form-restore";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  type: z.enum(["receivable", "payable"], { required_error: "Type is required" }),
  cheque_number: z.string().min(1, "Cheque number is required"),
  bank_name: z.string().min(1, "Bank name is required"),
  branch_name: z.string().optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  cheque_date: z.date({ required_error: "Cheque date is required" }),
  received_issued_date: z.date({ required_error: "Received/Issued date is required" }),
  payee_payor_name: z.string().min(1, "Payee/Payor name is required"),
  note: z.string().optional(),
});

export default function RecordCheque() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "receivable",
      cheque_number: "",
      bank_name: "",
      branch_name: "",
      amount: 0,
      cheque_date: new Date(),
      received_issued_date: new Date(),
      payee_payor_name: "",
      note: "",
    },
  });

  const { clearSavedData } = useFormRestore(form, "record_cheque_form");

  const onSubmit = useCallback(async (data) => {
    if (!session?.accessToken) {
      toast.error("Not authenticated");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        ...data,
        cheque_date: format(data.cheque_date, "yyyy-MM-dd"),
        received_issued_date: format(data.received_issued_date, "yyyy-MM-dd"),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cheques`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to record cheque");
      }

      toast.success("Cheque recorded successfully");
      clearSavedData();
      router.push("/cheques");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to record cheque");
    } finally {
      setIsSubmitting(false);
    }
  }, [session?.accessToken, router, clearSavedData]);

  const chequeType = form.watch("type");

  return (
    <div className="flex-1 w-full p-6 lg:p-8 space-y-6">

      {/* PAGE HEADER: Fluid width, aligned perfectly to dashboard padding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Record New Cheque
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Register a new inward or outward cheque instrument.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form id="record-cheque-form" onSubmit={form.handleSubmit(onSubmit)} className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT COLUMN: Primary Financial & Instrument Data */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SECTION: Instrument Details */}
              <Card className="shadow-sm border-border">
                <CardHeader className="px-6 py-4 border-b border-border bg-background">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">Instrument Routing</CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="cheque_number"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-muted-foreground">Serial Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Instrument ID" className="h-9 text-sm bg-white border-gray-200 focus-visible:ring-emerald-500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-muted-foreground">Banking Entity</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Commercial Bank" className="h-9 text-sm bg-white border-gray-200 focus-visible:ring-emerald-500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branch_name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 space-y-1.5">
                        <FormLabel className="text-sm font-medium text-muted-foreground">Branch (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Colombo 03" className="h-9 text-sm bg-white border-gray-200 focus-visible:ring-emerald-500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* SECTION: Financials & Dates */}
              <Card className="shadow-sm border-border">
                <CardHeader className="px-6 py-4 border-b border-border bg-background">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">Financials & Timeline</CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 space-y-1.5">
                        <FormLabel className="text-sm font-medium text-muted-foreground">Nominal Amount (LKR)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">LKR</span>
                            <Input type="number" step="0.01" placeholder="0.00" className="h-9 pl-12 bg-white border-gray-200 focus-visible:ring-emerald-500" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cheque_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col space-y-1.5">
                        <FormLabel className="text-sm font-medium text-muted-foreground mb-1">Maturity Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-9 pl-3 text-left font-normal bg-white border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500",
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
                    name="received_issued_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col space-y-1.5">
                        <FormLabel className="text-sm font-medium text-muted-foreground mb-1">
                          {chequeType === "receivable" ? "Received Date" : "Issued Date"}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-9 pl-3 text-left font-normal bg-white border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500",
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
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Context & Side Actions */}
            <div className="space-y-6">
              
              <Card className="shadow-sm border-border">
                <CardHeader className="px-6 py-4 border-b border-border bg-background">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">Contextual Data</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-muted-foreground">Cheque Nature</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 bg-white border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500">
                              <SelectValue placeholder="Select nature" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="receivable">Receivable (Inward)</SelectItem>
                            <SelectItem value="payable">Payable (Outward)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payee_payor_name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-muted-foreground">
                          {chequeType === "receivable" ? "Payor Stakeholder" : "Payee Stakeholder"}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Legal entity name" className="h-9 bg-white border-gray-200 focus-visible:ring-emerald-500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-muted-foreground">Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional details..."
                            className="resize-none min-h-[100px] bg-white border-gray-200 focus-visible:ring-emerald-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <div className="px-6 py-4 border-t border-border bg-muted/10">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Record Cheque
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Information Tip Card - Cleaner Version */}
              <div className="bg-white border border-border border-l-4 border-l-emerald-500 rounded-lg p-5 shadow-xs">
                <h4 className="text-sm font-bold text-foreground mb-1">
                   Security Notice
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ensure the instrument serial number matches exactly with the banking slip to prevent ledger discrepancies and potential reconciliation issues.
                </p>
              </div>

            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}