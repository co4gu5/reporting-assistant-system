"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FieldPalette, FieldType } from "./FieldPalette";
import { TableConfigModal } from "./TableConfigModal";
import { TableFieldDisplay } from "@/components/TableFieldDisplay";
import {
  DEFAULT_TABLE_CONFIG,
  createEmptyTableValue,
  normalizeTableConfig,
  type TemplateField,
} from "@/lib/templateField";

export type { TemplateField };

interface ActiveDrag {
  id: string;
  fromPalette: boolean;
  type?: FieldType;
  field?: TemplateField;
}

function generateId() {
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Try pointer-within first, fall back to rect intersection so cross-container
// drops are detected reliably even when the canvas is empty.
const customCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return rectIntersection(args);
};

function DroppableCanvas({
  children,
  isEmpty,
}: {
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop-zone" });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-64 rounded-xl border-2 border-dashed transition-colors p-4 space-y-3 ${
        isEmpty
          ? "flex items-center justify-center"
          : ""
      } ${
        isOver
          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
          : isEmpty
          ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      }`}
    >
      {children}
    </div>
  );
}

function SortableField({
  field,
  onUpdate,
  onRemove,
}: {
  field: TemplateField;
  onUpdate: (id: string, updates: Partial<TemplateField>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [optionInput, setOptionInput] = useState("");
  const [showTableConfig, setShowTableConfig] = useState(false);
  const tableConfig = normalizeTableConfig(field.tableConfig ?? DEFAULT_TABLE_CONFIG);

  function addOption() {
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    onUpdate(field.id, { options: [...(field.options ?? []), trimmed] });
    setOptionInput("");
  }

  function removeOption(opt: string) {
    onUpdate(field.id, {
      options: (field.options ?? []).filter((o) => o !== opt),
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 border rounded-xl p-4 transition-shadow ${
        isDragging
          ? "opacity-40 shadow-xl border-indigo-400"
          : "border-gray-200 dark:border-gray-700 shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </button>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 uppercase">
              {field.type}
            </span>
            <input
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              placeholder="Field label..."
              className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-transparent focus:border-indigo-400 focus:outline-none bg-transparent py-0.5"
            />
          </div>

          {field.type === "table" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tableConfig.columns.length} column
                {tableConfig.columns.length !== 1 ? "s" : ""} ×{" "}
                {tableConfig.rowHeaders.length} row
                {tableConfig.rowHeaders.length !== 1 ? "s" : ""}
              </p>
              <button
                type="button"
                onClick={() => setShowTableConfig(true)}
                className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors overflow-hidden"
              >
                <TableFieldDisplay config={tableConfig} value={createEmptyTableValue(tableConfig)} />
              </button>
              <button
                type="button"
                onClick={() => setShowTableConfig(true)}
                className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Configure table
              </button>
            </div>
          )}

          {field.type === "select" && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {(field.options ?? []).map((opt) => (
                  <span
                    key={opt}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                  >
                    {opt}
                    <button
                      onClick={() => removeOption(opt)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addOption())
                  }
                  placeholder="Add option..."
                  className="flex-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  onClick={addOption}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) =>
                  onUpdate(field.id, { required: e.target.checked })
                }
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              Required
            </label>
          </div>
        </div>

        <button
          onClick={() => onRemove(field.id)}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove field"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {showTableConfig && (
        <TableConfigModal
          config={tableConfig}
          onSave={(nextConfig) =>
            onUpdate(field.id, { tableConfig: nextConfig })
          }
          onClose={() => setShowTableConfig(false)}
        />
      )}
    </div>
  );
}

export interface SavedTemplate {
  id: string;
  name: string;
  fields: TemplateField[];
  isActive: boolean;
  createdAt: string;
}

interface FormBuilderProps {
  initialFields?: TemplateField[];
  initialName?: string;
  templateId?: string;
  onSaved?: (saved: SavedTemplate) => void;
}

export function FormBuilder({
  initialFields = [],
  initialName = "",
  templateId,
  onSaved,
}: FormBuilderProps) {
  const [fields, setFields] = useState<TemplateField[]>(initialFields);
  const [name, setName] = useState(initialName);
  const [setActive, setSetActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleUpdate = useCallback(
    (id: string, updates: Partial<TemplateField>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const handleRemove = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.fromPalette) {
      setActiveDrag({ id: String(event.active.id), fromPalette: true, type: data.type });
    } else {
      const field = fields.find((f) => f.id === event.active.id);
      setActiveDrag({ id: String(event.active.id), fromPalette: false, field });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const isFromPalette = active.data.current?.fromPalette;

    if (isFromPalette) {
      const type = active.data.current?.type as FieldType;
      const newField: TemplateField = {
        id: generateId(),
        type,
        label: "",
        required: false,
        options: type === "select" ? [] : undefined,
        tableConfig: type === "table" ? { ...DEFAULT_TABLE_CONFIG, columns: DEFAULT_TABLE_CONFIG.columns.map((col) => ({ ...col })) } : undefined,
      };

      // Dropped onto the canvas background or onto a specific field
      if (over.id === "canvas-drop-zone") {
        setFields((prev) => [...prev, newField]);
      } else {
        setFields((prev) => {
          const overIndex = prev.findIndex((f) => f.id === over.id);
          if (overIndex === -1) return [...prev, newField];
          const next = [...prev];
          next.splice(overIndex, 0, newField);
          return next;
        });
      }
    } else {
      // Reordering existing fields
      if (active.id !== over.id) {
        setFields((prev) => {
          const oldIndex = prev.findIndex((f) => f.id === active.id);
          const newIndex = prev.findIndex((f) => f.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return prev;
          return arrayMove(prev, oldIndex, newIndex);
        });
      }
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      alert("Please enter a template name");
      return;
    }
    if (fields.length === 0) {
      alert("Please add at least one field");
      return;
    }

    setSaving(true);
    setSavedMsg("");

    try {
      const url = templateId
        ? `/api/admin/template/${templateId}`
        : "/api/admin/template";
      const method = templateId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, fields, isActive: setActive, setActive }),
      });

      if (res.ok) {
        const saved: SavedTemplate = await res.json();
        setSavedMsg("Template saved successfully!");
        if (!templateId) {
          setFields([]);
          setName("");
          setSetActive(false);
        }
        onSaved?.(saved);
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to save template");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 items-start">
        <FieldPalette />

        <div className="flex-1 min-w-0">
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name..."
              className="flex-1 min-w-0 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3.5 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={setActive}
                onChange={(e) => setSetActive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Set as active template
            </label>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving..." : templateId ? "Update" : "Save template"}
            </button>
          </div>

          {savedMsg && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm rounded-lg px-4 py-3">
              {savedMsg}
            </div>
          )}

          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <DroppableCanvas isEmpty={fields.length === 0}>
              {fields.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
                  Drag fields here to build your form
                </p>
              ) : (
                fields.map((field) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    onUpdate={handleUpdate}
                    onRemove={handleRemove}
                  />
                ))
              )}
            </DroppableCanvas>
          </SortableContext>

          {fields.length > 0 && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
              {fields.length} field{fields.length !== 1 ? "s" : ""} · Drag to reorder
            </p>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <div className="bg-white dark:bg-gray-800 border border-indigo-400 rounded-xl px-4 py-3 shadow-2xl text-sm font-medium text-gray-700 dark:text-gray-300 opacity-95 cursor-grabbing">
            {activeDrag.fromPalette
              ? `+ ${activeDrag.type} field`
              : activeDrag.field?.label || `(${activeDrag.field?.type} field)`}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
