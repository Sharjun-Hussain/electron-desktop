"use client";

import React from "react";
import { DataTablePagination } from "./data-table";

/**
 * DataGrid
 * A visual alternative to DataTable that renders items as cards.
 * Uses the same TanStack table instance for state management.
 */
export function DataGrid({ 
  table, 
  renderGridItem, 
  isLoading = false,
  gridClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
}) {
  return (
    <div className="flex flex-col min-h-[400px]">
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className={`grid gap-6 ${gridClassName}`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className="h-64 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse flex flex-col p-4 gap-4"
              >
                <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-6 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-md mt-auto" />
              </div>
            ))}
          </div>
        ) : table?.getRowModel().rows?.length ? (
          <div className={`grid gap-6 ${gridClassName} animate-in fade-in duration-500`}>
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                {renderGridItem ? renderGridItem(row) : (
                  <div className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl">
                    <p className="text-slate-400 text-sm italic">
                      Please provide a `renderGridItem` function.
                    </p>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 font-medium text-[13px] bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            No results found.
          </div>
        )}
      </div>

      <div className="mt-auto">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
