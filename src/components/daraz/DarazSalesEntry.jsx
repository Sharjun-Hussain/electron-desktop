"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Store, Search, Plus, Trash2, ShoppingCart, CheckCircle2, Loader2, UserCheck, Check, ChevronsUpDown, Save, Settings, PackageSearch, PlusCircle, Edit, History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

const ProductSelect = ({ products, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return products.slice(0, 50);

    return products
      .filter(p =>
        (p.name || "").toLowerCase().includes(search) ||
        (p.sku || "").toLowerCase().includes(search) ||
        (p.barcode || "").toLowerCase().includes(search)
      )
      .slice(0, 50);
  }, [products, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent border-input rounded-md shadow-sm h-10 pl-3 font-normal"
        >
          <span className="text-muted-foreground">Select a product to add to order...</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, SKU, or Barcode..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty className="py-6 flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">No product found.</p>
            </CommandEmpty>
            <CommandGroup>
              {filteredItems.map((product, idx) => (
                <CommandItem
                  key={`${product.id || product.product_id}-${idx}`}
                  value={`${product.name} ${product.sku || ''} ${product.barcode || ''}`}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground text-sm">{product.name}</span>
                      <span className="text-[11px] text-muted-foreground/60">{product.barcode || product.sku || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[11px] text-muted-foreground">
                        Stock:
                        <span
                          className={cn(
                            "ml-1 font-medium",
                            (product?.stock_quantity || 0) <= 0
                              ? "text-red-500"
                              : "text-emerald-500"
                          )}
                        >
                          {product?.stock_quantity ?? "0"} units
                        </span>
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        LKR {(Number(product.selling_price) || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export function DarazSalesEntry() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Cart state
  const [cart, setCart] = useState([]);
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [parcelBarcode, setParcelBarcode] = useState("");
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);


  // Multi-store state
  const [darazStores, setDarazStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editingStoreName, setEditingStoreName] = useState("");
  const [deliveryFees, setDeliveryFees] = useState(0);



  useEffect(() => {
    if (session?.accessToken) {
      fetchProducts();
      fetchDarazStores();
    }
  }, [session]);
  
  const fetchDarazStores = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/daraz-stores`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setDarazStores(data.data || []);
        if (data.data && data.data.length > 0 && !selectedStoreId) {
          setSelectedStoreId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddStore = async () => {
    if(!newStoreName.trim()) return toast.warning("Store name is required");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/daraz-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ name: newStoreName })
      });
      const data = await res.json();
      if(data.status === 'success') {
        toast.success("Store added");
        setNewStoreName("");
        fetchDarazStores();
      } else toast.error(data.message);
    } catch (e) {
      toast.error("Failed to add store");
    }
  };

  const handleUpdateStore = async (id) => {
    if(!editingStoreName.trim()) return toast.warning("Store name is required");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/daraz-stores/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ name: editingStoreName })
      });
      const data = await res.json();
      if(data.status === 'success') {
        toast.success("Store updated");
        setEditingStoreId(null);
        fetchDarazStores();
      } else toast.error(data.message);
    } catch (e) {
      toast.error("Failed to update store");
    }
  };

  const handleDeleteStore = async (id) => {
    if(!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/daraz-stores/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      if(res.ok) {
        toast.success("Store removed");
        if(selectedStoreId === id) setSelectedStoreId("");
        fetchDarazStores();
      }
    } catch(e) {
      toast.error("Failed to remove store");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const limit = 200;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?limit=${limit}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        const rawProducts = data.data?.data || [];
        setProducts(rawProducts.map(p => {
          const v = p.variants?.[0] || {};
          const price = parseFloat(v.price || p.price || v.selling_price || p.selling_price || 0);
          
          let stock = 0;
          if (p.variants && p.variants.length > 0) {
            stock = p.variants.reduce((acc, vr) => acc + (vr.stocks?.reduce((sAcc, s) => sAcc + parseFloat(s.quantity || 0), 0) || parseFloat(vr.stock_quantity || 0)), 0);
          } else {
            stock = p.stocks?.reduce((acc, s) => acc + parseFloat(s.quantity || 0), 0) || parseFloat(p.stock_quantity || p.stock || 0);
          }
          
          return {
            ...p,
            selling_price: price,
            stock_quantity: stock
          };
        }));
      }
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };


  const handleProductSelect = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * Number(item.selling_price) }
            : item
        );
      }
      return [...prev, { 
        ...product, 
        quantity: 1, 
        total: Number(product.selling_price)
      }];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: newQuantity, total: newQuantity * Number(item.selling_price || 0) };
      }
      return item;
    }));
  };

  const updatePrice = (id, newPrice) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, selling_price: newPrice, total: item.quantity * newPrice };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const productTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const finalAmount = productTotal + Number(deliveryFees || 0);

  const handleSubmit = async (isHold = false) => {
    if (cart.length === 0) return toast.warning("Order contains no items");
    if (!orderNumber.trim()) return toast.warning("Order number is required");
    if (!selectedStoreId) return toast.warning("Please select a Daraz Store configuration");

    try {
      setProcessing(isHold ? 'hold' : 'submit');
      
      let finalCustomerId = null;
      if (customerName.trim() || customerPhone.trim() || customerEmail.trim()) {
        const custRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.accessToken}`
          },
          body: JSON.stringify({
            name: customerName.trim() || 'Daraz Customer',
            phone: customerPhone.trim() || undefined,
            email: customerEmail.trim() || undefined,
            source: 'daraz'
          })
        });
        const custData = await custRes.json();
        if (custData.status === 'success' && custData.data?.id) {
          finalCustomerId = custData.data.id;
        }
      }

      const salePayload = {
        customer_id: finalCustomerId,
        daraz_store_id: selectedStoreId,
        source: 'daraz',
        reference_number: orderNumber,
        parcel_barcode: parcelBarcode,
        payment_method: 'pending', // Daraz pays later
        payment_status: 'unpaid',
        status: isHold ? 'draft' : 'completed',
        
        // Calculated totals
        total_amount: productTotal, 
        discount_amount: 0,
        tax_amount: 0, 
        shipping_fee: Number(deliveryFees || 0),
        grand_total: finalAmount,
        paid_amount: 0,

        items: cart.map(item => ({
          product_id: item.id,
          variant_id: null,
          quantity: item.quantity,
          unit_price: Number(item.selling_price),
          subtotal: item.total
        }))
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(salePayload)
      });

      const data = await response.json();
      
      if (data.status === "success") {
        toast.success(isHold ? "Daraz order held successfully!" : "Daraz order logged successfully!");
        setCart([]);
        setOrderNumber("");
        setParcelBarcode("");
        setDeliveryFees(0);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerEmail("");
      } else {
        toast.error(data.message || "Failed to log order");
      }
    } catch (error) {
      toast.error("Network error while submitting order");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 mt-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 mt-1 self-start">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Daraz Order Entry</h2>
            <p className="text-muted-foreground text-[13px] mt-0.5">Compact layout for rapid ecommerce attribution</p>
          </div>
        </div>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 border-orange-200 hover:bg-orange-50 hover:text-orange-700 text-orange-600">
              <Settings className="w-4 h-4" /> Manage Stores
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Store className="w-5 h-5 text-orange-500" /> Daraz Stores
              </DialogTitle>
              <DialogDescription>
                Manage your organization's attached Daraz seller center profiles to map sales to specific storefronts.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 my-2">
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. Choice Mart" 
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)} 
                    className="pl-9 bg-background"
                  />
                </div>
                <Button onClick={handleAddStore} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <PlusCircle className="w-4 h-4" /> Add Store
                </Button>
              </div>
              
              <div className="border border-border rounded-md bg-background">
                <div className="max-h-[350px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground">Store Name</TableHead>
                        <TableHead className="w-[100px] text-right font-semibold text-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {darazStores.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={2} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-1">
                                <Store className="h-6 w-6 text-orange-500" />
                              </div>
                              <p className="text-sm font-medium text-foreground">No stores configured</p>
                              <p className="text-xs">Add your first Daraz store above.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : darazStores.map(store => (
                        <TableRow key={store.id} className="group hover:bg-muted/30">
                          <TableCell className="font-medium">
                            {editingStoreId === store.id ? (
                              <Input 
                                value={editingStoreName} 
                                onChange={(e) => setEditingStoreName(e.target.value)}
                                className="h-8 bg-background border-primary w-full"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateStore(store.id);
                                  if (e.key === 'Escape') setEditingStoreId(null);
                                }}
                              />
                            ) : (
                              <div className="flex items-center gap-2 text-foreground">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                                <span className="truncate">{store.name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {editingStoreId === store.id ? (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleUpdateStore(store.id)}
                                    className="hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all h-8 w-8"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setEditingStoreId(null)}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all h-8 w-8"
                                  >
                                    <div className="text-muted-foreground text-xs font-bold w-4 h-4 flex items-center justify-center">X</div>
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                      setEditingStoreId(store.id);
                                      setEditingStoreName(store.name);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all h-8 w-8"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDeleteStore(store.id)}
                                    className="opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all h-8 w-8"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Main Content: Table & Product Select */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Header Row: Store, Order #, Barcode, Customer */}
          <Card className="shadow-sm">
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Store className="w-4 h-4" /> Daraz Store
                </label>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger className="w-full bg-background border-orange-200 focus:ring-orange-500 dark:border-orange-500/30">
                    <SelectValue placeholder="Select Daraz Store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {darazStores.length === 0 && (
                      <SelectItem value="disabled" disabled>No stores configured</SelectItem>
                    )}
                    {darazStores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <PackageSearch className="w-4 h-4" /> Order Number
                </label>
                <Input 
                  placeholder="e.g. 192837465" 
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <ShoppingCart className="w-4 h-4" /> Parcel Barcode
                </label>
                <Input 
                  placeholder="e.g. DEX12345678" 
                  value={parcelBarcode}
                  onChange={(e) => setParcelBarcode(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <UserCheck className="w-4 h-4" /> Customer Profile
                </label>
                <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-10 bg-background text-left font-normal border-input text-foreground hover:bg-muted/50">
                      <span className="truncate">
                        {customerName ? customerName : customerPhone ? customerPhone : customerEmail ? customerEmail : <span className="text-muted-foreground">Optional Details</span>}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                      <div className="space-y-1 block">
                        <h4 className="font-medium leading-none text-foreground">Customer Context</h4>
                        <p className="text-xs text-muted-foreground">Optionally attach details to this Daraz order.</p>
                      </div>
                      <div className="grid gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground font-semibold">Full Name (Optional)</label>
                          <Input placeholder="e.g. John Doe" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-9"/>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground font-semibold">Phone Number (Optional)</label>
                          <Input placeholder="e.g. 0770000000" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-9"/>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground font-semibold">Email Address (Optional)</label>
                          <Input placeholder="e.g. john@example.com" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="h-9"/>
                        </div>
                        <Button className="w-full mt-2" onClick={() => setIsCustomerPopoverOpen(false)}>
                          Confirm Profile
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Rapid Data Entry Table */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 border-b bg-muted/50 rounded-t-lg">
                <ProductSelect products={products} onSelect={handleProductSelect} />
              </div>
              
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0 z-10 transition-colors">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[120px]">Quantity</TableHead>
                      <TableHead className="w-[150px]">Unit Price</TableHead>
                      <TableHead className="w-[150px] text-right">Total (LKR)</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          No products added to the order yet.<br/>
                          Use the search bar above to begin.
                        </TableCell>
                      </TableRow>
                    ) : cart.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium text-sm text-foreground">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.barcode || item.sku || 'No Barcode'}</div>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="1"
                            className="h-8 w-20 text-center bg-background"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="0"
                            className="h-8 bg-background"
                            value={item.selling_price}
                            onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {item.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/20"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Financials & Submission */}
        <div className="xl:col-span-1 space-y-4">
          <Card className="shadow-sm sticky top-4">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-muted-foreground">Items Total:</span>
                <span className="text-foreground">LKR {productTotal.toLocaleString()}</span>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium text-muted-foreground flex justify-between">
                  <span>Delivery Fees (LKR)</span>
                  {deliveryFees > 0 && <span className="text-primary font-semibold">+{Number(deliveryFees).toLocaleString()}</span>}
                </label>
                <Input 
                  type="number" 
                  min="0" 
                  className="font-medium bg-background"
                  placeholder="0.00" 
                  value={deliveryFees || ""}
                  onChange={(e) => setDeliveryFees(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-base font-semibold text-foreground">Final Amount</span>
                </div>
                <div className="text-3xl font-bold text-foreground tracking-tight">
                  <span className="text-lg text-muted-foreground font-medium mr-1">Rs.</span>
                  {finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex gap-2 mt-6 border-t pt-4">
                <Button 
                  onClick={() => handleSubmit(true)} 
                  disabled={processing || cart.length === 0} 
                  variant="outline"
                  className="w-1/3 h-11 border-orange-200 text-orange-600 hover:bg-orange-50 font-semibold shadow-sm"
                  size="lg"
                >
                  {processing === 'hold' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><History className="w-4 h-4 mr-2" /> Hold</>}
                </Button>
                <Button 
                  onClick={() => handleSubmit(false)} 
                  disabled={processing || cart.length === 0}
                  className="w-2/3 h-11 bg-orange-500 hover:bg-orange-600 font-semibold text-white shadow-md shadow-orange-500/20"
                  size="lg"
                >
                  {processing === 'submit' ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <><Save className="w-5 h-5 mr-2" /> Submit Daraz Sale</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
