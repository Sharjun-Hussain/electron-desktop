"use client";

import React, { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Barcode as BarcodeIcon,
    Save,
    Loader2,
    ScanLine,
    ScrollText,
    ZoomIn,
    ZoomOut,
    GripVertical
} from "lucide-react";
import { BarcodeSticker } from "@/components/barcode/barcode-sticker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useSettings } from "@/app/hooks/swr/useSettings";

const DEFAULT_SETTINGS = {
    paperType: "roll",
    labelWidth: 50,
    labelHeight: 30,
    perRow: 1,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 0,
    marginBottom: 0,
    gapX: 2,
    gapY: 2,
    qtyMode: "custom",
    customQty: 1,
    barcodeFormat: "CODE128",
    barThickness: 1.5,
    barHeight: 30,
    barFontSize: 12,
    showFields: {
        name: true,
        variant: true,
        sku: true,
        barcode: true,
        barcodeImage: true,
        price: true,
        supplierCode: false,
        customText: false,
    },
    fieldOrder: ["name", "variant", "barcodeImage", "price", "sku", "barcode", "supplierCode", "customText"],
    customTextContent: "",
    layoutMode: "classic",
};

const SortableFieldItem = ({ id, label, checked, onToggle }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center space-x-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-md shadow-sm mb-2 z-10 relative">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-emerald-600 text-slate-400 touch-none">
                <GripVertical className="h-4 w-4" />
            </div>
            <Checkbox id={`setting-field-${id}`} checked={checked} onCheckedChange={onToggle} className="h-4 w-4" />
            <Label htmlFor={`setting-field-${id}`} className="text-[13px] cursor-pointer select-none font-medium text-slate-700 dark:text-slate-300">{label}</Label>
        </div>
    );
};

const SAMPLE_PRODUCT = {
    name: "Premium Cotton T-Shirt",
    variant: "L / Navy Blue",
    sku: "TSH-NVY-L",
    barcode: "890123456789",
    price: 1250,
    supplier_code: "SUP-001",
};

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2.5 mb-5">
        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-md">
            <Icon className="h-4 w-4 text-emerald-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
    </div>
);

export function BarcodeSettings() {
    const { data: session } = useSession();
    const { useModularSettings, updateModularSettings } = useSettings();
    const { data: barcodeSettings, isLoading, mutate } = useModularSettings("barcode");

    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [zoomLevel, setZoomLevel] = useState([1]);

    useEffect(() => {
        if (barcodeSettings?.data) {
            setSettings({ ...DEFAULT_SETTINGS, ...barcodeSettings.data });
        }
    }, [barcodeSettings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setSettings((settings) => {
                const oldIndex = settings.fieldOrder.indexOf(active.id);
                const newIndex = settings.fieldOrder.indexOf(over.id);

                return {
                    ...settings,
                    fieldOrder: arrayMove(settings.fieldOrder, oldIndex, newIndex)
                };
            });
        }
    };

    const toggleField = (field) => {
        setSettings(prev => ({
            ...prev,
            showFields: { ...prev.showFields, [field]: !prev.showFields[field] }
        }));
    };

    const handleSave = async () => {
        if (!session?.accessToken) return;
        setIsSaving(true);
        try {
            await updateModularSettings("barcode", settings);
            toast.success("Barcode settings updated successfully");
            mutate();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save barcode settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left: Settings Controls ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Paper & Layout */}
                    <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
                        <SectionHeader icon={ScrollText} title="Paper & Layout" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left column */}
                            <div className="space-y-5">
                                <Tabs value={settings.paperType} onValueChange={(v) => updateSetting('paperType', v)} className="w-full">
                                    <TabsList className="w-full grid grid-cols-2 bg-slate-100 dark:bg-slate-900 h-10">
                                        <TabsTrigger value="roll" className="text-xs font-semibold">Label Roll</TabsTrigger>
                                        <TabsTrigger value="a4" className="text-xs font-semibold">A4 Sheet</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Width (mm)</Label>
                                        <Input type="number" value={settings.labelWidth} onChange={(e) => updateSetting('labelWidth', Number(e.target.value))} className="h-10 text-[13px] font-semibold" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Height (mm)</Label>
                                        <Input type="number" value={settings.labelHeight} onChange={(e) => updateSetting('labelHeight', Number(e.target.value))} className="h-10 text-[13px] font-semibold" />
                                    </div>
                                </div>

                                {/* Labels Per Row */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Labels Per Row</Label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => updateSetting('perRow', n)}
                                                className={`flex-1 h-10 rounded-md text-sm font-bold border transition-all duration-150
                                                    ${settings.perRow === n
                                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                                                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600'
                                                    }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right column — margins & gaps */}
                            <div className="grid grid-cols-2 gap-4 content-start">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-slate-500 font-semibold">Top Margin (mm)</Label>
                                    <Input type="number" value={settings.marginTop} onChange={(e) => updateSetting('marginTop', Number(e.target.value))} className="h-10 text-[13px] font-semibold" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-slate-500 font-semibold ">Right Margin (mm)</Label>
                                    <Input type="number" value={settings.marginRight ?? 0} onChange={(e) => updateSetting('marginRight', Number(e.target.value))} className="h-10 text-[13px] font-semibold" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-slate-500 font-semibold ">Bottom Margin (mm)</Label>
                                    <Input type="number" value={settings.marginBottom ?? 0} onChange={(e) => updateSetting('marginBottom', Number(e.target.value))} className="h-10 text-[13px] font-semibold" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-slate-500 font-semibold ">Left Margin (mm)</Label>
                                    <Input type="number" value={settings.marginLeft} onChange={(e) => updateSetting('marginLeft', Number(e.target.value))} className="h-10 text-[13px] font-semibold" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Gap X (mm)</Label>
                                    <Input type="number" value={settings.gapX} onChange={(e) => updateSetting('gapX', Number(e.target.value))} className="h-10 text-[13px] font-semibold" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Gap Y (mm)</Label>
                                    <Input type="number" value={settings.gapY} onChange={(e) => updateSetting('gapY', Number(e.target.value))} className="h-10 text-[13px] font-semibold" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Display Fields */}
                        <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SectionHeader icon={ScanLine} title="Display Fields" />

                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={settings.fieldOrder || DEFAULT_SETTINGS.fieldOrder} strategy={verticalListSortingStrategy}>
                                        {(settings.fieldOrder || DEFAULT_SETTINGS.fieldOrder).map((key) => {
                                            if (key === 'customTextContent') return null;
                                            const labelMap = {
                                                name: "Product Name", variant: "Variant Info", sku: "SKU Number",
                                                barcode: "Barcode ID", barcodeImage: "Barcode Graphic", price: "Selling Price",
                                                supplierCode: "Supplier Code", customText: "Custom Footer"
                                            };
                                            return (
                                                <SortableFieldItem
                                                    key={key}
                                                    id={key}
                                                    label={labelMap[key] || key}
                                                    checked={settings.showFields[key]}
                                                    onToggle={() => toggleField(key)}
                                                />
                                            );
                                        })}
                                    </SortableContext>
                                </DndContext>
                            </div>

                            {!settings.showFields.barcodeImage && (
                                <div className="space-y-2 mt-5 animate-in fade-in duration-300">
                                    <Label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sticker Design Layout</Label>
                                    <Tabs value={settings.layoutMode || "classic"} onValueChange={(v) => updateSetting('layoutMode', v)} className="w-full">
                                        <TabsList className="w-full flex border-b border-slate-200 dark:border-slate-800 bg-transparent h-auto p-0 rounded-none gap-6">
                                            <TabsTrigger value="classic" className="text-xs font-bold py-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 text-slate-500 dark:text-slate-400 p-0 shadow-none">Classic Stack</TabsTrigger>
                                            <TabsTrigger value="price-tag" className="text-xs font-bold py-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 text-slate-500 dark:text-slate-400 p-0 shadow-none">Retail Price Tag</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            )}
                        </Card>

                        {/* Barcode Styling */}
                        <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
                            <SectionHeader icon={BarcodeIcon} title="Barcode Styling" />

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                                        <span>Bar Thickness</span>
                                        <span className="text-emerald-600">{settings.barThickness}</span>
                                    </div>
                                    <Slider value={[settings.barThickness]} onValueChange={(v) => updateSetting('barThickness', v[0])} min={1} max={4} step={0.5} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                                        <span>Bar Height</span>
                                        <span className="text-emerald-600">{settings.barHeight}px</span>
                                    </div>
                                    <Slider value={[settings.barHeight]} onValueChange={(v) => updateSetting('barHeight', v[0])} min={10} max={100} step={5} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                                        <span>Font Size</span>
                                        <span className="text-emerald-600">{settings.barFontSize}px</span>
                                    </div>
                                    <Slider value={[settings.barFontSize]} onValueChange={(v) => updateSetting('barFontSize', v[0])} min={8} max={24} step={1} />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ── Right: Live Preview ── */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-5 border-l border-slate-200 dark:border-slate-800 pl-6 h-fit">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Live Design</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-md">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoomLevel([Math.max(0.5, zoomLevel[0] - 0.1)])}>
                                    <ZoomOut className="h-3 w-3" />
                                </Button>
                                <Slider value={zoomLevel} onValueChange={setZoomLevel} min={0.5} max={2.0} step={0.1} className="w-14" />
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoomLevel([Math.min(2.0, zoomLevel[0] + 0.1)])}>
                                    <ZoomIn className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-center items-start pt-2 transition-all duration-300 overflow-visible" style={{ transform: `scale(${zoomLevel[0]})`, transformOrigin: 'top center' }}>
                            <BarcodeSticker product={SAMPLE_PRODUCT} settings={settings} scale={1} showRulers={true} />
                        </div>

                        <div className="pt-8 space-y-3">
                            <Separator />
                            <Button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 text-sm rounded-lg shadow-sm">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isSaving ? "Saving..." : "Apply Config"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
