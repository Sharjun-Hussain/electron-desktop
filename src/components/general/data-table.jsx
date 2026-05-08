"use client";

import { flexRender } from "@tanstack/react-table";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Enhanced Pagination Component ---
export const DataTablePagination = ({
  table,
  showPageNumbers = true,
  pageSizeOptions = [10, 20, 30, 40, 50]
}) => {
  const totalRows = table.getFilteredRowModel().rows.length;
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  if (totalPages <= 1 && totalRows === 0) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3 border-t border-gray-100 dark:border-border/50 bg-gray-50/30 dark:bg-muted/10">
      <div className="text-xs text-muted-foreground">
        {selectedRows > 0 ? (
          <span>
            <span className="font-semibold text-emerald-600">{selectedRows}</span> of{" "}
            <span className="font-semibold">{totalRows}</span> row(s) selected
          </span>
        ) : (
          <span className="text-muted-foreground">
            {totalRows} total row(s)
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">Rows</span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px] border-gray-200 dark:border-border/50 focus:ring-emerald-500/20 dark:bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showPageNumbers && (
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

            {getPageNumbers().map((pageNum, idx) => (
              pageNum === '...' ? (
                <span key={`dots-${idx}`} className="px-2 text-muted-foreground">...</span>
              ) : (
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
                  onClick={() => table.setPageIndex(pageNum - 1)}
                >
                  {pageNum}
                </Button>
              )
            ))}

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
        )}
      </div>
    </div>
  );
};

// --- Loading Skeleton ---
const TableSkeleton = ({ columns, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRow key={i} className="border-b border-gray-100">
        {columns.map((col, j) => (
          <TableCell key={j} className="py-4 px-4 border-b border-gray-100 dark:border-border/50">
            <div className="h-4 w-full bg-gray-100 dark:bg-muted animate-pulse rounded" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

// --- Empty State ---
const EmptyState = ({ columns, message = "No results found." }) => (
  <TableRow>
    <TableCell
      colSpan={columns.length}
      className="h-48 text-center text-muted-foreground"
    >
      {message}
    </TableCell>
  </TableRow>
);

// --- Main Data Table Component ---
export function DataTable({
  table,
  columns,
  isLoading = false,
  emptyMessage = "No results found.",
  onRowClick,
  rowClassName,
  showPagination = false,
}) {
  const rows = table?.getRowModel().rows ?? [];
  const headerGroups = table?.getHeaderGroups() ?? [];

  return (
    <div className="relative">
      <div className="rounded-lg overflow-hidden bg-white dark:bg-background border border-border/50">
        <UITable>
          <TableHeader className="bg-gray-50 dark:bg-muted/30">
            {headerGroups.map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b border-gray-200 dark:border-border"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={columns} />
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "border-b border-gray-100 dark:border-border/50 hover:bg-gray-50/50 dark:hover:bg-muted/20 transition-colors",
                    row.getIsSelected() && "bg-emerald-50/30 dark:bg-emerald-500/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/20",
                    onRowClick && "cursor-pointer",
                    rowClassName
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 px-4 text-sm text-foreground"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <EmptyState columns={columns} message={emptyMessage} />
            )}
          </TableBody>
        </UITable>
      </div>

      {showPagination && <DataTablePagination table={table} />}
    </div>
  );
}