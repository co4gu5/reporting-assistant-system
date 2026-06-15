"use client";

import { useCallback, useEffect, useState } from "react";
import { FormBuilder, SavedTemplate, TemplateField } from "@/components/admin/FormBuilder";

interface Template {
  id: string;
  name: string;
  fields: TemplateField[];
  isActive: boolean;
  createdAt: string;
}

export default function TemplatePage() {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [view, setView] = useState<"list" | "new" | "edit">("list");

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/admin/template");
    if (res.ok) {
      const data = await res.json() as Template[];
      setTemplates(data);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/template")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Template[]) => { if (!cancelled) setTemplates(data); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = templates === null;

  async function setActiveTemplate(id: string) {
    await fetch(`/api/admin/template/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    // Mark the activated template and clear isActive on others immediately
    setTemplates((prev) =>
      prev?.map((t) => ({ ...t, isActive: t.id === id })) ?? prev
    );
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/admin/template/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev?.filter((t) => t.id !== id) ?? prev);
  }

  function handleSaved(saved: SavedTemplate) {
    setTemplates((prev) => {
      if (!prev) return prev;
      const exists = prev.some((t) => t.id === saved.id);
      if (exists) {
        // Update in-place; if this template just became active, clear others
        return prev.map((t) =>
          t.id === saved.id
            ? { ...t, ...saved }
            : saved.isActive
            ? { ...t, isActive: false }
            : t
        );
      }
      // Brand-new template — prepend
      return [saved, ...prev];
    });
  }

  if (view === "new") {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setView("list")}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Template</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Design a report form for your team</p>
          </div>
        </div>
        <FormBuilder onSaved={(saved) => { handleSaved(saved); setTimeout(() => setView("list"), 800); }} />
      </div>
    );
  }

  if (view === "edit" && editingTemplate) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => { setView("list"); setEditingTemplate(null); }}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Template</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{editingTemplate.name}</p>
          </div>
        </div>
        <FormBuilder
          initialFields={editingTemplate.fields}
          initialName={editingTemplate.name}
          templateId={editingTemplate.id}
          onSaved={(saved) => {
            handleSaved(saved);
            // Brief delay so user sees the "saved" message, then return to list
            setTimeout(() => { setView("list"); setEditingTemplate(null); }, 800);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Report Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Design the daily report form your team members will fill out.
          </p>
        </div>
        <button
          onClick={() => setView("new")}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates!.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-16 text-center">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No templates yet</p>
          <button onClick={() => setView("new")} className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-700 dark:hover:text-indigo-300">
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates!.map((template) => (
            <div key={template.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{template.name}</h3>
                    {template.isActive && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {Array.isArray(template.fields) ? template.fields.length : 0} fields ·{" "}
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Array.isArray(template.fields) && template.fields.slice(0, 3).map((f) => (
                  <span key={f.id} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                    {f.label || f.type}
                  </span>
                ))}
                {Array.isArray(template.fields) && template.fields.length > 3 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">+{template.fields.length - 3} more</span>
                )}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => { setEditingTemplate(template); setView("edit"); }}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Edit
                </button>
                {!template.isActive && (
                  <button onClick={() => setActiveTemplate(template.id)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                    Set active
                  </button>
                )}
                {!template.isActive && (
                  <button onClick={() => deleteTemplate(template.id)}
                    className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ml-auto">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
