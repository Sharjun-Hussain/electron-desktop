"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form"; // --- CHANGED ---
import { z } from "zod";
import { LoaderIcon, Plus, PlusCircle, Save, Trash2, X } from "lucide-react"; // --- CHANGED ---
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { useFormRestore } from "@/hooks/use-form-restore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // --- CHANGED ---
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // --- NEW ---
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea"; // --- NEW ---

// --- CHANGED --- Updated regex
const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

// --- CHANGED --- New schema for Suppliers
export const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Supplier name must be at least 2 characters." }),
  code: z
    .string()
    .min(3, { message: "Supplier code must be at least 3 characters." }),
  company_name: z.string().optional().or(z.literal("")),
  contact_person_name: z
    .string()
    .min(2, { message: "Contact person name is required." }),
  contact_person_phone: z
    .string()
    .regex(phoneRegex, "Invalid contact person phone number"),
  alternate_phone: z
    .string()
    .regex(phoneRegex, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().min(2, { message: "Address is required." }),
  city: z.string().min(2, { message: "City is required." }),
  state: z.string().min(2, { message: "State is required." }),
  country: z.string().min(2, { message: "Country is required." }),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  whatsapp: z
    .string()
    .regex(phoneRegex, "Invalid WhatsApp number")
    .optional()
    .or(z.literal("")),
  fax: z.string().optional().or(z.literal("")),
  email: z.string().email({ message: "Please enter a valid email address." }),
  website: z
    .string()
    .url("Must be a valid URL (e.g., https://example.com)")
    .optional()
    .or(z.literal("")),
  description: z.string().optional().or(z.literal("")),

  // --- NEW --- Handle bank accounts as an array of objects
  bank_accounts: z
    .array(
      z.object({
        bank_name: z.string().min(2, "Bank name is required."),
        account_holder_name: z
          .string()
          .min(2, "Account holder name is required."),
        branch_name: z.string().min(2, "Branch name is required."),
        account_number: z.string().min(5, "Account number is required."),
        is_default: z.boolean().default(false),
      })
    )
    .optional(),
});

// --- CHANGED --- Renamed to SupplierForm
export function SupplierForm({ initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const router = useRouter();

  const isEditMode = !!initialData;

  // --- NEW --- Helper function to "zip" parallel arrays into an object array
  const transformInitialData = (data) => {
    if (!data?.bank_names) {
      return [];
    }
    return data.bank_names.map((bankName, index) => ({
      bank_name: bankName,
      account_holder_name: data.account_holder_names?.[index] || "",
      branch_name: data.branch_names?.[index] || "",
      account_number: data.account_numbers?.[index] || "",
      is_default: !!data.is_default?.[index], // Convert 1/0 to true/false
    }));
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    // --- CHANGED --- Set default values based on supplier data
    defaultValues: initialData
      ? {
          ...initialData,
          website: initialData.website || "",
          alternate_phone: initialData.alternate_phone || "",
          whatsapp: initialData.whatsapp || "",
          fax: initialData.fax || "",
          description: initialData.description || "",
          company_name: initialData.company_name || "",
          bank_accounts: initialData.bank_accounts || [],
        }
      : {
          name: "",
          code: "",
          company_name: "",
          contact_person_name: "",
          contact_person_phone: "",
          alternate_phone: "",
          address: "",
          city: "",
          state: "",
          country: "",
          phone: "",
          whatsapp: "",
          fax: "",
          email: "",
          website: "",
          description: "",
          bank_accounts: [], // Default to empty array
        },
  });

  const { clearSavedData } = useFormRestore(form);

  // --- NEW --- `useFieldArray` for dynamic bank account fields
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bank_accounts",
  });

  async function onSubmit(data) {
    if (!accessToken) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();

    // --- CHANGED --- Append all supplier fields
    formData.append("name", data.name);
    formData.append("code", data.code);
    formData.append("email", data.email);
    formData.append("city", data.city);
    formData.append("phone", data.phone);
    formData.append("contact_person_name", data.contact_person_name);
    formData.append("contact_person_phone", data.contact_person_phone);
    formData.append("address", data.address);
    formData.append("state", data.state);
    formData.append("country", data.country);

    // Append optional fields only if they exist
    if (data.company_name) formData.append("company_name", data.company_name);
    if (data.alternate_phone)
      formData.append("alternate_phone", data.alternate_phone);
    if (data.whatsapp) formData.append("whatsapp", data.whatsapp);
    if (data.fax) formData.append("fax", data.fax);
    if (data.website) formData.append("website", data.website);
    if (data.description) formData.append("description", data.description);

    // --- NEW --- Transform bank_accounts array back into parallel arrays for the API
    if (data.bank_accounts) {
      data.bank_accounts.forEach((account) => {
        formData.append("bank_names[]", account.bank_name);
        formData.append("account_holder_names[]", account.account_holder_name);
        formData.append("branch_names[]", account.branch_name);
        formData.append("account_numbers[]", account.account_number);
        formData.append("is_default[]", account.is_default ? "1" : "0");
      });
    }

    // --- CHANGED --- Update API URL
    const url = isEditMode
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${initialData.id}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers`;

    const method = "POST"; // Use POST for FormData, backend will use _method

    if (isEditMode) {
      formData.append("_method", "PATCH");
    }

    try {
      const response = await fetch(url, {
        method: method, // Always POST when using FormData for PATCH
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // 'Content-Type': 'multipart/form-data' is set automatically by browser
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${isEditMode ? "update" : "create"} supplier.`
        );
      }

      toast.success(
        `Supplier ${isEditMode ? "updated" : "created"} successfully!`
      );

      router.refresh();
      clearSavedData();
      router.back(); // Navigate back on success
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "An unexpected error occurred.");
      setIsSubmitting(false); // Only set to false on error
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Global Electronics Ltd"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., SUP001"
                        {...field}
                        disabled={isSubmitting || isEditMode}
                      />
                    </FormControl>
                    <FormDescription>
                      Cannot be changed after creation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Global Electronics Limited"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contact_person_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., John Smith"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_person_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+2348012345678"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+234012345678"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alternate_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="e.g., +2348098765432"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+2348098765432"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fax (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+234012345678"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address & Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Main Street"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Lagos"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Lagos"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Nigeria"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any notes about the supplier..."
                      className="resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* --- NEW --- Bank Accounts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border rounded-lg relative space-y-4"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-destructive"
                  onClick={() => remove(index)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name={`bank_accounts.${index}.bank_name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., First Bank"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`bank_accounts.${index}.account_holder_name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Global Electronics Ltd"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`bank_accounts.${index}.branch_name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Victoria Island"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`bank_accounts.${index}.account_number`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="e.g., 1234567890"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`bank_accounts.${index}.is_default`}
                  render={({ field }) => (
                    <FormField
                      control={form.control}
                      name={`bank_accounts.${index}.is_default`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                // `checked` is the new state (true or false)

                                // We only need custom logic if it's being checked *true*
                                if (checked) {
                                  // Get all current bank account values
                                  const currentAccounts =
                                    form.getValues("bank_accounts");

                                  // Create a new array
                                  const newAccounts = currentAccounts.map(
                                    (account, i) => ({
                                      ...account,
                                      // Set is_default to true only for the current index (i === index)
                                      // Set all other items to false
                                      is_default: i === index,
                                    })
                                  );

                                  // Update the entire array in the form state
                                  form.setValue("bank_accounts", newAccounts, {
                                    shouldDirty: true, // Mark the form as dirty
                                  });
                                } else {
                                  // If it's being unchecked, just update this one field to false
                                  // (This allows having *no* default)
                                  field.onChange(false);
                                }
                              }}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormLabel>Set as default account</FormLabel>
                        </FormItem>
                      )}
                    />
                  )}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                append({
                  bank_name: "",
                  account_holder_name: "",
                  branch_name: "",
                  account_number: "",
                  is_default: false,
                })
              }
              disabled={isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Bank Account
            </Button>
          </CardContent>
        </Card>

        {/* --- CHANGED --- Updated buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            <X/> Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <LoaderIcon className="h-4 w-4 animate-spin" /> Saving...
              </span>
            ) : isEditMode ? (
              <>
              <Save/>
              Save Changes
              </>
            ) : (
              <>
              <Plus/>
              Create Supplier
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
