"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InterviewLineChart } from "@/components/admin/InterviewLineChart";
import {
  buildChartMemberSeries,
  INTERVIEW_CATEGORIES,
  type InterviewCategory,
  type WeeklyDashboardData,
} from "@/lib/interviewDashboard";

function createDefaultSelected() {
  return new Set<InterviewCategory>(INTERVIEW_CATEGORIES);
}

function toggleInSet<T>(prev: Set<T>, value: T): Set<T> {
  const next = new Set(prev);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function toggleCategoryInSet(
  prev: Set<InterviewCategory>,
  category: InterviewCategory
): Set<InterviewCategory> {
  const next = new Set(prev);
  if (next.has(category)) {
    if (next.size === 1) return prev;
    next.delete(category);
  } else {
    next.add(category);
  }
  return next;
}

export default function DashboardClient() {
  const [data, setData] = useState<WeeklyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todaySelected, setTodaySelected] = useState(createDefaultSelected);
  const [newSelected, setNewSelected] = useState(createDefaultSelected);
  const [weekSelected, setWeekSelected] = useState(createDefaultSelected);
  const [hiddenMemberIds, setHiddenMemberIds] = useState<Set<string>>(
    () => new Set()
  );

  const toggleMemberVisibility = useCallback((memberId: string) => {
    setHiddenMemberIds((prev) => toggleInSet(prev, memberId));
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) {
        setError("Failed to load dashboard data");
        setData(null);
        return;
      }
      setData(await res.json());
    } catch {
      setError("Failed to load dashboard data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const todaySeries = useMemo(
    () =>
      data
        ? buildChartMemberSeries(data.members, "today", todaySelected)
        : [],
    [data, todaySelected]
  );
  const newSeries = useMemo(
    () =>
      data ? buildChartMemberSeries(data.members, "new", newSelected) : [],
    [data, newSelected]
  );
  const weekSeries = useMemo(
    () =>
      data
        ? buildChartMemberSeries(data.members, "today", weekSelected, {
            cumulative: true,
          })
        : [],
    [data, weekSelected]
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Interview status by day for the current week (Mon–Fri), one line per member
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {!loading && data && !data.hasInterviewTable && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm rounded-lg px-4 py-3">
          No interview table found. Add a table field with row headers Today, New,
          Week and columns Intro, Tech, HM, Loop, Final in your active template.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[360px]">
        <InterviewLineChart
          title="Day"
          subtitle="Day row per member"
          labels={data?.weekDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri"]}
          series={todaySeries}
          selected={todaySelected}
          lineEndIndex={data?.todayIndex}
          hiddenMemberIds={hiddenMemberIds}
          onToggleMember={toggleMemberVisibility}
          onToggleCategory={(category) =>
            setTodaySelected((prev) => toggleCategoryInSet(prev, category))
          }
        />
        <InterviewLineChart
          title="New"
          subtitle="New row per member"
          labels={data?.weekDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri"]}
          series={newSeries}
          selected={newSelected}
          lineEndIndex={data?.todayIndex}
          hiddenMemberIds={hiddenMemberIds}
          onToggleMember={toggleMemberVisibility}
          onToggleCategory={(category) =>
            setNewSelected((prev) => toggleCategoryInSet(prev, category))
          }
        />
        <InterviewLineChart
          title="Week"
          subtitle="Cumulative Today row (Mon, Mon+Tue, …) per member"
          labels={data?.weekDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri"]}
          series={weekSeries}
          selected={weekSelected}
          lineEndIndex={data?.todayIndex}
          hiddenMemberIds={hiddenMemberIds}
          onToggleMember={toggleMemberVisibility}
          onToggleCategory={(category) =>
            setWeekSelected((prev) => toggleCategoryInSet(prev, category))
          }
        />
      </div>
    </div>
  );
}
