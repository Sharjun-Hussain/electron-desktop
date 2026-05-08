"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ReceiptText, Wallet, Loader2,
  Package, ShoppingBag, Mail, Phone, MapPin,
  ChevronDown, ChevronUp, Activity,
  CreditCard, TrendingUp, Building2, Save, X,
  Banknote, Truck, MousePointerClick, Network
} from "lucide-react";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { DataActions } from "@/components/general/DataActions";

export function DistributorLedgerSheet({ distributor, open, onOpenChange, accessToken }) {
  const [ledgerData, setLedgerData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [orderItemsMap, setOrderItemsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [itemLoadingMap, setItemLoadingMap] = useState({});
  const [currentBalance, setCurrentBalance] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [chequeDetails, setChequeDetails] = useState({
    bank_name: "",
    cheque_number: "",
    cheque_date: format(new Date(), "yyyy-MM-dd"),
    payee_payor_name: "",
  });

  const { formatCurrency, formatDate } = useAppSettings();

  const fetchLedger = useCallback(async () => {
    if (!distributor?.id || !accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors/${distributor.id}/ledger`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const result = await response.json();
      if (result.status === "success") {
        setLedgerData(result.data.ledger || []);
        setCurrentBalance(result.data.current_balance || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch wholesale ledger archive");
    } finally {
      setLoading(false);
    }
  }, [distributor?.id, accessToken]);

  const fetchOrders = useCallback(async () => {
    if (!distributor?.id || !accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?distributor_id=${distributor.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const result = await response.json();
      if (result.status === "success") {
        setOrdersData(Array.isArray(result.data?.data) ? result.data.data : (Array.isArray(result.data) ? result.data : []));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch distribution logs");
    } finally {
      setLoading(false);
    }
  }, [distributor?.id, accessToken]);

  const fetchPurchasedItems = useCallback(async () => {
    if (!distributor?.id || !accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors/${distributor.id}/purchased-items`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const result = await response.json();
      if (result.status === "success") {
        setItemsData(Array.isArray(result.data) ? result.data : (Array.isArray(result.data?.data) ? result.data.data : []));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [distributor?.id, accessToken]);

  const toggleOrderItems = async (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      if (!orderItemsMap[orderId]) {
        try {
          setItemLoadingMap(prev => ({ ...prev, [orderId]: true }));
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${orderId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const result = await res.json();
          if (result.status === "success") {
            setOrderItemsMap(prev => ({ ...prev, [orderId]: result.data.items }));
          }
        } catch (err) {
          console.error("Failed to fetch order items:", err);
          toast.error("Failed to fetch manifest entries");
        } finally {
          setItemLoadingMap(prev => ({ ...prev, [orderId]: false }));
        }
      }
    }
    setExpandedOrders(newExpanded);
  };

  useEffect(() => {
    if (open && distributor?.id) {
      if (activeTab === "ledger") fetchLedger();
      if (activeTab === "orders") fetchOrders();
      if (activeTab === "items") fetchPurchasedItems();
      if (activeTab === "overview") fetchLedger();
    }
  }, [open, distributor?.id, activeTab, fetchLedger, fetchOrders, fetchPurchasedItems]);

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount"));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid reconciliation amount");
      return;
    }
    const payload = {
      amount,
      payment_method: paymentMethod,
      description: formData.get("description"),
      transaction_date: new Date().toISOString(),
      cheque_details: paymentMethod === "cheque" ? chequeDetails : null,
    };
    try {
      setSettleLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors/${distributor.id}/payments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        toast.success("Wholesale settlement recorded");
        setSettleOpen(false);
        fetchLedger();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to process settlement");
    } finally {
      setSettleLoading(false);
    }
  };

  const isReceivable = currentBalance > 0;

  const exportData = useMemo(() => {
    return ledgerData.map(t => ({
      Date: formatDate(t.transaction_date),
      Description: t.description,
      Reference: t.reference_type,
      Type: t.type === 'debit' ? 'Debit (-)' : 'Credit (+)',
      Amount: t.amount,
      Balance: t.balance
    }));
  }, [ledgerData, formatDate]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-background border-l shadow-2xl">

          {/* HEADER */}
          <SheetHeader className="px-8 py-6 pr-14 border-b border-border bg-background shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-md">
                    <Network className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    {distributor?.name}
                    <Badge variant={distributor?.is_active ? "default" : "secondary"} className="text-[10px] font-semibold tracking-wide bg-blue-600">
                      {distributor?.is_active ? "AUTHORIZED" : "SUSPENDED"}
                    </Badge>
                  </SheetTitle>
                </div>
                <SheetDescription className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <ReceiptText className="h-4 w-4" />
                  Partner Network ID: #{distributor?.id}
                </SheetDescription>
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Outstading Dues</p>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {formatCurrency(Math.abs(currentBalance || 0))}
                  </span>
                  <Badge variant="outline" className={cn("text-xs font-bold border", isReceivable ? "text-amber-600 border-amber-200 bg-amber-50" : "text-blue-600 border-blue-200 bg-blue-50")}>
                    {isReceivable ? "DR" : "CR"}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* TABS NAVIGATION */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-8 border-b border-border bg-muted/10 shrink-0">
              <TabsList className="bg-transparent h-12 w-full justify-start gap-6 p-0 border-none">
                {[
                  { id: "overview", label: "Overview", icon: TrendingUp },
                  { id: "orders", label: "Shipments", icon: Truck },
                  { id: "ledger", label: "Ledger", icon: Activity },
                  { id: "items", label: "Inventory", icon: Package },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none h-full px-1 font-semibold text-sm text-muted-foreground data-[state=active]:text-foreground transition-none gap-2 data-[state=active]:shadow-none"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-8">

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="mt-0 space-y-6">

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-foreground">Business Logistics</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 shadow-sm flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-3.5 w-3.5 text-blue-600/70" />
                        <p className="text-xs font-semibold text-muted-foreground">Email Address</p>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{distributor?.email || "—"}</p>
                    </Card>
                    <Card className="p-4 shadow-sm flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-3.5 w-3.5 text-blue-600/70" />
                        <p className="text-xs font-semibold text-muted-foreground">Phone Number</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{distributor?.phone || "—"}</p>
                    </Card>
                    <Card className="p-4 shadow-sm flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-600/70" />
                        <p className="text-xs font-semibold text-muted-foreground">Warehouse</p>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{distributor?.address || "—"}</p>
                    </Card>
                  </div>
                </div>

                {/* Account Metrics */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-foreground">Channel Metrics</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Banknote className="h-4 w-4 text-blue-600/70" />
                        <p className="text-xs font-semibold text-muted-foreground">Total Volume</p>
                      </div>
                      <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(parseFloat(distributor?.totalSpent || 0))}</p>
                    </Card>
                    <Card className="p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-blue-600/70" />
                        <p className="text-xs font-semibold text-muted-foreground">Credit Limit</p>
                      </div>
                      <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(distributor?.credit_limit || 0)}</p>
                    </Card>
                    <Card className="p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-4 w-4 text-blue-600/70" />
                        <p className="text-xs font-semibold text-muted-foreground">Total Shipments</p>
                      </div>
                      <p className="text-xl font-bold tabular-nums text-foreground">{distributor?.visits || 0}</p>
                    </Card>
                  </div>
                </div>

                {/* Financial Actions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-foreground">Wholesale Settlements</h3>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-md border border-border">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Record Wholesale Payment</p>
                      <p className="text-sm text-muted-foreground">Log bulk payments or reconcile distributor dues.</p>
                    </div>
                    <Button onClick={() => setSettleOpen(true)} className="gap-2 shadow-sm font-semibold bg-blue-600 hover:bg-blue-700">
                      <Wallet className="h-4 w-4" />
                      Record Settlement
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* SHIPMENTS TAB */}
              <TabsContent value="orders" className="mt-0">
                <div className="border border-border rounded-md shadow-sm overflow-x-auto bg-background">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="font-semibold text-[11px] uppercase tracking-wider">Manifest</TableHead>
                        <TableHead className="font-semibold text-[11px] uppercase tracking-wider">Date</TableHead>
                        <TableHead className="text-center font-semibold text-[11px] uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-right font-semibold text-[11px] uppercase tracking-wider">Volume</TableHead>
                        <TableHead className="text-right font-semibold text-[11px] uppercase tracking-wider">Paid</TableHead>
                        <TableHead className="text-right font-semibold text-[11px] uppercase tracking-wider pr-4">Owed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && ordersData.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></TableCell></TableRow>
                      ) : ordersData.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">No distribution records found.</TableCell></TableRow>
                      ) : (
                        ordersData.map((order) => (
                          <React.Fragment key={order.id}>
                            <TableRow className="cursor-pointer transition-colors hover:bg-muted/30" onClick={() => toggleOrderItems(order.id)}>
                              <TableCell className="pl-4">
                                {expandedOrders.has(order.id) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </TableCell>
                              <TableCell className="font-bold text-[13px] text-slate-900 dark:text-white flex items-center gap-1.5 h-14">
                                <ReceiptText className="h-3 w-3 text-slate-400" />
                                #{order.invoice_number}
                              </TableCell>
                              <TableCell className="text-[12px] font-medium text-slate-500 whitespace-nowrap">{formatDate(order.sale_date)}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0 h-5", order.payment_status === "paid" ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50")}>
                                  {order.payment_status?.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-[13px] tabular-nums text-slate-900 dark:text-white">
                                {formatCurrency(order.payable_amount)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-[12px] tabular-nums text-emerald-600">
                                {formatCurrency(order.paid_amount)}
                              </TableCell>
                              <TableCell className="pr-4 text-right font-bold text-[13px] tabular-nums text-rose-600">
                                {formatCurrency(Math.max(0, order.payable_amount - order.paid_amount))}
                              </TableCell>
                            </TableRow>
                            {expandedOrders.has(order.id) && (
                              <TableRow className="bg-muted/10">
                                <TableCell colSpan={7} className="p-0">
                                  <div className="px-10 py-4">
                                    <div className="bg-background border border-border p-4 rounded-md shadow-sm">
                                      {(!order.items || order.items.length === 0) ? (
                                        <div className="py-4 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                                          <Package className="h-4 w-4 opacity-20" />
                                          No itemized records available for this manifest.
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          {order.items.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between text-[13px] py-1.5 border-b border-border/50 last:border-0 last:pb-0">
                                              <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                  <div className="h-1 w-1 rounded-full bg-blue-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="font-bold text-slate-900 dark:text-white leading-none">
                                                    {item.product?.name || item.product_name || "Unknown Product"}
                                                  </span>
                                                  {item.variant?.name && (
                                                    <span className="text-[10px] text-slate-500 font-semibold mt-1 uppercase tracking-wider">{item.variant.name}</span>
                                                  )}
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] font-bold h-5 px-1.5 bg-slate-100 text-slate-600 border-none">
                                                  x{item.quantity}
                                                </Badge>
                                              </div>
                                              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                                                {formatCurrency(item.total_price || (item.unit_price * item.quantity))}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* LEDGER TAB */}
              <TabsContent value="ledger" className="mt-0 space-y-4">
                <div className="flex items-center justify-end">
                  <DataActions 
                    data={exportData} 
                    fileName={`${distributor?.name || 'Distributor'}_Wholesale_Statement`}
                    showPrint
                  />
                </div>

                <div className="border border-border rounded-md shadow-sm overflow-x-auto bg-background">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold pl-4">Date</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                        <TableHead className="text-right font-semibold pr-4">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && ledgerData.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></TableCell></TableRow>
                      ) : ledgerData.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">No ledger entries found.</TableCell></TableRow>
                      ) : (
                        ledgerData.map((t) => (
                          <TableRow key={t.id} className="transition-colors hover:bg-muted/30">
                            <TableCell className="pl-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(t.transaction_date)}</TableCell>
                            <TableCell>
                              <p className="text-sm font-medium text-foreground">{t.description}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{t.reference_type}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn("text-sm font-medium", t.type === "debit" ? "text-amber-600" : "text-blue-600")}>
                                {t.type === "debit" ? "-" : "+"}{formatCurrency(t.amount)}
                              </span>
                            </TableCell>
                            <TableCell className="pr-4 text-right">
                              <span className="text-sm font-medium text-foreground font-bold">
                                {formatCurrency(t.balance)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* INVENTORY TAB */}
              <TabsContent value="items" className="mt-0">
                {loading && itemsData.length === 0 ? (
                  <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(!Array.isArray(itemsData) || itemsData.length === 0) ? (
                      <div className="col-span-2 py-12 text-center border border-dashed border-border rounded-md">
                        <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <h4 className="font-medium text-sm text-muted-foreground">No distributed assets found</h4>
                      </div>
                    ) : (
                      itemsData.map((item, idx) => (
                        <Card key={idx} className="p-4 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{item.product_name}</p>
                              <span className="text-xs text-muted-foreground font-semibold">Bulk x{item.purchase_count} units total</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Last Shipment</p>
                            <p className="text-sm font-medium text-foreground">{formatDate(item.last_purchase_date)}</p>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </TabsContent>

            </div>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* SETTLEMENT DIALOG */}
      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent className="sm:max-w-lg p-0 bg-background border shadow-xl flex flex-col max-h-[90vh] overflow-hidden">

          <DialogHeader className="px-6 py-5 border-b border-border bg-background shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-md">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Distributor Settlement</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Reconcile wholesale dues for {distributor?.name}</p>
              </div>
            </div>
          </DialogHeader>

          <form id="settlement-form" onSubmit={handleSettleSubmit} className="flex-1 flex flex-col min-h-0">

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="amount" className="font-semibold">Settlement Amount</Label>
                <Input
                  id="amount" name="amount" type="number" step="0.01"
                  defaultValue={Math.abs(currentBalance || 0)}
                  className="shadow-sm font-mono text-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Payment Method</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'cash', label: 'Cash', icon: Wallet },
                    { id: 'bank', label: 'Bank', icon: Building2 },
                    { id: 'cheque', label: 'Cheque', icon: CreditCard },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={cn(
                        "flex items-center justify-center py-2.5 rounded-md border text-sm font-medium transition-colors gap-2",
                        paymentMethod === m.id
                          ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <m.icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "cheque" && (
                <div className="p-4 bg-muted/30 rounded-md border border-border space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Bank Name</Label>
                      <Input
                        value={chequeDetails.bank_name}
                        onChange={(e) => setChequeDetails({ ...chequeDetails, bank_name: e.target.value })}
                        placeholder="e.g. Commercial Bank"
                        className="shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Cheque Number</Label>
                      <Input
                        value={chequeDetails.cheque_number}
                        onChange={(e) => setChequeDetails({ ...chequeDetails, cheque_number: e.target.value })}
                        placeholder="Serial code"
                        className="shadow-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Cheque Date</Label>
                      <Input
                        type="date"
                        value={chequeDetails.cheque_date}
                        onChange={(e) => setChequeDetails({ ...chequeDetails, cheque_date: e.target.value })}
                        className="shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">Reconciliation Notes</Label>
                <Input
                  id="description" name="description"
                  placeholder="Bulk payment for manifest #..."
                  className="shadow-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-background shrink-0 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSettleOpen(false)}
                className="font-semibold shadow-sm"
              >
                <X className="mr-2 h-4 w-4" />
                Discard
              </Button>
              <Button
                type="submit"
                disabled={settleLoading}
                className="font-semibold shadow-sm min-w-[120px] bg-blue-600 hover:bg-blue-700"
              >
                {settleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Complete Settlement
                  </>
                )}
              </Button>
            </div>

          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
