"use client";

import { cn } from "@/lib/cn";
import { OperatingStatementRow } from "@/lib/types";
import { formatNumber } from "@/lib/calculations";
import { useCallback, useState } from "react";

interface OperatingStatementGridProps {
  rows: OperatingStatementRow[];
  onCellEdit: (id: string, field: keyof OperatingStatementRow, value: number) => void;
}

export function OperatingStatementGrid({ rows, onCellEdit }: OperatingStatementGridProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const yearFields = ["previousYear", "currentYear", "projectedYear"] as const;
  const yearLabels = ["Previous Year", "Current Year", "Projected Year"];

  const handleDoubleClick = useCallback(
    (id: string, field: string, currentValue: number) => {
      setEditingCell(`${id}-${field}`);
      setEditValue(currentValue.toString());
    },
    []
  );

  const handleBlur = useCallback(
    (id: string, field: keyof OperatingStatementRow) => {
      const numValue = parseFloat(editValue) || 0;
      onCellEdit(id, field, numValue);
      setEditingCell(null);
    },
    [editValue, onCellEdit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string, field: keyof OperatingStatementRow) => {
      if (e.key === "Enter") {
        handleBlur(id, field);
      } else if (e.key === "Escape") {
        setEditingCell(null);
      }
    },
    [handleBlur]
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/50">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-800/80">
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 border-b border-slate-700 w-[40%]">
              Particulars
            </th>
            {yearLabels.map((label) => (
              <th
                key={label}
                className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 border-b border-slate-700 w-[20%]"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "border-b border-slate-800/50 transition-colors",
                row.isHeader && "bg-slate-800/60",
                row.isTotal && "bg-slate-800/30 border-slate-700",
                !row.isHeader && !row.isTotal && "hover:bg-slate-800/20"
              )}
            >
              <td
                className={cn(
                  "px-4 py-2.5 text-sm",
                  row.isHeader && "font-bold text-blue-400 uppercase text-xs tracking-wider pt-4",
                  row.isTotal && "font-semibold text-white",
                  !row.isHeader && !row.isTotal && "text-slate-300",
                  row.indent && "pl-8"
                )}
              >
                {row.label}
              </td>
              {yearFields.map((field) => {
                const cellId = `${row.id}-${field}`;
                const isEditing = editingCell === cellId;
                const isEditable = !row.isHeader && !row.isTotal;
                const value = row[field] as number;

                return (
                  <td
                    key={field}
                    className={cn(
                      "px-4 py-2.5 text-right font-mono text-sm",
                      row.isHeader && "text-slate-600",
                      row.isTotal && "font-semibold text-emerald-400",
                      !row.isHeader && !row.isTotal && "text-slate-300",
                      isEditable && "cursor-pointer"
                    )}
                    onDoubleClick={() =>
                      isEditable && handleDoubleClick(row.id, field, value)
                    }
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleBlur(row.id, field)}
                        onKeyDown={(e) => handleKeyDown(e, row.id, field)}
                        className="w-full h-8 px-2 text-right bg-blue-900/30 border border-blue-500 rounded text-blue-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        autoFocus
                      />
                    ) : row.isHeader ? (
                      ""
                    ) : (
                      <span
                        className={cn(
                          "inline-block w-full px-2 py-0.5 rounded",
                          isEditable && "hover:bg-slate-700/50 transition-colors"
                        )}
                      >
                        {formatNumber(value)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700">
        <p className="text-xs text-slate-500 italic">
          💡 Double-click on any cell to edit. Press Enter to save, Escape to cancel.
        </p>
      </div>
    </div>
  );
}
