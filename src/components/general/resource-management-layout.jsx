"use client";

import React, { useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table";
import { DataGrid } from "@/components/general/data-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LoaderIcon,
  PlusCircle,
  Download,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccessDenied } from "./access-denied";

// Pagination Component
const PaginationControls = ({ table, paginationState, pageCount }) => {
  const currentPage = paginationState?.pageIndex ?? table.getState().pagination.pageIndex;
  const totalPages = pageCount ?? table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-border/50 bg-gray-50/30 dark:bg-muted/10">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </p>
        <Select
          value={table.getState().pagination.pageSize.toString()}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200 dark:border-border/50 dark:bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">per page</p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
          onClick={() => table.setPageIndex(0)}
          disabled={!canPreviousPage}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
          onClick={() => table.previousPage()}
          disabled={!canPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i;
            } else if (currentPage <= 2) {
              pageNum = i;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 5 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            if (pageNum >= 0 && pageNum < totalPages) {
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    currentPage === pageNum
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
                  )}
                  onClick={() => table.setPageIndex(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            }
            return null;
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
          onClick={() => table.nextPage()}
          disabled={!canNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 dark:border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:bg-transparent"
          onClick={() => table.setPageIndex(totalPages - 1)}
          disabled={!canNextPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ResourceTableToolbar = ({
  table,
  searchColumn,
  searchPlaceholder,
  bulkActionsComponent,
  filterComponents,
  isFiltered: externalIsFiltered,
  onClearFilters,
  onSearchChange,
  sortOptions,
  sortValue,
  onSortChange,
  viewMode,
  onViewModeChange,
  enableBulkActions = true,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const columnFilters = table.getState().columnFilters;
  const internalIsFiltered = columnFilters.length > 0;
  const showClear = externalIsFiltered || internalIsFiltered;
  const activeFilterCount = columnFilters.length + (externalIsFiltered ? 1 : 0);

  const isAllSelected = table.getIsAllPageRowsSelected();
  const isSomeSelected = table.getIsSomePageRowsSelected();

  return (
    <div className="flex flex-col gap-2">
      {/* Single compact toolbar row */}
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Select-all Checkbox - Only show if bulk actions are enabled */}
        {enableBulkActions && (
          <>
            <Checkbox
              checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
              onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
              className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=indeterminate]:bg-emerald-600 data-[state=indeterminate]:border-emerald-600 shrink-0"
            />
            <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-0.5 shrink-0" />
          </>
        )}

        {/* Bulk Actions - Only show if enabled and component provided */}
        {enableBulkActions && bulkActionsComponent ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="inventory-bulk-actions"
                variant="outline"
                size="sm"
                disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                className="h-8 px-3 text-sm font-medium border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-md shadow-none gap-1.5 shrink-0"
              >
                Bulk Actions {table.getFilteredSelectedRowModel().rows.length > 0 && `(${table.getFilteredSelectedRowModel().rows.length})`}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 rounded-md border-gray-200 shadow-lg p-1">
              {bulkActionsComponent}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : enableBulkActions ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8 px-3 text-sm font-medium border-gray-200 bg-white text-gray-400 rounded-md shadow-none gap-1.5 shrink-0 opacity-60 cursor-default"
          >
            Bulk Actions
            <ChevronDown className="h-3.5 w-3.5 opacity-40" />
          </Button>
        ) : null}

        {enableBulkActions && <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-0.5 shrink-0" />}

        {/* Search */}
        <div id="inventory-search" className="relative flex-1 min-w-0 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
          <Input
            placeholder={searchPlaceholder || "Search..."}
            value={table.getColumn(searchColumn)?.getFilterValue() ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              table.getColumn(searchColumn)?.setFilterValue(value);
              if (onSearchChange) onSearchChange(value);
            }}
            className="h-8 pl-8 pr-3 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-gray-600 placeholder:text-gray-400"
          />
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-0.5 shrink-0" />

        {/* Filters toggle */}
        {filterComponents && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltersOpen((p) => !p)}
            className={cn(
              "h-8 px-3 text-sm font-medium rounded-md gap-1.5 shrink-0 transition-colors",
              filtersOpen || activeFilterCount > 0
                ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        {/* Sort */}
        {(sortOptions && onSortChange) && (
          <div id="inventory-sort">
            <Select value={sortValue} onValueChange={onSortChange}>
            <SelectTrigger className="h-8 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors gap-1 px-2 w-auto shrink-0">
              <span className="text-gray-400 font-normal mr-0.5">Sort:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-md border-gray-200 shadow-lg">
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm font-medium rounded-md">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
            </Select>
          </div>
        )}

        <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-0.5 shrink-0" />

        {/* View-mode toggle */}
        {onViewModeChange && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              id="inventory-view-list"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              id="inventory-view-grid"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Clear filters */}
        {showClear && (
          <button
            onClick={() => {
              table.resetColumnFilters();
              if (onClearFilters) onClearFilters();
            }}
            className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
            title="Clear filters"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Collapsible filter panel */}
      {filtersOpen && filterComponents && (
        <div className="flex items-center gap-3 flex-wrap px-4 pt-2 pb-3 border-t border-gray-100 dark:border-white/5 animate-in slide-in-from-top-1 fade-in duration-200">
          {filterComponents(table)}
        </div>
      )}
    </div>
  );
};

import { DataActions } from "@/components/general/DataActions";

export const ResourceManagementLayout = ({
  data,
  columns,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  headerTitle,
  addButtonLabel = "Add New",
  onAddClick,
  onExportClick,
  exportFileName,
  exportData,
  isAdding,
  statCardsComponent,
  bulkActionsComponent,
  searchColumn = "name",
  searchPlaceholder = "Search...",
  loadingSkeleton,
  filterComponents,
  extraActions,
  isFiltered,
  onClearFilters,
  onPrint,
  showPrint = false,
  // Row action props
  onRowClick,
  rowClassName,
  // Pagination props
  pageCount,
  paginationState,
  onPaginationChange,
  enablePagination = true,
  // Search props
  onSearchChange,
  // Sort props
  sortOptions,
  sortValue,
  onSortChange,
  // View mode props
  viewMode = "list",
  onViewModeChange,
  renderGridItem,
  gridClassName,
  // Bulk actions toggle
  enableBulkActions = true,
  tableMeta,
  children,
}) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Use manual pagination if pageCount is provided, otherwise use auto pagination
  const isManualPagination = !!pageCount && onPaginationChange;

  const pagination = isManualPagination
    ? paginationState
    : internalPagination;

  const handlePaginationChange = (updater) => {
    if (isManualPagination && onPaginationChange) {
      onPaginationChange(updater);
    } else {
      const newState = typeof updater === 'function'
        ? updater(internalPagination)
        : updater;
      setInternalPagination(newState);
    }
  };

  const table = useReactTable({
    data: data || [],
    columns,
    meta: tableMeta,
    pageCount: isManualPagination ? pageCount : undefined,
    manualPagination: isManualPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: handlePaginationChange,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
    },
  });

  const renderedBulkActions = bulkActionsComponent && enableBulkActions
    ? React.cloneElement(bulkActionsComponent, { table })
    : null;

  const isEmpty = !data || (Array.isArray(data) && data.length === 0);

  if (isLoading && isEmpty) {
    return loadingSkeleton || (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <LoaderIcon className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <AccessDenied 
        errorMessage={errorMessage} 
        onRetry={onRetry} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex flex-col gap-6 max-w-full mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {headerTitle}
          <div className="flex items-center gap-2">
            {extraActions}
            
            {(onExportClick || data) && (
              <div id="inventory-export" className="shrink-0">
                {onExportClick ? (
                  <Button
                    variant="outline"
                    className="gap-2 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
                    onClick={onExportClick}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                ) : (
                  <DataActions 
                    data={exportData || data} 
                    fileName={exportFileName} 
                    onPrint={onPrint}
                    showPrint={showPrint}
                  />
                )}
              </div>
            )}

            {onAddClick && (
              <Button
                id="inventory-add-product"
                onClick={onAddClick}
                disabled={isAdding}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isAdding ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                {addButtonLabel}
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {statCardsComponent && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {statCardsComponent}
          </div>
        )}

        {/* Main Content Card */}
        <Card className="border border-gray-200 dark:border-white/5 shadow-sm rounded-lg overflow-hidden bg-white dark:bg-card">
          <CardContent className="p-0">
            <div className="border-b border-gray-100 dark:border-white/10 bg-white dark:bg-card">
              <ResourceTableToolbar
                table={table}
                searchColumn={searchColumn}
                searchPlaceholder={searchPlaceholder}
                bulkActionsComponent={renderedBulkActions}
                filterComponents={filterComponents}
                isFiltered={isFiltered}
                onClearFilters={onClearFilters}
                onSearchChange={onSearchChange}
                sortOptions={sortOptions}
                sortValue={sortValue}
                onSortChange={onSortChange}
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
                enableBulkActions={enableBulkActions}
              />
            </div>

            <div className={cn(
              "transition-all duration-300",
              viewMode === "grid" && "bg-gray-50/30 dark:bg-slate-950/20"
            )}>
              {viewMode === "grid" && renderGridItem ? (
                <DataGrid
                  table={table}
                  renderGridItem={renderGridItem}
                  isLoading={isLoading}
                  gridClassName={gridClassName}
                />
              ) : (
                <DataTable 
                  table={table} 
                  columns={columns} 
                  isLoading={isLoading} 
                  onRowClick={onRowClick}
                  rowClassName={rowClassName}
                />
              )}
            </div>

            {/* Pagination Controls */}
            {enablePagination && (
              <PaginationControls
                table={table}
                paginationState={pagination}
                pageCount={pageCount}
              />
            )}
          </CardContent>
        </Card>
        {children}
      </div>
    </div>
  );
};