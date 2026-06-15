"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DEFAULT_TABLE_CONFIG,
  normalizeTableConfig,
  type TableColumn,
  type TableColumnType,
  type TableConfig,
  type TableConfigInput,
} from "@/lib/templateField";

interface TableConfigModalProps {
  config: TableConfigInput;
  onSave: (config: TableConfig) => void;
  onClose: () => void;
}

type DraftColumn = TableColumn & { id: string };

const COLUMN_TYPES: { value: TableColumnType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
];

function createColumnId() {
  return `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createDefaultColumn(index: number): DraftColumn {
  return { id: createColumnId(), header: `Column ${index + 1}`, type: "text" };
}

function toDraftColumns(columns: TableColumn[]): DraftColumn[] {
  return columns.map((column) => ({ ...column, id: createColumnId() }));
}

function SortableColumnItem({
  column,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  column: DraftColumn;
  index: number;
  total: number;
  onUpdate: (id: string, updates: Partial<TableColumn>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border p-3 ${
        isDragging
          ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-lg opacity-95"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="flex gap-2 flex-wrap items-center">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
          aria-label="Drag to reorder column"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </button>

        <input
          value={column.header}
          onChange={(e) => onUpdate(column.id, { header: e.target.value })}
          placeholder={`Column ${index + 1}`}
          className="flex-1 min-w-40 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={column.type}
          onChange={(e) =>
            onUpdate(column.id, { type: e.target.value as TableColumnType })
          }
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {COLUMN_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            value={column.maxWidth ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              onUpdate(column.id, {
                maxWidth: raw ? Number(raw) : undefined,
              });
            }}
            placeholder="Auto"
            className="w-24 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            px max
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(column.id, -1)}
            disabled={index === 0}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move up"
            aria-label="Move column up"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onMove(column.id, 1)}
            disabled={index === total - 1}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move down"
            aria-label="Move column down"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRemove(column.id)}
          disabled={total <= 1}
          className="px-3 py-2 text-xs text-gray-500 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export function TableConfigModal({
  config,
  onSave,
  onClose,
}: TableConfigModalProps) {
  const normalized = normalizeTableConfig(config);
  const [columns, setColumns] = useState<DraftColumn[]>(() =>
    toDraftColumns(normalized.columns)
  );
  const [rowHeaders, setRowHeaders] = useState<string[]>(normalized.rowHeaders);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function updateColumn(id: string, updates: Partial<TableColumn>) {
    setColumns((prev) =>
      prev.map((column) =>
        column.id === id ? { ...column, ...updates } : column
      )
    );
  }

  function updateRowHeader(index: number, value: string) {
    setRowHeaders((prev) =>
      prev.map((header, i) => (i === index ? value : header))
    );
  }

  function addColumn() {
    setColumns((prev) => [...prev, createDefaultColumn(prev.length)]);
  }

  function removeColumn(id: string) {
    setColumns((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((column) => column.id !== id);
    });
  }

  function moveColumn(id: string, direction: -1 | 1) {
    setColumns((prev) => {
      const index = prev.findIndex((column) => column.id === id);
      const newIndex = index + direction;
      if (index === -1 || newIndex < 0 || newIndex >= prev.length) return prev;
      return arrayMove(prev, index, newIndex);
    });
  }

  function handleColumnDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setColumns((prev) => {
      const oldIndex = prev.findIndex((column) => column.id === active.id);
      const newIndex = prev.findIndex((column) => column.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function addRow() {
    setRowHeaders((prev) => [...prev, `Row ${prev.length + 1}`]);
  }

  function removeRow(index: number) {
    setRowHeaders((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleSave() {
    onSave(
      normalizeTableConfig({
        columns: columns.map(({ id: _id, ...column }) => column),
        rowHeaders,
      })
    );
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Configure table
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Set headers, column types, max widths, and order
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Columns
              </h3>
              <button
                type="button"
                onClick={addColumn}
                className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Add column
              </button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleColumnDragEnd}
            >
              <SortableContext
                items={columns.map((column) => column.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {columns.map((column, index) => (
                    <SortableColumnItem
                      key={column.id}
                      column={column}
                      index={index}
                      total={columns.length}
                      onUpdate={updateColumn}
                      onRemove={removeColumn}
                      onMove={moveColumn}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Drag the handle or use the arrows to reorder columns
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Row headers
              </h3>
              <button
                type="button"
                onClick={addRow}
                className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Add row
              </button>
            </div>
            <div className="space-y-2">
              {rowHeaders.map((header, index) => (
                <div key={`row-${index}`} className="flex gap-2">
                  <input
                    value={header}
                    onChange={(e) => updateRowHeader(index, e.target.value)}
                    placeholder={`Row ${index + 1}`}
                    className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={rowHeaders.length <= 1}
                    className="px-3 py-2 text-xs text-gray-500 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Preview
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80">
                    <th className="px-3 py-2 border-b border-r border-gray-200 dark:border-gray-700 w-28" />
                    {columns.map((column, index) => (
                      <th
                        key={column.id}
                        style={
                          column.maxWidth
                            ? { maxWidth: column.maxWidth, width: column.maxWidth }
                            : undefined
                        }
                        className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300"
                      >
                        <span>{column.header || `Column ${index + 1}`}</span>
                        <span className="block text-[10px] font-normal text-gray-400 dark:text-gray-500 mt-0.5">
                          {COLUMN_TYPES.find((t) => t.value === column.type)?.label}
                          {column.maxWidth ? ` · ${column.maxWidth}px` : ""}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowHeaders.map((rowHeader, rowIndex) => (
                    <tr
                      key={`preview-row-${rowIndex}`}
                      className="border-t border-gray-100 dark:border-gray-800"
                    >
                      <th className="px-3 py-2 border-r border-gray-200 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50">
                        {rowHeader || `Row ${rowIndex + 1}`}
                      </th>
                      {columns.map((column) => (
                        <td
                          key={`${rowIndex}-${column.id}`}
                          style={
                            column.maxWidth
                              ? { maxWidth: column.maxWidth, width: column.maxWidth }
                              : undefined
                          }
                          className="px-3 py-2 text-gray-400 dark:text-gray-500 italic truncate"
                        >
                          {column.type === "textarea"
                            ? "Long text"
                            : column.type === "number"
                              ? "0"
                              : "Text"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Save table format
          </button>
        </div>
      </div>
    </div>
  );
}
