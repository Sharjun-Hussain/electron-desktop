"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";

import { db, syncMasterData } from "@/lib/indexedDB/db";

function getImageUrl(imageField) {
  if (!imageField) return null;
  try {
    const images = JSON.parse(imageField);
    if (Array.isArray(images) && images.length > 0) {
      const path = images[0];
      if (path.startsWith("http")) return path;
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "");
      return `${baseUrl}/${encodeURI(path.replace(/\\/g, "/"))}`;
    }
  } catch (e) {
    if (typeof imageField === "string" && imageField.startsWith("http")) return imageField;
    if (typeof imageField === "string" && imageField.length > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "");
      return `${baseUrl}/${encodeURI(imageField.replace(/\\/g, "/"))}`;
    }
  }
  return null;
}

export function usePosData() {
  const { data: session } = useSession();

  const [allProducts, setAllProducts] = useState([]);
  const [flattenedVariants, setFlattenedVariants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const loadFromDB = useCallback(async () => {
    try {
      const localProducts = await db.products.toArray();
      const localVariants = await db.variants.toArray();
      const localCustomers = await db.customers.toArray();
      const localDistributors = await db.distributors.toArray();
      const localEmployees = await db.employees.toArray();

      // We need to re-group variants into products for allProducts state
      const grouped = localProducts.map(p => ({
        ...p,
        variants: localVariants.filter(v => v.productId === p.id)
      }));

      setAllProducts(grouped);
      setFlattenedVariants(localVariants);
      setCustomers(localCustomers);
      setDistributors(localDistributors);
      setActiveEmployees(localEmployees);
      console.log("Loaded POS data from IndexedDB (Offline Mode)");
    } catch (err) {
      console.error("Failed to load from IndexedDB:", err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    
    // Check if browser is online
    if (!navigator.onLine) {
       setIsOffline(true);
       await loadFromDB();
       setIsLoading(false);
       return;
    }

    try {
      const [prodRes, custRes, distRes, sellerRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=1000`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/active-sellers`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
      ]);

      const [prodResult, custResult, distResult, sellerResult] = await Promise.all([
        prodRes.json(),
        custRes.json(),
        distRes.json(),
        sellerRes.json(),
      ]);

      let processedProducts = [];
      let processedCustomers = [];
      let processedDistributors = [];
      let processedEmployees = [];

      if (prodResult.status === "success") {
        const rawProductList = prodResult.data.data || [];

        // For manufacturing businesses, only Finished Goods are sold at POS
        const businessType = (session?.user?.organization?.business_type || "").toLowerCase();
        const isManufacturing = businessType === "manufacturing";
        const filteredList = isManufacturing
          ? rawProductList.filter(p => (p.product_type || "").toLowerCase() === "finished good")
          : rawProductList;

        processedProducts = filteredList.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          image: getImageUrl(p.image),
          category: p.main_category?.name,
          unit: p.unit?.short_name || 'pc',
          variants: (p.variants || []).map((v) => {
            let variantLabel = v.name;
            if (!variantLabel && v.attribute_values && v.attribute_values.length > 0) {
              variantLabel = v.attribute_values.map((av) => av.value).join(" / ");
            }
            return {
              id: v.id,
              productId: p.id,
              name: p.name,
              unit: p.unit?.short_name || 'pc',
              measurementUnit: p.measurement?.short_name || null,
              variantName: variantLabel || "Default",
              fullName: variantLabel ? `${p.name} - ${variantLabel}` : p.name,
              barcode: v.barcode || p.barcode,
              retailPrice: parseFloat(v.price) || 0,
              wholesalePrice: parseFloat(v.wholesale_price) || 0,
              image: getImageUrl(v.image) || getImageUrl(p.image),
              stock: v.stock || 0,
            };
          }),
        }));

        const variantsFlat = processedProducts.flatMap((p) => p.variants);
        setAllProducts(processedProducts);
        setFlattenedVariants(variantsFlat);
        setIsOffline(false);
      }

      if (custResult.status === "success") {
        processedCustomers = custResult.data;
        setCustomers(processedCustomers);
      }

      if (distResult.status === "success") {
        processedDistributors = distResult.data;
        setDistributors(processedDistributors);
      }

      if (sellerResult.status === "success") {
        processedEmployees = sellerResult.data;
        setActiveEmployees(processedEmployees);
      }

      // Sync to IndexedDB
      await syncMasterData({
        products: processedProducts,
        customers: processedCustomers,
        distributors: processedDistributors,
        employees: processedEmployees
      });

    } catch (error) {
      console.error("Error fetching POS data, falling back to IndexedDB:", error);
      setIsOffline(true);
      await loadFromDB();
      toast.error("Offline Mode: Using cached data");
    } finally {
      setIsLoading(false);
    }
  }, [session, loadFromDB]);

  useEffect(() => {
    fetchData();
    if (session?.user?.branches?.length > 0) {
      setSelectedBranch(session.user.branches[0]);
    }
  }, [fetchData, session]);

  const addCustomerToList = useCallback((newCustomer) => {
    setCustomers((prev) => [...prev, newCustomer]);
  }, []);

  const addDistributorToList = useCallback((newDistributor) => {
    setDistributors((prev) => [...prev, newDistributor]);
  }, []);

  return {
    allProducts,
    flattenedVariants,
    customers,
    distributors,
    activeEmployees,
    selectedBranch,
    setSelectedBranch,
    isLoading,
    addCustomerToList,
    addDistributorToList,
    session,
  };
}
