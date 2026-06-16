"use client";

import {
  INTERVIEW_CATEGORIES,
  type ChartMemberSeries,
  type InterviewCategory,
} from "@/lib/interviewDashboard";

interface InterviewLineChartProps {
  title: string;
  subtitle: string;
  labels: string[];
  series: ChartMemberSeries[];
  selected: Set<InterviewCategory>;
  onToggleCategory: (category: InterviewCategory) => void;
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 200;
const PADDING = { top: 12, right: 12, bottom: 32, left: 36 };

function xForIndex(index: number, count: number, plotWidth: number, left: number) {
  if (count <= 1) return left + plotWidth / 2;
  return left + (index / (count - 1)) * plotWidth;
}

function buildYAxis(allValues: number[]) {
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 0;

  if (dataMax <= 0) {
    return { maxValue: 1, ticks: [0] };
  }

  const ticks: number[] = [];
  for (let index = 0; index < 5; index++) {
    const tick = Math.round((dataMax / 4) * index);
    if (ticks.length === 0 || ticks[ticks.length - 1] !== tick) {
      ticks.push(tick);
    }
  }

  const lastTick = ticks[ticks.length - 1];
  if (lastTick !== dataMax) {
    const roundedMax = Math.round(dataMax);
    if (roundedMax !== lastTick) {
      ticks.push(roundedMax);
    }
  }

  return { maxValue: dataMax, ticks };
}

export function InterviewLineChart({
  title,
  subtitle,
  labels,
  series,
  selected,
  onToggleCategory,
}: InterviewLineChartProps) {
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const allValues = series.flatMap((member) => member.values);
  const { maxValue, ticks: yTicks } = buildYAxis(allValues);
  const pointCount = labels.length;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {INTERVIEW_CATEGORIES.map((category) => (
            <label
              key={category}
              className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selected.has(category)}
                onChange={() => onToggleCategory(category)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              {category}
            </label>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full max-w-full h-auto"
          role="img"
          aria-label={`${title} line chart`}
        >
          {yTicks.map((tick, tickIndex) => {
            const y = PADDING.top + plotHeight - (tick / maxValue) * plotHeight;
            return (
              <g key={`y-${tickIndex}-${tick}`}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + plotWidth}
                  y2={y}
                  stroke="currentColor"
                  className="text-gray-200 dark:text-gray-700"
                  strokeDasharray="4 4"
                />
                <text
                  x={PADDING.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-400 dark:fill-gray-500 text-[10px]"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          <line
            x1={PADDING.left}
            y1={PADDING.top + plotHeight}
            x2={PADDING.left + plotWidth}
            y2={PADDING.top + plotHeight}
            className="stroke-gray-300 dark:stroke-gray-600"
            strokeWidth={1}
          />
          <line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={PADDING.top + plotHeight}
            className="stroke-gray-300 dark:stroke-gray-600"
            strokeWidth={1}
          />

          {series.map((member) => {
            const points = member.values.map((value, index) => ({
              x: xForIndex(index, pointCount, plotWidth, PADDING.left),
              y: PADDING.top + plotHeight - (value / maxValue) * plotHeight,
            }));
            const linePath = points
              .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
              .join(" ");

            return (
              <g key={member.id}>
                <path
                  d={linePath}
                  fill="none"
                  stroke={member.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {points.map((point, index) => (
                  <circle
                    key={`${member.id}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={3}
                    fill={member.color}
                  />
                ))}
              </g>
            );
          })}

          {labels.map((label, index) => (
            <text
              key={`label-${label}`}
              x={xForIndex(index, pointCount, plotWidth, PADDING.left)}
              y={CHART_HEIGHT - 8}
              textAnchor="middle"
              className="fill-gray-500 dark:fill-gray-400 text-[11px]"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>

      {series.length > 0 ? (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-x-3 gap-y-1.5">
          {series.map((member) => (
            <div
              key={`legend-${member.id}`}
              className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: member.color }}
              />
              <span className="truncate max-w-[120px]" title={member.name}>
                {member.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
          No member reports this week
        </p>
      )}
    </div>
  );
}
