export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "table";

export type TableColumnType = "text" | "textarea" | "number";

export interface TableColumn {
  header: string;
  type: TableColumnType;
  maxWidth?: number;
  defaultValue?: string;
}

export interface TableConfig {
  columns: TableColumn[];
  rowHeaders: string[];
}

/** Legacy shape stored in older templates */
export type TableConfigInput =
  | TableConfig
  | {
      columnHeaders?: string[];
      rowHeaders?: string[];
      columns?: TableColumn[];
    };

export interface TemplateField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
  tableConfig?: TableConfigInput;
}

export type TableFieldValue = string[][];

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  columns: [
    { header: "Column 1", type: "text" },
    { header: "Column 2", type: "text" },
  ],
  rowHeaders: ["Row 1", "Row 2"],
};

export function normalizeTableConfig(input: TableConfigInput): TableConfig {
  if ("columns" in input && input.columns && input.columns.length > 0) {
    return {
      columns: input.columns.map((col, index) => ({
        header: col.header?.trim() || `Column ${index + 1}`,
        type: col.type ?? "text",
        maxWidth:
          typeof col.maxWidth === "number" && col.maxWidth > 0
            ? col.maxWidth
            : undefined,
        defaultValue: col.defaultValue?.trim() || undefined,
      })),
      rowHeaders:
        input.rowHeaders && input.rowHeaders.length > 0
          ? input.rowHeaders
          : [...DEFAULT_TABLE_CONFIG.rowHeaders],
    };
  }

  const headers =
    "columnHeaders" in input && input.columnHeaders && input.columnHeaders.length > 0
      ? input.columnHeaders
      : DEFAULT_TABLE_CONFIG.columns.map((col) => col.header);

  return {
    columns: headers.map((header, index) => ({
      header: header.trim() || `Column ${index + 1}`,
      type: "text" as const,
    })),
    rowHeaders:
      input.rowHeaders && input.rowHeaders.length > 0
        ? input.rowHeaders
        : [...DEFAULT_TABLE_CONFIG.rowHeaders],
  };
}

export function createEmptyTableValue(config: TableConfigInput): TableFieldValue {
  const normalized = normalizeTableConfig(config);
  return normalized.rowHeaders.map(() =>
    normalized.columns.map((column) => column.defaultValue ?? "")
  );
}

export function normalizeTableValue(
  value: unknown,
  config: TableConfigInput
): TableFieldValue {
  const normalized = normalizeTableConfig(config);
  const rows = normalized.rowHeaders.length;
  const cols = normalized.columns.length;
  const existing = Array.isArray(value) ? value : [];

  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => {
      const cell = existing[rowIndex]?.[colIndex];
      return cell === undefined || cell === null ? "" : String(cell);
    })
  );
}

export function isTableValueComplete(
  value: unknown,
  config: TableConfigInput
): boolean {
  const normalized = normalizeTableValue(value, config);
  return normalized.every((row) =>
    row.every((cell) => cell.trim() !== "")
  );
}

export function isTableValueEmpty(value: unknown): boolean {
  if (!Array.isArray(value)) return true;
  return value.every(
    (row) =>
      !Array.isArray(row) ||
      row.every(
        (cell) =>
          cell === undefined || cell === null || String(cell).trim() === ""
      )
  );
}

export function getColumnStyle(
  column: TableColumn
): { maxWidth: number; width: number } | undefined {
  if (!column.maxWidth) return undefined;
  return { maxWidth: column.maxWidth, width: column.maxWidth };
}
