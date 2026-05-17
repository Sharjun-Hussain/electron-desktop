"use client";

import React from "react";
import Barcode from "react-barcode";
import { useCurrency } from "@/hooks/useCurrency";

export const BarcodeSticker = ({ product, settings, scale = 1, showRulers = false }) => {
    const widthPx = settings.labelWidth * 3.78 * scale;
    const heightPx = settings.labelHeight * 3.78 * scale;
    const fontSize = Math.max(8 * scale, 8);

    const { formatCurrency } = useCurrency();

    return (
        <div className="relative group">
            {/* VISUAL RULERS (Preview Only) */}
            {showRulers && (
                <>
                    {/* Top Width Indicator */}
                    <div className="absolute -top-5 left-0 w-full flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1 rounded">{settings.labelWidth}mm</div>
                        <div className="w-full h-px bg-emerald-300 relative top-px">
                            <div className="absolute left-0 top-[-2px] h-1.5 w-px bg-emerald-300"></div>
                            <div className="absolute right-0 top-[-2px] h-1.5 w-px bg-emerald-300"></div>
                        </div>
                    </div>
                    {/* Left Height Indicator */}
                    <div className="absolute top-0 -left-6 h-full flex flex-row items-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1 rounded -rotate-90 whitespace-nowrap">{settings.labelHeight}mm</div>
                        <div className="h-full w-px bg-emerald-300 relative left-[2px]">
                            <div className="absolute top-0 left-[-2px] w-1.5 h-px bg-emerald-300"></div>
                            <div className="absolute bottom-0 left-[-2px] w-1.5 h-px bg-emerald-300"></div>
                        </div>
                    </div>
                </>
            )}

            {/* Sticker Content */}
            <div
                className="bg-white flex flex-col items-center justify-center text-center overflow-hidden relative box-border transition-all duration-200"
                style={{
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    outline: showRulers ? '1px dashed #10b981' : 'none',
                    padding: `${4 * scale}px`,
                    pageBreakInside: "avoid",
                }}
            >
                {settings.layoutMode === "price-tag" && settings.showFields.barcodeImage === false ? (
                    <div className="flex flex-row items-center w-full h-full justify-between gap-2 px-1 text-left">
                        <div className="flex flex-col flex-1 min-w-0 justify-between h-full py-1">
                            <div>
                                {settings.showFields.name && (
                                    <div className="font-bold text-black leading-tight whitespace-normal break-words" style={{ fontSize: `${fontSize + 1}px` }}>
                                        {product.name}
                                    </div>
                                )}
                                {settings.showFields.variant && product.variant && product.variant.toLowerCase() !== "default" && (
                                    <div className="text-gray-500 leading-none mt-0.5 truncate" style={{ fontSize: `${fontSize - 1}px` }}>
                                        {product.variant}
                                    </div>
                                )}
                            </div>
                            <div className="mt-auto">
                                {settings.showFields.sku && (
                                    <div className="font-mono text-gray-400 font-medium" style={{ fontSize: `${fontSize - 2}px` }}>
                                        SKU: {product.sku}
                                    </div>
                                )}
                                {settings.showFields.barcode && (
                                    <div className="font-mono text-gray-400 font-medium mt-0.5" style={{ fontSize: `${fontSize - 2}px` }}>
                                        ID: {product.barcode}
                                    </div>
                                )}
                                {settings.showFields.customText && settings.customTextContent && (
                                    <div className="text-gray-400 italic truncate" style={{ fontSize: `${fontSize - 2}px` }}>
                                        {settings.customTextContent}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end justify-between h-full py-1 shrink-0">
                            {settings.showFields.price && (
                                <div className="flex flex-col items-center justify-center shrink-0 border border-slate-200 bg-slate-50 rounded-lg p-2 min-w-[70px] text-center shadow-inner">
                                    <span className="text-black font-extrabold tracking-tight leading-none" style={{ fontSize: `${fontSize + 5}px` }}>
                                        {formatCurrency(product.price)}
                                    </span>
                                </div>
                            )}
                            {settings.showFields.supplierCode && product.supplier_code && (
                                <div className="text-emerald-600 font-black tracking-tight text-right mt-auto whitespace-nowrap" style={{ fontSize: `${fontSize + 1}px` }}>
                                    {product.supplier_code}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full h-full justify-between">
                        <div className="w-full px-1">
                            {settings.showFields.name && (
                                <div className="font-bold text-black leading-tight w-full whitespace-normal break-words" style={{ fontSize: `${fontSize + 2}px` }}>
                                    {product.name}
                                </div>
                            )}
                            {settings.showFields.variant && product.variant && product.variant.toLowerCase() !== "default" && (
                                <div className="text-gray-600 leading-none mt-1" style={{ fontSize: `${fontSize - 1}px` }}>
                                    {product.variant}
                                </div>
                            )}
                        </div>

                        {settings.showFields.barcodeImage !== false && (
                            <div className="flex-1 flex items-center justify-center w-full overflow-hidden my-2">
                                <div className="scale-100 transform transition-transform">
                                    <Barcode
                                        value={product.barcode}
                                        format={settings.barcodeFormat || "CODE128"}
                                        width={settings.barThickness * scale}
                                        height={settings.barHeight * scale}
                                        displayValue={settings.showFields.barcode}
                                        fontSize={settings.barFontSize * scale}
                                        margin={0}
                                        background="transparent"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="w-full flex flex-col px-1">
                            <div className="flex justify-between items-baseline w-full font-bold">
                                {settings.showFields.price && <span className="text-black" style={{ fontSize: `${fontSize + 2}px` }}>{formatCurrency(product.price)}</span>}
                                {settings.showFields.sku && <span className="font-medium text-gray-400" style={{ fontSize: `${fontSize - 1}px` }}>{product.sku}</span>}
                            </div>
                            <div className="flex justify-between items-center w-full mt-1">
                                <div className="text-left flex-1 min-w-0">
                                    {settings.showFields.customText && settings.customTextContent && (
                                        <span className="text-gray-400 block truncate italic" style={{ fontSize: `${fontSize - 2}px` }}>
                                            {settings.customTextContent}
                                        </span>
                                    )}
                                </div>
                                {settings.showFields.supplierCode && product.supplier_code && (
                                    <span className="text-emerald-600 font-extrabold text-right whitespace-nowrap ml-auto" style={{ fontSize: `${fontSize + 1}px` }}>
                                        {product.supplier_code}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
