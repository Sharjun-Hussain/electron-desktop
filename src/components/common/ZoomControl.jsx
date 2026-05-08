"use client";

import React, { useEffect } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { cn } from "@/lib/utils";

export default function ZoomControl({ className }) {
  const { global, setGlobalSettings } = useSettingsStore();
  const zoomLevel = global.zoomLevel || 1;

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.1, 2); // Max 200%
    setGlobalSettings({ zoomLevel: parseFloat(newZoom.toFixed(1)) });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.1, 0.5); // Min 50%
    setGlobalSettings({ zoomLevel: parseFloat(newZoom.toFixed(1)) });
  };

  const handleReset = () => {
    setGlobalSettings({ zoomLevel: 1 });
  };

  return (
    <div className={cn("flex items-center gap-0.5 bg-slate-100/50 rounded-lg p-0.5", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-white hover:shadow-sm transition-all"
        onClick={handleZoomOut}
        title="Zoom Out"
      >
        <Minus className="h-3.5 w-3.5 text-slate-500" />
      </Button>
      
      <div 
        className="text-[10px] font-bold w-10 text-center cursor-pointer select-none text-slate-600"
        onDoubleClick={handleReset}
        title="Double click to reset"
      >
        {Math.round(zoomLevel * 100)}%
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-white hover:shadow-sm transition-all"
        onClick={handleZoomIn}
        title="Zoom In"
      >
        <Plus className="h-3.5 w-3.5 text-slate-500" />
      </Button>
    </div>
  );
}
