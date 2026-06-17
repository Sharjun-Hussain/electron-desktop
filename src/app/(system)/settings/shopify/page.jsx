"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Store,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Package,
  ArrowRightLeft,
  Info,


  AlertCircle,
  Trash2,
  MoreVertical,
  Layers,

  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Zap,
  TrendingUp,
  ShoppingCart,

  Activity,
  Search,
  Filter,
  Check,
  Plus,
  Clock,
  Settings2,
  HelpCircle,
  Key,
  MapPin,
  Globe,
  UserCheck,
  Save,
  CloudUpload,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const DebouncedInput = ({ value, onChange, className, placeholder, icon: Icon, wrapperClassName }) => {
  const [localVal, setLocalVal] = useState(value || "");
  
  useEffect(() => {
    setLocalVal(value || "");
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localVal !== value) {
        onChange(localVal);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localVal, value, onChange]);

  return (
    <div className={cn("relative flex-1", wrapperClassName)}>
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />}
      <Input
        placeholder={placeholder}
        className={className}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onChange(localVal);
          }
        }}
      />
    </div>
  );
};

export default function ShopifySettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariantIds, setSelectedVariantIds] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState([]);

  // Pagination State for Local Inventory Sync
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [localSearch, setLocalSearch] = useState("");
  const [localCategoryId, setLocalCategoryId] = useState("all");
  const [localBrandId, setLocalBrandId] = useState("all");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [storeDetails, setStoreDetails] = useState(null);
  const [shopifyProducts, setShopifyProducts] = useState([]);
  const [shopifySearch, setShopifySearch] = useState("");
  const [shopifyStatus, setShopifyStatus] = useState("all");
  const [shopifyVendor, setShopifyVendor] = useState("");
  const [shopifyLinkStatus, setShopifyLinkStatus] = useState("all");
  const [shopifyProductsLoading, setShopifyProductsLoading] = useState(false);
  const [shopifyPagination, setShopifyPagination] = useState({ next: null, prev: null });
  const [shopifyCurrentPage, setShopifyCurrentPage] = useState(1);
  const [shopifyPageSize, setShopifyPageSize] = useState(10);
  const [shopifyOrders, setShopifyOrders] = useState([]);
  const [shopifyOrdersLoading, setShopifyOrdersLoading] = useState(false);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [shopifyProductsLoaded, setShopifyProductsLoaded] = useState(false);
  const [shopifyOrdersLoaded, setShopifyOrdersLoaded] = useState(false);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  const prevInventoryParams = React.useRef({ page: 1, size: 10, field: "name", order: "ASC" });
  const prevShopifyParams = React.useRef({ search: "", status: "all", vendor: "" });

  // Product Detailed Sheet State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetProduct, setSheetProduct] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);

  const fetchShopifyProductDetails = async (id) => {
    try {
      setSheetLoading(true);
      setSheetOpen(true);
      setSheetProduct(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/shopify-products/${id}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSheetProduct(data.data);
      } else {
        toast.error(data.message || "Failed to load product details");
        setSheetOpen(false);
      }
    } catch (err) {
      toast.error("Network error while fetching product details");
      setSheetOpen(false);
    } finally {
      setSheetLoading(false);
    }
  };

  const [config, setConfig] = useState({
    shop_url: "",
    access_token: "",
    client_id: "",
    client_secret: "",
    location_id: "",
    pos_branch_id: "",
    enabled: false
  });
  const [branches, setBranches] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [activeTab, setActiveTab] = useState(tabParam || "settings");

  const handleTabChange = (value) => {
    setActiveTab(value);
    router.push(`?tab=${value}`, { scroll: false });
  };
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("ASC");


  useEffect(() => {
    if (session?.accessToken) {
      fetchConfig();
    }
  }, [session]);



  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/config`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success" && data.data) {
        // Merge with existing config to keep empty strings for masked fields
        setConfig(prev => ({
          ...prev,
          ...data.data,
          client_secret: "", // Always clear on load for security
          pos_branch_id: data.data.pos_branch_id || ""
        }));

        if (data.data.connected) {
          setConnectionStatus("success");
        } else {
          setConnectionStatus("error");
        }
      }
      
      // Also fetch branches
      const branchRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const branchData = await branchRes.json();
      if (branchData.status === "success") {
        setBranches(branchData.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch Shopify config:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connectionStatus === "success" && config.shop_url) {
      setActiveTab("inventory");
      fetchAnalytics();
      fetchLocalProducts();
    } else {
      setActiveTab("settings");
    }
  }, [connectionStatus]);

  const createProductOnShopify = async (variantId) => {
    try {
      setSyncing(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/products/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ variant_id: variantId })
      });
      const data = await response.json();
      if (data.status === "success") {
        const { action } = data.data;
        if (action === 'linked') {
          toast.success("Variant linked to existing Shopify SKU!");
        } else {
          toast.success("New product created on Shopify!");
        }
        fetchLocalProducts();
        fetchShopifyProducts();
        fetchAnalytics();
      } else {
        toast.error(data.message || "Failed to sync product");
      }
    } catch (error) {
      toast.error("Error syncing product with Shopify");
    } finally {
      setSyncing(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!session?.accessToken) return;
    try {
      setAnalyticsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/analytics`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setAnalytics(data.data);
        setAnalyticsLoaded(true);
      } else {
        console.error("Analytics API Error:", data.message);
        // Don't toast here as it might be a temporary "not configured" error
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast.error("Failed to load store analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchLocalProducts = async () => {
    try {
      setProductsLoading(true);
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/products?limit=all`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setProducts(data.data.data);
        setInventoryLoaded(true);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "inventory" && !inventoryLoaded) {
      fetchLocalProducts();
    }
  }, [activeTab, inventoryLoaded]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortOrder("ASC");
    }
    setCurrentPage(1);
  };

  const fetchMasterData = async () => {
    if (!session?.accessToken) return;
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        })
      ]);
      const [catData, brandData] = await Promise.all([catRes.json(), brandRes.json()]);
      if (catData.status === "success" && Array.isArray(catData.data)) setCategories(catData.data);
      if (brandData.status === "success" && Array.isArray(brandData.data)) setBrands(brandData.data);
    } catch (error) {
      console.error("Failed to fetch master data:", error);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchMasterData();
    }
  }, [session]);

  const updateProductStatus = async (productId, status) => {
    try {
      setSyncing(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/products/update-status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: productId, status })
      });
      const data = await response.json();
      if (data.status === "success") {
        toast.success(`Product status updated to ${status}`);
        fetchShopifyProducts();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating product status");
    } finally {
      setSyncing(false);
    }
  };

  const deleteShopifyProduct = async (productId) => {
    if (!confirm("Are you sure you want to remove this product from Shopify? This cannot be undone.")) return;
    try {
      setSyncing(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/products/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: productId })
      });
      const data = await response.json();
      if (data.status === "success") {
        toast.success("Product removed from Shopify");
        fetchShopifyProducts();
        fetchAnalytics();
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Error deleting product");
    } finally {
      setSyncing(false);
    }
  };

  const fetchStoreDetails = async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/store-details`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setStoreDetails(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch store details:", error);
    }
  };

  useEffect(() => {
    if (connectionStatus === "success") {
      fetchStoreDetails();
    }
  }, [connectionStatus]);

  useEffect(() => {
    const baseTitle = "Shopify Integration | Inzeedo POS";
    if (connectionStatus === "success" && storeDetails?.name) {
      document.title = `${storeDetails.name} - Shopify Sync | Inzeedo POS`;
    } else {
      document.title = baseTitle;
    }
  }, [connectionStatus, storeDetails]);

  const fetchShopifyProducts = async (search = shopifySearch, pageInfo = "") => {
    if (!session?.accessToken) return;
    try {
      setShopifyProductsLoading(true);
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/shopify-products?limit=250`;

      if (pageInfo) {
        url += `&page_info=${pageInfo}`;
      } else {
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (shopifyStatus !== "all") url += `&status=${shopifyStatus}`;
        if (shopifyVendor) url += `&vendor=${encodeURIComponent(shopifyVendor)}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setShopifyProducts(data.data.products);
        setShopifyPagination({
          next: data.data.next_page_info,
          prev: data.data.prev_page_info
        });
        setShopifyProductsLoaded(true);
      }
    } catch (error) {
      console.error("Failed to fetch shopify products:", error);
      toast.error("Failed to load products from Shopify");
    } finally {
      setShopifyProductsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "shopify-products") {
       const paramsChanged = 
         prevShopifyParams.current.search !== shopifySearch ||
         prevShopifyParams.current.status !== shopifyStatus ||
         prevShopifyParams.current.vendor !== shopifyVendor;

       if (paramsChanged || !shopifyProductsLoaded) {
         if (paramsChanged) setShopifyCurrentPage(1);
         fetchShopifyProducts();
         prevShopifyParams.current = { search: shopifySearch, status: shopifyStatus, vendor: shopifyVendor };
       }
    }
  }, [shopifySearch, shopifyStatus, shopifyVendor, activeTab, shopifyProductsLoaded]);

  useEffect(() => {
    setShopifyCurrentPage(1);
  }, [shopifyLinkStatus]);

  const fetchShopifyOrders = async () => {
    if (!session?.accessToken) return;
    try {
      setShopifyOrdersLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/shopify-orders`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setShopifyOrders(data.data);
        setShopifyOrdersLoaded(true);
      }
    } catch (error) {
      console.error("Failed to fetch shopify orders:", error);
      toast.error("Failed to load orders from Shopify");
    } finally {
      setShopifyOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "shopify-products") {
      if (!shopifyProductsLoaded) fetchShopifyProducts();
    } else if (activeTab === "shopify-orders") {
      if (!shopifyOrdersLoaded) fetchShopifyOrders();
    } else if (activeTab === "analytics") {
      if (!analyticsLoaded) fetchAnalytics();
    }
  }, [activeTab]);

  const handleSave = async () => {
    try {
      setLoading(true);

      // Save Config
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          shop_url: config.shop_url,
          access_token: config.access_token,
          client_id: config.client_id,
          client_secret: config.client_secret,
          location_id: config.location_id,
          pos_branch_id: config.pos_branch_id,
          enabled: config.enabled
        })
      });


      const data = await response.json();
      if (data.status === "success") {
        toast.success("Settings synchronized successfully");
        setConnectionStatus("success");
        fetchAnalytics();
        fetchLocalProducts();
      } else {
        toast.error(data.message || "Failed to save configuration");
        setConnectionStatus("error");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
      setConnectionStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      if (data.status === "success") {
        toast.success("Shopify store disconnected successfully");
        setConnectionStatus("idle");
        setConfig({
          shop_url: "",
          access_token: "",
          client_id: "",
          client_secret: "",
          location_id: "",
          pos_branch_id: "",
          enabled: false
        });
        setStoreDetails(null);
        setAnalytics(null);
        setProducts([]);
        setShopifyProducts([]);
        setShopifyOrders([]);
        setInventoryLoaded(false);
        setShopifyProductsLoaded(false);
        setShopifyOrdersLoaded(false);
        setAnalyticsLoaded(false);
        setActiveTab("settings");
      } else {
        toast.error(data.message || "Failed to disconnect store");
      }
    } catch (error) {
      console.error("Disconnect Error:", error);
      toast.error("Error disconnecting Shopify store");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setVerifying(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          shop_url: config.shop_url,
          access_token: config.access_token
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        toast.success(`Connected to ${data.data.name}`);
      } else {
        toast.error(data.message || "Connection failed");
        setConnectionStatus("error");
      }
    } catch (error) {
      toast.error("Connection test failed");
      setConnectionStatus("error");
    } finally {
      setVerifying(false);
    }
  };

  const runPushSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/push`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        toast.success(`Push completed: ${data.data.pushed} items updated`);
        fetchAnalytics();
      } else {
        toast.error(data.message || "Push sync failed");
      }
    } catch (error) {
      toast.error("An error occurred during push sync");
    } finally {
      setSyncing(false);
    }
  };

  const toggleVariantSync = async (variantIds, enabled) => {
    try {
      setProductsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shopify/products/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ product_ids: variantIds, enabled })
      });
      const data = await response.json();
      if (data.status === "success") {
        toast.success(enabled ? "Selected variants enabled for sync" : "Selected variants disabled from sync");
        fetchLocalProducts();
        fetchAnalytics();
        setSelectedVariantIds([]);
      }
    } catch (error) {
      toast.error("Failed to update sync status");
    } finally {
      setProductsLoading(false);
    }
  };

  const toggleProductExpand = (productId) => {
    if (expandedProducts.includes(productId)) {
      setExpandedProducts(expandedProducts.filter(id => id !== productId));
    } else {
      setExpandedProducts([...expandedProducts, productId]);
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products || [];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery) ||
        p.code?.toLowerCase().includes(lowerQuery) ||
        p.barcode?.toLowerCase().includes(lowerQuery) ||
        p.variants?.some(v =>
          v.name?.toLowerCase().includes(lowerQuery) ||
          v.sku?.toLowerCase().includes(lowerQuery) ||
          v.barcode?.toLowerCase().includes(lowerQuery)
        )
      );
    }

    result = [...result].sort((a, b) => {
      let aVal, bVal;
      if (sortField === "stock") {
        aVal = a.variants?.reduce((sum, v) => sum + (v.stocks?.reduce((s, st) => s + parseFloat(st.quantity || 0), 0) || 0), 0) || 0;
        bVal = b.variants?.reduce((sum, v) => sum + (v.stocks?.reduce((s, st) => s + parseFloat(st.quantity || 0), 0) || 0), 0) || 0;
      } else if (sortField === "sku") {
        aVal = a.code || a.sku || "";
        bVal = b.code || b.sku || "";
      } else {
        aVal = a.name || "";
        bVal = b.name || "";
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "ASC" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "ASC" ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchQuery, sortField, sortOrder]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allFilteredVariantIds = useMemo(() => {
    if (!filteredProducts) return [];
    return filteredProducts.flatMap(p => p.variants?.map(v => v.id) || []);
  }, [filteredProducts]);

  const stats = [
    {
      label: "Shopify Products",
      val: analytics?.shopify_products || "0",
      desc: "Live inventory listings",
      icon: Package,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Total Store Orders",
      val: analytics?.shopify_orders || "0",
      desc: "Successful transactions",
      icon: ShoppingCart,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Linked Variants",
      val: analytics?.linked_local_variants || "0",
      desc: "Active industrial syncs",
      icon: Layers,
      gradient: "from-amber-500 to-orange-400",
    },
    {
      label: "Sync Activity",
      val: analytics?.sync_status || "Inactive",
      desc: "Real-time bridge status",
      icon: Activity,
      gradient: analytics?.sync_status === 'Active' ? "from-violet-500 to-purple-400" : "from-zinc-500 to-zinc-400",
    }
  ];

  return (
    <div className="min-h-screen bg-[#f6f6f7] dark:bg-zinc-950 font-sans antialiased">
      {/* Header */}
      <div id="shopify-header" className="bg-white dark:bg-zinc-900 border-b border-[#dfe3e8] dark:border-zinc-800 px-8 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-[#008060] rounded-lg flex items-center justify-center shadow-sm">
              <Store className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#202223] dark:text-zinc-100 flex items-center gap-2">
                {storeDetails ? storeDetails.name : "Shopify Integration"}
                {connectionStatus === "success" && (
                  <CheckCircle2 className="size-4 text-[#008060]" />
                )}
              </h1>
              <p className="text-xs text-[#6d7175] dark:text-zinc-400 font-medium mt-0.5 leading-none">
                {storeDetails ? `${storeDetails.domain} • ${storeDetails.email}` : "Industrial POS Analytics"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedVariantIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                <Button
                  variant="outline"
                  className="h-9 text-xs font-semibold px-4 border-[#dfe3e8] rounded-lg"
                  onClick={() => toggleVariantSync(selectedVariantIds, true)}
                >
                  Enable Sync ({selectedVariantIds.length})
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-xs font-semibold px-4 border-[#dfe3e8] text-red-600 rounded-lg"
                  onClick={() => toggleVariantSync(selectedVariantIds, false)}
                >
                  Disable
                </Button>
              </div>
            )}
            <div className="h-8 w-px bg-[#dfe3e8] dark:bg-zinc-800 mx-1" />
            <Button
              variant="outline"
              className="h-9 text-xs font-bold border-[#dfe3e8] px-4 rounded-lg bg-white dark:bg-zinc-900"
              onClick={fetchLocalProducts}
              disabled={productsLoading}
            >
              <RefreshCw className={cn("size-3 mr-2", productsLoading && "animate-spin")} />
              Refresh List
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dfe3e8] dark:border-zinc-800">
            <TabsList className="bg-transparent h-auto p-0 flex gap-8 justify-start rounded-none">
              {connectionStatus === "success" && (
                <TabsTrigger
                  value="inventory"
                  className="flex items-center gap-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#008060] dark:data-[state=active]:text-emerald-500 data-[state=active]:border-b-2 data-[state=active]:border-[#008060] dark:data-[state=active]:border-emerald-500 data-[state=active]:shadow-none font-semibold text-sm h-12 px-0 transition-all border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                >
                  <Layers className="size-4" />
                  Inventory Sync
                  {totalItems > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#f4f6f8] dark:bg-zinc-800 text-[10px] font-bold text-[#6d7175] dark:text-zinc-400 border border-[#dfe3e8] dark:border-zinc-700">
                      {totalItems}
                    </span>
                  )}
                </TabsTrigger>
              )}
              {connectionStatus === "success" && (
                <TabsTrigger
                  value="shopify-products"
                  className="flex items-center gap-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#008060] dark:data-[state=active]:text-emerald-500 data-[state=active]:border-b-2 data-[state=active]:border-[#008060] dark:data-[state=active]:border-emerald-500 data-[state=active]:shadow-none font-semibold text-sm h-12 px-0 transition-all border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                >
                  <Package className="size-4" />
                  Shopify Products
                  {analytics?.shopify_products > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#f4f6f8] dark:bg-zinc-800 text-[10px] font-bold text-[#6d7175] dark:text-zinc-400 border border-[#dfe3e8] dark:border-zinc-700">
                      {analytics.shopify_products}
                    </span>
                  )}
                </TabsTrigger>
              )}
              {connectionStatus === "success" && (
                <TabsTrigger
                  value="shopify-orders"
                  className="flex items-center gap-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#008060] dark:data-[state=active]:text-emerald-500 data-[state=active]:border-b-2 data-[state=active]:border-[#008060] dark:data-[state=active]:border-emerald-500 data-[state=active]:shadow-none font-semibold text-sm h-12 px-0 transition-all border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                >
                  <ShoppingCart className="size-4" />
                  Shopify Orders
                  {analytics?.shopify_orders > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#f4f6f8] dark:bg-zinc-800 text-[10px] font-bold text-[#6d7175] dark:text-zinc-400 border border-[#dfe3e8] dark:border-zinc-700">
                      {analytics.shopify_orders}
                    </span>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#008060] dark:data-[state=active]:text-emerald-500 data-[state=active]:border-b-2 data-[state=active]:border-[#008060] dark:data-[state=active]:border-emerald-500 data-[state=active]:shadow-none font-semibold text-sm h-12 px-0 transition-all border-b-2 border-transparent text-muted-foreground hover:text-foreground"
              >
                <Settings2 className="size-4" />
                API Settings
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              {activeTab === 'inventory' && (
                <Button
                  variant="outline"
                  className="h-9 text-xs font-bold border-[#dfe3e8] px-4 rounded-lg bg-white dark:bg-zinc-900"
                  onClick={fetchLocalProducts}
                  disabled={productsLoading}
                >
                  <RefreshCw className={cn("size-3 mr-2", productsLoading && "animate-spin")} />
                  Refresh List
                </Button>
              )}

              {activeTab === 'shopify-products' && (
                <Button
                  variant="outline"
                  className="h-9 text-xs font-bold border-[#dfe3e8] px-4 rounded-lg bg-white dark:bg-zinc-900"
                  onClick={fetchShopifyProducts}
                  disabled={shopifyProductsLoading}
                >
                  <RefreshCw className={cn("size-3 mr-2", shopifyProductsLoading && "animate-spin")} />
                  Fetch Products
                </Button>
              )}

              {activeTab === 'shopify-orders' && (
                <Button
                  variant="outline"
                  className="h-9 text-xs font-bold border-[#dfe3e8] px-4 rounded-lg bg-white dark:bg-zinc-900"
                  onClick={fetchShopifyOrders}
                  disabled={shopifyOrdersLoading}
                >
                  <RefreshCw className={cn("size-3 mr-2", shopifyOrdersLoading && "animate-spin")} />
                  Fetch Orders
                </Button>
              )}
              {activeTab === 'settings' && (
                <Button
                  className="h-9 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold px-6 shadow-sm rounded-lg flex items-center gap-2"
                  onClick={handleSave}
                  disabled={loading || syncing}
                >
                  {loading ? <RefreshCw className="size-3 animate-spin" /> : <Save className="size-3" />}
                  Save Settings
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="inventory" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Grid */}
            <div id="stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-[#dfe3e8] dark:border-zinc-800 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm"
                >
                  <div className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} text-white shadow-sm`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-[12px] font-medium text-muted-foreground leading-none mb-1.5">{card.label}</p>
                    <div className="h-7 flex items-center">
                      {analyticsLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        <h3 className="text-2xl font-bold text-foreground leading-none">
                          {card.val}
                        </h3>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1.5 opacity-70 italic">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sync Console */}
            <Card id="sync-console" className="border-[#dfe3e8] dark:border-zinc-800 shadow-sm rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
              <div className="p-4 border-b border-[#dfe3e8] dark:border-zinc-800 flex items-center justify-between gap-4 bg-white dark:bg-zinc-900">
                <div className="relative flex-1 max-w-lg">
                  <DebouncedInput
                    icon={Search}
                    placeholder="Filter products, variants or SKUs (Scan barcode)..."
                    className="pl-9 h-10 border-[#dfe3e8] dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus-visible:ring-[#008060] rounded-lg"
                    value={searchQuery}
                    onChange={(val) => setSearchQuery(val)}
                  />
                </div>
                <Button
                  id="push-stock-btn"
                  className="h-10 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold px-4 shadow-sm rounded-lg"
                  onClick={runPushSync}
                  disabled={syncing || productsLoading}
                >
                  {syncing ? <RefreshCw className="size-3 animate-spin mr-2" /> : <Zap className="size-3 mr-2" />}
                  Push Enabled Stock
                </Button>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f6f6f7] dark:bg-zinc-900 border-b border-[#dfe3e8] dark:border-zinc-800">
                      <th className="p-4 w-12 text-center">
                        <Checkbox
                          checked={selectedVariantIds.length === allFilteredVariantIds.length && allFilteredVariantIds.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedVariantIds(allFilteredVariantIds);
                            else setSelectedVariantIds([]);
                          }}
                        />
                      </th>
                      <th 
                        className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400 cursor-pointer hover:text-[#008060] transition-colors"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          Product / Variant
                          {sortField === "name" && (sortOrder === "ASC" ? <ArrowUpCircle className="size-3" /> : <ArrowDownCircle className="size-3" />)}
                        </div>
                      </th>
                      <th 
                        className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400 cursor-pointer hover:text-[#008060] transition-colors"
                        onClick={() => handleSort("sku")}
                      >
                        <div className="flex items-center gap-1">
                          SKU / Code
                          {sortField === "sku" && (sortOrder === "ASC" ? <ArrowUpCircle className="size-3" /> : <ArrowDownCircle className="size-3" />)}
                        </div>
                      </th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Pricing (Retail)</th>
                      <th 
                        className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400 text-center cursor-pointer hover:text-[#008060] transition-colors"
                        onClick={() => handleSort("stock")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Local Stock
                          {sortField === "stock" && (sortOrder === "ASC" ? <ArrowUpCircle className="size-3" /> : <ArrowDownCircle className="size-3" />)}
                        </div>
                      </th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400 text-center">Sync Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dfe3e8] dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {productsLoading ? (
                      <tr><td colSpan="5" className="p-12 text-center text-xs text-muted-foreground animate-pulse">Loading Shopify Inventory...</td></tr>
                    ) : paginatedProducts.length === 0 ? (
                      <tr><td colSpan="5" className="p-12 text-center text-xs text-muted-foreground">No matching items found.</td></tr>
                    ) : paginatedProducts.map(product => (
                      <React.Fragment key={product.id}>
                        <tr
                          className={cn("transition-colors cursor-pointer group hover:bg-slate-50 dark:hover:bg-zinc-900/50", expandedProducts.includes(product.id) && "bg-slate-50 dark:bg-zinc-900/50")}
                          onClick={() => toggleProductExpand(product.id)}
                        >
                          <td className="p-4 w-12 text-center">
                            <Checkbox
                              checked={product.variants?.every(v => selectedVariantIds.includes(v.id)) && product.variants?.length > 0}
                              onCheckedChange={(checked) => {
                                const vIds = product.variants?.map(v => v.id) || [];
                                if (checked) setSelectedVariantIds([...new Set([...selectedVariantIds, ...vIds])]);
                                else setSelectedVariantIds(selectedVariantIds.filter(id => !vIds.includes(id)));
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 bg-[#f4f6f8] dark:bg-zinc-800 rounded flex items-center justify-center border border-[#dfe3e8] dark:border-zinc-700">
                                {expandedProducts.includes(product.id) ? <ChevronDown className="size-4" /> : <Plus className="size-4" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-[#202223] dark:text-white leading-tight">{product.name}</span>
                                <span className="text-[11px] text-[#6d7175] font-medium">{product.variants?.length || 0} Industrial Variants</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[12px] font-mono text-[#6d7175] dark:text-zinc-400 bg-[#f4f6f8] dark:bg-zinc-800 px-2 py-0.5 rounded border border-[#dfe3e8] dark:border-zinc-700">
                              {product.code || '--'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-[13px] font-bold text-[#202223] dark:text-zinc-100 italic">Varies</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                              (product.variants?.reduce((acc, v) => acc + (v.stocks?.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0) || 0), 0) || 0) > 0 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                : "bg-rose-50 text-rose-600 border border-rose-100"
                            )}>
                              {product.variants?.reduce((acc, v) => acc + (v.stocks?.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0) || 0), 0) || 0}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {product.variants?.every(v => v.shopify_sync_enabled) ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <Check className="size-3" /> Fully Synced
                              </span>
                            ) : product.variants?.some(v => v.shopify_sync_enabled) ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                <ArrowLeftRight className="size-3" /> Partially Synced
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                                Local Only
                              </span>
                            )}
                          </td>
                        </tr>

                        {expandedProducts.includes(product.id) && product.variants?.map(variant => (
                          <tr key={variant.id} className="bg-slate-50/50 dark:bg-zinc-900/30 animate-in slide-in-from-top-1 duration-200">
                            <td className="p-4 pl-8 w-12 text-center">
                              <Checkbox
                                checked={selectedVariantIds.includes(variant.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) setSelectedVariantIds([...selectedVariantIds, variant.id]);
                                  else setSelectedVariantIds(selectedVariantIds.filter(id => id !== variant.id));
                                }}
                              />
                            </td>
                            <td className="p-4 pl-12">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-medium text-[#202223] dark:text-zinc-200">{variant.name || 'Standard Variant'}</span>
                                <span className="text-[10px] text-[#008060] font-bold mt-0.5">Specifications Linked</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-[12px] font-mono font-bold text-[#202223] dark:text-zinc-100">{variant.sku}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-[13px] font-bold text-[#202223] dark:text-zinc-100">LKR {variant.price}</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                                (variant.stocks?.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0) || 0) > 0 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                  : "bg-rose-50 text-rose-600 border border-rose-100"
                              )}>
                                {variant.stocks?.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0) || 0}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {variant.shopify_sync_enabled ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-3 rounded-full bg-[#e3f1df] text-[#008060] text-[10px] font-bold border border-[#bbe5b3] hover:bg-[#d6ebce] transition-colors gap-1.5"
                                  onClick={() => toggleVariantSync([variant.id], false)}
                                >
                                  <CheckCircle2 className="size-3" /> Enabled
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-4 rounded-lg text-[#008060] text-[10px] font-black border-[#008060]/30 hover:bg-[#008060]/5 shadow-xs transition-all active:scale-95 flex items-center gap-2 group"
                                  onClick={() => createProductOnShopify(variant.id)}
                                  disabled={syncing}
                                >
                                  {syncing ? (
                                    <RefreshCw className="size-3 animate-spin" />
                                  ) : (
                                    <CloudUpload className="size-3 group-hover:-translate-y-0.5 transition-transform" />
                                  )}
                                  Sync to Shopify
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-border/50 bg-gray-50/30 dark:bg-muted/10">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200 dark:border-border/50 dark:bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 30, 40, 50].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">per page</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1 mx-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        if (pageNum >= 1 && pageNum <= totalPages) {
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="icon"
                              className={cn(
                                "h-8 w-8 text-xs",
                                currentPage === pageNum
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                                  : "border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
                              )}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="shopify-products" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-[#dfe3e8] dark:border-zinc-800 shadow-xs mb-6">
              <div className="relative flex-1 w-full md:max-w-xs">
                <DebouncedInput
                  icon={Search}
                  placeholder="Search Shopify products..."
                  className="pl-9 h-10 border-[#dfe3e8] rounded-lg text-sm bg-white dark:bg-zinc-900 shadow-xs"
                  value={shopifySearch}
                  onChange={(val) => setShopifySearch(val)}
                />
              </div>

              <Select value={shopifyStatus} onValueChange={setShopifyStatus}>
                <SelectTrigger className="w-full md:w-[180px] h-10 border-[#dfe3e8] rounded-lg text-sm bg-white dark:bg-zinc-900 shadow-xs">
                  <SelectValue placeholder="Product Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={shopifyLinkStatus} onValueChange={setShopifyLinkStatus}>
                <SelectTrigger className="w-full md:w-[150px] h-10 border-[#dfe3e8] rounded-lg text-sm bg-white dark:bg-zinc-900 shadow-xs">
                  <SelectValue placeholder="POS Link" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="linked">Linked Only</SelectItem>
                  <SelectItem value="unlinked">Unlinked Only</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-full md:w-[180px]">
                <DebouncedInput
                  icon={Store}
                  placeholder="Filter by Vendor..."
                  className="pl-9 h-10 border-[#dfe3e8] rounded-lg text-sm bg-white dark:bg-zinc-900 shadow-xs"
                  value={shopifyVendor}
                  onChange={(val) => setShopifyVendor(val)}
                />
              </div>

              {(shopifySearch || shopifyStatus !== "all" || shopifyVendor || shopifyLinkStatus !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-rose-500 font-bold hover:bg-rose-50"
                  onClick={() => {
                    setShopifySearch("");
                    setShopifyStatus("all");
                    setShopifyVendor("");
                    setShopifyLinkStatus("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
            <Card className="bg-white dark:bg-zinc-900 border-[#dfe3e8] dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f6f6f7] dark:bg-zinc-800/50 border-b border-[#dfe3e8] dark:border-zinc-800">
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Image</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Shopify Product</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">SKU</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Vendor</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">POS Link</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Status</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Price</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400 text-center">Stock</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dfe3e8] dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {shopifyProductsLoading ? (
                      <tr><td colSpan="9" className="p-12 text-center text-xs text-muted-foreground animate-pulse">Fetching from Shopify Admin API...</td></tr>
                    ) : shopifyProducts.length === 0 ? (
                      <tr><td colSpan="9" className="p-12 text-center text-xs text-muted-foreground">No products found on Shopify.</td></tr>
                    ) : shopifyProducts
                      .filter(p => {
                        if (shopifyLinkStatus === 'linked') return !!p.local_match;
                        if (shopifyLinkStatus === 'unlinked') return !p.local_match;
                        return true;
                      })
                      .slice((shopifyCurrentPage - 1) * shopifyPageSize, shopifyCurrentPage * shopifyPageSize)
                      .map(product => (
                        <tr key={product.id} className="hover:bg-[#f6f6f7] dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="p-4">
                            <div className="size-10 bg-slate-100 dark:bg-zinc-800 rounded overflow-hidden border border-slate-200 dark:border-zinc-700">
                              {product.image ? (
                                <img src={product.image.src} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package className="size-4 text-slate-300" /></div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span 
                                className="text-[13px] font-bold text-[#202223] dark:text-white leading-tight hover:text-[#008060] dark:hover:text-emerald-400 hover:underline cursor-pointer transition-colors"
                                onClick={() => fetchShopifyProductDetails(product.id)}
                              >
                                {product.title}
                              </span>
                              <span className="text-[10px] text-[#6d7175] font-medium mt-0.5">ID: {product.id}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[12px] font-mono font-bold text-[#202223] dark:text-zinc-100">
                              {product.variants?.[0]?.sku || '--'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-[12px] text-[#6d7175] dark:text-zinc-400 font-medium">
                              {product.vendor || 'No Vendor'}
                            </span>
                          </td>
                          <td className="p-4">
                            {product.local_match ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  <Check className="size-3" /> Linked
                                </span>
                                <span className="text-[9px] text-slate-400 mt-1 truncate max-w-[120px]">{product.local_match.name || product.local_match.product?.name}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-50 text-zinc-400 border border-zinc-100">
                                No Match
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              product.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                              {product.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-[13px] font-bold text-[#202223] dark:text-zinc-100">
                              LKR {product.variants?.[0]?.price || '0.00'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold",
                              (product.variants?.[0]?.inventory_quantity || 0) > 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                            )}>
                              {product.variants?.[0]?.inventory_quantity || 0}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-emerald-50 text-zinc-400 hover:text-[#008060]">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border-[#dfe3e8] shadow-xl">
                                <DropdownMenuLabel className="text-[10px] font-bold text-zinc-400 px-2 py-1.5 uppercase tracking-wider">Sync Actions</DropdownMenuLabel>
                                {product.local_match ? (
                                  <DropdownMenuItem
                                    className={cn(
                                      "flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold cursor-pointer",
                                      product.local_match.shopify_sync_enabled ? "text-rose-600 focus:bg-rose-50" : "text-emerald-600 focus:bg-emerald-50"
                                    )}
                                    onClick={() => toggleVariantSync([product.local_match.id], !product.local_match.shopify_sync_enabled)}
                                  >
                                    <ArrowRightLeft className="size-3.5" />
                                    {product.local_match.shopify_sync_enabled ? "Unlink from POS" : "Link Now"}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem disabled className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-zinc-300">
                                    <AlertCircle className="size-3.5" /> SKU Mismatch
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator className="my-1.5 bg-[#f4f6f8]" />
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold text-blue-600 focus:bg-blue-50 cursor-pointer"
                                  onClick={() => fetchShopifyProductDetails(product.id)}
                                >
                                  <Info className="size-3.5" /> View Detailed Sheet
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="my-1.5 bg-[#f4f6f8]" />
                                <DropdownMenuLabel className="text-[10px] font-bold text-zinc-400 px-2 py-1.5 uppercase tracking-wider">Shopify Status</DropdownMenuLabel>

                                {product.status === 'active' ? (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold text-amber-600 focus:bg-amber-50 cursor-pointer"
                                    onClick={() => updateProductStatus(product.id, 'draft')}
                                    disabled={syncing}
                                  >
                                    <RefreshCw className="size-3.5" /> Set as Draft
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold text-emerald-600 focus:bg-emerald-50 cursor-pointer"
                                    onClick={() => updateProductStatus(product.id, 'active')}
                                    disabled={syncing}
                                  >
                                    <CheckCircle2 className="size-3.5" /> Set as Active
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator className="my-1.5 bg-[#f4f6f8]" />

                                <DropdownMenuItem
                                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold text-rose-600 focus:bg-rose-50 cursor-pointer"
                                  onClick={() => deleteShopifyProduct(product.id)}
                                  disabled={syncing}
                                >
                                  <Trash2 className="size-3.5" /> Remove Product
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Shopify Pagination Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-border/50 bg-gray-50/30 dark:bg-muted/10">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Page {shopifyCurrentPage} of {shopifyTotalPages}
                  </p>
                  <Select
                    value={shopifyPageSize.toString()}
                    onValueChange={(value) => {
                      setShopifyPageSize(Number(value));
                      setShopifyCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200 dark:border-border/50 dark:bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 30, 40, 50].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">per page</p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
                    onClick={() => setShopifyCurrentPage(1)}
                    disabled={shopifyCurrentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
                    onClick={() => setShopifyCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={shopifyCurrentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1 mx-1">
                    {Array.from({
                      length: Math.min(5, shopifyTotalPages)
                    }, (_, i) => {
                      let pageNum;
                      if (shopifyTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (shopifyCurrentPage <= 3) {
                        pageNum = i + 1;
                      } else if (shopifyCurrentPage >= shopifyTotalPages - 2) {
                        pageNum = shopifyTotalPages - 4 + i;
                      } else {
                        pageNum = shopifyCurrentPage - 2 + i;
                      }

                      if (pageNum >= 1 && pageNum <= shopifyTotalPages) {
                        return (
                          <Button
                            key={pageNum}
                            variant={shopifyCurrentPage === pageNum ? "default" : "outline"}
                            size="icon"
                            className={cn(
                              "h-8 w-8 text-xs font-medium transition-all duration-200",
                              shopifyCurrentPage === pageNum
                                ? "bg-[#008060] hover:bg-[#006e52] text-white border-[#008060] shadow-md shadow-emerald-500/20 scale-105"
                                : "border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-muted-foreground"
                            )}
                            onClick={() => setShopifyCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
                    onClick={() => setShopifyCurrentPage(prev => Math.min(shopifyTotalPages, prev + 1))}
                    disabled={shopifyCurrentPage >= shopifyTotalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
                    onClick={() => setShopifyCurrentPage(shopifyTotalPages)}
                    disabled={shopifyCurrentPage >= shopifyTotalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            </Card>
          </TabsContent>

          <TabsContent value="shopify-orders" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white dark:bg-zinc-900 border-[#dfe3e8] dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f6f6f7] dark:bg-zinc-800/50 border-b border-[#dfe3e8] dark:border-zinc-800">
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Order</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Date</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Customer</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Financial</th>
                      <th className="p-4 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dfe3e8] dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {shopifyOrdersLoading ? (
                      <tr><td colSpan="5" className="p-12 text-center text-xs text-muted-foreground animate-pulse">Fetching from Shopify Admin API...</td></tr>
                    ) : shopifyOrders.length === 0 ? (
                      <tr><td colSpan="5" className="p-12 text-center text-xs text-muted-foreground">No orders found on Shopify.</td></tr>
                    ) : shopifyOrders.map(order => (
                      <tr key={order.id} className="hover:bg-[#f6f6f7] dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-[#008060] dark:text-emerald-500">#{order.order_number}</span>
                            <span className="text-[10px] text-[#6d7175] font-medium">via {order.source_name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[12px] text-[#202223] dark:text-zinc-300 font-medium">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-[#202223] dark:text-zinc-200">
                              {order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'No Customer'}
                            </span>
                            <span className="text-[10px] text-[#6d7175] font-medium">{order.email || order.phone || '--'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                            order.financial_status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                            {order.financial_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[13px] font-bold text-[#202223] dark:text-zinc-100">
                            {order.currency} {order.total_price}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Configuration Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="size-5 text-[#008060]" />
                  <h2 className="text-base font-bold text-[#202223] dark:text-white">API Configuration</h2>
                </div>

                {/* SETUP HELP CARD */}
                <div id="setup-guide" className="bg-[#f0f4f8] dark:bg-zinc-800/40 rounded-xl p-5 border border-[#d1d9e4] dark:border-zinc-700/50 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 text-[#2c5282] dark:text-blue-300">
                    <HelpCircle className="size-4" />
                    <span className="text-[13px] font-bold">Setup Guide</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Globe className="size-4 text-[#4a5568] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-bold text-[#2d3748] dark:text-zinc-200 leading-tight">Shop URL</p>
                        <p className="text-[11px] text-[#718096] dark:text-zinc-400 mt-1">Found in your browser address bar when logged into Shopify. (e.g. <b>your-store.myshopify.com</b>)</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Key className="size-4 text-[#4a5568] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-bold text-[#2d3748] dark:text-zinc-200 leading-tight">Access Token <span className="text-[10px] font-mono text-emerald-600">shpat_...</span></p>
                        <p className="text-[11px] text-[#718096] dark:text-zinc-400 mt-1">
                          Go to <b>Settings → Apps → Develop Apps</b>. Create a Custom App, enable <b>read_inventory</b> &amp; <b>write_inventory</b> scopes, Install it, then click <b>Reveal Token</b> (shown once).
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <MapPin className="size-4 text-[#4a5568] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-bold text-[#2d3748] dark:text-zinc-200 leading-tight">Location ID</p>
                        <p className="text-[11px] text-[#718096] dark:text-zinc-400 mt-1">
                          In <b>Settings &gt; Locations</b>, click your primary branch. The ID is the long number at the end of the URL.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Card id="api-configuration" className="lg:col-span-2 border-[#dfe3e8] dark:border-zinc-800 shadow-xs rounded-xl overflow-hidden">
                <CardContent className="p-6 space-y-6 bg-white dark:bg-zinc-900">
                  {loading ? (
                    <div className="space-y-6 animate-pulse">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                          </div>
                        ))}
                      </div>
                      <Skeleton className="h-24 w-full rounded-xl" />
                      <Skeleton className="h-16 w-full rounded-xl" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2 space-y-1.5 pb-2 border-b border-[#dfe3e8] dark:border-zinc-800">
                          <Label className="text-[10px] font-bold text-[#202223] dark:text-zinc-400 uppercase tracking-tight">Inventory Sync Source Branch</Label>
                          <Select
                            value={config.pos_branch_id}
                            onValueChange={(val) => setConfig({ ...config, pos_branch_id: val })}
                            disabled={!!(config.pos_branch_id && connectionStatus === "success")}
                          >
                            <SelectTrigger className="h-10 border-[#dfe3e8] dark:border-zinc-800 rounded-lg bg-[#f9fafb] dark:bg-zinc-950/50 shadow-xs">
                              <SelectValue placeholder="Select Branch for Stock Sync" />
                            </SelectTrigger>
                            <SelectContent>
                              {branches.map(branch => (
                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-[#6d7175] font-medium leading-tight">
                            {config.pos_branch_id && connectionStatus === "success" 
                              ? "🔒 Branch selection is locked to maintain sync integrity."
                              : "Choose which physical branch's inventory will be used to update Shopify."}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-[#202223] dark:text-zinc-400">Shop URL</Label>
                          <Input
                            value={config.shop_url}
                            onChange={(e) => setConfig({ ...config, shop_url: e.target.value })}
                            className="h-10 border-[#dfe3e8] dark:border-zinc-700 bg-[#f9fafb] dark:bg-zinc-800 rounded-lg"
                            placeholder="store.myshopify.com"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-[#202223] dark:text-zinc-400">Access Token <span className="text-[9px] font-mono text-emerald-600 font-normal">(must start with shpat_)</span></Label>
                          <Input
                            type="password"
                            value={config.access_token}
                            onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                            className="h-10 border-[#dfe3e8] dark:border-zinc-700 bg-[#f9fafb] dark:bg-zinc-800 rounded-lg"
                            placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-[#202223] dark:text-zinc-400">Location ID</Label>
                          <Input
                            value={config.location_id}
                            onChange={(e) => setConfig({ ...config, location_id: e.target.value })}
                            className="h-10 border-[#dfe3e8] dark:border-zinc-700 bg-[#f9fafb] dark:bg-zinc-800 rounded-lg font-mono"
                            placeholder="123456789"
                          />
                        </div>
                      </div>

                      {/* OAuth Credentials for 24h Auto-Refresh */}
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 space-y-4">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="size-3.5 text-amber-600" />
                          <span className="text-[12px] font-bold text-amber-700 dark:text-amber-400">24h Auto-Refresh Credentials</span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium italic ml-auto">Optional — for automatic token renewal</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-[#202223] dark:text-zinc-400">Client ID <span className="text-[9px] font-mono text-amber-600 font-normal">(from Dev Dashboard)</span></Label>
                            <Input
                              value={config.client_id}
                              onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                              className="h-10 border-amber-200 dark:border-amber-800/50 bg-white dark:bg-zinc-900 rounded-lg font-mono text-xs"
                              placeholder="abc123def456..."
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-[#202223] dark:text-zinc-400">Client Secret <span className="text-[9px] font-mono text-amber-600 font-normal">(shpss_...)</span></Label>
                            <Input
                              type="password"
                              value={config.client_secret}
                              onChange={(e) => setConfig({ ...config, client_secret: e.target.value })}
                              className="h-10 border-amber-200 dark:border-amber-800/50 bg-white dark:bg-zinc-900 rounded-lg font-mono text-xs"
                              placeholder="shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
                          Shopify tokens expire every <b>24 hours</b>. Adding Client ID &amp; Secret lets the system auto-refresh via Client Credentials Grant — no manual re-entry needed.
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[#f4f6f8] dark:bg-zinc-800/50 rounded-xl border border-[#dfe3e8] dark:border-zinc-700 cursor-pointer hover:bg-[#e3f1df] transition-colors" onClick={() => setConfig({ ...config, enabled: !config.enabled })}>
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm border border-[#dfe3e8] dark:border-zinc-700">
                            <Zap className={cn("size-5", config.enabled ? "text-[#008060] fill-[#008060]" : "text-zinc-300")} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-[#202223] dark:text-white">Real-time Background Sync</span>
                            <span className="text-[10px] text-[#6d7175] font-medium">Auto-push stock changes on every POS transaction</span>
                          </div>
                        </div>
                        <Switch checked={config.enabled} onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })} className="data-[state=checked]:bg-[#008060]" />
                      </div>
                    </>
                  )}


                  <div className="flex items-center justify-end pt-4 border-t border-[#dfe3e8] dark:border-zinc-800">
                    <Button
                      variant="outline"
                      className="h-10 border-[#dfe3e8] dark:border-zinc-700 hover:bg-[#f6f6f7] dark:hover:bg-zinc-800 text-xs font-bold px-6 rounded-lg"
                      onClick={testConnection}
                      disabled={verifying || syncing}
                    >
                      {verifying && <RefreshCw className="size-3 animate-spin mr-2" />}
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Danger Zone */}
            {connectionStatus === "success" && (
              <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-5 text-rose-600" />
                  <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">Danger Zone</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300">Disconnect Shopify Integration</p>
                    <p className="text-[11px] text-rose-600/80 dark:text-rose-400/70 leading-relaxed">
                      This will remove your API credentials and disable all inventory synchronization. 
                      Linked products will no longer update automatically.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="h-10 px-6 font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
                        disabled={loading}
                      >
                        Disconnect Store
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white dark:bg-zinc-900 border-[#dfe3e8] dark:border-zinc-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-[#202223] dark:text-white">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-[#6d7175] dark:text-zinc-400">
                          This action will permanently remove your Shopify integration settings from FoodCity POS. 
                          You will need to re-enter your API credentials to reconnect.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="h-10 text-xs font-bold rounded-lg border-[#dfe3e8] dark:border-zinc-800">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDisconnect}
                          className="h-10 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          Confirm Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            {/* Security Info */}
            <div className="p-6 bg-white dark:bg-zinc-900 border border-[#dfe3e8] dark:border-zinc-800 rounded-xl flex gap-4 shadow-xs items-start">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-sm shadow-emerald-500/5 transition-transform hover:scale-105 cursor-default">
                <ShieldCheck className="size-5 text-[#008060]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#202223] dark:text-zinc-100 leading-none mb-1">Data Security</h4>
                <p className="text-[11px] text-[#6d7175] dark:text-zinc-400 leading-relaxed font-medium opacity-80">
                  All synchronization occurs via TLS 1.3 secured tunnels. Your API credentials are never stored in cleartext and are restricted to specific organization scopes.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Shopify Product Detailed Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-zinc-950 border-l border-[#dfe3e8] dark:border-zinc-800 p-0 overflow-y-auto">
          <SheetHeader className="p-6 border-b border-[#dfe3e8] dark:border-zinc-800 bg-[#f4f6f8] dark:bg-zinc-900 sticky top-0 z-10">
            <SheetTitle className="text-xl font-bold text-[#202223] dark:text-white flex items-center gap-3">
              <Store className="size-5 text-[#008060]" />
              Product Detailed Sheet
            </SheetTitle>
            <SheetDescription className="text-xs text-[#6d7175] dark:text-zinc-400">
              Live data fetched directly from Shopify Admin API.
            </SheetDescription>
          </SheetHeader>

          {sheetLoading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="size-8 animate-spin text-[#008060]" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading live data from Shopify...</p>
            </div>
          ) : sheetProduct ? (
            <div className="p-6 space-y-8">
              {/* Header Info */}
              <div className="flex gap-6 items-start">
                <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-[#dfe3e8] dark:border-zinc-800 shadow-sm shrink-0">
                  {sheetProduct.image ? (
                    <img src={sheetProduct.image.src} alt={sheetProduct.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="size-8 text-slate-300" /></div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-xl font-black text-[#202223] dark:text-white leading-tight">{sheetProduct.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border",
                      sheetProduct.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      Status: {sheetProduct.status.toUpperCase()}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                      ID: {sheetProduct.id}
                    </span>
                    {sheetProduct.vendor && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Vendor: {sheetProduct.vendor}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {sheetProduct.body_html && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[#202223] dark:text-white flex items-center gap-2">
                    <Info className="size-4 text-[#008060]" /> Description
                  </h3>
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert text-[#6d7175] dark:text-zinc-300 p-4 bg-[#f4f6f8] dark:bg-zinc-900 rounded-xl border border-[#dfe3e8] dark:border-zinc-800 max-h-60 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: sheetProduct.body_html }}
                  />
                </div>
              )}

              {/* Variants Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#202223] dark:text-white flex items-center gap-2">
                  <Layers className="size-4 text-[#008060]" /> Variants ({sheetProduct.variants?.length || 0})
                </h3>
                <div className="rounded-xl border border-[#dfe3e8] dark:border-zinc-800 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f4f6f8] dark:bg-zinc-900 border-b border-[#dfe3e8] dark:border-zinc-800">
                      <tr>
                        <th className="p-3 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Variant Title</th>
                        <th className="p-3 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">SKU</th>
                        <th className="p-3 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400">Price</th>
                        <th className="p-3 text-[11px] font-bold text-[#6d7175] dark:text-zinc-400 text-center">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dfe3e8] dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                      {sheetProduct.variants?.map((variant) => (
                        <tr key={variant.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                          <td className="p-3">
                            <span className="text-[12px] font-bold text-[#202223] dark:text-zinc-100">{variant.title}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">{variant.sku || '--'}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">LKR {variant.price}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={cn(
                              "inline-flex px-2 py-0.5 rounded text-[10px] font-bold",
                              variant.inventory_quantity > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            )}>
                              {variant.inventory_quantity || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground">No product data loaded.</div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
