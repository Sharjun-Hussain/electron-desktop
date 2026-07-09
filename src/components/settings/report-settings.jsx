"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import {
  Save, FileText, Layout, AlignLeft, Image as ImageIcon,
  Type, Palette, Grid, Printer, RotateCcw, Info,
  Eye, Monitor, Layers, CheckCircle2, Loader2,
  Table as TableIcon,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col mb-5">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-md bg-emerald-500/10">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <h3 className="text-sm font-medium text-slate-900 dark:text-white leading-none">{title}</h3>
    </div>
    {description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 ml-9 leading-none font-medium">{description}</p>}
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

const PRESET_THEMES = [
  { id: "emerald", label: "Emerald (Classic)", primary: "#10b981", bg: "bg-emerald-500" },
  { id: "slate", label: "Slate (Pro)", primary: "#334155", bg: "bg-slate-700" },
  { id: "indigo", label: "Indigo (Modern)", primary: "#6366f1", bg: "bg-indigo-500" },
  { id: "rose", label: "Rose (Elegant)", primary: "#f43f5e", bg: "bg-rose-500" },
  { id: "amber", label: "Amber (Warm)", primary: "#f59e0b", bg: "bg-amber-500" },
];

export function ReportSettings() {
  const { useModularSettings, updateModularSettings } = useSettings();
  const { data: response, isLoading } = useModularSettings('report');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    pageSize: "A4",
    orientation: "portrait",
    showLogo: true,
    logoHeight: 40,
    themeColor: "emerald",
    primaryColor: "#10b981",
    headerTitle: "Business Intelligence Report",
    showAddress: true,
    showContact: true,
    showBranchDetails: true,
    showGeneratedDate: true,
    showPrintedBy: true,
    footerText: "Thank you for your business. This is a computer generated document.",
    showPageNumbers: true,
    showConfidentialTag: true,
    rowDensity: "default",
    fontSize: 12,
    showBorders: true,
    accentTableHead: true,
  });

  useEffect(() => {
    if (response?.data) {
      setFormData(prev => ({ ...prev, ...response.data }));
    }
  }, [response]);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const result = await updateModularSettings('report', formData);
      if (result.success) {
        toast.success("Report layout saved successfully");
      } else {
        toast.error("Failed to save report settings: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      toast.error("Failed to save report settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ─── LEFT: CONFIGURATION ─── */}
      <div className="flex-1 space-y-6">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Tabs defaultValue="appearance" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 h-11 p-0 px-4">
                <TabsTrigger value="appearance" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-11 text-sm font-medium">Appearance</TabsTrigger>
                {formData.product_sales_report_print_type !== 'thermal' && (
                  <>
                    <TabsTrigger value="header" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-11 text-sm font-medium">Header & Identity</TabsTrigger>
                    <TabsTrigger value="table" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-11 text-sm font-medium">Table & Content</TabsTrigger>
                    <TabsTrigger value="footer" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-11 text-sm font-medium">Footer</TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* --- APPEARANCE --- */}
              <TabsContent value="appearance" className="p-6 m-0 space-y-8 animate-in fade-in duration-300">
                <section>
                  <SectionHeader icon={Layout} title="Print Layout Format" description="Select the primary output format for your reports" />
                  <div className="ml-9">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Sales By Product Format</Label>
                      <Select value={formData.product_sales_report_print_type || "A4"} onValueChange={(val) => setFormData(p => ({ ...p, product_sales_report_print_type: val }))}>
                        <SelectTrigger className="h-9 text-sm max-w-[300px]">
                          <SelectValue placeholder="Select Layout" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4 (Standard Document)</SelectItem>
                          <SelectItem value="thermal">Thermal (Receipt Printer)</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.product_sales_report_print_type === 'thermal' && (
                        <p className="text-[11px] text-amber-600 font-medium mt-2">
                          Note: Thermal printing removes colors and fixes dimensions to 80mm width.
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {formData.product_sales_report_print_type !== 'thermal' && (
                  <>
                    <section>
                      <SectionHeader icon={Layout} title="Document Geometry" description="Configure page size and orientation for printed reports" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase">Page Size</Label>
                          <Select value={formData.pageSize} onValueChange={(val) => setFormData(p => ({ ...p, pageSize: val }))}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Select Size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A4">A4 (Standard)</SelectItem>
                              <SelectItem value="Letter">US Letter</SelectItem>
                              <SelectItem value="A5">A5 (Compact)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase">Orientation</Label>
                          <Select value={formData.orientation} onValueChange={(val) => setFormData(p => ({ ...p, orientation: val }))}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Select Orientation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="portrait">Portrait (Vertical)</SelectItem>
                              <SelectItem value="landscape">Landscape (Horizontal)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>

                    <section>
                      <SectionHeader icon={Palette} title="Brand & Palette" description="Set your reports' core visual theme" />
                      <div className="ml-9">
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Theme Preset</Label>
                        <div className="flex flex-wrap gap-3">
                          {PRESET_THEMES.map((theme) => (
                            <button
                              key={theme.id}
                              onClick={() => setFormData(p => ({ ...p, themeColor: theme.id, primaryColor: theme.primary }))}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                                formData.themeColor === theme.id
                                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500"
                                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                              )}
                            >
                              <div className={cn("w-3 h-3 rounded-full", theme.bg)} />
                              <span className="text-[11px] font-bold">{theme.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </TabsContent>

              {/* --- HEADER --- */}
              <TabsContent value="header" className="p-6 m-0 space-y-8 animate-in fade-in duration-300">
                <section>
                  <SectionHeader icon={Type} title="Header Text" description="Custom title displayed at the top of every report" />
                  <div className="ml-9 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Report Header Title</Label>
                      <Input 
                        value={formData.headerTitle} 
                        onChange={(e) => setFormData(p => ({ ...p, headerTitle: e.target.value }))}
                        className="h-10 font-medium"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <SectionHeader icon={ImageIcon} title="Identity Elements" description="Control which business details are visible" />
                  <div className="ml-9 space-y-1">
                    <ToggleRow 
                      label="Show Business Logo" 
                      desc="Display your shop logo in the top corner"
                      checked={formData.showLogo}
                      onCheckedChange={(val) => setFormData(p => ({ ...p, showLogo: val }))}
                    />
                    {formData.showLogo && (
                      <div className="px-3 py-3 rounded-md bg-slate-50/50 dark:bg-slate-900/50 mb-3 ml-2 border-l-2 border-emerald-500">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                          Logo Size (Height) <span>{formData.logoHeight}px</span>
                        </Label>
                        <Slider 
                          value={[formData.logoHeight]} 
                          onValueChange={([val]) => setFormData(p => ({ ...p, logoHeight: val }))}
                          min={20} max={100} step={5}
                          className="mt-3"
                        />
                      </div>
                    )}
                    <ToggleRow 
                      label="Show Physical Address" 
                      desc="Include shop address in the header"
                      checked={formData.showAddress}
                      onCheckedChange={(val) => setFormData(p => ({ ...p, showAddress: val }))}
                    />
                    <ToggleRow 
                      label="Show Contact Numbers" 
                      desc="Display phone & email details"
                      checked={formData.showContact}
                      onCheckedChange={(val) => setFormData(p => ({ ...p, showContact: val }))}
                    />
                    <ToggleRow 
                      label="Show Generated Timestamp" 
                      desc="Print date and time of report generation"
                      checked={formData.showGeneratedDate}
                      onCheckedChange={(val) => setFormData(p => ({ ...p, showGeneratedDate: val }))}
                    />
                  </div>
                </section>
              </TabsContent>

              {/* --- TABLE --- */}
              <TabsContent value="table" className="p-6 m-0 space-y-8 animate-in fade-in duration-300">
                <section>
                  <SectionHeader icon={TableIcon} title="Grid Layout" description="Customize how data tables are rendered" />
                  <div className="ml-9 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Row Density</Label>
                      <Select value={formData.rowDensity} onValueChange={(val) => setFormData(p => ({ ...p, rowDensity: val }))}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact (More Rows)</SelectItem>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="spacious">Spacious</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                        Font Size <span>{formData.fontSize}pt</span>
                      </Label>
                      <Slider 
                        value={[formData.fontSize]} 
                        onValueChange={([val]) => setFormData(p => ({ ...p, fontSize: val }))}
                        min={8} max={16} step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="ml-9 mt-6 space-y-1">
                    <ToggleRow 
                      label="Enable Grid Borders" 
                      desc="Show borders between cells and rows"
                      checked={formData.showBorders}
                      onCheckedChange={(val) => setFormData(p => ({ ...p, showBorders: val }))}
                    />
                    <ToggleRow 
                      label="Accent Table Headers" 
                      desc="Apply theme color to the top header row"
                      checked={formData.accentTableHead}
                      onCheckedChange={(val) => setFormData(p => ({ ...p, accentTableHead: val }))}
                    />
                  </div>
                </section>
              </TabsContent>

              {/* --- FOOTER --- */}
              <TabsContent value="footer" className="p-6 m-0 space-y-8 animate-in fade-in duration-300">
                <section>
                  <SectionHeader icon={AlignLeft} title="Footer Content" description="Text and metadata at the bottom of pages" />
                  <div className="ml-9 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Custom Footer Text</Label>
                      <Textarea 
                        placeholder="e.g. Terms & Conditions, System generated message..."
                        value={formData.footerText}
                        onChange={(e) => setFormData(p => ({ ...p, footerText: e.target.value }))}
                        className="min-h-[80px] text-sm"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <SectionHeader icon={Grid} title="Page Metrics" description="Control page-level indicators" />
                  <div className="ml-9 space-y-1">
                    <ToggleRow 
                      label="Show Page Numbers" 
                      desc="Display 'Page X of Y' in the footer"
                      checked={formData.showPageNumbers}
                      onCheckedChange={(val) => setFormData(p => ({ ...p, showPageNumbers: val }))}
                    />
                    <ToggleRow 
                      label="Show 'Printed By'" 
                      desc="Include the name of the staff member who printed"
                      checked={formData.showPrintedBy}
                      onCheckedChange={(val) => setFormData(p => ({ ...p, showPrintedBy: val }))}
                    />
                    <ToggleRow 
                      label="Confidentiality Tag" 
                      desc="Mark reports with a 'Confidential' badge"
                      checked={formData.showConfidentialTag}
                      onCheckedChange={(val) => setFormData(p => ({ ...p, showConfidentialTag: val }))}
                    />
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-500/10 rounded-full">
                <Info className="w-4 h-4 text-emerald-600" />
             </div>
             <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Save Changes</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Layout changes apply to all new print jobs</p>
             </div>
          </div>
          <Button 
            disabled={isSaving}
            onClick={handleUpdate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 px-6 shadow-md shadow-emerald-500/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Layout
          </Button>
        </div>
      </div>

      {/* ─── RIGHT: PREVIEW ─── */}
      <div className="hidden lg:block w-[400px] shrink-0">
        <div className="sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5" /> Real-time Preview
            </h4>
            <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 px-2 h-5 bg-emerald-50 border-emerald-200 text-emerald-700">A4 {formData.orientation}</Badge>
          </div>
          
          <Card className={cn(
            "border-2 border-slate-200 dark:border-slate-800 shadow-2xl bg-white flex flex-col transition-all duration-500 overflow-hidden",
            formData.product_sales_report_print_type === 'thermal' 
              ? "w-[280px] mx-auto aspect-auto min-h-[400px] p-4 text-black font-mono rounded-none border-dashed" 
              : `p-6 text-slate-900 ${formData.orientation === 'landscape' ? "aspect-[1.41/1]" : "aspect-[1/1.41]"}`
          )}>
            {formData.product_sales_report_print_type === 'thermal' ? (
               // Thermal Receipt Preview
               <div className="flex-1 w-full text-[9px] uppercase tracking-tighter leading-tight font-bold">
                 <div className="text-center space-y-1 mb-4">
                   <h1 className="text-sm font-black">{formData.headerTitle || "BUSINESS NAME"}</h1>
                   <div>
                     {formData.showAddress && <p>123 Business Road, Colombo 03</p>}
                     {formData.showContact && <p>TEL: +94 11 234 5678</p>}
                   </div>
                   <h2 className="mt-2 text-xs border-t border-black pt-1">CASHIER-OUT REPORT</h2>
                 </div>
                 
                 <div className="border-y border-dashed border-black py-2 mb-2 space-y-0.5">
                   <div className="flex justify-between"><span>Date:</span><span>01/05/26 14:30</span></div>
                   {formData.showBranchDetails && <div className="flex justify-between mt-1 pt-1 border-t border-dotted border-black"><span>Branch:</span><span>Main Terminal</span></div>}
                 </div>

                 <div className="border-b border-black pb-2 mb-2">
                   <h3 className="font-bold border-b border-black mb-1">A. Cash In/Out</h3>
                   <div className="flex justify-between"><span>Beginning Balance</span><span>500.00</span></div>
                   <div className="flex justify-between"><span>Total Cash Sales</span><span>1,200.00</span></div>
                   <div className="flex justify-between text-black"><span>Cash Out</span><span>100.00</span></div>
                 </div>

                 <div className="mt-8 text-center border-t border-dashed border-black pt-2">
                   <p className="text-[10px]">{formData.footerText || "*** END OF REPORT ***"}</p>
                 </div>
               </div>
            ) : (
               // A4 Document Preview
               <>
                 <div className="flex justify-between items-start border-b-2 pb-4 mb-4 transition-all duration-300" style={{ borderColor: formData.primaryColor }}>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          {formData.showLogo && <div className="bg-slate-900 text-white flex items-center justify-center font-bold text-[8px] rounded" style={{ height: `${formData.logoHeight/2}px`, width: `${formData.logoHeight/2}px` }}>LOGO</div>}
                          <h5 className="font-bold text-xs">BUSINESS NAME</h5>
                       </div>
                       <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{formData.headerTitle || "Business Report"}</h6>
                       
                       <div className="space-y-1.5 mt-2">
                         <div className="space-y-0.5">
                           {formData.showAddress && <p className="text-[8px] text-slate-400">123 Business Road, Colombo 03</p>}
                           {formData.showContact && <p className="text-[8px] text-slate-400">+94 11 234 5678 | contact@business.com</p>}
                         </div>
                         
                         {formData.showBranchDetails && (
                           <div className="space-y-0.5 pt-1 border-t border-slate-100 max-w-[120px]">
                             <p className="text-[8px] text-slate-500"><strong>Branch:</strong> Main Terminal</p>
                             <p className="text-[8px] text-slate-400">456 Terminal Ave, City Center</p>
                             <p className="text-[8px] text-slate-500"><strong>Manager:</strong> John Doe</p>
                           </div>
                         )}
                       </div>
                    </div>
                    <div className="text-right text-[8px] text-slate-400 space-y-0.5">
                       {formData.showGeneratedDate && <p><strong>Date Generated:</strong> 01 May 2026, 14:30 PM</p>}
                       {formData.showConfidentialTag && (
                         <div className="inline-block mt-1 px-1.5 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 font-bold uppercase tracking-tighter text-[6px]">
                           Confidential
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="flex-1 space-y-3">
                    <div className="h-4 w-1/3 bg-slate-100 rounded" />
                    <div className="border rounded overflow-hidden" style={{ borderColor: formData.showBorders ? "#e2e8f0" : "transparent" }}>
                       <div className={cn("h-6 flex items-center px-2", formData.accentTableHead ? "text-white" : "bg-slate-100")} style={{ backgroundColor: formData.accentTableHead ? formData.primaryColor : undefined }}>
                          <div className="h-2 w-16 bg-white/30 rounded mr-auto" />
                          <div className="h-2 w-8 bg-white/30 rounded" />
                       </div>
                       {[1,2,3,4].map(i => (
                         <div key={i} className={cn("h-8 border-b flex items-center px-2", formData.rowDensity === "compact" ? "h-6" : formData.rowDensity === "spacious" ? "h-10" : "h-8")} style={{ borderColor: formData.showBorders ? "#f1f5f9" : "transparent" }}>
                            <div className="h-2 w-24 bg-slate-100 rounded mr-auto" />
                            <div className="h-2 w-10 bg-slate-100 rounded" />
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center text-[7px] text-slate-400 font-medium">
                    {formData.showPrintedBy && <span>By: Admin</span>}
                    <span className="flex-1 text-center px-4 line-clamp-1">{formData.footerText}</span>
                    {formData.showPageNumbers && <span>Page 1 of 1</span>}
                 </div>
               </>
            )}
          </Card>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-normal">
                Preview displays a high-fidelity estimation. Fine-tuning for specific printers may be required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className, variant }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
      {children}
    </span>
  );
}
