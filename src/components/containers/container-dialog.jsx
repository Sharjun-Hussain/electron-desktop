"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Plus, Check, ChevronsUpDown, Box, X, Info } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  base_unit_id: z.string().optional(),
  measurement_unit_id: z.string().optional(),
  capacity: z.coerce.number().min(0, "Capacity must be positive").optional(),
  description: z.string().optional(),
});

export function ContainerDialog({ open, onOpenChange, onSuccess, session, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState([]);
  const [measurementUnits, setMeasurementUnits] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [openUnitCombobox, setOpenUnitCombobox] = useState(false);
  const [openMeasurementCombobox, setOpenMeasurementCombobox] = useState(false);

  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      base_unit_id: "",
      measurement_unit_id: "",
      capacity: 0,
      description: "",
    },
  });

  // Optimize data fetching with useCallback
  const fetchData = useCallback(async () => {
    if (!session?.accessToken || !open) return;

    setLoadingData(true);
    try {
      const [mUnitsRes, unitsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/measurement-units/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/units/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
      ]);

      const mUnitsData = await mUnitsRes.json();
      const unitsData = await unitsRes.json();

      if (mUnitsData.status === "success") {
        setMeasurementUnits(mUnitsData.data || []);
      }
      if (unitsData.status === "success") {
        setUnits(unitsData.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load unit data");
    } finally {
      setLoadingData(false);
    }
  }, [session?.accessToken, open]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize form reset
  const resetForm = useCallback(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        slug: initialData.slug || "",
        base_unit_id: initialData.base_unit_id?.toString() || "",
        measurement_unit_id: initialData.measurement_unit_id?.toString() || "",
        capacity: initialData.capacity || 0,
        description: initialData.description || "",
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        base_unit_id: "",
        measurement_unit_id: "",
        capacity: 0,
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
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/containers/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/containers`;

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
        toast.success(`Container ${isEditing ? "updated" : "created"} successfully`);
        if (onSuccess) onSuccess(result.data);
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.message || `Failed to ${isEditing ? "update" : "create"} container`);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditing, initialData?.id, session?.accessToken, onSuccess, onOpenChange, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col h-full bg-background border-l shadow-2xl">

        {/* PIPEDRIVE-STYLE HEADER */}
        <SheetHeader className="px-8 py-6 pr-14 border-b border-border bg-background shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                  <Box className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <SheetTitle className="text-xl font-bold text-foreground">
                  {isEditing ? "Edit Container" : "New Container"}
                </SheetTitle>
              </div>
              <SheetDescription className="text-sm text-muted-foreground mt-2">
                {isEditing
                  ? "Update the configuration parameters for this container."
                  : "Register a new storage or measurement vessel."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <Form {...form}>
            <form id="container-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">

              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 20L Drum, Pallet"
                          className="shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="base_unit_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Base Unit</FormLabel>
                        <Popover open={openUnitCombobox} onOpenChange={setOpenUnitCombobox}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between shadow-sm",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? units.find(
                                    (unit) => unit.id.toString() === field.value
                                  )?.name
                                  : "Select unit"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-md">
                            <Command>
                              <CommandInput placeholder="Search unit..." className="h-9" />
                              <CommandList className="max-h-[200px]">
                                <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">No unit found.</CommandEmpty>
                                <CommandGroup>
                                  {units.map((unit) => (
                                    <CommandItem
                                      value={unit.name}
                                      key={unit.id}
                                      onSelect={() => {
                                        form.setValue("base_unit_id", unit.id.toString());
                                        setOpenUnitCombobox(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          unit.id.toString() === field.value
                                            ? "opacity-100 text-emerald-600"
                                            : "opacity-0"
                                        )}
                                      />
                                      {unit.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="measurement_unit_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Measurement Unit</FormLabel>
                        <Popover open={openMeasurementCombobox} onOpenChange={setOpenMeasurementCombobox}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between shadow-sm",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? measurementUnits.find(
                                    (unit) => unit.id.toString() === field.value
                                  )?.name
                                  : "Select unit"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-md">
                            <Command>
                              <CommandInput placeholder="Search unit..." className="h-9" />
                              <CommandList className="max-h-[200px]">
                                <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">No unit found.</CommandEmpty>
                                <CommandGroup>
                                  {measurementUnits.map((unit) => (
                                    <CommandItem
                                      value={unit.name}
                                      key={unit.id}
                                      onSelect={() => {
                                        form.setValue("measurement_unit_id", unit.id.toString());
                                        setOpenMeasurementCombobox(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          unit.id.toString() === field.value
                                            ? "opacity-100 text-emerald-600"
                                            : "opacity-0"
                                        )}
                                      />
                                      {unit.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="shadow-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Identifier (Slug)</FormLabel>
                      <FormControl>
                        <Input placeholder="container-slug" className="shadow-sm" {...field} />
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
                          placeholder="Provide a brief description of this container..."
                          className="resize-y min-h-[100px] shadow-sm"
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
                    Protocol: Accurate container definitions optimize measurement logic and distribution logistics across the catalog.
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
            form="container-form"
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
                {isEditing ? "Save Changes" : "Save Container"}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}