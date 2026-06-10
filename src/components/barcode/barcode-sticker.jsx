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
                    <div className="flex flex-col items-center justify-center w-full h-full gap-2 px-2 py-1.5 text-center">
                        <div className="flex flex-col w-full gap-0.5">
                            {settings.showFields.name && (
                                <div className="font-bold text-black leading-tight whitespace-normal break-words w-full" style={{ fontSize: `${fontSize + 2}px` }}>
                                    {product.name}
                                </div>
                            )}
                            {settings.showFields.variant && product.variant && product.variant.toLowerCase() !== "default" && (
                                <div className="text-gray-500 leading-none truncate w-full" style={{ fontSize: `${fontSize - 1}px` }}>
                                    {product.variant}
                                </div>
                            )}
                        </div>
                        
                        {settings.showFields.price && (
                            <div className="flex flex-col items-center justify-center shrink-0 border border-slate-200 bg-slate-50 rounded-lg px-4 py-1.5 min-w-[90px] text-center shadow-sm w-fit mx-auto">
                                <span className="text-black font-extrabold tracking-tight leading-none" style={{ fontSize: `${fontSize + 4}px` }}>
                                    {formatCurrency(product.price)}
                                </span>
                            </div>
                        )}

                        <div className="flex flex-col gap-0.5 w-full">
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
                                <div className="text-gray-400 italic truncate w-full" style={{ fontSize: `${fontSize - 2}px` }}>
                                    {settings.customTextContent}
                                </div>
                            )}
                            {settings.showFields.supplierCode && product.supplier_code && (
                                <div className="text-emerald-600 font-black tracking-tight mt-0.5" style={{ fontSize: `${fontSize + 1}px` }}>
                                    {product.supplier_code}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`flex flex-col items-center w-full h-full ${!settings.showFields.barcodeImage ? 'justify-center gap-1.5' : 'justify-start gap-0.5'} px-1 py-1`}>
                        {(settings.fieldOrder || ["name", "variant", "barcodeImage", "price", "sku", "barcode", "supplierCode", "customText"]).map((field) => {
                            if (!settings.showFields[field] && field !== 'customText') return null;
                            if (field === 'customText' && (!settings.showFields.customText || !settings.customTextContent)) return null;

                            switch (field) {
                                case 'name':
                                    return (
                                        <div key="name" className="font-bold text-black leading-tight w-full text-center whitespace-normal break-words" style={{ fontSize: `${fontSize + 2}px` }}>
                                            {product.name}
                                        </div>
                                    );
                                case 'variant':
                                    if (!product.variant || product.variant.toLowerCase() === "default") return null;
                                    return (
                                        <div key="variant" className="text-gray-600 leading-none w-full text-center" style={{ fontSize: `${fontSize - 1}px` }}>
                                            {product.variant}
                                        </div>
                                    );
                                case 'barcodeImage':
                                    return (
                                        <div key="barcodeImage" className="flex-1 flex items-center justify-center w-full overflow-hidden my-1">
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
                                    );
                                case 'price':
                                    return (
                                        <div key="price" className="text-black font-bold w-full text-center" style={{ fontSize: `${fontSize + 2}px` }}>
                                            {formatCurrency(product.price)}
                                        </div>
                                    );
                                case 'sku':
                                    return (
                                        <div key="sku" className="font-medium text-gray-500 w-full text-center" style={{ fontSize: `${fontSize - 1}px` }}>
                                            SKU: {product.sku}
                                        </div>
                                    );
                                case 'supplierCode':
                                    if (!product.supplier_code) return null;
                                    return (
                                        <div key="supplierCode" className="text-emerald-600 font-extrabold w-full text-center" style={{ fontSize: `${fontSize + 1}px` }}>
                                            {product.supplier_code}
                                        </div>
                                    );
                                case 'customText':
                                    return (
                                        <div key="customText" className="text-gray-400 italic truncate w-full text-center" style={{ fontSize: `${fontSize - 2}px` }}>
                                            {settings.customTextContent}
                                        </div>
                                    );
                                default:
                                    return null;
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
