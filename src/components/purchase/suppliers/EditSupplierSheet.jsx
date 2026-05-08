"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  Phone,
  MapPin,
  User,
  Save,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const supplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  contact_person: z.string().min(2, "Contact person is required"),
  address: z.string().min(5, "Address is required"),
});

export function EditSupplierSheet({ open, onOpenChange, supplier, onSuccess }) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      contact_person: "",
      address: "",
    },
  });

  useEffect(() => {
    if (supplier && open) {
      form.reset({
        name: supplier.name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        contact_person: supplier.contact_person || "",
        address: supplier.address || "",
      });
    }
  }, [supplier, open, form]);

  const onSubmit = async (data) => {
    if (!session?.accessToken || !supplier?.id) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplier.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Supplier updated successfully");
        if (onSuccess) onSuccess(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.message || "Failed to update supplier.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected system error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col h-full bg-background border-l shadow-2xl">

        {/* HEADER */}
        <SheetHeader className="px-8 py-6 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <SheetTitle className="text-xl font-bold text-foreground">
              Edit Supplier
            </SheetTitle>
          </div>
          <SheetDescription className="text-sm text-muted-foreground">
            Update the core details and contact information for this vendor.
          </SheetDescription>
        </SheetHeader>

        {/* SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <Form {...form}>
            <form id="edit-supplier-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* COMPANY DETAILS */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-foreground">Company Details</h3>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Supplier Name</FormLabel>
                        <FormControl>
                          <Input className="shadow-sm" placeholder="e.g. Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Primary Contact</FormLabel>
                        <FormControl>
                          <Input className="shadow-sm" placeholder="Full name of representative" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* CONTACT INFORMATION */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-foreground">Contact Information</h3>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Phone Number</FormLabel>
                        <FormControl>
                          <Input className="shadow-sm" placeholder="+94 77 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input className="shadow-sm" type="email" placeholder="vendor@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ADDRESS */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-foreground">Location</h3>
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Registered Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Full address including city and region..."
                          className="min-h-[100px] resize-y shadow-sm"
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
        </div>

        {/* FOOTER: Standard Shadcn theme buttons + Icons */}
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
            type="submit"
            form="edit-supplier-form"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[120px] font-semibold shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}