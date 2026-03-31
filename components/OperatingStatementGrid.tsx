"use client";

import { cn } from "@/lib/cn";
import { OperatingStatementRow } from "@/lib/types";
import { formatNumber } from "@/lib/calculations";
import { useCallback, useMemo, useState } from "react";

interface OperatingStatementGridProps {
  rows: OperatingStatementRow[];
  onCellEdit: (id: string, field: keyof OperatingStatementRow, value: number) => void;
}

export function OperatingStatementGrid({ rows, onCellEdit }: OperatingStatementGridProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [colWidths, setColWidths] = useState<Record<string, number>>({});

  const yearFields = ["previousYear", "currentYear", "projectedYear"] as const;
  const yearLabels = ["Previous Year", "Current Year", "Projected Year"];
  const resizeKeys = useMemo(
    () => ["__particulars", ...yearFields],
    [yearFields]
  );

  const getColWidth = useCallback(
    (key: string) => {
      if (colWidths[key]) return colWidths[key];
      if (key === "__particulars") return 320;
      return 170;
    },
    [colWidths]
  );

  const startResize = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = getColWidth(key);
      const onMove = (ev: MouseEvent) => {
        const next = Math.max(72, startW + (ev.clientX - startX));
        setColWidths((prev) => ({ ...prev, [key]: next }));
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [getColWidth]
  );

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
    <div className="overflow-x-auto rounded-lg border border-card-border">
      <table
        className="w-full border-collapse table-fixed"
        style={{ minWidth: resizeKeys.reduce((sum, key) => sum + getColWidth(key), 0) }}
      >
        <thead>
          <tr className="bg-slate-50">
            <th
              className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 border-b border-card-border relative"
              style={{ width: getColWidth("__particulars"), minWidth: 120 }}
            >
              Particulars
              <button
                type="button"
                aria-label="Resize particulars column"
                onMouseDown={(e) => startResize("__particulars", e)}
                className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
              />
            </th>
            {yearFields.map((field, idx) => (
              <th
                key={field}
                className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 border-b border-card-border relative"
                style={{ width: getColWidth(field), minWidth: 96 }}
              >
                {yearLabels[idx]}
                <button
                  type="button"
                  aria-label={`Resize ${yearLabels[idx]} column`}
                  onMouseDown={(e) => startResize(field, e)}
                  className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "border-b border-card-border transition-colors",
                row.isHeader && "bg-slate-100/60",
                row.isTotal && "bg-slate-50",
                !row.isHeader && !row.isTotal && "hover:bg-slate-50/60"
              )}
            >
              <td
                className={cn(
                  "px-4 py-2.5 text-sm",
                  row.isHeader && "font-bold text-accent uppercase text-xs tracking-wider pt-4",
                  row.isTotal && "font-semibold text-foreground",
                  !row.isHeader && !row.isTotal && "text-foreground",
                  row.indent && "pl-8"
                )}
                style={{ width: getColWidth("__particulars"), minWidth: 120 }}
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
                      row.isHeader && "text-muted",
                      row.isTotal && "font-semibold text-accent",
                      !row.isHeader && !row.isTotal && "text-foreground",
                      isEditable && "cursor-pointer"
                    )}
                    style={{ width: getColWidth(field), minWidth: 96 }}
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
                        className="w-full h-8 px-2 text-right bg-blue-50 border border-accent rounded text-accent font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                        autoFocus
                      />
                    ) : row.isHeader ? (
                      ""
                    ) : (
                      <span
                        className={cn(
                          "inline-block w-full px-2 py-0.5 rounded",
                          isEditable && "hover:bg-slate-100 transition-colors"
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
      <div className="px-4 py-2 bg-slate-50 border-t border-card-border">
        <p className="text-xs text-muted-foreground italic">
          Double-click on any cell to edit. Press Enter to save, Escape to cancel.
        </p>
      </div>
    </div>
  );
}
