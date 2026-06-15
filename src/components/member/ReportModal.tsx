"use client";

import { useState } from "react";
import { TableFieldDisplay } from "@/components/TableFieldDisplay";
import {
  createEmptyTableValue,
  DEFAULT_TABLE_CONFIG,
  isTableValueComplete,
  normalizeTableConfig,
  normalizeTableValue,
  type TemplateField,
} from "@/lib/templateField";

export type { TemplateField };

interface ReportModalProps {
  templateId: string;
  templateName: string;
  fields: TemplateField[];
  /** When provided, the modal is in edit mode and PUTs to this report id */
  reportId?: string;
  /** Pre-fill values when editing */
  initialData?: Record<string, unknown>;
  onSubmitted: () => void;
  onClose?: () => void;
}

export function ReportModal({
  templateId,
  templateName,
  fields,
  reportId,
  initialData,
  onSubmitted,
  onClose,
}: ReportModalProps) {
  const isEdit = !!reportId;
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const base = initialData ?? {};
    const next = { ...base };

    for (const field of fields) {
      if (field.type === "table") {
        next[field.id] = normalizeTableValue(
          base[field.id],
          normalizeTableConfig(field.tableConfig ?? DEFAULT_TABLE_CONFIG)
        );
      }
    }

    return next;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function setValue(fieldId: string, value: unknown) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    for (const field of fields) {
      if (field.required) {
        const val = values[field.id];
        if (field.type === "table") {
          const config = normalizeTableConfig(field.tableConfig ?? DEFAULT_TABLE_CONFIG);
          if (!isTableValueComplete(val, config)) {
            setError(`"${field.label}" is required`);
            return;
          }
          continue;
        }
        if (val === undefined || val === null || val === "") {
          setError(`"${field.label}" is required`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      let res: Response;

      if (isEdit) {
        res = await fetch(`/api/member/report/${reportId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: values }),
        });
      } else {
        res = await fetch("/api/member/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: templateId === "default" ? undefined : templateId,
            data: values,
          }),
        });
      }

      if (res.ok) {
        onSubmitted();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to save report");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl min-h-[80vh] max-h-[95vh] flex flex-col">

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isEdit ? "bg-amber-100 dark:bg-amber-900/40" : "bg-indigo-100 dark:bg-indigo-900/40"}`}>
            <svg
              className={`w-5 h-5 ${isEdit ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isEdit ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )}
            </svg>
          </div>
          <div className="min-w-0 pr-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isEdit ? "Edit Report" : "Daily Report"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{templateName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === "text" && (
                  <input type="text" value={String(values[field.id] ?? "")} onChange={(e) => setValue(field.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Type your answer..." />
                )}

                {field.type === "textarea" && (
                  <textarea value={String(values[field.id] ?? "")} onChange={(e) => setValue(field.id, e.target.value)} rows={3}
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                    placeholder="Type your answer..." />
                )}

                {field.type === "number" && (
                  <input type="number" value={String(values[field.id] ?? "")} onChange={(e) => setValue(field.id, e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="0" min={0} />
                )}

                {field.type === "select" && (
                  <select value={String(values[field.id] ?? "")} onChange={(e) => setValue(field.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                    <option value="">Select an option...</option>
                    {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}

                {field.type === "checkbox" && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={Boolean(values[field.id])} onChange={(e) => setValue(field.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Yes</span>
                  </label>
                )}

                {field.type === "table" && (
                  <TableFieldDisplay
                    config={field.tableConfig ?? DEFAULT_TABLE_CONFIG}
                    value={
                      values[field.id] ??
                      createEmptyTableValue(field.tableConfig ?? DEFAULT_TABLE_CONFIG)
                    }
                    editable
                    onChange={(nextValue) => setValue(field.id, nextValue)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex gap-3">
            {isEdit && onClose && (
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            )}
            <button type="submit" disabled={submitting}
              className={`flex-1 py-3 rounded-xl font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white ${
                isEdit ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"
              }`}>
              {submitting
                ? isEdit ? "Saving..." : "Submitting..."
                : isEdit ? "Save changes" : "Submit daily report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
