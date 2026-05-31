"use client";

import React from 'react';
import { useAppSettings } from '@/app/hooks/useAppSettings';
import { AlertTriangle, Clock, ArrowUpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { differenceInDays, parseISO } from 'date-fns';

export function TrialBanner() {
  const { business } = useAppSettings();
  const [isVisible, setIsVisible] = React.useState(true);

  if (!business || !isVisible) return null;

  // 1. Only show for Trial organizations
  if (business.subscription_status !== 'Trial') return null;
  
  // 2. Hide for Master Organization
  if (business.is_master) return null;

  // 3. Calculate remaining days
  const expiryDate = business.subscription_expiry_date;
  if (!expiryDate) return null;

  const daysRemaining = differenceInDays(parseISO(expiryDate), new Date());
  const isUrgent = daysRemaining <= 7;

  return (
    <div className={cn(
      "w-full px-4 py-2 flex items-center justify-between transition-all duration-500 animate-in fade-in slide-in-from-top-4",
      isUrgent 
        ? "bg-amber-50 border-b border-amber-200 text-amber-900" 
        : "bg-emerald-50 border-b border-emerald-100 text-emerald-900"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "size-8 rounded-lg flex items-center justify-center shrink-0",
          isUrgent ? "bg-amber-100" : "bg-emerald-100"
        )}>
          {isUrgent ? (
            <AlertTriangle className="size-4 text-amber-600" />
          ) : (
            <Clock className="size-4 text-emerald-600" />
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-0.5">
          <p className="text-xs font-bold uppercase tracking-tight">
            Trial Period Active
          </p>
          <p className="text-[11px] font-medium opacity-80">
            You are currently exploring our premium features. {daysRemaining > 0 ? (
              <>Your trial ends in <span className="font-bold underline">{daysRemaining} days</span>.</>
            ) : (
              <span className="font-bold text-red-600">Your trial expires today.</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Link 
          href="/settings?tab=subscription"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
            isUrgent 
              ? "bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-200" 
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-100"
          )}
        >
          <ArrowUpCircle className="size-3.5" />
          Upgrade Now
        </Link>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1.5 rounded-md hover:bg-black/5 text-muted-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
