"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { formatNumber } from "@/lib/calculations";

interface Column {
  key: string;
  label: string;
  type: "text" | "number";
  width?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface EditableTableProps {
  columns: Column[];
  data: any[];
  onUpdate: (id: string, field: string, value: string | number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel?: string;
}

export function EditableTable({
  columns,
  data,
  onUpdate,
  onAdd,
  onRemove,
  addLabel = "Add Row",
}: EditableTableProps) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border border-slate-700/50">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-800/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 border-b border-slate-700"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-12 border-b border-slate-700 px-2" />
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.id as string}
                className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors group"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    {col.type === "number" ? (
                      <Input
                        type="number"
                        value={row[col.key] as number || ""}
                        onChange={(e) =>
                          onUpdate(
                            row.id as string,
                            col.key,
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        className="h-8 text-right font-mono text-sm bg-transparent border-slate-700/50 focus:border-blue-500"
                        placeholder="0"
                      />
                    ) : (
                      <Input
                        type="text"
                        value={(row[col.key] as string) || ""}
                        onChange={(e) =>
                          onUpdate(row.id as string, col.key, e.target.value)
                        }
                        className="h-8 text-sm bg-transparent border-slate-700/50 focus:border-blue-500"
                        placeholder={`Enter ${col.label.toLowerCase()}`}
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(row.id as string)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
                  className="text-center py-8 text-slate-500 text-sm"
                >
                  No entries yet. Click below to add one.
                </td>
              </tr>
            )}
          </tbody>
          {data.length > 0 && columns.some((c) => c.type === "number") && (
            <tfoot>
              <tr className="bg-slate-800/50 border-t border-slate-600">
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm font-semibold text-slate-300"
                  >
                    {i === 0 ? (
                      "Total"
                    ) : col.type === "number" ? (
                      <span className="font-mono text-right block">
                        {formatNumber(
                          data.reduce(
                            (sum, row) => sum + ((row[col.key] as number) || 0),
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
