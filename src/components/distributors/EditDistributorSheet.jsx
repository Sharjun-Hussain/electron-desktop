"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, X, MapPin, Mail, Phone, Network, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/auth/DesktopAuthProvider";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(2, "Partner name must be at least 2 characters"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  phone: z.string().min(10, "Contact number must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters").or(z.literal("")),
  credit_limit: z.string().or(z.number()).transform(v => parseFloat(v) || 0),
  is_active: z.boolean().default(true),
});

export function EditDistributorSheet({ distributor, open, onOpenChange, onSave }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      credit_limit: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (distributor && open) {
      form.reset({
        name: distributor.name || "",
        email: distributor.email || "",
        phone: distributor.phone || "",
        address: distributor.address || "",
        credit_limit: parseFloat(distributor.credit_limit || 0),
        is_active: !!distributor.is_active,
      });
    }
  }, [distributor, open, form]);

  const onSubmit = async (data) => {
    if (!session?.accessToken || !distributor) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors/${distributor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.status === "success") {
        toast.success("Wholesale partner profile updated");
        onSave();
        onOpenChange(false);
      } else {
        toast.error(result.message || "Failed to update distributor");
      }
    } catch (error) {
      console.error("Error updating distributor:", error);
      toast.error("An error occurred during profile update");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] p-0 flex flex-col h-full border-l border-border/50">
        <SheetHeader className="px-8 py-6 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-md">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <SheetTitle className="text-xl font-bold text-foreground">
              Modify Partner Profile
            </SheetTitle>
          </div>
          <SheetDescription className="text-sm text-muted-foreground">
            Update wholesale partnership details and credit terms.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 bg-card">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                   <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-foreground">Business Identity</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">Active Status</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-foreground">Distributor / Business Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Global Distribution Ltd"
                          className="shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="font-semibold text-foreground">Direct Contact</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="077 123 4567"
                            className="shadow-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="font-semibold text-foreground">Business Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="partners@business.com"
                            className="shadow-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-2 pt-4 pb-2 border-b border-border">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-foreground">Logistics Hub</h3>
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-foreground">Warehouse / Office Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Warehouse Location, City..."
                          className="min-h-[80px] resize-y shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2 pt-4 pb-2 border-b border-border">
                  <Network className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-foreground">Financial Terms</h3>
                </div>

                <FormField
                  control={form.control}
                  name="credit_limit"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-foreground">Authorized Credit Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="shadow-sm font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="px-8 py-5 border-t border-border bg-background flex flex-row items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto font-semibold"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>

          <Button
            className="w-full sm:w-auto min-w-[120px] font-semibold shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Profile
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
