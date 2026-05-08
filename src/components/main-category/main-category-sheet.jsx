"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Plus, Folder, X, Info } from "lucide-react";
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
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
});

export function MainCategorySheet({ open, onOpenChange, onSuccess, session, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { clearSavedData } = useFormRestore(form, "main_category_sheet_form", open);

  // Memoize form reset to optimize rendering lifecycle
  const resetForm = useCallback(() => {
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

  useEffect(() => {
    resetForm();
  }, [resetForm, open]);

  // Optimize submission handler
  const onSubmit = useCallback(async (data) => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories`;

      const method = isEditing ? "PATCH" : "POST";

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
        toast.success(`Category ${isEditing ? "updated" : "created"} successfully`);
        if (onSuccess) onSuccess(result.data);
        onOpenChange(false);
        clearSavedData();
        form.reset();
      } else {
        toast.error(result.message || `Failed to ${isEditing ? "update" : "create"} category`);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditing, initialData?.id, session?.accessToken, onSuccess, onOpenChange, clearSavedData, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col h-full bg-background border-l shadow-2xl">

        {/* PIPEDRIVE-STYLE HEADER */}
        <SheetHeader className="px-8 py-6 pr-14 border-b border-border bg-background shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                  <Folder className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <SheetTitle className="text-xl font-bold text-foreground">
                  {isEditing ? "Edit Category" : "New Category"}
                </SheetTitle>
              </div>
              <SheetDescription className="text-sm text-muted-foreground mt-2">
                {isEditing
                  ? "Update the institutional details for this category."
                  : "Add a new organizational category to your catalog."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <Form {...form}>
            <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">

              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Category Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Organic Vegetables, Electronics"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a brief description of this category..."
                          className="min-h-[120px] resize-y shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* STANDARD CRM CALLOUT BOX */}
              <div className="mt-auto pt-6">
                <div className="bg-muted/30 border border-border rounded-md p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Organize your products into categories for better inventory management and structured reporting across endpoints.
                  </p>
                </div>
              </div>

            </form>
          </Form>
        </div>

        {/* STANDARD SHADCN FOOTER */}
        <SheetFooter className="px-8 py-5 border-t border-border bg-background flex flex-row items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto font-semibold shadow-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            form="category-form"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[140px] font-semibold shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {isEditing ? "Save Changes" : "Save Category"}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}