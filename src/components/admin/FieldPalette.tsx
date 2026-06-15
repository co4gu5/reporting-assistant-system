"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { FieldType } from "@/lib/templateField";

export type { FieldType };

interface PaletteItem {
  type: FieldType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: "text",
    label: "Short text",
    description: "Single-line text input",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
      </svg>
    ),
  },
  {
    type: "textarea",
    label: "Long text",
    description: "Multi-line text area",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
      </svg>
    ),
  },
  {
    type: "number",
    label: "Number",
    description: "Numeric input",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
  },
  {
    type: "select",
    label: "Dropdown",
    description: "Single select from options",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    ),
  },
  {
    type: "checkbox",
    label: "Checkbox",
    description: "Yes / No toggle",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: "table",
    label: "Table",
    description: "Grid with row and column headers",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
      </svg>
    ),
  },
];

function DraggablePaletteItem({ item }: { item: PaletteItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { type: item.type, fromPalette: true },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors select-none ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
        {item.icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
      </div>
    </div>
  );
}

export function FieldPalette() {
  return (
    <div className="w-56 shrink-0">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Field types
      </p>
      <div className="space-y-2">
        {PALETTE_ITEMS.map((item) => (
          <DraggablePaletteItem key={item.type} item={item} />
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">Drag fields onto the canvas</p>
    </div>
  );
}
