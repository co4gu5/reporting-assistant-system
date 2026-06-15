"use client";

import { useCallback, useEffect, useState } from "react";

interface ReportField {
  id: string;
  type: string;
  label: string;
}

interface Report {
  id: string;
  date: string;
  data: Record<string, unknown>;
  user: { id: string; name: string; email: string };
  template: { id: string; name: string; fields: ReportField[] };
}

interface TemplateGroup {
  template: Report["template"];
  reports: Report[];
}

type ViewMode = "table" | "card" | "list";

function groupByTemplate(reports: Report[]): TemplateGroup[] {
  const map = new Map<string, TemplateGroup>();
  for (const report of reports) {
    const key = report.template.id;
    if (!map.has(key)) map.set(key, { template: report.template, reports: [] });
    map.get(key)!.reports.push(report);
  }
  return Array.from(map.values());
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Field renderers ──────────────────────────────────────────────────────────

function CellValue({ value, type }: { value: unknown; type: string }) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-gray-300 dark:text-gray-600 italic text-xs">—</span>;
  }
  if (type === "checkbox") {
    return value ? (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </span>
    ) : (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
      </span>
    );
  }
  if (type === "select") {
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium whitespace-nowrap">{String(value)}</span>;
  }
  if (type === "number") return <span className="text-sm font-mono text-gray-800 dark:text-gray-200">{String(value)}</span>;
  const str = String(value);
  return <span className="text-sm text-gray-700 dark:text-gray-300 block max-w-xs truncate" title={str}>{str}</span>;
}

function InlineValue({ value, type }: { value: unknown; type: string }) {
  if (value === undefined || value === null || value === "") return <span className="text-gray-400 dark:text-gray-500 italic">No answer</span>;
  if (type === "checkbox") return <span>{value ? "Yes" : "No"}</span>;
  if (type === "select") {
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">{String(value)}</span>;
  }
  const str = String(value);
  return <span className="line-clamp-2">{str}</span>;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Group header ─────────────────────────────────────────────────────────────

function GroupHeader({
  template,
  count,
  expanded,
  onToggle,
  viewMode,
}: {
  template: Report["template"];
  count: number;
  expanded: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
}) {
  // Table always shows all columns — toggle is not meaningful there
  const showToggle = viewMode !== "table";

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{template.name}</h2>
      <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
        {count} report{count !== 1 ? "s" : ""}
      </span>

      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors pr-1"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "Collapse" : "Expand all"}
        </button>
      )}
    </div>
  );
}

// ─── TABLE view ───────────────────────────────────────────────────────────────

function ReportsTable({
  group,
  onRowClick,
  expanded,
  onToggle,
}: {
  group: TemplateGroup;
  onRowClick: (r: Report) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { template, reports } = group;
  const fields = Array.isArray(template.fields) ? template.fields : [];
  return (
    <div className="mb-10">
      <GroupHeader template={template} count={reports.length} expanded={expanded} onToggle={onToggle} viewMode="table" />
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap w-44">Member</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap w-36">Date</th>
                {fields.map((f) => (
                  <th key={f.id} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap max-w-xs">
                    <span className="block truncate max-w-[180px]" title={f.label}>{f.label}</span>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {reports.map((report) => (
                <tr key={report.id} onClick={() => onRowClick(report)} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${avatarColor(report.user.name)}`}>
                        {report.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[100px]">{report.user.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]">{report.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(report.date)}<br />
                    <span className="text-gray-400 dark:text-gray-500">{formatTime(report.date)}</span>
                  </td>
                  {fields.map((f) => (
                    <td key={f.id} className="px-4 py-3 max-w-xs">
                      <CellValue value={report.data[f.id]} type={f.type} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-gray-300 dark:text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CARD view ────────────────────────────────────────────────────────────────

function ReportsCard({
  group,
  onCardClick,
  expanded,
  onToggle,
}: {
  group: TemplateGroup;
  onCardClick: (r: Report) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { template, reports } = group;
  const fields = Array.isArray(template.fields) ? template.fields : [];
  const PREVIEW_COUNT = 3;
  const visibleFields = expanded ? fields : fields.slice(0, PREVIEW_COUNT);

  return (
    <div className="mb-10">
      <GroupHeader template={template} count={reports.length} expanded={expanded} onToggle={onToggle} viewMode="card" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => onCardClick(report)}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(report.user.name)}`}>
                  {report.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{report.user.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{report.user.email}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(report.date)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatTime(report.date)}</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              {visibleFields.map((f) => (
                <div key={f.id}>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">{f.label}</p>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <InlineValue value={report.data[f.id]} type={f.type} />
                  </div>
                </div>
              ))}
              {!expanded && fields.length > PREVIEW_COUNT && (
                <p className="text-xs text-indigo-400 dark:text-indigo-500">
                  +{fields.length - PREVIEW_COUNT} more field{fields.length - PREVIEW_COUNT !== 1 ? "s" : ""} — click &ldquo;Expand all&rdquo; to show
                </p>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{template.name}</span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                View detail
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LIST view ────────────────────────────────────────────────────────────────

function ReportsList({
  group,
  onRowClick,
  expanded,
  onToggle,
}: {
  group: TemplateGroup;
  onRowClick: (r: Report) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { template, reports } = group;
  const fields = Array.isArray(template.fields) ? template.fields : [];
  const previewField = fields[0] ?? null;

  return (
    <div className="mb-10">
      <GroupHeader template={template} count={reports.length} expanded={expanded} onToggle={onToggle} viewMode="list" />
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
        {reports.map((report) => (
          <div key={report.id}>
            <div
              onClick={() => onRowClick(report)}
              className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors group ${
                expanded
                  ? "bg-indigo-50/30 dark:bg-indigo-900/10 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20"
                  : "hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20"
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(report.user.name)}`}>
                {report.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 w-44 shrink-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{report.user.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{report.user.email}</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                {formatDate(report.date)}
              </span>
              {!expanded && previewField && (
                <div className="flex-1 min-w-0 hidden sm:block">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium mr-1.5">{previewField.label}:</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    <InlineValue value={report.data[previewField.id]} type={previewField.type} />
                  </span>
                </div>
              )}
              {expanded && <div className="flex-1" />}
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {expanded && (
              <div className="px-5 pb-4 pt-1 bg-indigo-50/20 dark:bg-indigo-900/10 border-t border-indigo-100/60 dark:border-indigo-900/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 pl-[52px]">
                  {fields.map((f) => (
                    <div key={f.id}>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">{f.label}</p>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <InlineValue value={report.data[f.id]} type={f.type} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── View toggle ──────────────────────────────────────────────────────────────

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const buttons: { id: ViewMode; title: string; icon: React.ReactNode }[] = [
    {
      id: "table",
      title: "Table view",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
        </svg>
      ),
    },
    {
      id: "card",
      title: "Card view",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "list",
      title: "List view",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
      {buttons.map((btn) => (
        <button
          key={btn.id}
          onClick={() => onChange(btn.id)}
          title={btn.title}
          className={`p-1.5 rounded-md transition-colors ${
            mode === btn.id
              ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback((templateId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return next;
    });
  }, []);

  const fetchReports = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedDate) params.set("date", selectedDate);
    const res = await fetch(`/api/admin/reports?${params}`);
    if (res.ok) return res.json() as Promise<Report[]>;
    return [] as Report[];
  }, [selectedDate]);

  useEffect(() => {
    let cancelled = false;
    fetchReports().then((data) => { if (!cancelled) setReports(data); });
    return () => { cancelled = true; };
  }, [fetchReports]);

  const loading = reports === null;
  const today = new Date().toISOString().split("T")[0];
  const groups = reports ? groupByTemplate(reports) : [];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daily reports submitted by your team members.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Filter by date:</label>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate("")} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports!.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No reports found</p>
          {selectedDate && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Try clearing the date filter</p>}
        </div>
      ) : (
        groups.map((group) => {
          const expanded = !collapsedGroups.has(group.template.id);
          const onToggle = () => toggleGroup(group.template.id);
          if (viewMode === "table") return <ReportsTable key={group.template.id} group={group} onRowClick={setSelectedReport} expanded={expanded} onToggle={onToggle} />;
          if (viewMode === "card")  return <ReportsCard  key={group.template.id} group={group} onCardClick={setSelectedReport} expanded={expanded} onToggle={onToggle} />;
          return                          <ReportsList   key={group.template.id} group={group} onRowClick={setSelectedReport} expanded={expanded} onToggle={onToggle} />;
        })
      )}

      {selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function ReportDetailModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const fields = Array.isArray(report.template.fields) ? report.template.fields : [];
  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${avatarColor(report.user.name)}`}>
              {report.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{report.user.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(report.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {" · "}{formatTime(report.date)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {fields.map((field) => {
                const value = report.data[field.id];
                return (
                  <tr key={field.id} className="align-top">
                    <td className="px-6 py-3 w-44 shrink-0">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{field.label}</span>
                    </td>
                    <td className="px-6 py-3">
                      {value !== undefined && value !== null && value !== "" ? (
                        field.type === "checkbox" ? (
                          <span className={`text-sm font-medium ${value ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>{value ? "Yes" : "No"}</span>
                        ) : field.type === "select" ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">{String(value)}</span>
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{String(value)}</span>
                        )
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic text-sm">No answer</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
