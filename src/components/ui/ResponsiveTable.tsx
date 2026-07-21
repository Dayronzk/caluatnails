import React from "react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

export interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No hay registros disponibles.",
  isLoading = false,
}: ResponsiveTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-3xl bg-rose-50/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-4xl border border-rose-100/70 p-8 text-center shadow-soft-xs text-gray-500 font-medium">
        <i className="ri-inbox-archive-line text-3xl text-rose-300 block mb-2" />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-rose-100/70 bg-white/90 backdrop-blur-sm shadow-soft-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-rose-100/80 bg-rose-50/40 text-xs uppercase font-bold text-rose-600 tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50 font-medium text-gray-800">
            {data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-rose-50/30 transition-colors">
                {columns.map((col, idx) => (
                  <td key={idx} className={`px-6 py-4 ${col.className || ""}`}>
                    {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? "") : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="md:hidden space-y-3.5">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            className="bg-white/95 backdrop-blur-sm rounded-3xl border border-rose-100/70 p-5 shadow-soft-xs space-y-2.5"
          >
            {columns.map((col, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs sm:text-sm border-b border-rose-50 last:border-0 pb-2 last:pb-0">
                <span className="font-bold uppercase text-[10px] tracking-wider text-rose-500/80">{col.header}</span>
                <div className="font-semibold text-gray-900 text-right">
                  {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? "") : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResponsiveTable;
