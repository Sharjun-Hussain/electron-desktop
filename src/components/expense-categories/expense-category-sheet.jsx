"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, FolderDown, X, Tag, FileText, CheckCircle2 } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export function ExpenseCategorySheet({ isOpen, onClose, onSuccess, initialData }) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name || "",
          description: initialData.description || "",
          is_active: initialData.is_active === 1 || initialData.is_active === true,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          is_active: true,
        });
      }
    }
  }, [isOpen, initialData, form]);

  async function onSubmit(data) {
    try {
      setIsSubmitting(true);

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          ...data,
          is_active: data.is_active ? 1 : 0
        }),
      });

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'create'} category`);
      }

      toast.success(`Expense category ${isEditing ? 'updated' : 'created'} successfully`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} category`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden bg-white">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <FolderDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-foreground tracking-tight">
                {isEditing ? "Edit Category" : "Add Category"}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isEditing ? "Modify expense category details" : "Create a new expense category"}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 font-sans">
          <Form {...form}>
            <form id="expense-category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Category Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input
                          placeholder="e.g., Utilities, Rent, Marketing"
                          className="h-10 pl-9 border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Description
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                        <Textarea
                          placeholder="Briefly describe what this category covers..."
                          className="pl-9 resize-none min-h-[100px] border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <FormLabel className="text-sm font-medium text-foreground">
                          Active Status
                        </FormLabel>
                      </div>
                      <FormDescription className="text-[12px] text-muted-foreground">
                        Inactive categories cannot be selected for new expenses
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 font-semibold border-gray-200"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="expense-category-form"
              disabled={isSubmitting}
              className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  <FolderDown className="mr-2 h-4 w-4" />
                  {isEditing ? "Update Category" : "Save Category"}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}