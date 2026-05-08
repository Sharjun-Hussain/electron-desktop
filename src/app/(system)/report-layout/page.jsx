'use client';

import React from 'react';
import { ReportSettings } from '@/components/settings/report-settings';
import { FileText } from 'lucide-react';

export default function ReportLayoutPage() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300 scroll-smooth min-h-screen">
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 h-16 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Report Layout Design</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-none">Global report styles & headers</p>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto pb-32">
        <ReportSettings />
      </div>
    </div>
  );
}
