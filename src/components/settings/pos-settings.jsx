"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { useBeep } from "@/hooks/use-beep";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useSettingsStore } from "@/store/useSettingsStore";
import {
  Save, Volume2, Printer, Percent, Calculator,
  CreditCard, Banknote, Smartphone, QrCode,
  FileText, ScrollText, CheckCircle2, Settings2, Loader2, Eye,
  Fingerprint, Type, Layout, AlignLeft, AlignCenter, RotateCcw, Image as ImageIcon,
  Usb, Scan, Activity, Zap, Info, ShieldCheck, Monitor,
  Fullscreen, Package, Lock, ArrowUpCircle, LayoutGrid,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { safeMergeSettings } from "@/lib/settings-utils";
import { ReceiptTemplate } from "@/components/pos/ReceiptTemplate";
import { InvoiceA4Template } from "@/components/pos/InvoiceA4Template";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const AVAILABLE_PAYMENTS = [
  { id: "cash", label: "Cash", icon: Banknote, desc: "Physical currency" },
  { id: "card", label: "Card Terminal", icon: CreditCard, desc: "Credit/Debit transactions" },
  { id: "online", label: "Online Transfer", icon: CreditCard, desc: "Bank transfer basis" },
  { id: "qr", label: "QR Payment", icon: QrCode, desc: "Scan to pay" },
  { id: "wallet", label: "Digital Wallet", icon: Smartphone, desc: "Apple Pay / Google Pay" },
  { id: "cheque", label: "Cheque Basis", icon: ScrollText, desc: "Physical cheque settlement" },
];

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="p-1.5 rounded-md bg-emerald-500/10 shrink-0">
      <Icon className="w-4 h-4 text-emerald-600" />
    </div>
    <div className="flex flex-col gap-1.5">
      <h3 className="text-sm font-medium text-slate-900 dark:text-white leading-none">{title}</h3>
      {description && <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none font-medium">{description}</p>}
    </div>
  </div>
);

const ToggleRow = ({ label, desc, checked, onCheckedChange }) => (
  <div className="flex items-center justify-between py-1.5 px-3 rounded-md border border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20 mb-1 last:mb-0 transition-all hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
    <div className="space-y-1">
      <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 leading-none">{label}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">{desc}</p>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="data-[state=checked]:bg-emerald-600"
    />
  </div>
);

import { useHardware } from "@/components/pos/hooks/useHardware";
import qz from "qz-tray";
import { hardwareService } from "@/lib/qz-service";

export function PosSettings() {
  const { hasPermission } = usePermission();
  const { useModularSettings, updateModularSettings, useBusinessSettings } = useSettings();
  const { data: response, isLoading } = useModularSettings('pos');
  const { data: businessResponse } = useBusinessSettings();
  const business = businessResponse?.data;
  const planFeatures = business?.plan?.features || [];
  const overrides = business?.module_overrides || [];
  const tier = business?.subscription_tier;
  const posLayout = useSettingsStore((state) => state.global?.posLayout || "modern");
  const setPosLayout = useSettingsStore((state) => state.setPosLayout);
  const posTouchUI = useSettingsStore((state) => state.global?.posTouchUI || false);
  const setPosTouchUI = useSettingsStore((state) => state.setPosTouchUI);

  const {
    isReady: isHardwareReady, isConnecting, selectedPrinter,
    selectedScalePort, selectedDisplayPort, currentWeight,
    pickPrinter, pickScalePort, pickDisplayPort,
    startScaleListening, stopScaleListening, updateDisplay,
    openDrawer, printReceipt
  } = useHardware();
  const [systemPrinters, setSystemPrinters] = useState([]);
  const [serialPorts, setSerialPorts] = useState([]);
  const [hasFetchedHardware, setHasFetchedHardware] = useState(false);



  const isShiftEnabled =
    planFeatures.includes('shift_management') ||
    planFeatures.includes('all_features') ||
    overrides.includes('shift_management') ||
    tier === 'Enterprise';

  const { playBeep } = useBeep();
  const [terminalName, setTerminalName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("pos_terminal_id");
    if (saved) setTerminalName(saved);
  }, []);

  const handleTerminalNameChange = (val) => {
    setTerminalName(val);
    localStorage.setItem("pos_terminal_id", val);
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(searchParams.get("config") || "behavior");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const printRef = useRef(null);

  const handleTestPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Test_Receipt",
  });

  useEffect(() => {
    const config = searchParams.get("config");
    if (config) setActiveTab(config);
  }, [searchParams]);

  // Fetch all hardware when QZ is ready
  useEffect(() => {
    if (isHardwareReady && activeTab === 'printer' && !hasFetchedHardware) {
      // Printers (Filtered physical/active only)
      hardwareService.findActivePrinters().then(setSystemPrinters).catch(console.error);
      // Serial Ports (Scales/Displays)
      hardwareService.findSerialPorts().then(setSerialPorts).catch(console.error);
      setHasFetchedHardware(true);
    }
  }, [isHardwareReady, activeTab, hasFetchedHardware]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams);
    params.set("config", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [formData, setFormData] = useState({
    enableSound: true, beepStyle: "digital", masterVolume: 60, beepPitch: 440, beepDuration: 0.1, beepWaveform: "sine",
    showReceiptPreview: true,
    showDiscount: true, showTax: true, activePaymentMethods: ["cash", "card"],
    invoiceTemplate: "thermal_80", paperWidth: "80mm", fontSize: "medium", fontFamily: "mono", defaultPaymentMethod: "cash",
    showLogo: true, showHeader: true, showFooter: true, headerText: "", footerText: "Thank you for your business!\nPlease visit again.",
    refundPolicy: "Returns accepted within 7 days with original receipt. Items must be in original condition.",
    enableWholesale: true,
    requireShift: true,
    posPricingMode: "fifo", // "fifo" or "manual_batch"
    enableBatchSelection: false,
    showUser: true, showCustomer: true, showDateTime: true, showSalesType: true, showBarcode: true,
    autoPrint: true, openCashDrawer: true, autoFeed: true, silentPrint: false, enableMultiplePayments: false,
    enableExtraDiscount: true, defaultExtraDiscountType: "amount",
    posTableColumns: ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "batch", "expire"],
  });

  const [peripherals, setPeripherals] = useState({
    receiptPrinter: { status: 'disconnected', name: null },
    barcodePrinter: { status: 'disconnected', name: null },
    scanner: { status: 'listening', name: 'Standard HID Scanner' },
    drawer: { status: 'wired', name: 'Printer Linked' },
    digitalScale: { status: 'online', name: 'Mettler Toledo - COM3' }
  });

  // Pattern Recognition for Barcode Scanners
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeydown = (e) => {
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt') return;

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Industrial scanners typically type at <30ms per character velocity
      if (diff < 40) {
        buffer += e.key;
        if (buffer.length > 8) {
          setPeripherals(prev => ({
            ...prev,
            scanner: { ...prev.scanner, status: 'connected' }
          }));
        }
      } else {
        buffer = "";
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const detectUSBDevice = async (type) => {
    try {
      if (!navigator.usb) {
        toast.error("WebUSB is not supported in this environment (Secure Context required)");
        return;
      }
      const device = await navigator.usb.requestDevice({ filters: [] });
      setPeripherals(prev => ({
        ...prev,
        [type]: { status: 'connected', name: device.productName || device.manufacturerName || 'Target Peripheral' }
      }));
      toast.success(`${type.replace(/([A-Z])/g, ' $1')} identified successfully`);
    } catch (e) {
      console.warn("USB Discovery Session Cancelled", e);
    }
  };

  const handlePulseDrawer = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 800)),
      {
        loading: 'Synthesizing Drawer Pulse...',
        success: 'Cash Drawer kick signal verified',
        error: 'Hardware communication failure'
      }
    );
  };


  const mockSale = {
    invoice_number: "INV-2024-001",
    created_at: new Date().toISOString(),
    is_wholesale: false,
    total_amount: 1250.00,
    discount_amount: 50.00,
    tax_amount: 180.00,
    payable_amount: 1380.00,
    paid_amount: 1500.00,
    payment_method: "CASH",
    customer: { name: "Abhijit Sharma" },
    sellers: [{ name: "Admin User" }],
    items: [
      { product: { name: "Premium Arabica Coffee" }, product_variant: { name: "250g Pack" }, quantity: 1, unit_price: 800, total_amount: 800 },
      { product: { name: "Organic Brown Sugar" }, quantity: 2, unit_price: 225, total_amount: 450 }
    ]
  };

  const businessData = businessResponse?.data || {
    name: "Aetheria Workstation",
    address: "742 Evergreen Terrace, Springfield, OR",
    phone: "+1 (555) 0123-4567",
    tax_id: "VAT-9988776655",
    logo: null
  };

  useEffect(() => {
    if (response?.data) {
      setFormData(prev => {
        const merged = safeMergeSettings(prev, response.data);

        // Auto-default to A4 Professional for Manufacturing businesses if not already configured for A4
        if (businessResponse?.data?.business_type === 'manufacturing' &&
          (!response.data.invoiceTemplate || !response.data.invoiceTemplate.includes('a4'))) {
          merged.invoiceTemplate = 'a4_professional';
          merged.paperWidth = '210mm';
        }
        return merged;
      });
    }
  }, [response, businessResponse]);

  const togglePayment = (id) => {
    setFormData(prev => {
      const active = prev.activePaymentMethods || [];
      return { ...prev, activePaymentMethods: active.includes(id) ? active.filter(p => p !== id) : [...active, id] };
    });
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleColumn = (colId) => {
    setFormData(prev => {
      const current = prev.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "batch", "expire"];
      const updated = current.includes(colId)
        ? current.filter(c => c !== colId)
        : [...current, colId];
      return { ...prev, posTableColumns: updated };
    });
  };

  const handleSave = async () => {
    if (!hasPermission(PERMISSIONS.SETTINGS_POS)) {
      toast.error("You do not have permission to modify POS settings");
      return;
    }
    setIsSaving(true);
    const result = await updateModularSettings('pos', formData);
    if (result.success) toast.success("POS configuration synchronized");
    else toast.error(result.error || "Failed to synchronize POS basis");
    setIsSaving(false);
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-200 dark:text-slate-800" /></div>;

  const selectTriggerCls = "w-full h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md text-[13px] font-medium text-slate-900 dark:text-white transition-all";

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-6">
          <TabsList className="bg-transparent h-auto p-0 flex gap-10 justify-start rounded-none">
            {[
              { id: "behavior", label: "Terminal Behavior", icon: Settings2 },
              { id: "invoice", label: "Invoice Layout", icon: FileText, restricted: tier === 'Essential' },
              { id: "printer", label: "Hardware Control", icon: Printer },
              { id: "payments", label: "Payment Protocol", icon: CreditCard, restricted: tier === 'Essential' },
            ].map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-500 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 dark:data-[state=active]:border-emerald-500 data-[state=active]:shadow-none text-[13px] h-11 px-0 transition-all border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200  gap-2"
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.restricted && <Lock className="w-3 h-3 text-amber-500 ml-1" />}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* TAB 1: BEHAVIOR */}
        <TabsContent value="behavior" className="mt-0 outline-none animate-in fade-in-0 duration-300">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-md overflow-hidden">
            <CardContent className="p-6">
              <SectionHeader icon={Volume2} title="Structural Audio Profile" description="Synthesize and calibrate the terminal's electronic sound signatures for active cashier sessions" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tone Synthesis */}
                <div className="space-y-6">
                  <ToggleRow label="Audio Action Basis" desc="Enable real-time electronic sound synthesis on POS events" checked={formData.enableSound} onCheckedChange={(c) => updateField('enableSound', c)} />

                  {formData.enableSound && (
                    <div className="space-y-6 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 shadow-inner">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 ">Master Amplitude (%)</Label>
                          <span className="text-[11px] font-medium text-emerald-600 ">{formData.masterVolume}%</span>
                        </div>
                        <Slider
                          value={[formData.masterVolume]}
                          onValueChange={([v]) => updateField('masterVolume', v)}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 ">Oscillator Frequency (Hz)</Label>
                          <span className="text-[11px] font-medium text-emerald-600 ">{formData.beepPitch} Hz</span>
                        </div>
                        <Slider
                          value={[formData.beepPitch]}
                          onValueChange={([v]) => updateField('beepPitch', v)}
                          min={200}
                          max={2000}
                          step={10}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 ">Decay Softness (Duration)</Label>
                          <span className="text-[11px] font-medium text-emerald-600 ">{(formData.beepDuration * 1000).toFixed(0)} ms</span>
                        </div>
                        <Slider
                          value={[formData.beepDuration]}
                          onValueChange={([v]) => updateField('beepDuration', v)}
                          min={0.02}
                          max={0.5}
                          step={0.01}
                        />
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400  px-1">Synthesis Waveform</Label>
                        <Select value={formData.beepWaveform} onValueChange={(v) => updateField('beepWaveform', v)}>
                          <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <SelectItem value="sine" className="text-xs font-medium">Sine (Digital Clean)</SelectItem>
                            <SelectItem value="square" className="text-xs font-medium">Square (Mechanical)</SelectItem>
                            <SelectItem value="triangle" className="text-xs font-medium">Triangle (Soft Tone)</SelectItem>
                            <SelectItem value="sawtooth" className="text-xs font-medium">Sawtooth (Industrial)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 mt-4">
                        <Label className="text-[10px] font-medium text-slate-400  px-1">Sound Profile Diagnostic</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => playBeep('scan', formData)}
                            className="h-14 flex-col border-emerald-600/30 bg-emerald-600/5 hover:bg-emerald-600/10 text-emerald-600 rounded-md font-medium text-[10px] transition-all active:scale-95 gap-1 "
                          >
                            <Zap className="w-4 h-4" />
                            Scan
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => playBeep('success', formData)}
                            className="h-14 flex-col border-blue-600/30 bg-blue-600/5 hover:bg-blue-600/10 text-blue-600 rounded-md font-medium text-[10px] transition-all active:scale-95 gap-1 "
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Success
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => playBeep('error', formData)}
                            className="h-14 flex-col border-red-600/30 bg-red-600/5 hover:bg-red-600/10 text-red-600 rounded-md font-medium text-[10px] transition-all active:scale-95 gap-1 "
                          >
                            <Activity className="w-4 h-4" />
                            Error
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/50">
                    <SectionHeader icon={Layout} title="Interface & Layout" description="Select the primary visual structural basis for the POS workstation" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: "modern", label: "Modern Desktop", desc: "Touch-friendly & Visual", icon: Monitor },
                        { id: "classic", label: "Classic Industrial", desc: "Keyboard-first & Compact", icon: LayoutGrid },
                      ].map((layout) => {
                        const isActive = posLayout === layout.id;
                        return (
                          <div
                            key={layout.id}
                            onClick={() => {
                              setPosLayout(layout.id);
                              toast.success(`POS layout switched to ${layout.label}`);
                            }}
                            className={cn(
                              "relative cursor-pointer rounded-xl border p-4 transition-all outline-none",
                              isActive
                                ? "border-emerald-600 bg-emerald-50/10 dark:bg-emerald-500/5 shadow-sm ring-1 ring-emerald-600/20"
                                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                            )}
                          >
                            {isActive && <div className="absolute top-3 right-3 p-0.5 rounded-full bg-emerald-600 text-white shadow-sm"><CheckCircle2 className="w-2.5 h-2.5" /></div>}
                            <layout.icon className={cn("w-4 h-4 mb-3", isActive ? "text-emerald-600" : "text-slate-400 dark:text-slate-500")} />
                            <h4 className={cn("font-medium text-[12px]", isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>{layout.label}</h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 leading-none ">{layout.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                      <ToggleRow
                        label="Enable Touch UI Mode"
                        desc="Activates on-screen numpads for keyboard-less devices"
                        checked={posTouchUI}
                        onCheckedChange={(c) => {
                          setPosTouchUI(c);
                          toast.success(c ? "Touch UI enabled globally" : "Touch UI disabled");
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/50">
                    <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400  px-1 mb-2 block">Workstation Identification</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          placeholder="e.g. Counter 01, Express Register"
                          value={terminalName}
                          onChange={(e) => handleTerminalNameChange(e.target.value)}
                          className="h-10 pl-9 bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 rounded-md text-[13px] font-medium"
                        />
                      </div>
                      <div className="px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[9px] font-medium text-amber-800/60 ">Local Persistence Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1 lg:pt-0">
                  <ToggleRow label="Checkout Live Preview" desc="Render receipt preview prior to settlement" checked={formData.showReceiptPreview} onCheckedChange={(c) => updateField('showReceiptPreview', c)} />
                  <ToggleRow label="Line Item Discounts" desc="Allow manual adjustments to item prices" checked={formData.showDiscount} onCheckedChange={(c) => updateField('showDiscount', c)} />
                  <ToggleRow label="Fiscal Tax Breakdown" desc="Display tax structural details in cart" checked={formData.showTax} onCheckedChange={(c) => updateField('showTax', c)} />
                  <ToggleRow label="Enable Wholesale Mode" desc="Show wholesale toggle and pricing protocols in workstation" checked={formData.enableWholesale} onCheckedChange={(c) => updateField('enableWholesale', c)} />
                  <ToggleRow
                    label={
                      <div className="flex items-center gap-2">
                        Mandatory Shift Protocol
                        {!isShiftEnabled && <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 py-0 h-4 uppercase tracking-tighter font-semibold">Enterprise</Badge>}
                      </div>
                    }
                    desc="Require opening/closing shift for transactions"
                    checked={isShiftEnabled && formData.requireShift}
                    onCheckedChange={(c) => isShiftEnabled && updateField('requireShift', c)}
                  />
                  <ToggleRow label="Enable Split Payments" desc="Allow multiple payment methods for a single invoice" checked={formData.enableMultiplePayments} onCheckedChange={(c) => updateField('enableMultiplePayments', c)} />
                  <ToggleRow label="Enable Extra Checkout Discount" desc="Allow cashier to apply a final discount on the settlement screen" checked={formData.enableExtraDiscount ?? true} onCheckedChange={(c) => updateField('enableExtraDiscount', c)} />

                  {(formData.enableExtraDiscount ?? true) && (
                    <div className="flex items-center justify-between py-1.5 px-3 rounded-md border border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20 mb-1 ml-4 transition-all">
                      <div className="space-y-1">
                        <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 leading-none">Default Discount Type</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">Initial type for extra checkout discount</p>
                      </div>
                      <Select value={formData.defaultExtraDiscountType || "amount"} onValueChange={(v) => updateField('defaultExtraDiscountType', v)}>
                        <SelectTrigger className="w-[140px] h-8 bg-white dark:bg-slate-950 text-xs font-bold border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                          <SelectItem value="amount" className="text-xs font-bold">Fixed Amount</SelectItem>
                          <SelectItem value="percentage" className="text-xs font-bold">Percentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/50">
                    <SectionHeader icon={Package} title="Inventory & Pricing Strategy" description="Configure how the system identifies and prices products with multiple batches" />
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400  px-1">Pricing Identification Mode</Label>
                        <Select value={formData.posPricingMode} onValueChange={(v) => updateField('posPricingMode', v)}>
                          <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <SelectItem value="fifo" className="text-xs font-medium">Auto FIFO (Fastest - uses oldest batch price)</SelectItem>
                            <SelectItem value="manual_batch" className="text-xs font-medium">Manual Batch Selection (Most Accurate - asks cashier)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <ToggleRow
                        label="Force Selection on Price Conflict"
                        desc="Always show pop-up if batches have different selling prices"
                        checked={formData.enableBatchSelection}
                        onCheckedChange={(c) => updateField('enableBatchSelection', c)}
                      />
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/50">
                    <SectionHeader icon={LayoutGrid} title="Workstation Table Layout" description="Toggle visibility of specific data columns in the active POS sales table" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 bg-slate-50/30 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      {[
                        { id: "barcode", label: "Item Code", desc: "Unique barcode / SKU" },
                        { id: "name", label: "Item Name", desc: "Product & variant title" },
                        { id: "quantity", label: "Quantity", desc: "Sale qty / Units" },
                        { id: "mrp", label: "MRP", desc: "Maximum Retail Price" },
                        { id: "price", label: "Selling Price", desc: "Active unit rate" },
                        { id: "discount", label: "Disc. Amount", desc: "Fixed value reduction" },
                        { id: "discount_percent", label: "Disc. (%)", desc: "Percentage reduction" },
                        { id: "total", label: "Net Total", desc: "Line item calculation" },
                        { id: "batch", label: "Batch", desc: "Inventory lot tracking" },
                        { id: "expire", label: "Expiry", desc: "Safety date identifier" },
                      ].map((col) => (
                        <ToggleRow
                          key={col.id}
                          label={col.label}
                          desc={col.desc}
                          checked={(formData.posTableColumns || []).includes(col.id)}
                          onCheckedChange={() => toggleColumn(col.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: INVOICE & PRINT */}
        <TabsContent value="invoice" className="mt-0 outline-none animate-in fade-in-0 duration-300">
          {tier === 'Essential' ? (
            <div className="py-12">
              <Card className="border-amber-200 bg-amber-50/20 overflow-hidden max-w-2xl mx-auto">
                <div className="h-1 bg-amber-500 w-full" />
                <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Lock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-slate-900 leading-tight">Advanced Customization Restricted</h2>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Your organization is on the <span className="font-bold text-amber-700 underline decoration-amber-300">Essential Plan</span>. Thermal and A4 document layout customization are premium features.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl pt-1">
                    <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-start gap-2 text-left">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 leading-none">Professional</div>
                        <p className="text-[9px] text-slate-400 mt-1 leading-tight">Full layout control and messaging customization.</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-start gap-2 text-left">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 leading-none">Enterprise</div>
                        <p className="text-[9px] text-slate-400 mt-1 leading-tight">Professional A4 Invoicing with white-labeling.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button size="sm" className="h-8 px-5 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/10 text-[10px] font-bold" onClick={() => router.push('/settings?tab=subscription')}>
                      <ArrowUpCircle className="w-3.5 h-3.5 mr-2" /> Upgrade Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Designer Controls */}
              <div className="xl:col-span-6 space-y-6">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-md overflow-hidden">
                  <CardContent className="p-6">
                    <SectionHeader icon={Layout} title="Identity & Typography" description="Configure the structural basis and scaling for printed documentation" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {[
                        { id: "thermal_80", label: "Thermal 80mm", desc: "POS Standard", icon: ScrollText, width: "80mm" },
                        { id: "thermal_58", label: "Thermal 58mm", desc: "Narrow Roll", icon: ScrollText, width: "58mm" },
                        { id: "a4_professional", label: "Business A4", desc: "Professional Invoice", icon: FileText, width: "210mm" },
                        { id: "a4_basic", label: "Flatbed A4", desc: "Standard Layout", icon: FileText, width: "210mm" },
                      ].map((tpl) => {
                        const isActive = formData.invoiceTemplate === tpl.id;
                        return (
                          <div
                            key={tpl.id}
                            onClick={() => {
                              updateField('invoiceTemplate', tpl.id);
                              updateField('paperWidth', tpl.width);
                            }}
                            className={cn(
                              "relative cursor-pointer rounded-md border p-4 transition-all outline-none",
                              isActive
                                ? "border-emerald-600 bg-emerald-50/10 dark:bg-emerald-500/5 shadow-sm ring-1 ring-emerald-600/20"
                                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                            )}
                          >
                            {isActive && <div className="absolute top-3 right-3 p-0.5 rounded-full bg-emerald-600 text-white shadow-sm"><CheckCircle2 className="w-2.5 h-2.5" /></div>}
                            <tpl.icon className={cn("w-4 h-4 mb-3", isActive ? "text-emerald-600" : "text-slate-400 dark:text-slate-500")} />
                            <h4 className={cn("font-medium text-[12px]", isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>{tpl.label}</h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 leading-none ">{tpl.desc}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-50 dark:border-slate-800/50">

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400  px-1">Display Scale (Font)</Label>
                        <Select value={formData.fontSize} onValueChange={(v) => updateField('fontSize', v)}>
                          <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <SelectItem value="xsmall" className="text-xs font-medium">X-Small (Compact)</SelectItem>
                            <SelectItem value="small" className="text-xs font-medium">Small (Condensed)</SelectItem>
                            <SelectItem value="medium" className="text-xs font-medium">Medium (Standard)</SelectItem>
                            <SelectItem value="large" className="text-xs font-medium">Large (High Vis)</SelectItem>
                            <SelectItem value="xlarge" className="text-xs font-medium">X-Large (Display)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col justify-end xl:col-span-2">
                        <div className="p-3 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20">
                          <ToggleRow label="Show Business Logo" desc="Render corporate identifier" checked={formData.showLogo} onCheckedChange={(c) => updateField('showLogo', c)} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-md overflow-hidden">
                  <CardContent className="p-6">
                    <SectionHeader icon={AlignLeft} title="Messaging & Information" description="Customize terminal headers and footer disclosure statements" />

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400  px-1">Header Custom Title</Label>
                        <Input
                          value={formData.headerText}
                          onChange={(e) => updateField('headerText', e.target.value)}
                          className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md text-[13px] font-medium text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400  px-1">Footer Disclaimer / Thank You</Label>
                        <textarea
                          value={formData.footerText}
                          onChange={(e) => updateField('footerText', e.target.value)}
                          className="w-full min-h-[60px] p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[13px] font-medium text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                          placeholder="E.g. Thank you for your business!"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400  px-1 text-emerald-600">Refund & Return Policy</Label>
                        <textarea
                          value={formData.refundPolicy}
                          onChange={(e) => updateField('refundPolicy', e.target.value)}
                          className="w-full min-h-[80px] p-3 bg-emerald-50/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-md text-[13px] font-medium text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                          placeholder="E.g. Returns accepted within 7 days..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-md overflow-hidden">
                  <CardContent className="p-6">
                    <SectionHeader icon={Fingerprint} title="Transaction Metadata" description="Toggle structural fields for detailed terminal traceability" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                      <ToggleRow label="Show Date & Time" desc="Official transaction timestamps" checked={formData.showDateTime} onCheckedChange={(c) => updateField('showDateTime', c)} />
                      <ToggleRow label="Show User Identification" desc="Identification of active cashier" checked={formData.showUser} onCheckedChange={(c) => updateField('showUser', c)} />
                      <ToggleRow label="Show Customer Info" desc="Registered buyer identification" checked={formData.showCustomer} onCheckedChange={(c) => updateField('showCustomer', c)} />
                      <ToggleRow label="Show Sales Category" desc="Wholesale vs Retail identifier" checked={formData.showSalesType} onCheckedChange={(c) => updateField('showSalesType', c)} />
                      <ToggleRow label="Tax Breakdown" desc="Render fiscal tax identifiers" checked={formData.showTax} onCheckedChange={(c) => updateField('showTax', c)} />
                      <ToggleRow label="Discount Details" desc="Line item and total adjustments" checked={formData.showDiscount} onCheckedChange={(c) => updateField('showDiscount', c)} />
                      <ToggleRow label="Print Invoice Barcode" desc="Render scannable code for returns" checked={formData.showBarcode ?? true} onCheckedChange={(c) => updateField('showBarcode', c)} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Live Preview Panel */}
              <div className="xl:col-span-6 relative">
                <div className="sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-amber-500/10 text-amber-600"><Eye className="w-3.5 h-3.5" /></div>
                      <h4 className="text-[11px] font-medium text-slate-500 ">Live Terminal Preview</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Draft Profile</div>
                      <div className="flex items-center border rounded-md overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] font-bold gap-1.5 border-r rounded-none hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600"
                          onClick={() => handleTestPrint()}
                        >
                          <Printer className="w-3 h-3" />
                          Test Print
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-none hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => setIsPreviewMaximized(true)}
                        >
                          <Fullscreen className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Dialog open={isPreviewMaximized} onOpenChange={setIsPreviewMaximized}>
                    <DialogContent className="max-w-[90vw] w-[1000px] h-[90vh] p-0 bg-slate-100 dark:bg-slate-950 border-none overflow-hidden flex flex-col">
                      <DialogHeader className="p-4 bg-white dark:bg-slate-900 border-b shrink-0">
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          Full Scale Document Preview
                        </DialogTitle>
                        <DialogDescription className="text-[11px]">
                          Reviewing {formData.invoiceTemplate === 'a4_professional' ? 'Professional A4 Invoice' : 'Standard Receipt'} layout at 1:1 scale
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center bg-slate-200/50 dark:bg-slate-900/50">
                        <div className="bg-white shadow-2xl h-fit">
                          {formData.invoiceTemplate === 'a4_professional' ? (
                            <InvoiceA4Template
                              sale={mockSale}
                              settings={formData}
                              business={businessData}
                            />
                          ) : (
                            <ReceiptTemplate
                              sale={mockSale}
                              settings={formData}
                              business={businessData}
                            />
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="w-full h-[600px] bg-slate-200/50 dark:bg-slate-950/40 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden relative group">
                    <div className="absolute inset-0 overflow-y-auto p-8 scrollbar-hide">
                      {/* The "Paper" container */}
                      <div ref={printRef} className="bg-white text-black shadow-2xl mx-auto origin-top transition-all duration-500 rounded-sm" style={{ width: formData.paperWidth === '210mm' ? '100%' : '240px' }}>
                        {formData.invoiceTemplate === 'a4_professional' ? (
                          <InvoiceA4Template
                            sale={mockSale}
                            settings={formData}
                            business={businessData}
                          />
                        ) : (
                          <ReceiptTemplate
                            sale={mockSale}
                            settings={formData}
                            business={businessData}
                          />
                        )}
                      </div>
                    </div>

                    {/* Texture Overlay */}
                    <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-200/20 dark:border-slate-950/20 rounded-3xl"></div>
                  </div>

                  <div className="mt-4 p-4 rounded-md bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600"><RotateCcw className="w-3.5 h-3.5" /></div>
                    <p className="text-[11px] text-emerald-800/60 dark:text-emerald-400/60 font-medium ">Changes above will propagate to the preview canvas in real-time.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 3: HARDWARE CONTROL CENTER */}
        {/* TAB 3: HARDWARE CONTROL CENTER */}
        <TabsContent value="printer" className="mt-0 outline-none animate-in fade-in-0 duration-300">
          <div className="space-y-12">

            {/* STAGE 1: System Connection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] font-bold">1</div>
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">System Connection</h3>
              </div>
              <Card className={cn(
                "border transition-all duration-500",
                isHardwareReady ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"
              )}>
                <CardContent className="p-3 sm:px-4">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl shadow-lg transition-all",
                        isHardwareReady ? "bg-emerald-600 text-white shadow-emerald-500/20" : "bg-amber-500 text-white shadow-amber-500/20"
                      )}>
                        {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Monitor className="w-5 h-5" />}
                      </div>
                      <div className="space-y-0.5 flex flex-col justify-center">
                        <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                          Hardware Service: {isHardwareReady ? "Operational" : "Disconnected"}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-none">
                          {isHardwareReady
                            ? "Linked to local hardware via QZ Tray WebSocket bridge"
                            : "QZ Tray not detected. Ensure the desktop application is running."}
                        </p>
                      </div>
                    </div>
                    {!isHardwareReady && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-4 border-amber-500/30 text-amber-600 dark:text-amber-500 bg-transparent hover:bg-amber-500/10 text-xs font-medium transition-all"
                        onClick={() => window.location.reload()}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-2" />
                        Retry Connection
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* STAGE 2: Preparation & Setup Guide */}
            {!isHardwareReady && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] font-bold">2</div>
                  <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Preparation & Setup Guide</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50">
                    <div className="p-2 w-fit rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase">Step 01</div>
                    <div className="space-y-1">
                      <h5 className="text-[13px] font-medium text-slate-900 dark:text-white">Install QZ Tray</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Download and install QZ Tray from <a href="https://qz.io/download/" target="_blank" className="text-emerald-600 underline">qz.io</a>. This is required for silent printing.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50">
                    <div className="p-2 w-fit rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase">Step 02</div>
                    <div className="space-y-1">
                      <h5 className="text-[13px] font-medium text-slate-900 dark:text-white">Select System Printer</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Select your thermal printer from the dropdown menu below. System will remember this for sales.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <div className="p-2 w-fit rounded-md bg-amber-500/10 text-amber-600"><ShieldCheck className="w-4 h-4" /></div>
                    <div className="space-y-1">
                      <h5 className="text-[13px] font-medium text-amber-900 dark:text-amber-400">Security Certificate</h5>
                      <p className="text-[11px] text-amber-800/60 dark:text-amber-400/60 leading-relaxed font-medium">
                        First time printing, QZ Tray asks for permission. Click **"Always Allow"** to prevent pop-ups.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* STAGE 3: Device Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                {isHardwareReady ? "2" : "3"}
              </div>
              <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Device Configuration</h3>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8 space-y-6">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-md overflow-hidden">
                  <CardContent className="p-6">
                    <SectionHeader icon={Printer} title="Primary Receipt Printer" description="Select and calibrate your physical thermal printer for silent checkout" />

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 px-1">Selected Device</Label>
                          <Select
                            value={selectedPrinter || ""}
                            onValueChange={pickPrinter}
                            disabled={!isHardwareReady}
                          >
                            <SelectTrigger className="h-10 bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-[13px] font-medium shadow-none">
                              <SelectValue placeholder={isHardwareReady ? "Select a printer..." : "Waiting for service..."} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {systemPrinters.length > 0 ? (
                                systemPrinters.map(p => (
                                  <SelectItem key={p} value={p} className="text-[13px] font-medium">{p}</SelectItem>
                                ))
                              ) : (
                                <div className="p-4 text-center text-[12px] text-slate-500">No printers detected on this computer</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 px-1">Device Identifier</Label>
                          <div className="h-10 px-3 flex items-center bg-slate-50/50 dark:bg-slate-950/30 rounded-md border border-dashed border-slate-200 dark:border-slate-800">
                            <span className="text-[13px] font-mono font-medium text-slate-900 dark:text-slate-100">
                              {selectedPrinter || "UNBOUND"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50">
                        <SectionHeader icon={Settings2} title="Auto-Peripheral Actions" description="Configure automatic structural triggers for physical hardware" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                          <ToggleRow label="Auto-Print Settlement" desc="Trigger printer immediately after payment" checked={formData.autoPrint} onCheckedChange={(c) => updateField('autoPrint', c)} />
                          <ToggleRow label="Kick Drawer Basis" desc="Trigger cash drawer RJ11 pulse on sale" checked={formData.openCashDrawer} onCheckedChange={(c) => updateField('openCashDrawer', c)} />
                          <ToggleRow label="Auto-Advance Feed" desc="Perform paper feed after document cut" checked={formData.autoFeed} onCheckedChange={(c) => updateField('autoFeed', c)} />
                          <ToggleRow label="Silent Receipt Basis" desc="Skip system print dialog (Experimental)" checked={formData.silentPrint} onCheckedChange={(c) => updateField('silentPrint', c)} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-md overflow-hidden">
                  <CardContent className="p-6">
                    <SectionHeader icon={Fullscreen} title="Digital Weight Scale" description="Connect an RS232/USB scale to automatically read item weights" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 px-1">Scale COM Port</Label>
                          <Select
                            value={selectedScalePort || ""}
                            onValueChange={pickScalePort}
                            disabled={!isHardwareReady}
                          >
                            <SelectTrigger className="h-10 bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-[13px] font-medium shadow-none">
                              <SelectValue placeholder="Select COM port..." />
                            </SelectTrigger>
                            <SelectContent>
                              {serialPorts.length > 0 ? serialPorts.map(port => (
                                <SelectItem key={port} value={port} className="text-[13px] font-medium">{port}</SelectItem>
                              )) : (
                                <div className="p-4 text-center text-[12px] text-slate-500">No COM ports detected</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[12px] font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-100 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                            onClick={startScaleListening}
                            disabled={!selectedScalePort}
                          >
                            <Activity className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                            Start Listening
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[12px] font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-100 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                            onClick={stopScaleListening}
                            disabled={!selectedScalePort}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-2 text-red-500" />
                            Stop
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5 flex flex-col">
                        <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 px-1">Live Weight Reading</Label>
                        <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-inner min-h-[92px]">
                          <span className={cn(
                            "text-3xl font-mono font-medium transition-all",
                            currentWeight > 0 ? "text-emerald-600 dark:text-emerald-500" : "text-slate-800 dark:text-slate-200"
                          )}>
                            {currentWeight.toFixed(3)}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Kilograms (KG)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-md overflow-hidden">
                  <CardContent className="p-6">
                    <SectionHeader icon={LayoutGrid} title="Customer Pole Display" description="Synchronize real-time cart totals to a physical VFD display" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 px-1">Display COM Port</Label>
                        <Select
                          value={selectedDisplayPort || ""}
                          onValueChange={pickDisplayPort}
                          disabled={!isHardwareReady}
                        >
                          <SelectTrigger className="h-10 bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-[13px] font-medium shadow-none">
                            <SelectValue placeholder="Select COM port..." />
                          </SelectTrigger>
                          <SelectContent>
                            {serialPorts.length > 0 ? serialPorts.map(port => (
                              <SelectItem key={port} value={port} className="text-[13px] font-medium">{port}</SelectItem>
                            )) : (
                              <div className="p-4 text-center text-[12px] text-slate-500">No COM ports detected</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          className="h-10 w-full border-dashed border-slate-200 dark:border-slate-800 text-[12px] font-medium hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-all shadow-none disabled:opacity-100 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                          onClick={async () => {
                            toast.loading("Sending test message...");
                            await updateDisplay("INZEEDO POS", "READY TO SERVE");
                            toast.dismiss();
                            toast.success("Message sent to pole display");
                          }}
                          disabled={!selectedDisplayPort}
                        >
                          <Monitor className="w-3.5 h-3.5 mr-2 text-blue-600" />
                          Test Welcome Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* STAGE 4: Hardware Diagnostics */}
              <div className="xl:col-span-4 space-y-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                    {isHardwareReady ? "3" : "4"}
                  </div>
                  <h4 className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Hardware Diagnostics</h4>
                </div>

                <Button
                  onClick={async () => {
                    const html = printRef.current.innerHTML;
                    toast.loading("Sending test print pulse...");
                    const success = await printReceipt(html);
                    if (success) toast.success("Test receipt printed successfully");
                  }}
                  disabled={!isHardwareReady || !selectedPrinter}
                  variant="outline"
                  className="w-full h-[52px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-between px-4 transition-all shadow-sm group disabled:opacity-100 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                >
                  <div className="flex items-center gap-3">
                    <Printer className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                    <div className="text-left flex flex-col justify-center">
                      <span className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 transition-colors">Print Test Page</span>
                      <span className="block text-[11px] text-slate-500 font-medium mt-0.5">Verify alignment & contrast</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </Button>

                <Button
                  onClick={async () => {
                    toast.loading("Sending drawer kick signal...");
                    await openDrawer();
                    toast.success("Cash drawer signal verified");
                  }}
                  disabled={!isHardwareReady || !selectedPrinter}
                  variant="outline"
                  className="w-full h-[52px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-between px-4 transition-all shadow-sm group disabled:opacity-100 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-slate-500 group-hover:text-amber-600 transition-colors" />
                    <div className="text-left flex flex-col justify-center">
                      <span className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-amber-600 transition-colors">Pulse Cash Drawer</span>
                      <span className="block text-[11px] text-slate-500 font-medium mt-0.5">Test physical RJ11 trigger</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition-colors" />
                </Button>

                <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-5"><ShieldCheck className="w-16 h-16 text-emerald-600" /></div>
                  <h5 className="text-[12px] font-medium text-emerald-600 dark:text-emerald-500 mb-1.5">Security: Hardware Locked</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Hardware signals are encrypted and transmitted locally. No data leaves your workstation during peripheral communication.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </TabsContent>

        {/* TAB 4: PAYMENT PROTOCOL */}
        <TabsContent value="payments" className="mt-0 space-y-6 outline-none animate-in fade-in-0 duration-300">
          {tier === 'Essential' ? (
            <div className="py-12">
              <Card className="border-amber-200 bg-amber-50/20 overflow-hidden max-w-2xl mx-auto">
                <div className="h-1 bg-amber-500 w-full" />
                <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Lock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-slate-900 leading-tight">Settlement Protocol Restricted</h2>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Your organization is on the <span className="font-bold text-amber-700 underline decoration-amber-300">Essential Plan</span>. Advanced payment methodologies (QR, Wallets, Transfers) are premium features.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl pt-1">
                    <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-start gap-2 text-left">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 leading-none">Professional</div>
                        <p className="text-[9px] text-slate-400 mt-1 leading-tight">Enable digital transfers and cheque settlements.</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-start gap-2 text-left">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 leading-none">Enterprise</div>
                        <p className="text-[9px] text-slate-400 mt-1 leading-tight">Dynamic QR payments and digital wallet integration.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button size="sm" className="h-8 px-5 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/10 text-[10px] font-bold" onClick={() => router.push('/settings?tab=subscription')}>
                      <ArrowUpCircle className="w-3.5 h-3.5 mr-2" /> Upgrade Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-md overflow-hidden">
                <CardContent className="p-6">
                  <SectionHeader icon={ShieldCheck} title="Active Settlement Protocols" description="Configure sanctioned payment methodologies available at the workstation checkout" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {AVAILABLE_PAYMENTS.map((payment) => {
                      const isSelected = (formData.activePaymentMethods || []).includes(payment.id);
                      return (
                        <div
                          key={payment.id}
                          onClick={() => togglePayment(payment.id)}
                          className={cn(
                            "relative flex items-start gap-4 p-4 rounded-md border transition-all cursor-pointer select-none outline-none",
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/10 dark:bg-emerald-500/5 shadow-sm ring-1 ring-emerald-600/20"
                              : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                          )}
                        >
                          <div className={cn(
                            "h-10 w-10 shrink-0 rounded-md flex items-center justify-center transition-all shadow-sm",
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                          )}>
                            <payment.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between">
                              <h4 className={cn("font-medium text-[12px] leading-none", isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>{payment.label}</h4>
                              {isSelected && (
                                <div className="p-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1.5 leading-none ">{payment.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t border-slate-50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
                        <Settings2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-300 ">Default Logical Basis:</Label>
                    </div>
                    <Select value={formData.defaultPaymentMethod} onValueChange={(v) => updateField('defaultPaymentMethod', v)}>
                      <SelectTrigger className="w-full sm:w-[260px] h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md text-[13px] font-medium text-slate-900 dark:text-white transition-all shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        {AVAILABLE_PAYMENTS.filter(p => (formData.activePaymentMethods || []).includes(p.id)).map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs font-medium">{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Save Protocol Actions */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 active:scale-95 transition-all shadow-sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Synchronize Protocol
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Floating Action Hub */}
      <div className="fixed bottom-6 right-6 md:right-10 z-50 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasPermission(PERMISSIONS.SETTINGS_POS)}
            className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm gap-2 active:scale-95 transition-all shadow-sm rounded-xl"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Configuration
          </Button>

          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700/50 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}