import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Check, 
  Clock, 
  X, 
  AlertCircle, 
  RotateCcw, 
  Info,
  Activity,
  Ban,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  History,
  Globe
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
    bg: "bg-slate-100 dark:bg-slate-500/20",
    text: "text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-500/30",
    icon: Info,
    label: label || (val.charAt(0).toUpperCase() + val.slice(1))
  };

  if (isSuccess) {
    config = {
      bg: "bg-emerald-100 dark:bg-emerald-500/20",
      text: "text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
      icon: val === "active" ? Activity : Check,
      label: label || (val === "true" ? "Active" : val.charAt(0).toUpperCase() + val.slice(1))
    };
  } else if (isWarning) {
    config = {
      bg: "bg-amber-100 dark:bg-amber-500/20",
      text: "text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
      icon: Clock,
      label: label || (val === "partial" ? "Partially Paid" : val.charAt(0).toUpperCase() + val.slice(1))
    };
  } else if (isDanger) {
    config = {
      bg: "bg-rose-100 dark:bg-rose-500/20",
      text: "text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
      icon: val === "inactive" ? Ban : X,
      label: label || (val === "false" ? "Inactive" : val.charAt(0).toUpperCase() + val.slice(1))
    };
  } else if (isInfo) {
    config = {
      bg: "bg-indigo-100 dark:bg-indigo-500/20",
      text: "text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
      icon: val.includes("refund") || val.includes("return") ? RotateCcw : Info,
      label: label || val.charAt(0).toUpperCase() + val.slice(1)
    };
  } else if (val === "cash") {
    config = {
      bg: "bg-emerald-100 dark:bg-emerald-500/20",
      text: "text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
      icon: Banknote,
      label: label || "Cash"
    };
  } else if (val === "card") {
    config = {
      bg: "bg-blue-100 dark:bg-blue-500/20",
      text: "text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
      icon: CreditCard,
      label: label || "Card"
    };
  } else if (val === "online") {
    config = {
      bg: "bg-violet-100 dark:bg-violet-500/20",
      text: "text-violet-800 dark:text-violet-400 border-violet-200 dark:border-violet-500/30",
      icon: Globe,
      label: label || "Online"
    };
  } else if (val === "qr") {
    config = {
      bg: "bg-fuchsia-100 dark:bg-fuchsia-500/20",
      text: "text-fuchsia-800 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-500/30",
      icon: QrCode,
      label: label || "QR"
    };
  } else if (val === "wallet") {
    config = {
      bg: "bg-orange-100 dark:bg-orange-500/20",
      text: "text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
      icon: Wallet,
      label: label || "Wallet"
    };
  } else if (val === "cheque") {
    config = {
      bg: "bg-slate-100 dark:bg-slate-500/20",
      text: "text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-500/30",
      icon: History,
      label: label || "Cheque"
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
        "flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold uppercase tracking-wider shadow-none transition-colors duration-300", 
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
