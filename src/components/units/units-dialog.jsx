"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  short_name: z.string().min(1, "Short name is required"),
  is_base_unit: z.boolean().default(false),
});

export function UnitDialog({ open, onOpenChange, onSuccess, session, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      short_name: "",
      is_base_unit: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        short_name: initialData.short_name || "",
        is_base_unit: initialData.is_base_unit || false,
      });
    } else {
      form.reset({
        name: "",
        short_name: "",
        is_base_unit: false,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data) => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/units/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/units`;
      
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Unit ${isEditing ? "updated" : "created"} successfully`);
        onSuccess(result.data);
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.message || `Failed to ${isEditing ? "update" : "create"} unit`);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[460px] border-l border-border/40 bg-card/95 backdrop-blur-xl p-0 flex flex-col shadow-2xl">
        <SheetHeader className="p-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="size-10 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
              <Plus className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <SheetTitle className="text-lg font-bold  text-slate-900 dark:text-white truncate">
                {isEditing ? "Edit Unit" : "New Unit"}
              </SheetTitle>
              <SheetDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1  opacity-70 truncate">
                {isEditing
                  ? "Update your catalog's packaging specifics"
                  : "Add a new unit type to your inventory catalog"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form id="unit-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col px-8 py-4 overflow-y-auto space-y-8">
            <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Unit Name (e.g. Kilogram)" 
                          className="h-9 bg-background border-border rounded-md px-3 font-semibold  text-sm shadow-sm transition-all focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-semibold text-red-500/80 ml-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="short_name"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white ml-0.5">Short Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. kg" 
                          className="h-9 bg-background border-border rounded-md px-3 font-mono font-semibold  text-sm shadow-sm transition-all focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-semibold text-red-500/80 ml-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_base_unit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/60 p-4 bg-muted/5">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white">
                          Base Unit
                        </FormLabel>
                        <FormDescription className="text-xs text-slate-500 font-medium">
                          This unit acts as the primary reference for calculations.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="mt-auto">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-md p-4">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold leading-relaxed  opacity-70">
                        Protocol: Precise unit definitions ensure integrity across high-density logistics and stock data.
                    </p>
                </div>
            </div>
          </form>
        </Form>

        <SheetFooter className="p-8 pt-4 pb-8 bg-muted/20 border-t border-border/40 grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-md font-bold text-xs  text-slate-500 hover:text-slate-900 transition-all active:scale-95"
            onClick={() => onOpenChange(false)}
          >
            Dismiss
          </Button>
          <Button 
            type="submit" 
            form="unit-form"
            disabled={isSubmitting}
            className="h-9 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs  shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              <>
                {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {isEditing ? "Save Changes" : "Save Unit"}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
