"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

import CreatePurchaseOrder from "@/components/purchase/Purchase-orders/create/purchase-order-form";
import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const id = searchParams.get('poid');
  const { setBreadcrumb } = useBreadcrumbStore();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken && id) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${id}`,
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch purchase order details");
          }

          const result = await response.json();

          if (result.status === "success") {
            setData(result.data);
            // Set Breadcrumb Label
            const label = result.data.po_number || `PO #${result.data.id}`;
            setBreadcrumb(id, label);
            // Set Document Title
            document.title = `Edit ${label} | Inzeedo POS`;
          } else {
            throw new Error(result.message || "Failed to load data");
          }
        } catch (err) {
          console.error(err);
          setError(err.message);
          toast.error("Failed to load purchase order");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [status, session, id, setBreadcrumb]);

  if (isLoading || status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Error Loading Order</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return <CreatePurchaseOrder initialData={data} />;
}
