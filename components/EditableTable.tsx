"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { formatNumber } from "@/lib/calculations";
import { useCallback, useMemo, useState } from "react";

interface Column {
  key: string;
  label: string;
  type: "text" | "number";
  width?: string;
}

export type TableRow = { id: string };

interface EditableTableProps<T extends TableRow> {
  columns: Column[];
  data: T[];
  onUpdate: (id: string, field: string, value: string | number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel?: string;
}

function cellValue<T extends TableRow>(row: T, key: string): string | number | undefined {
  return (row as Record<string, string | number | undefined>)[key];
}

export function EditableTable<T extends TableRow>({
  columns,
  data,
  onUpdate,
  onAdd,
  onRemove,
  addLabel = "Add Row",
}: EditableTableProps<T>) {
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const resizeKeys = useMemo(
    () => [...columns.map((c) => c.key), "__actions"],
    [columns]
  );

  const getColWidth = useCallback(
    (key: string, fallback?: string) => {
      if (colWidths[key]) return colWidths[key];
      if (key === "__actions") return 48;
      if (fallback?.endsWith("%")) {
        return 180;
      }
      if (fallback?.endsWith("px")) {
        const n = parseInt(fallback, 10);
        if (Number.isFinite(n)) return n;
      }
      return 160;
    },
    [colWidths]
  );

  const startResize = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = getColWidth(key);
      const onMove = (ev: MouseEvent) => {
        const min = key === "__actions" ? 36 : 72;
        const next = Math.max(min, startW + (ev.clientX - startX));
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

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border border-card-border">
        <table
          className="w-full border-collapse table-fixed"
          style={{ minWidth: resizeKeys.reduce((sum, key) => sum + getColWidth(key), 0) }}
        >
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 border-b border-card-border relative"
                  style={{ width: getColWidth(col.key, col.width), minWidth: 96 }}
                >
                  {col.label}
                  <button
                    type="button"
                    aria-label={`Resize ${col.label} column`}
                    onMouseDown={(e) => startResize(col.key, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                  />
                </th>
              ))}
              <th
                className="w-12 border-b border-card-border px-2 relative"
                style={{ width: getColWidth("__actions"), minWidth: 36 }}
              >
                <button
                  type="button"
                  aria-label="Resize actions column"
                  onMouseDown={(e) => startResize("__actions", e)}
                  className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                className="border-b border-card-border hover:bg-slate-50/80 transition-colors group"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2"
                    style={{ width: getColWidth(col.key, col.width), minWidth: 96 }}
                  >
                    {col.type === "number" ? (
                      <Input
                        type="number"
                        value={(cellValue(row, col.key) as number) || ""}
                        onChange={(e) =>
                          onUpdate(
                            row.id,
                            col.key,
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        className="h-8 text-right font-mono text-sm"
                        placeholder="0"
                      />
                    ) : (
                      <Input
                        type="text"
                        value={(cellValue(row, col.key) as string) || ""}
                        onChange={(e) => onUpdate(row.id, col.key, e.target.value)}
                        className="h-8 text-sm"
                        placeholder={`Enter ${col.label.toLowerCase()}`}
                      />
                    )}
                  </td>
                ))}
                <td
                  className="px-2 py-2"
                  style={{ width: getColWidth("__actions"), minWidth: 36 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(row.id)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No entries yet. Click below to add one.
                </td>
              </tr>
            )}
          </tbody>
          {data.length > 0 && columns.some((c) => c.type === "number") && (
            <tfoot>
              <tr className="bg-slate-50 border-t border-card-border">
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm font-semibold text-foreground"
                  >
                    {i === 0 ? (
                      "Total"
                    ) : col.type === "number" ? (
                      <span className="font-mono text-right block">
                        {formatNumber(
                          data.reduce(
                            (sum, row) => sum + ((cellValue(row, col.key) as number) || 0),
                            0
                          )
                        )}
                      </span>
                    ) : null}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="mt-3"
      >
        <Plus className="w-4 h-4 mr-1" />
        {addLabel}
      </Button>
    </div>
  );
}
