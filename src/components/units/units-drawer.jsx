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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  short_name: z.string().min(1, "Short name is required"),
});

export function UnitDrawer({ open, onOpenChange, onSuccess, session, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      short_name: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        short_name: initialData.short_name || "",
      });
    } else {
      form.reset({
        name: "",
        short_name: "",
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
      <SheetContent className="sm:max-w-md flex flex-col h-full bg-white dark:bg-card p-0 overflow-hidden border-l border-slate-100 dark:border-border/60 shadow-2xl">
        <SheetHeader className="p-6 border-b border-slate-100 dark:border-border/50 bg-slate-50/50 dark:bg-muted/30">
          <SheetTitle className="text-xl font-bold text-slate-900 dark:text-foreground">
            {isEditing ? "Edit Unit" : "Create Unit"}
          </SheetTitle>
          <SheetDescription className="text-xs font-bold text-[#10b981]   mt-1.5 opacity-80">
            {isEditing ? "Update Unit Profile" : "New Unit Configuration"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs  font-bold text-slate-500 dark:text-muted-foreground  pl-1 mb-2 block">
                      Unit Name
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Kilogram" 
                        className="h-11 bg-white dark:bg-background border-slate-200 dark:border-border/60 focus-visible:ring-[#10b981]/20 focus-visible:border-[#10b981] font-bold text-slate-900 dark:text-foreground placeholder:font-medium placeholder:text-slate-400 rounded-md transition-all"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="short_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs  font-bold text-slate-500 dark:text-muted-foreground  pl-1 mb-2 block">
                      Short Name
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. kg" 
                        className="h-11 bg-white dark:bg-background border-slate-200 dark:border-border/60 focus-visible:ring-[#10b981]/20 focus-visible:border-[#10b981] font-bold font-mono text-slate-900 dark:text-foreground placeholder:font-medium placeholder:text-slate-400 rounded-md transition-all"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <SheetFooter className="p-6 border-t border-slate-100 dark:border-border/50 bg-slate-50/50 dark:bg-muted/20 flex-none">
          <div className="flex w-full items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-6 font-bold text-slate-600 dark:text-muted-foreground bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-muted transition-all rounded-md border-slate-200 dark:border-border/50 shadow-sm active:scale-95  text-xs "
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="h-10 px-8 bg-[#10b981] hover:bg-[#0da371] text-white rounded-md font-bold   text-xs shadow-lg shadow-[#10b981]/20 transition-all active:scale-95 border-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Updating" : "Creating"}
                </>
              ) : (
                <>
                  {isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isEditing ? "Commit Changes" : "Register Unit"}
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
