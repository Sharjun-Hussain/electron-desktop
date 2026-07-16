"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { useSettingsStore } from "@/store/useSettingsStore";

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
  const { data: nextAuthSession } = useSession();
  const { session: localSession } = useSettingsStore();
  const session = nextAuthSession || localSession;

  const [allProducts, setAllProducts] = useState([]);
  // flattenedVariants is now memoized based on allProducts and selectedBranch
  const [customers, setCustomers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
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
      const localBranches = await db.branches.toArray();

      // Optimized pre-grouping of variants to avoid O(n²) lookups
      const variantsByProduct = localVariants.reduce((acc, v) => {
        if (!acc[v.productId]) acc[v.productId] = [];
        acc[v.productId].push(v);
        return acc;
      }, {});
      
      // We need to re-group variants into products for allProducts state
      const grouped = localProducts.map(p => {
        const variants = variantsByProduct[p.id] || [];
        const minRetail = variants.length > 0 ? Math.min(...variants.map(v => parseFloat(v.price) || 0)) : 0;
        const minWholesale = variants.length > 0 ? Math.min(...variants.map(v => parseFloat(v.wholesale_price) || parseFloat(v.price) || 0)) : 0;

        return {
          ...p,
          variants,
          minRetail,
          minWholesale
        };
      });

      setAllProducts(grouped);
      setCustomers(localCustomers);
      setDistributors(localDistributors);
      setActiveEmployees(localEmployees);
      setBranches(localBranches);
      console.log("Loaded POS data from IndexedDB (Offline Mode)");
    } catch (err) {
      console.error("Failed to load from IndexedDB:", err);
    }
  }, []);

  const forceReset = useCallback(async () => {
    try {
      setIsLoading(true);
      await db.delete(); // Delete the entire IndexedDB database
      window.location.reload(); // Reload to recreate it and fetch fresh
    } catch (err) {
      console.error("Force reset failed:", err);
      toast.error("Failed to reset local data");
    } finally {
      setIsLoading(false);
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
      // Define endpoints to fetch
      const endpoints = [
        { key: 'products', url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list` },
        { key: 'customers', url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/active/list` },
        { key: 'distributors', url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors/active/list` },
        { key: 'sellers', url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/active-sellers` },
        { key: 'branches', url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list` },
      ];

      // Fetch all with Settled to prevent one failure from blocking others
      const results = await Promise.allSettled(
        endpoints.map(e => 
          fetch(e.url, { 
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(10000) // 10s timeout
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
      let processedBranches = [];

      // Helper to check if a result was successful
      const isSuccess = (res) => res.status === 'fulfilled' && res.value.status === 'success';

      // 1. Handle Products
      if (isSuccess(results[0])) {
        const prodData = results[0].value;
        const rawProductList = prodData.data || [];

        // For manufacturing/restaurant businesses, Raw Materials are not sold directly at POS
        const businessType = (session?.user?.organization?.business_type || "").toLowerCase();
        const isManufacturing = businessType === "manufacturing" || businessType === "manufacturer";
        const isRestaurant = businessType === "restaurant";
        
        const filteredList = (isManufacturing || isRestaurant)
          ? rawProductList.filter(p => p.product_type !== 'Raw Material')
          : rawProductList;

        processedProducts = filteredList.map((p) => {
          const variants = (p.variants || []).map((v) => {
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
              stocks: v.stocks || [],
              stock: (v.stocks || []).reduce((acc, s) => acc + parseFloat(s.quantity || 0), 0),
              batches: v.batches || []
            };
          });

          // Pre-calculate min prices for the grid
          const minRetail = variants.length > 0 ? Math.min(...variants.map(v => v.retailPrice)) : 0;
          const minWholesale = variants.length > 0 ? Math.min(...variants.map(v => v.wholesalePrice || v.retailPrice)) : 0;

          return {
            id: p.id,
            name: p.name,
            code: p.code,
            image: getImageUrl(p.image),
            category: p.main_category?.name,
            unit: p.unit?.short_name || 'pc',
            variants,
            minRetail,
            minWholesale
          };
        });

        // Extract all batches for separate sync if needed by classic-page
        const allBatches = processedProducts.flatMap(p => 
          p.variants.flatMap(v => (v.batches || []).map(b => ({ ...b, variantId: v.id })))
        );

        setAllProducts(processedProducts);
        setIsOffline(false);
      } else {
        console.warn("Product sync failed, using local DB", results[0].reason);
        const localProducts = await db.products.toArray();
        const localVariants = await db.variants.toArray();
        const variantsByProduct = localVariants.reduce((acc, v) => {
          if (!acc[v.productId]) acc[v.productId] = [];
          acc[v.productId].push(v);
          return acc;
        }, {});

        const grouped = localProducts.map(p => ({
          ...p,
          variants: variantsByProduct[p.id] || []
        }));
         setAllProducts(grouped);
      }

      // 2. Handle Customers
      if (isSuccess(results[1])) {
        processedCustomers = results[1].value.data;
        setCustomers(processedCustomers);
      } else {
        console.warn("Customer sync failed", results[1].reason);
        processedCustomers = await db.customers.toArray();
        setCustomers(processedCustomers);
      }

      // 3. Handle Distributors
      if (isSuccess(results[2])) {
        processedDistributors = results[2].value.data;
        setDistributors(processedDistributors);
      } else {
        console.warn("Distributor sync failed", results[2].reason);
        processedDistributors = await db.distributors.toArray();
        setDistributors(processedDistributors);
      }

      // 4. Handle Sellers
      if (isSuccess(results[3])) {
        processedEmployees = results[3].value.data;
        setActiveEmployees(processedEmployees);
      } else {
        console.warn("Seller sync failed", results[3].reason);
        processedEmployees = await db.employees.toArray();
        setActiveEmployees(processedEmployees);
      }

      // 5. Handle Branches
      if (isSuccess(results[4])) {
        processedBranches = results[4].value.data;
        setBranches(processedBranches);
      } else {
        console.warn("Branch sync failed", results[4].reason);
        processedBranches = await db.branches.toArray();
        setBranches(processedBranches);
      }

      // 6. Finalize Sync
      const allBatches = processedProducts.flatMap(p => 
        (p.variants || []).flatMap(v => (v.batches || []).map(b => ({ 
          ...b, 
          variantId: v.id,
          productId: p.id 
        })))
      );

      await syncMasterData({
        products: processedProducts.length > 0 ? processedProducts : undefined,
        batches: allBatches.length > 0 ? allBatches : undefined,
        customers: processedCustomers.length > 0 ? processedCustomers : undefined,
        distributors: processedDistributors.length > 0 ? processedDistributors : undefined,
        employees: processedEmployees.length > 0 ? processedEmployees : undefined,
        branches: processedBranches.length > 0 ? processedBranches : undefined
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

  const flattenedVariants = useMemo(() => {
    return allProducts.flatMap((p) =>
      p.variants.map((v) => ({
        ...v,
        stock: selectedBranch
          ? parseFloat((v.stocks || []).find((s) => s.branch_id === selectedBranch.id)?.quantity || 0)
          : (v.stocks || []).reduce((acc, s) => acc + parseFloat(s.quantity || 0), 0),
      }))
    );
  }, [allProducts, selectedBranch]);
  
  useEffect(() => {
    const init = async () => {
      const currentOrgId = session?.user?.organization?.id;
      const lastOrgId = localStorage.getItem("pos_last_org_id");

      // 1. Check if organization has changed
      if (currentOrgId && lastOrgId && String(lastOrgId) !== String(currentOrgId)) {
        console.log("Organization change detected. Clearing local cache...");
        await db.transaction('rw', [db.products, db.variants, db.customers, db.distributors, db.employees, db.batches, db.branches], async () => {
          await Promise.all([
            db.products.clear(),
            db.variants.clear(),
            db.customers.clear(),
            db.distributors.clear(),
            db.employees.clear(),
            db.batches.clear(),
            db.branches.clear()
          ]);
        });
      }

      // Store current org ID for next time
      if (currentOrgId) {
        localStorage.setItem("pos_last_org_id", String(currentOrgId));
      }

      // 2. Always try to load what we have in DB first (Very fast UI feedback)
      await loadFromDB();
      
      // 3. MANDATORY INITIAL SYNC: Always fetch fresh data on app open
      // This prevents "old data confusion" by ensuring local DB matches server.
      if (navigator.onLine) {
        console.log("App opened: Performing mandatory initial sync to ensure fresh data...");
        await fetchData();
      } else {
        console.warn("App opened offline: Using cached data until connection restored.");
        setIsLoading(false);
      }
    };

    if (session?.accessToken) {
      init();
    }
  }, [session?.accessToken, session?.user?.organization?.id, loadFromDB, fetchData]);

  useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0]);
    }
  }, [branches, selectedBranch]);

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
    branches,
    selectedBranch,
    setSelectedBranch,
    isLoading,
    addCustomerToList,
    refreshData: fetchData,
    session,
  };
}
