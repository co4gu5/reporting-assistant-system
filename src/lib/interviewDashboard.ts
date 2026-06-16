import {
  getCurrentWeekDateStrings,
  getLocalDateStr,
  getServerTimezone,
  getTodayWeekdayIndex,
} from "./timezone";
import {
  normalizeTableConfig,
  normalizeTableValue,
  type TableConfig,
  type TableConfigInput,
} from "./templateField";

export const INTERVIEW_CATEGORIES = [
  "Intro",
  "Tech",
  "HM",
  "Loop",
  "Final",
] as const;

export type InterviewCategory = (typeof INTERVIEW_CATEGORIES)[number];
export type InterviewRowKey = "today" | "new" | "week";

export type CategoryCounts = Record<InterviewCategory, number>;

export interface DayInterviewStats {
  today: CategoryCounts;
  new: CategoryCounts;
  week: CategoryCounts;
}

export interface MemberWeeklySeries {
  userId: string;
  userName: string;
  days: DayInterviewStats[];
}

export interface WeeklyDashboardData {
  weekDays: string[];
  weekDates: string[];
  /** Inclusive index into weekDays (0=Mon … 4=Fri); line charts may stop here. */
  todayIndex: number;
  members: MemberWeeklySeries[];
  hasInterviewTable: boolean;
}

export interface ChartMemberSeries {
  id: string;
  name: string;
  values: number[];
  color: string;
}

export interface InterviewTableField {
  fieldId: string;
  config: TableConfig;
}

export const MEMBER_LINE_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
] as const;

function emptyCategoryCounts(): CategoryCounts {
  return { Intro: 0, Tech: 0, HM: 0, Loop: 0, Final: 0 };
}

function emptyDayStats(): DayInterviewStats {
  return {
    today: emptyCategoryCounts(),
    new: emptyCategoryCounts(),
    week: emptyCategoryCounts(),
  };
}

const ROW_KEYS: { key: InterviewRowKey; label: string }[] = [
  { key: "today", label: "today" },
  { key: "new", label: "new" },
  { key: "week", label: "week" },
];

export function sumSelectedCategories(
  counts: CategoryCounts,
  selected: Iterable<InterviewCategory>
): number {
  let total = 0;
  for (const category of selected) {
    total += counts[category] ?? 0;
  }
  return total;
}

export function getWeekdayLabels(): string[] {
  return ["Mon", "Tue", "Wed", "Thu", "Fri"];
}

function parseCount(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function findRowIndex(config: TableConfig, rowLabel: string): number {
  const target = normalizeLabel(rowLabel);
  return config.rowHeaders.findIndex(
    (header) => normalizeLabel(header) === target
  );
}

function findColumnIndex(
  config: TableConfig,
  category: InterviewCategory
): number {
  const target = normalizeLabel(category);
  return config.columns.findIndex(
    (column) => normalizeLabel(column.header) === target
  );
}

export function findInterviewTableField(
  fields: unknown
): InterviewTableField | null {
  if (!Array.isArray(fields)) return null;

  for (const field of fields) {
    if (field?.type !== "table" || !field.tableConfig) continue;

    const config = normalizeTableConfig(field.tableConfig as TableConfigInput);
    const rowLabels = config.rowHeaders.map(normalizeLabel);

    if (
      rowLabels.includes("today") &&
      rowLabels.includes("new") &&
      rowLabels.includes("week")
    ) {
      return { fieldId: String(field.id), config };
    }
  }

  return null;
}

export function extractInterviewStats(
  reportData: Record<string, unknown>,
  tableField: InterviewTableField
): DayInterviewStats {
  const stats = emptyDayStats();
  const tableValue = normalizeTableValue(
    reportData[tableField.fieldId],
    tableField.config
  );

  for (const { key, label } of ROW_KEYS) {
    const rowIndex = findRowIndex(tableField.config, label);
    if (rowIndex === -1) continue;

    for (const category of INTERVIEW_CATEGORIES) {
      const colIndex = findColumnIndex(tableField.config, category);
      if (colIndex === -1) continue;
      stats[key][category] = parseCount(tableValue[rowIndex][colIndex]);
    }
  }

  return stats;
}

function addDayStats(target: DayInterviewStats, source: DayInterviewStats) {
  for (const { key } of ROW_KEYS) {
    for (const category of INTERVIEW_CATEGORIES) {
      target[key][category] += source[key][category];
    }
  }
}

export function aggregateInterviewReports(
  reports: {
    date: Date | string;
    data: unknown;
    userId: string;
    userName: string;
    template: { fields: unknown };
  }[]
): WeeklyDashboardData {
  const timezone = getServerTimezone();
  const weekDays = getWeekdayLabels();
  const weekDates = getCurrentWeekDateStrings(undefined, timezone);
  const memberMap = new Map<string, MemberWeeklySeries>();
  let hasInterviewTable = false;

  const tableFieldCache = new Map<string, InterviewTableField | null>();

  for (const report of reports) {
    const templateKey = JSON.stringify(report.template.fields);
    if (!tableFieldCache.has(templateKey)) {
      tableFieldCache.set(
        templateKey,
        findInterviewTableField(report.template.fields)
      );
    }

    const tableField = tableFieldCache.get(templateKey);
    if (!tableField) continue;

    hasInterviewTable = true;

    const reportDateStr = getLocalDateStr(new Date(report.date), timezone);
    const dayIndex = weekDates.indexOf(reportDateStr);
    if (dayIndex === -1) continue;

    if (!memberMap.has(report.userId)) {
      memberMap.set(report.userId, {
        userId: report.userId,
        userName: report.userName,
        days: weekDates.map(() => emptyDayStats()),
      });
    }

    const reportData =
      report.data && typeof report.data === "object"
        ? (report.data as Record<string, unknown>)
        : {};

    addDayStats(
      memberMap.get(report.userId)!.days[dayIndex],
      extractInterviewStats(reportData, tableField)
    );
  }

  const members = Array.from(memberMap.values()).sort((a, b) =>
    a.userName.localeCompare(b.userName)
  );

  return {
    weekDays,
    weekDates,
    todayIndex: getTodayWeekdayIndex(undefined, timezone),
    members,
    hasInterviewTable,
  };
}

export function buildMemberSeriesValues(
  memberDays: DayInterviewStats[],
  rowKey: InterviewRowKey,
  selected: Set<InterviewCategory>
): number[] {
  return memberDays.map((day) => sumSelectedCategories(day[rowKey], selected));
}

export function toCumulativeValues(values: number[]): number[] {
  let total = 0;
  return values.map((value) => {
    total += value;
    return total;
  });
}

export function buildChartMemberSeries(
  members: MemberWeeklySeries[],
  rowKey: InterviewRowKey,
  selected: Set<InterviewCategory>,
  options?: { cumulative?: boolean }
): ChartMemberSeries[] {
  return members.map((member, index) => {
    let values = buildMemberSeriesValues(member.days, rowKey, selected);
    if (options?.cumulative) {
      values = toCumulativeValues(values);
    }
    return {
      id: member.userId,
      name: member.userName,
      values,
      color: MEMBER_LINE_COLORS[index % MEMBER_LINE_COLORS.length],
    };
  });
}
