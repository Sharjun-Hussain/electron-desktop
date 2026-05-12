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

// Session-level flag to prevent redundant fetching within the same application session
let hasFetchedInSession = false;

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

      // Optimized pre-grouping of variants to avoid O(n²) lookups
      const variantsByProduct = localVariants.reduce((acc, v) => {
        if (!acc[v.productId]) acc[v.productId] = [];
        acc[v.productId].push(v);
        return acc;
      }, {});
      
      // We need to re-group variants into products for allProducts state
      const grouped = localProducts.map(p => ({
        ...p,
        variants: variantsByProduct[p.id] || []
      }));

      setAllProducts(grouped);
      setFlattenedVariants(localVariants);
      setCustomers(localCustomers);
      setDistributors(localDistributors);
      setActiveEmployees(localEmployees);
      console.log("Loaded POS data from IndexedDB (Offline Mode)");
      return localProducts.length > 0;
    } catch (err) {
      console.error("Failed to load from IndexedDB:", err);
      return false;
    }
  }, []);

  const fetchData = useCallback(async (force = false) => {
    // 1. Always prioritize fast local loading first
    const hasDataLocally = allProducts.length > 0;
    if (!hasDataLocally) {
      const dataFound = await loadFromDB();
      // If we found local data, we can stop "initial loading" state immediately
      if (dataFound) {
        setIsLoading(false);
      }
    }

    // 2. Decide if we need to fetch from network
    if (!session?.accessToken) {
      setIsLoading(false);
      return;
    }

    // If we've already synced in this session and aren't forcing, stop here
    if (hasFetchedInSession && !force) {
      setIsLoading(false);
      return;
    }
    
    // Check if browser is online
    if (!navigator.onLine) {
       setIsOffline(true);
       setIsLoading(false);
       return;
    }

    try {
      // Define endpoints to fetch
      const endpoints = [
        { key: 'products', url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=1000` },
        { key: 'customers', url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/active/list` },
        { key: 'distributors', url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors/active/list` },
        { key: 'sellers', url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/active-sellers` },
      ];

      // Fetch all with Settled to prevent one failure from blocking others
      const results = await Promise.allSettled(
        endpoints.map(e => 
          fetch(e.url, { 
            headers: { Authorization: `Bearer ${session.accessToken}` },
            signal: AbortSignal.timeout(15000) // 15s timeout for large datasets
          }).then(async res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
        )
      );

      let processedProducts = [];
      let processedCustomers = [];
      let processedDistributors = [];
      let processedEmployees = [];

      // Helper to check if a result was successful
      const isSuccess = (res) => res.status === 'fulfilled' && res.value.status === 'success';

      // 1. Handle Products
      if (isSuccess(results[0])) {
        const prodData = results[0].value;
        const rawProductList = prodData.data.data || [];

        const businessType = (session?.user?.organization?.business_type || "").toLowerCase();
        const isManufacturing = businessType === "manufacturing";
        
        const filteredList = isManufacturing
          ? rawProductList.filter(p => {
              const type = (p.product_type || "").toLowerCase();
              return type === "finished good" || type === "";
            })
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
              mrpPrice: parseFloat(v.mrp_price) || 0,
              wholesalePrice: parseFloat(v.wholesale_price) || 0,
              image: getImageUrl(v.image) || getImageUrl(p.image),
              stock: (v.stocks || []).reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0),
            };
          }),
        }));

        const variantsFlat = processedProducts.flatMap((p) => p.variants);
        setAllProducts(processedProducts);
        setFlattenedVariants(variantsFlat);
        setIsOffline(false);
      }

      // 2. Handle Customers
      if (isSuccess(results[1])) {
        processedCustomers = results[1].value.data;
        setCustomers(processedCustomers);
      }

      // 3. Handle Distributors
      if (isSuccess(results[2])) {
        processedDistributors = results[2].value.data;
        setDistributors(processedDistributors);
      }

      // 4. Handle Sellers
      if (isSuccess(results[3])) {
        processedEmployees = results[3].value.data;
        setActiveEmployees(processedEmployees);
      }

      // Sync successful results to IndexedDB
      await syncMasterData({
        products: processedProducts.length > 0 ? processedProducts : undefined,
        customers: processedCustomers.length > 0 ? processedCustomers : undefined,
        distributors: processedDistributors.length > 0 ? processedDistributors : undefined,
        employees: processedEmployees.length > 0 ? processedEmployees : undefined
      });

      hasFetchedInSession = true;
    } catch (error) {
      console.error("Error syncing POS data:", error);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [session, loadFromDB, allProducts.length]);

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
    refetch: () => fetchData(true)
  };
}
