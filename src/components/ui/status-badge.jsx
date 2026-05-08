import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  RotateCcw, 
  CreditCard, 
  Banknote, 
  History,
  Info,
  ShieldCheck,
  Ban
} from "lucide-react";

/**
 * Universal StatusBadge component for the Financial Workstation.
 * Standardizes business states across Sales, Purchase, and Customer modules.
 * 
 * @param {Object} props
 * @param {string|boolean} props.value - Raw status value from API
 * @param {string} props.className - Custom style overrides
 * @param {string} props.label - Explicit label override
 * @param {boolean} props.showIcon - Whether to display the micro-icon
 */
export function StatusBadge({ value, className, label, showIcon = true }) {
  if (value === undefined || value === null) return null;

  const val = String(value).toLowerCase().trim();
  
  // Define status categories
  const isSuccess = [
    "active", "true", "cleared", "completed", "received", 
    "approved", "success", "paid", "delivered"
  ].includes(val) || value === true;

  const isWarning = [
    "pending", "processing", "partial", "partially paid", 
    "due", "unpaid", "draft", "awaiting"
  ].includes(val);

  const isDanger = [
    "void", "cancelled", "bounced", "destructive", 
    "failed", "failure", "inactive", "revoked", "rejected"
  ].includes(val) || value === false;

  const isInfo = [
    "refunded", "partially refunded", "returned", 
    "shipped", "in transit", "hold"
  ].includes(val);

  // Default styles (Neutral)
  let config = {
    bg: "bg-slate-500/10 dark:bg-slate-400/10",
    text: "text-slate-700 dark:text-slate-400 border-slate-500/20",
    icon: Info,
    label: label || (val.charAt(0).toUpperCase() + val.slice(1))
  };

  if (isSuccess) {
    config = {
      bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
      text: "text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      icon: val === "active" ? ShieldCheck : CheckCircle2,
      label: label || (val === "true" ? "Active" : val.charAt(0).toUpperCase() + val.slice(1))
    };
  } else if (isWarning) {
    config = {
      bg: "bg-amber-500/10 dark:bg-amber-400/10",
      text: "text-amber-700 dark:text-amber-400 border-amber-500/20",
      icon: Clock,
      label: label || (val === "partial" ? "Partially Paid" : val.charAt(0).toUpperCase() + val.slice(1))
    };
  } else if (isDanger) {
    config = {
      bg: "bg-rose-500/10 dark:bg-rose-400/10",
      text: "text-rose-700 dark:text-rose-400 border-rose-500/20",
      icon: val === "inactive" ? Ban : XCircle,
      label: label || (val === "false" ? "Inactive" : val.charAt(0).toUpperCase() + val.slice(1))
    };
  } else if (isInfo) {
    config = {
      bg: "bg-indigo-500/10 dark:bg-indigo-400/10",
      text: "text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
      icon: val.includes("refund") || val.includes("return") ? RotateCcw : Info,
      label: label || val.charAt(0).toUpperCase() + val.slice(1)
    };
  }

  // Handle specific label mapping for business clarity
  if (val === "due") config.label = "Payment Due";
  if (val === "unpaid") config.label = "Unpaid";

  const Icon = config.icon;

  return (
    <Badge 
      variant="outline"
      className={cn(
        "flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-tight transition-all duration-300 shadow-xs", 
        config.bg, 
        config.text, 
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      {config.label}
    </Badge>
  );
}
