"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { X, Delete, Command, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

const Calculator = ({ onClose }) => {
  const [displayValue, setDisplayValue] = useState("0");
  const [operator, setOperator] = useState(null);
  const [previousValue, setPreviousValue] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const calculate = (a, op, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    switch (op) {
      case "+": return numA + numB;
      case "-": return numA - numB;
      case "*": return numA * numB;
      case "/": return numB !== 0 ? numA / numB : "Error";
      default: return numB;
    }
  };

  const handleAction = useCallback((action) => {
    if (!isNaN(parseInt(action))) {
      // It's a number
      setDisplayValue(prev => 
        waitingForOperand || prev === "0" ? String(action) : prev + action
      );
      setWaitingForOperand(false);
    } else if (["+", "-", "*", "/"].includes(action)) {
      const current = parseFloat(displayValue);
      if (previousValue !== null && operator && !waitingForOperand) {
        const result = calculate(previousValue, operator, displayValue);
        setPreviousValue(result);
        setDisplayValue(String(result));
      } else {
        setPreviousValue(current);
      }
      setOperator(action);
      setWaitingForOperand(true);
    } else if (action === "=" || action === "Enter") {
      if (!operator || previousValue === null) return;
      const result = calculate(previousValue, operator, displayValue);
      setDisplayValue(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(false);
    } else if (action === "." ) {
      if (waitingForOperand) {
        setDisplayValue("0.");
        setWaitingForOperand(false);
      } else if (!displayValue.includes(".")) {
        setDisplayValue(displayValue + ".");
      }
    } else if (action === "C" || action === "Escape") {
      setDisplayValue("0");
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(false);
      if (action === "Escape") onClose();
    } else if (action === "Backspace") {
      if (displayValue.length > 1) {
        setDisplayValue(displayValue.slice(0, -1));
      } else {
        setDisplayValue("0");
      }
    }
  }, [displayValue, operator, previousValue, waitingForOperand, onClose]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      const { key } = e;
      if (/[0-9]/.test(key)) handleAction(key);
      else if (["+", "-", "*", "/"].includes(key)) handleAction(key);
      else if (key === "Enter") {
        e.preventDefault();
        handleAction("Enter");
      }
      else if (key === "." || key === ",") handleAction(".");
      else if (key === "Backspace") handleAction("Backspace");
      else if (key === "Escape") handleAction("Escape");
      else if (key.toLowerCase() === "c" || key === "\\") handleAction("C");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAction]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/40 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="relative bg-card/80 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] w-full max-w-[340px] overflow-hidden p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50">
            <Command className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground">POS Calculator (Alt+C)</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-500/10 hover:text-red-500" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Display */}
        <div className="space-y-1">
          <div className="h-6 text-right overflow-hidden">
            {previousValue !== null && (
              <span className="text-sm font-medium text-muted-foreground animate-in slide-in-from-right-4">
                {previousValue} {operator}
              </span>
            )}
          </div>
          <div className="text-right text-5xl font-bold text-foreground break-all leading-tight font-mono">
            {displayValue}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3">
          {/* Row 1 */}
          <CalcButton label="C" onClick={() => handleAction("C")} className="bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white" />
          <CalcButton label={<Delete className="h-5 w-5" />} onClick={() => handleAction("Backspace")} className="bg-muted/50 text-foreground" />
          <CalcButton label="/" onClick={() => handleAction("/")} variant="operator" active={operator === "/"} />
          <CalcButton label="*" onClick={() => handleAction("*")} variant="operator" active={operator === "*"} />

          {/* Row 2 */}
          <CalcButton label="7" onClick={() => handleAction("7")} />
          <CalcButton label="8" onClick={() => handleAction("8")} />
          <CalcButton label="9" onClick={() => handleAction("9")} />
          <CalcButton label="-" onClick={() => handleAction("-")} variant="operator" active={operator === "-"} />

          {/* Row 3 */}
          <CalcButton label="4" onClick={() => handleAction("4")} />
          <CalcButton label="5" onClick={() => handleAction("5")} />
          <CalcButton label="6" onClick={() => handleAction("6")} />
          <CalcButton label="+" onClick={() => handleAction("+")} variant="operator" active={operator === "+"} />

          {/* Row 4 */}
          <div className="col-span-3 grid grid-cols-3 gap-3">
            <CalcButton label="1" onClick={() => handleAction("1")} />
            <CalcButton label="2" onClick={() => handleAction("2")} />
            <CalcButton label="3" onClick={() => handleAction("3")} />
            <CalcButton label="0" onClick={() => handleAction("0")} className="col-span-2" />
            <CalcButton label="." onClick={() => handleAction(".")} />
          </div>

          <CalcButton 
            label={<CornerDownLeft className="h-6 w-6" />} 
            onClick={() => handleAction("=")} 
            className="row-span-2 h-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" 
          />
        </div>
      </div>
    </div>
  );
};

const CalcButton = ({ label, onClick, className, variant = "default", active = false }) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={clsx(
        "h-14 text-xl font-bold rounded-2xl transition-all duration-200 active:scale-95",
        variant === "default" && "bg-card border border-border/40 hover:bg-muted/50 text-foreground",
        variant === "operator" && (active ? "bg-emerald-600 text-white" : "bg-muted text-foreground hover:bg-emerald-600/10 hover:text-emerald-600"),
        className
      )}
    >
      {label}
    </Button>
  );
};

export default memo(Calculator);
