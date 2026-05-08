"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, Download, Eye, EyeOff, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Dynamically import the Barcode component
const Barcode = dynamic(() => import("react-barcode"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-muted-foreground">
      Loading barcode generator...
    </div>
  ),
});

export function BarcodeGenerator({ data, onDataChange }) {
  const [barcodeType, setBarcodeType] = useState("CODE128");

  // Advanced barcode settings
  const [barcodeSettings, setBarcodeSettings] = useState({
    // Size settings
    height: 50,
    width: 2,
    fontSize: 16,

    // Display settings
    showValue: true,
    showTitle: true,
    showPrice: true,
    showSize: true,
    showSKU: true,

    // Style settings
    lineColor: "#000000",
    background: "#ffffff",
    textColor: "#000000",
    textMargin: 2,

    // Advanced settings
    margin: 10,
    flat: false,
  });

  const barcodeFormats = [
    { value: "CODE128", label: "CODE 128" },
    { value: "CODE128A", label: "CODE 128 A" },
    { value: "CODE128B", label: "CODE 128 B" },
    { value: "CODE128C", label: "CODE 128 C" },
    { value: "EAN13", label: "EAN-13" },
    { value: "EAN8", label: "EAN-8" },
    { value: "UPC", label: "UPC-A" },
    { value: "CODE39", label: "CODE 39" },
    { value: "ITF14", label: "ITF-14" },
    { value: "MSI", label: "MSI" },
    { value: "pharmacode", label: "Pharmacode" },
    { value: "codabar", label: "Codabar" },
  ];

  const generateRandomBarcodeData = () => {
    const formats = {
      EAN13: () =>
        Math.floor(1000000000000 + Math.random() * 9000000000000)
          .toString()
          .substring(0, 13),
      EAN8: () =>
        Math.floor(10000000 + Math.random() * 90000000)
          .toString()
          .substring(0, 8),
      UPC: () =>
        Math.floor(100000000000 + Math.random() * 900000000000)
          .toString()
          .substring(0, 12),
      default: () =>
        Math.floor(100000000000 + Math.random() * 900000000000).toString(),
    };

    const randomValue = formats[barcodeType]
      ? formats[barcodeType]()
      : formats.default();
    const randomPrice = (Math.random() * 100).toFixed(2);

    onDataChange({
      title: data?.title || "Premium Product",
      barcodeValue: randomValue,
      size: data?.size || "500g",
      unit: data?.unit || "grams",
      price: `$${randomPrice}`,
      sku: `SKU-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    });
  };

  const handleInputChange = (field, value) => {
    onDataChange({ ...data, [field]: value });
  };

  const handleSettingChange = (key, value) => {
    setBarcodeSettings((prev) => ({ ...prev, [key]: value }));
  };

  const downloadBarcode = () => {
    const barcodeElement = document.querySelector(".barcode-container svg");
    if (barcodeElement) {
      const svgData = new XMLSerializer().serializeToString(barcodeElement);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = barcodeSettings.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `barcode-${
          data?.barcodeValue || "product"
        }.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const BarcodePreview = () => (
    <div
      className="p-6 rounded-lg border-2 border-dashed border-muted flex items-center justify-center min-h-[200px]"
      style={{ backgroundColor: barcodeSettings.background }}
    >
      <div className="barcode-container text-center">
        {barcodeSettings.showTitle && data?.title && (
          <h3
            className={`font-bold mb-3 ${
              barcodeSettings.showValue ? "mb-2" : "mb-4"
            }`}
            style={{
              color: barcodeSettings.textColor,
              fontSize: `${barcodeSettings.fontSize + 4}px`,
            }}
          >
            {data.title}
          </h3>
        )}

        {data?.barcodeValue && (
          <div className="inline-block">
            <Barcode
              value={data.barcodeValue}
              format={barcodeType}
              height={barcodeSettings.height}
              width={barcodeSettings.width}
              fontSize={barcodeSettings.fontSize}
              margin={barcodeSettings.margin}
              displayValue={barcodeSettings.showValue}
              background={barcodeSettings.background}
              lineColor={barcodeSettings.lineColor}
              textColor={barcodeSettings.textColor}
              textMargin={barcodeSettings.textMargin}
              flat={barcodeSettings.flat}
            />
          </div>
        )}

        <div
          className="flex justify-center items-center gap-6 mt-4 text-sm flex-wrap"
          style={{ color: barcodeSettings.textColor }}
        >
          {barcodeSettings.showSize && data?.size && (
            <p>
              Size: <span className="font-semibold">{data.size}</span>
            </p>
          )}
          {barcodeSettings.showPrice && data?.price && (
            <p>
              Price: <span className="font-semibold">{data.price}</span>
            </p>
          )}
          {barcodeSettings.showSKU && data?.sku && (
            <p>
              SKU: <span className="font-semibold">{data.sku}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const SizeControl = ({ label, value, min, max, step, onChange }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([newValue]) => onChange(newValue)}
        className="w-full"
      />
    </div>
  );

  const ColorControl = ({ label, value, onChange }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  const ToggleControl = ({ label, checked, onChange, icon: Icon }) => (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex items-center space-x-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor={label} className="text-sm font-normal cursor-pointer">
          {label}
        </Label>
      </div>
      <Switch id={label} checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
      {/* Left Column - Preview and Basic Settings */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Barcode Generator
                </CardTitle>
                <CardDescription>
                  Create and customize barcodes for your products
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={generateRandomBarcodeData}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcodeType">Barcode Type</Label>
                <Select value={barcodeType} onValueChange={setBarcodeType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select barcode type" />
                  </SelectTrigger>
                  <SelectContent>
                    {barcodeFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcodeValue">Barcode Value</Label>
                <Input
                  id="barcodeValue"
                  placeholder="Enter barcode value"
                  value={data?.barcodeValue || ""}
                  onChange={(e) =>
                    handleInputChange("barcodeValue", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productTitle">Product Title</Label>
                <Input
                  id="productTitle"
                  placeholder="Product name"
                  value={data?.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productSize">Size/Weight</Label>
                <Input
                  id="productSize"
                  placeholder="e.g., 500g, 1L"
                  value={data?.size || ""}
                  onChange={(e) => handleInputChange("size", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productPrice">Price</Label>
                <Input
                  id="productPrice"
                  placeholder="e.g., $19.99"
                  value={data?.price || ""}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                />
              </div>
            </div>

            {data?.barcodeValue && (
              <div className="space-y-4">
                <BarcodePreview />

                <div className="flex justify-center">
                  <Button onClick={downloadBarcode} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Barcode
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Advanced Settings */}
      {/* <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Display Settings</CardTitle>
            <CardDescription>
              Control what information appears on the barcode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <ToggleControl
                label="Show Barcode Value"
                checked={barcodeSettings.showValue}
                onChange={(checked) =>
                  handleSettingChange("showValue", checked)
                }
                icon={barcodeSettings.showValue ? Eye : EyeOff}
              />
              <ToggleControl
                label="Show Product Title"
                checked={barcodeSettings.showTitle}
                onChange={(checked) =>
                  handleSettingChange("showTitle", checked)
                }
                icon={barcodeSettings.showTitle ? Eye : EyeOff}
              />
              <ToggleControl
                label="Show Price"
                checked={barcodeSettings.showPrice}
                onChange={(checked) =>
                  handleSettingChange("showPrice", checked)
                }
                icon={barcodeSettings.showPrice ? Eye : EyeOff}
              />
              <ToggleControl
                label="Show Size"
                checked={barcodeSettings.showSize}
                onChange={(checked) => handleSettingChange("showSize", checked)}
                icon={barcodeSettings.showSize ? Eye : EyeOff}
              />
              <ToggleControl
                label="Show SKU"
                checked={barcodeSettings.showSKU}
                onChange={(checked) => handleSettingChange("showSKU", checked)}
                icon={barcodeSettings.showSKU ? Eye : EyeOff}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Size & Spacing</CardTitle>
            <CardDescription>
              Adjust the dimensions and spacing of the barcode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SizeControl
              label="Barcode Height"
              value={barcodeSettings.height}
              min={20}
              max={100}
              step={1}
              onChange={(value) => handleSettingChange("height", value)}
            />

            <SizeControl
              label="Bar Width"
              value={barcodeSettings.width}
              min={1}
              max={4}
              step={0.1}
              onChange={(value) => handleSettingChange("width", value)}
            />

            <SizeControl
              label="Font Size"
              value={barcodeSettings.fontSize}
              min={8}
              max={24}
              step={1}
              onChange={(value) => handleSettingChange("fontSize", value)}
            />

            <SizeControl
              label="Text Margin"
              value={barcodeSettings.textMargin}
              min={0}
              max={10}
              step={1}
              onChange={(value) => handleSettingChange("textMargin", value)}
            />

            <SizeControl
              label="Barcode Margin"
              value={barcodeSettings.margin}
              min={0}
              max={20}
              step={1}
              onChange={(value) => handleSettingChange("margin", value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Colors</CardTitle>
            <CardDescription>
              Customize the colors of your barcode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorControl
              label="Barcode Color"
              value={barcodeSettings.lineColor}
              onChange={(value) => handleSettingChange("lineColor", value)}
            />

            <ColorControl
              label="Background Color"
              value={barcodeSettings.background}
              onChange={(value) => handleSettingChange("background", value)}
            />

            <ColorControl
              label="Text Color"
              value={barcodeSettings.textColor}
              onChange={(value) => handleSettingChange("textColor", value)}
            />
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
