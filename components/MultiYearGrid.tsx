"use client";

import { cn } from "@/lib/cn";
import type { FinancialGridRow, YearColumn } from "@/lib/types";
import { formatNumber } from "@/lib/calculations";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Lock, LockOpen } from "lucide-react";
import { impliedYoYGrowthPct } from "@/lib/operatingGrowth";

interface MultiYearGridProps {
  columns: YearColumn[];
  rows: FinancialGridRow[];
  onCellEdit: (rowId: string, columnId: string, value: number) => void;
  onBulkPercent?: (columnId: string, percent: number) => void;
  onReorder?: (orderedIds: string[]) => void;
  manageItemsLabel?: string;
  onManageItems?: () => void;
  growthColumn?: boolean;
  onGrowthPctChange?: (rowId: string, pct: number) => void;
  onGrowthLockToggle?: (rowId: string, locked: boolean) => void;
}

function SortableRow({
  id,
  children,
  disabled,
  dragWidth,
}: {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  dragWidth: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style}>
      <td
        className="w-8 px-1 border-b border-card-border"
        style={{ width: dragWidth, minWidth: dragWidth }}
      >
        {!disabled && (
          <button
            type="button"
            className="text-muted hover:text-foreground cursor-grab p-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
      </td>
      {children}
    </tr>
  );
}

export function MultiYearGrid({
  columns,
  rows,
  onCellEdit,
  onBulkPercent,
  onReorder,
  manageItemsLabel = "Manage items",
  onManageItems,
  growthColumn = false,
  onGrowthPctChange,
  onGrowthLockToggle,
}: MultiYearGridProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingGrowthRowId, setEditingGrowthRowId] = useState<string | null>(null);
  const [growthEditValue, setGrowthEditValue] = useState("");
  const [bulkPct, setBulkPct] = useState("");
  const [bulkCol, setBulkCol] = useState<string>(() => columns[0]?.id ?? "");
  const [colWidths, setColWidths] = useState<Record<string, number>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDoubleClick = useCallback(
    (rowId: string, colId: string, current: number, editable: boolean) => {
      if (!editable) return;
      setEditingCell(`${rowId}|${colId}`);
      setEditValue(String(current));
    },
    []
  );

  const commitEdit = useCallback(
    (rowId: string, colId: string) => {
      const n = parseFloat(editValue);
      onCellEdit(rowId, colId, Number.isFinite(n) ? n : 0);
      setEditingCell(null);
    },
    [editValue, onCellEdit]
  );

  const dragIds = rows.filter((r) => !r.isHeader && !r.isTotal).map((r) => r.id);

  const onDragEnd = (e: DragEndEvent) => {
    if (!onReorder) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = dragIds.indexOf(String(active.id));
    const newIndex = dragIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(dragIds, oldIndex, newIndex);
    onReorder(newOrder);
  };

  const colIds = columns.map((c) => c.id);
  const resizeKeyOrder = useMemo(
    () => ["__drag", "__items", ...(growthColumn ? ["__growth"] : []), ...colIds],
    [colIds, growthColumn]
  );

  const getColWidth = useCallback(
    (key: string) => {
      if (colWidths[key]) return colWidths[key];
      if (key === "__drag") return 36;
      if (key === "__items") return 280;
      if (key === "__growth") return 120;
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
        const min = key === "__drag" ? 28 : 72;
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

  const thead = (
    <thead>
      <tr className="bg-slate-50">
        <th
          className="w-8 border-b border-card-border relative"
          style={{ width: getColWidth("__drag"), minWidth: getColWidth("__drag") }}
        >
          <button
            type="button"
            aria-label="Resize drag column"
            onMouseDown={(e) => startResize("__drag", e)}
            className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
          />
        </th>
        <th
          className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-3 border-b border-card-border relative"
          style={{ width: getColWidth("__items"), minWidth: 120 }}
        >
          Items
          <button
            type="button"
            aria-label="Resize items column"
            onMouseDown={(e) => startResize("__items", e)}
            className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
          />
        </th>
        {growthColumn && (
          <th
            className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-3 border-b border-card-border whitespace-nowrap relative"
            style={{ width: getColWidth("__growth"), minWidth: 100 }}
          >
            <span className="block">%</span>
            <span className="text-[10px] font-normal text-muted">YoY</span>
            <button
              type="button"
              aria-label="Resize growth column"
              onMouseDown={(e) => startResize("__growth", e)}
              className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
            />
          </th>
        )}
        {columns.map((c) => (
          <th
            key={c.id}
            className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-3 border-b border-card-border whitespace-nowrap relative"
            style={{ width: getColWidth(c.id), minWidth: 96 }}
          >
            <span className="block">{c.label}</span>
            <span className="text-[10px] font-normal text-muted capitalize">{c.kind}</span>
            <button
              type="button"
              aria-label={`Resize ${c.label} column`}
              onMouseDown={(e) => startResize(c.id, e)}
              className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
            />
          </th>
        ))}
      </tr>
    </thead>
  );

  const bodyRows = rows.map((row) => {
    const growthEditable =
      growthColumn &&
      onGrowthLockToggle &&
      onGrowthPctChange &&
      !row.isHeader &&
      !row.isTotal &&
      row.modes?.[colIds[0] ?? ""] !== "auto";

    const impliedPct = impliedYoYGrowthPct(row.values, colIds);
    const displayPct = row.growthPctLocked ? row.growthPct ?? 0 : impliedPct;

    const growthCell = growthColumn && (
      <td
        className={cn(
          "px-1 py-2 border-b border-card-border align-middle",
          row.isHeader && "bg-slate-100/60",
          row.isTotal && "bg-slate-50"
        )}
        style={{ width: getColWidth("__growth"), minWidth: 100 }}
      >
        {row.isHeader || row.isTotal ? (
          <span className="text-muted text-xs">—</span>
        ) : row.modes?.[colIds[0] ?? ""] === "auto" ? (
          <span className="text-muted text-xs">—</span>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              title={row.growthPctLocked ? "Unlock — edit each year freely" : "Lock — fix YoY % and cascade"}
              onClick={() => onGrowthLockToggle?.(row.id, !row.growthPctLocked)}
              className={cn(
                "shrink-0 p-1 rounded-md border transition-colors",
                row.growthPctLocked
                  ? "border-amber-400 bg-amber-50 text-amber-600"
                  : "border-card-border bg-white text-muted hover:text-foreground"
              )}
            >
              {row.growthPctLocked ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <LockOpen className="w-3.5 h-3.5" />
              )}
            </button>
            {editingGrowthRowId === row.id && row.growthPctLocked ? (
              <input
                type="number"
                step="0.01"
                value={growthEditValue}
                onChange={(e) => setGrowthEditValue(e.target.value)}
                onBlur={() => {
                  const n = parseFloat(growthEditValue);
                  if (Number.isFinite(n)) onGrowthPctChange?.(row.id, n);
                  setEditingGrowthRowId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const n = parseFloat(growthEditValue);
                    if (Number.isFinite(n)) onGrowthPctChange?.(row.id, n);
                    setEditingGrowthRowId(null);
                  }
                  if (e.key === "Escape") setEditingGrowthRowId(null);
                }}
                className="w-16 h-8 px-1 text-right bg-amber-50 border border-amber-400 rounded text-amber-700 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                autoFocus
              />
            ) : (
              <button
                type="button"
                disabled={!growthEditable || !row.growthPctLocked}
                onDoubleClick={() => {
                  if (row.growthPctLocked && growthEditable) {
                    setEditingGrowthRowId(row.id);
                    setGrowthEditValue(String(displayPct));
                  }
                }}
                className={cn(
                  "min-w-[3rem] text-right font-mono text-xs px-1 py-1 rounded",
                  row.growthPctLocked && growthEditable && "cursor-pointer hover:bg-slate-100",
                  !row.growthPctLocked && "text-muted",
                  row.growthPctLocked && "text-amber-700 font-medium"
                )}
                title={
                  row.growthPctLocked
                    ? "Double-click to edit locked YoY %"
                    : "Implied from first two years — lock to fix"
                }
              >
                {colIds.length < 2
                  ? "—"
                  : !row.growthPctLocked && (row.values[colIds[0]] ?? 0) === 0
                    ? "—"
                    : `${displayPct.toFixed(2)}%`}
              </button>
            )}
          </div>
        )}
      </td>
    );

    const cells = (
      <>
        <td
          className={cn(
            "px-2 py-2.5 text-sm border-b border-card-border",
            row.isHeader && "font-bold text-accent uppercase text-xs tracking-wider pt-4",
            row.isTotal && "font-semibold text-foreground",
            !row.isHeader && !row.isTotal && "text-foreground",
            row.indent && "pl-6"
          )}
          style={{ width: getColWidth("__items"), minWidth: 120 }}
        >
          {row.label}
        </td>
        {growthCell}
        {columns.map((col) => {
          const mode = row.modes?.[col.id];
          const isAuto = mode === "auto";
          const raw = row.values[col.id] ?? 0;
          const key = `${row.id}|${col.id}`;
          const isEditing = editingCell === key;
          const colIndex = colIds.indexOf(col.id);
          const lockedForward =
            Boolean(row.growthPctLocked && !row.isHeader && !row.isTotal && colIndex > 0);
          const editable =
            !row.isHeader && !row.isTotal && !isAuto && !lockedForward;

          return (
            <td
              key={col.id}
              className={cn(
                "px-2 py-2.5 text-right font-mono text-sm border-b border-card-border",
                row.isHeader && "text-muted",
                row.isTotal && "font-semibold text-accent",
                !row.isHeader && !row.isTotal && "text-foreground",
                editable && "cursor-pointer"
              )}
              style={{ width: getColWidth(col.id), minWidth: 96 }}
              onDoubleClick={() => handleDoubleClick(row.id, col.id, raw, editable)}
            >
              {isEditing ? (
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(row.id, col.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit(row.id, col.id);
                    if (e.key === "Escape") setEditingCell(null);
                  }}
                  className="w-full h-8 px-2 text-right bg-blue-50 border border-accent rounded text-accent font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  autoFocus
                />
              ) : row.isHeader ? (
                ""
              ) : isAuto ? (
                <span className="text-muted italic text-xs">Auto calculate</span>
              ) : (
                <span
                  className={cn(
                    "inline-block w-full px-1 py-0.5 rounded",
                    editable && "hover:bg-slate-100 transition-colors"
                  )}
                >
                  {formatNumber(raw)}
                </span>
              )}
            </td>
          );
        })}
      </>
    );

    if (row.isHeader || row.isTotal || !onReorder) {
      return (
        <tr
          key={row.id}
          className={cn(row.isHeader && "bg-slate-100/60", row.isTotal && "bg-slate-50")}
        >
          <td
            className="border-b border-card-border"
            style={{ width: getColWidth("__drag"), minWidth: getColWidth("__drag") }}
          />
          {cells}
        </tr>
      );
    }

    return (
      <SortableRow key={row.id} id={row.id} dragWidth={getColWidth("__drag")}>
        {cells}
      </SortableRow>
    );
  });

  return (
    <div className="space-y-3">
      {(onBulkPercent || onManageItems) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {onBulkPercent && (
            <>
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
                  if (!Number.isFinite(p) || !bulkCol) return;
                  onBulkPercent(bulkCol, p);
                }}
              >
                GO
              </Button>
            </>
          )}
          {onManageItems && (
            <button
              type="button"
              onClick={onManageItems}
              className="text-accent hover:underline text-sm ml-auto"
            >
              {manageItemsLabel}
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-card-border">
        {onReorder ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <table
              className="w-full border-collapse min-w-[640px] table-fixed"
              style={{
                minWidth: resizeKeyOrder.reduce((sum, key) => sum + getColWidth(key), 0),
              }}
            >
              {thead}
              <SortableContext items={dragIds} strategy={verticalListSortingStrategy}>
                <tbody>{bodyRows}</tbody>
              </SortableContext>
            </table>
          </DndContext>
        ) : (
          <table
            className="w-full border-collapse min-w-[640px] table-fixed"
            style={{
              minWidth: resizeKeyOrder.reduce((sum, key) => sum + getColWidth(key), 0),
            }}
          >
            {thead}
            <tbody>{bodyRows}</tbody>
          </table>
        )}
        <p className="px-4 py-2 text-xs text-muted-foreground border-t border-card-border bg-slate-50 italic">
          NB: Areas marked &apos;Auto calculate&apos; will be populated in the final report. Double-click
          amounts to edit. Lock % to hold YoY growth — later years follow from the first year; bulk % skips
          locked rows.
        </p>
      </div>
    </div>
  );
}
