"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Delete, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const VirtualNumpad = ({ 
  value = "", 
  onChange, 
  onExact, 
  totalAmount = 0 
}) => {
  const [internalValue, setInternalValue] = React.useState(value.toString());

  // Sync with external value if it changes drastically (like when method changes or onExact is called)
  React.useEffect(() => {
    if (parseFloat(value) !== parseFloat(internalValue) && !(value === "" && internalValue === "0")) {
      setInternalValue(value.toString());
    }
  }, [value]);

  const handleDigit = (digit) => {
    let current = internalValue;
    if (digit === "." && current.includes(".")) return;
    if (digit === "00" && current === "0") return;

    if (current === "0" && digit !== ".") {
      current = digit;
    } else {
      current += digit;
    }

    setInternalValue(current);
    onChange(current);
  };

  const handleBackspace = () => {
    let current = internalValue;
    if (current.length > 0) {
      current = current.slice(0, -1);
      if (current === "") current = "0";
      setInternalValue(current);
      onChange(current);
    }
  };

  const handleClear = () => {
    setInternalValue("0");
    onChange("0");
  };

  const handleQuickAdd = (amount) => {
    const current = parseFloat(internalValue) || 0;
    const next = (current + amount).toString();
    setInternalValue(next);
    onChange(next);
  };



  const btnClass = "h-14 md:h-16 text-lg font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm active:scale-95 transition-all text-slate-800 dark:text-slate-200";

  return (
    <div className="w-full bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-300">
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("7")}>7</Button>
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("8")}>8</Button>
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("9")}>9</Button>
        <Button variant="outline" className={cn(btnClass, "bg-slate-100 dark:bg-slate-800 text-rose-600")} onClick={handleClear}>
          <X className="w-5 h-5 mr-1" /> Clear
        </Button>

        {/* Row 2 */}
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("4")}>4</Button>
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("5")}>5</Button>
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("6")}>6</Button>
        <Button variant="outline" className={cn(btnClass, "bg-slate-100 dark:bg-slate-800")} onClick={handleBackspace}>
          <Delete className="w-5 h-5" />
        </Button>

        {/* Row 3 */}
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("1")}>1</Button>
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("2")}>2</Button>
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("3")}>3</Button>
        <Button 
          variant="outline" 
          className={cn(btnClass, "row-span-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 hover:text-emerald-700")} 
          onClick={() => onExact && onExact(totalAmount)}
        >
          Exact
        </Button>

        {/* Row 4 */}
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("0")}>0</Button>
        <Button variant="outline" className={btnClass} onClick={() => handleDigit("00")}>00</Button>
        <Button variant="outline" className={btnClass} onClick={() => handleDigit(".")}>.</Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        <Button variant="outline" className="h-10 text-xs font-bold text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100" onClick={() => handleQuickAdd(100)}>+100</Button>
        <Button variant="outline" className="h-10 text-xs font-bold text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100" onClick={() => handleQuickAdd(500)}>+500</Button>
        <Button variant="outline" className="h-10 text-xs font-bold text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100" onClick={() => handleQuickAdd(1000)}>+1000</Button>
        <Button variant="outline" className="h-10 text-xs font-bold text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100" onClick={() => handleQuickAdd(5000)}>+5000</Button>
      </div>
    </div>
  );
};
