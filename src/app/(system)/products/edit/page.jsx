"use client";

// React & Next.js
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Third-party
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { LoaderIcon } from "lucide-react";
import { ProductForm } from "@/components/products/new/product-form";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

export default function EditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const productId = searchParams.get('id');
  const { setBreadcrumb } = useBreadcrumbStore();

  const [productData, setProductData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect for handling authentication status
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  // Effect for fetching Product data
  useEffect(() => {
    // Only fetch data if authenticated and we have a token
    if (status === "authenticated" && accessToken) {
      const fetchProductData = async () => {
        setIsLoading(true);
        setError(null);

        const productApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${productId}`;

        try {
          const response = await fetch(productApiUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch data");
          }

          const data = await response.json();
          if (data.status === "success") {
            setProductData(data.data);
            // Set Breadcrumb Label
            const label = data.data.name || `Product #${data.data.id}`;
            setBreadcrumb(productId, label);
            // Set Document Title
            document.title = `Edit ${label} | Inzeedo POS`;
          } else {
            throw new Error(data.message || "Failed to fetch");
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
          setError(errorMessage);
          toast.error(errorMessage || "Failed to load product data.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProductData();
    }
  }, [status, accessToken, productId, setBreadcrumb]); // 'router' was removed, as it's not used in this effect

  // Wait for both session authentication and data fetching
  if (isLoading || status === "loading") {
    return (
      <div className="flex gap-3 h-[80vh] w-full items-center justify-center">
        <LoaderIcon className="h-6 w-6 animate-spin text-muted-foreground" />{" "}
        Loading product Details ...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center text-red-500">
        <p>Failed to load product data. Please try again.</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* <div className="flex items-center justify-between space-y-2 mb-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
          <p className="text-muted-foreground">
            Fill in the details below to edit this product.
          </p>
        </div>
      </div> */}
      {productData && <ProductForm initialData={productData} />}
    </div>
  );
}
