"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, X, MapPin, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useFormRestore } from "@/hooks/use-form-restore";

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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  phone: z.string().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters").or(z.literal("")),
});

export function AddCustomerSheet({ open, onOpenChange, onAdd }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const { clearSavedData } = useFormRestore(form);

  const onSubmit = async (data) => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.status === "success") {
        toast.success("Customer profile registered successfully");
        onAdd();
        onOpenChange(false);
        clearSavedData();
        form.reset();
      } else {
        toast.error(result.message || "Failed to add customer");
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("An error occurred during registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] p-0 flex flex-col h-full border-l border-border/50">
        <SheetHeader className="px-8 py-6 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <SheetTitle className="text-xl font-bold text-foreground">
              Register Customer
            </SheetTitle>
          </div>
          <SheetDescription className="text-sm text-muted-foreground">
            Register a new client relationship in the registry.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 bg-card">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-foreground">Core Identity</h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-foreground">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Johnathan Smith"
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
                        <FormLabel className="font-semibold text-foreground">Contact Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="0771234567"
                            className="shadow-sm"
                            {...field}
                            onKeyDown={(e) => {
                              if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab" && e.key !== "Enter" && e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Delete") {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                              field.onChange(value);
                            }}
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
                        <FormLabel className="font-semibold text-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john@example.com"
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
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-foreground">Geographical Anchor</h3>
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-foreground">Primary Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Street, City, Province..."
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
            className="w-full sm:w-auto min-w-[120px] font-semibold shadow-sm"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Register Customer
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
