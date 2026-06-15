"use client";

import { useCallback, useEffect, useState } from "react";
import { ReportModal, TemplateField } from "@/components/member/ReportModal";
import { TableFieldDisplay } from "@/components/TableFieldDisplay";
import { DEFAULT_TABLE_CONFIG, isTableValueEmpty } from "@/lib/templateField";

interface TodayData {
  submitted: boolean;
  report?: {
    id: string;
    date: string;
    data: Record<string, unknown>;
    template: {
      id: string;
      name: string;
      fields: TemplateField[];
    };
  };
  template?: {
    id: string;
    name: string;
    fields: TemplateField[];
  };
}

type ModalMode = "submit" | "edit" | null;

export default function MemberDashboard() {
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "done">("loading");
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const fetchToday = useCallback(async () => {
    const res = await fetch("/api/member/report/today");
    if (res.ok) return res.json() as Promise<TodayData>;
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchToday().then((data) => {
      if (!cancelled) {
        setTodayData(data);
        setLoadState("done");
        if (data && !data.submitted) setModalMode("submit");
      }
    });
    return () => { cancelled = true; };
  }, [fetchToday]);

  const loading = loadState === "loading";

  function handleSubmitted() {
    setModalMode(null);
    // Immediately optimistic update then re-fetch for accuracy
    fetchToday().then((data) => { if (data) setTodayData(data); });
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const report = todayData?.report;
  const template = report?.template ?? todayData?.template;

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">My Dashboard</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Status card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  todayData?.submitted ? "bg-green-100 dark:bg-green-900/40" : "bg-amber-100 dark:bg-amber-900/40"
                }`}>
                  {todayData?.submitted ? (
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-base font-semibold ${todayData?.submitted ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
                    {todayData?.submitted ? "You've submitted today's report" : "You haven't submitted today's report"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {todayData?.submitted
                      ? `via "${report?.template.name}" · ${new Date(report!.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
                      : "Fill it out now — it only takes a minute"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {todayData?.submitted ? (
                  <button
                    onClick={() => setModalMode("edit")}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit report
                  </button>
                ) : (
                  <button
                    onClick={() => setModalMode("submit")}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Fill out report
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submitted report display */}
          {todayData?.submitted && report && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Today&apos;s Report — {report.template.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2.5 py-1 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Submitted
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {report.template.fields.map((field) => {
                  const value = report.data[field.id];
                  return (
                    <div key={field.id} className="px-6 py-4 flex gap-6">
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-44 shrink-0 pt-0.5">
                        {field.label}
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 flex-1 whitespace-pre-wrap">
                        {field.type === "table" ? (
                          isTableValueEmpty(value) ? (
                            <span className="text-gray-400 dark:text-gray-500 italic">No answer</span>
                          ) : (
                            <TableFieldDisplay
                              config={field.tableConfig ?? DEFAULT_TABLE_CONFIG}
                              value={value}
                            />
                          )
                        ) : value !== undefined && value !== null && value !== "" ? (
                          field.type === "checkbox" ? (value ? "Yes" : "No") : String(value)
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">No answer</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Submit modal */}
      {modalMode === "submit" && template && (
        <ReportModal
          templateId={template.id}
          templateName={template.name}
          fields={template.fields}
          onSubmitted={handleSubmitted}
          onClose={() => setModalMode(null)}
        />
      )}

      {/* Edit modal */}
      {modalMode === "edit" && report && (
        <ReportModal
          templateId={report.template.id}
          templateName={report.template.name}
          fields={report.template.fields}
          reportId={report.id}
          initialData={report.data}
          onSubmitted={handleSubmitted}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
}
