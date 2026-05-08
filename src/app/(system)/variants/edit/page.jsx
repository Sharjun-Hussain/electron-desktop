"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { ProductVariantForm } from "@/components/variants/new/variant-form";
import { ProductFormSkeleton } from "@/app/skeletons/products/product-form-skeleton";
import { toast } from "sonner";

export default function EditVariantPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVariant = async () => {
      if (!searchParams.get('id') || !session?.accessToken) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/variants/${searchParams.get('id')}`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }
        );
        const result = await response.json();

        if (result.status === "success") {
          setVariant(result.data);
        } else {
          toast.error(result.message || "Failed to load variant");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Network error while loading variant");
      } finally {
        setLoading(false);
      }
    };

    fetchVariant();
  }, [searchParams.get('id'), session]);

  if (loading) return <ProductFormSkeleton />;
  if (!variant) return <div className="p-8 text-center text-muted-foreground">Variant not found</div>;

  return (
    <div>
      <ProductVariantForm initialData={variant} />
    </div>
  );
}
