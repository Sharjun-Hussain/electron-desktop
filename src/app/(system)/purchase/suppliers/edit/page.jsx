"use client";

// React & Next.js
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Third-party
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { Loader2, LoaderIcon } from "lucide-react";

// Local UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupplierForm } from "@/components/purchase/suppliers/new/supplier-form";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

export default function EditSupplierPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const supplierId = searchParams.get('id');
  const { setBreadcrumb } = useBreadcrumbStore();

  const [supplierData, setSupplierData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect for handling authentication status
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  // Effect for fetching supplier data
  useEffect(() => {
    // Only fetch data if authenticated and we have a token
    if (status === "authenticated" && accessToken) {
      const fetchSupplierData = async () => {
        setIsLoading(true);
        setError(null);

        const supplierApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplierId}`;

        try {
          const response = await fetch(supplierApiUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch data");
          }

          const data = await response.json();
          if (data.status === "success") {
            setSupplierData(data.data);
            // Set Breadcrumb Label
            const label = data.data.name || `Supplier #${data.data.id}`;
            setBreadcrumb(supplierId, label);
            // Set Document Title
            document.title = `Edit ${label} | Inzeedo POS`;
          } else {
            throw new Error(data.message || "Failed to fetch");
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
          setError(errorMessage);
          toast.error(errorMessage || "Failed to load supplier data.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSupplierData();
    }
  }, [status, accessToken, supplierId, setBreadcrumb]); // 'router' was removed, as it's not used in this effect

  // Wait for both session authentication and data fetching
  if (isLoading || status === "loading") {
    return (
      <div className="flex gap-3 h-[80vh] w-full items-center justify-center">
        <LoaderIcon className="h-6 w-6 animate-spin text-muted-foreground" />{" "}
        Loading Supplier Details ...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center text-red-500">
        <p>Failed to load supplier data. Please try again.</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 pt-3">
      <div className="flex items-center justify-between space-y-2 mb-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Supplier</h2>
          <p className="text-muted-foreground">
            Fill in the details below to edit this supplier.
          </p>
        </div>
      </div>
      {supplierData && <SupplierForm initialData={supplierData} />}
    </div>
  );
}
