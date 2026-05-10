"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { useFormRestore } from "@/hooks/use-form-restore";

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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 letters"),
  description: z.string().optional(),
});

export function BrandDrawer({ open, onOpenChange, onSuccess, session, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { clearSavedData } = useFormRestore(form, "brand_drawer_form");

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data) => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands`;
      
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
        toast.success(`Brand ${isEditing ? "updated" : "added"} successfully`);
        onSuccess(result.data);
        onOpenChange(false);
        clearSavedData();
        form.reset();
      } else {
        toast.error(result.message || `Failed to ${isEditing ? "update" : "add"} brand`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[480px] rounded-l-3xl border-l border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-y-auto">
        <SheetHeader className="p-6 pb-0">
          <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
            <Tag className="size-6 text-emerald-600" />
          </div>
          <SheetTitle className="text-xl font-bold ">
            {isEditing ? "Edit Brand" : "Add New Brand"}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground/60">
            {isEditing
              ? "Update your brand details here."
              : "Add a new brand for your items."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 pt-4 space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-muted-foreground ml-1">Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Nike, Apple, Samsung" 
                      className="bg-background border-border/60 rounded-xl px-4 py-2 text-sm shadow-sm focus:ring-emerald-500/20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500 ml-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-muted-foreground ml-1">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Give a short description of this brand..."
                      className="min-h-[120px] bg-background border-border/60 rounded-xl px-4 py-3 text-sm shadow-sm focus:ring-emerald-500/20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500 ml-1" />
                </FormItem>
              )}
            />
            <div className="pt-4 flex flex-col gap-3">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 border-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {isEditing ? "Update Brand" : "Add Brand"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-full py-2 font-semibold text-muted-foreground hover:text-foreground transition-all"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
