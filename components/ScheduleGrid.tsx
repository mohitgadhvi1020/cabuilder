"use client";

import type { YearColumn, YearValues } from "@/lib/types";
import { formatNumber } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export interface ScheduleRow {
  id: string;
  particular: string;
  values: YearValues;
}

interface ScheduleGridProps {
  columns: YearColumn[];
  rows: ScheduleRow[];
  onParticularChange: (id: string, value: string) => void;
  onCellEdit: (id: string, columnId: string, value: number) => void;
  onBulkPercent?: (columnId: string, percent: number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel: string;
}

export function ScheduleGrid({
  columns,
  rows,
  onParticularChange,
  onCellEdit,
  onBulkPercent,
  onAdd,
  onRemove,
  addLabel,
}: ScheduleGridProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [bulkPct, setBulkPct] = useState("");
  const [bulkCol, setBulkCol] = useState(columns[0]?.id ?? "");
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const resizeKeys = useMemo(() => ["__particular", ...columns.map((c) => c.id), "__actions"], [columns]);

  const getColWidth = useCallback(
    (key: string) => {
      if (colWidths[key]) return colWidths[key];
      if (key === "__particular") return 260;
      if (key === "__actions") return 44;
      return 140;
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

  const handleDoubleClick = useCallback((id: string, colId: string, v: number) => {
    setEditingCell(`${id}|${colId}`);
    setEditValue(String(v));
  }, []);

  const commit = useCallback(
    (id: string, colId: string) => {
      const n = parseFloat(editValue);
      onCellEdit(id, colId, Number.isFinite(n) ? n : 0);
      setEditingCell(null);
    },
    [editValue, onCellEdit]
  );

  return (
    <div className="space-y-3">
      {onBulkPercent && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Input
            type="number"
            placeholder="%"
            value={bulkPct}
            onChange={(e) => setBulkPct(e.target.value)}
            className="w-20 h-9"
          />
          <span className="text-muted-foreground">% for</span>
          <select
            value={bulkCol}
            onChange={(e) => setBulkCol(e.target.value)}
            className="h-9 rounded-md border border-card-border bg-white px-2 text-foreground text-sm"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const p = parseFloat(bulkPct);
              if (Number.isFinite(p) && bulkCol) onBulkPercent(bulkCol, p);
            }}
          >
            GO
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-card-border">
        <table
          className="w-full border-collapse min-w-[560px] table-fixed"
          style={{ minWidth: resizeKeys.reduce((sum, key) => sum + getColWidth(key), 0) }}
        >
          <thead>
            <tr className="bg-slate-50">
              <th
                className="text-left text-xs font-semibold text-muted-foreground uppercase px-3 py-3 border-b border-card-border relative"
                style={{ width: getColWidth("__particular"), minWidth: 120 }}
              >
                Particular
                <button
                  type="button"
                  aria-label="Resize particular column"
                  onMouseDown={(e) => startResize("__particular", e)}
                  className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                />
              </th>
              {columns.map((c) => (
                <th
                  key={c.id}
                  className="text-right text-xs font-semibold text-muted-foreground uppercase px-2 py-3 border-b border-card-border whitespace-nowrap relative"
                  style={{ width: getColWidth(c.id), minWidth: 96 }}
                >
                  {c.label}
                  <button
                    type="button"
                    aria-label={`Resize ${c.label} column`}
                    onMouseDown={(e) => startResize(c.id, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                  />
                </th>
              ))}
              <th
                className="w-10 border-b border-card-border relative"
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
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-card-border hover:bg-slate-50/60">
                <td
                  className="px-2 py-1"
                  style={{ width: getColWidth("__particular"), minWidth: 120 }}
                >
                  <Input
                    value={row.particular}
                    onChange={(e) => onParticularChange(row.id, e.target.value)}
                    className="h-9 text-sm"
                    placeholder="Description"
                  />
                </td>
                {columns.map((col) => {
                  const key = `${row.id}|${col.id}`;
                  const raw = row.values[col.id] ?? 0;
                  const editing = editingCell === key;
                  return (
                    <td
                      key={col.id}
                      className="px-1 py-1 text-right font-mono text-sm text-foreground cursor-pointer"
                      style={{ width: getColWidth(col.id), minWidth: 96 }}
                      onDoubleClick={() => handleDoubleClick(row.id, col.id, raw)}
                    >
                      {editing ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commit(row.id, col.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commit(row.id, col.id);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          className="w-full h-8 px-2 text-right bg-blue-50 border border-accent rounded text-accent font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                          autoFocus
                        />
                      ) : (
                        <span className="block px-2 py-1 rounded hover:bg-slate-100">
                          {formatNumber(raw)}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td
                  className="px-1"
                  style={{ width: getColWidth("__actions"), minWidth: 36 }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => onRemove(row.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        {addLabel}
      </Button>
    </div>
  );
}
