import {
  getColumnStyle,
  normalizeTableConfig,
  normalizeTableValue,
  type TableConfigInput,
  type TableFieldValue,
} from "@/lib/templateField";

interface TableFieldDisplayProps {
  config: TableConfigInput;
  value: unknown;
  editable?: boolean;
  onChange?: (value: TableFieldValue) => void;
}

const inputClassName =
  "w-full min-w-0 px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export function TableFieldDisplay({
  config,
  value,
  editable = false,
  onChange,
}: TableFieldDisplayProps) {
  const normalizedConfig = normalizeTableConfig(config);
  const tableValue = normalizeTableValue(value, config);

  function updateCell(rowIndex: number, colIndex: number, cellValue: string) {
    if (!onChange) return;
    const next = tableValue.map((row, r) =>
      row.map((cell, c) =>
        r === rowIndex && c === colIndex ? cellValue : cell
      )
    );
    onChange(next);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/80">
            <th className="px-3 py-2 border-b border-r border-gray-200 dark:border-gray-700 w-px whitespace-nowrap" />
            {normalizedConfig.columns.map((column, index) => (
              <th
                key={`display-col-${index}`}
                style={getColumnStyle(column)}
                className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300"
              >
                {column.header || `Column ${index + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {normalizedConfig.rowHeaders.map((rowHeader, rowIndex) => (
            <tr
              key={`display-row-${rowIndex}`}
              className="border-t border-gray-100 dark:border-gray-800"
            >
              <th className="px-3 py-2 border-r border-gray-200 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 w-px whitespace-nowrap">
                {rowHeader || `Row ${rowIndex + 1}`}
              </th>
              {normalizedConfig.columns.map((column, colIndex) => (
                <td
                  key={`display-cell-${rowIndex}-${colIndex}`}
                  style={getColumnStyle(column)}
                  className="px-3 py-2 align-top"
                >
                  {editable ? (
                    column.type === "textarea" ? (
                      <textarea
                        value={tableValue[rowIndex][colIndex]}
                        onChange={(e) =>
                          updateCell(rowIndex, colIndex, e.target.value)
                        }
                        rows={2}
                        className={`${inputClassName} resize-none`}
                        placeholder="..."
                      />
                    ) : (
                      <input
                        type={column.type === "number" ? "number" : "text"}
                        value={tableValue[rowIndex][colIndex]}
                        onChange={(e) =>
                          updateCell(rowIndex, colIndex, e.target.value)
                        }
                        className={inputClassName}
                        placeholder={column.type === "number" ? "0" : "..."}
                        min={column.type === "number" ? 0 : undefined}
                      />
                    )
                  ) : (
                    <span className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                      {tableValue[rowIndex][colIndex] || (
                        <span className="text-gray-400 dark:text-gray-500 italic">
                          —
                        </span>
                      )}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
