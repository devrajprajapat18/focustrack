"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  differenceInCalendarDays,
  endOfWeek,
  format,
  getDay,
  isToday,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type HeatmapMetric = "tasksCompleted" | "focusSessions" | "notesCreated";
type RangeKey = "30" | "90" | "365";

type HeatmapDay = {
  date: string;
  tasksCompleted: number;
  focusSessions?: number;
  notesCreated?: number;
};

type GridDay = {
  date: Date;
  dateKey: string;
  value: number;
  outOfRange: boolean;
  isToday: boolean;
  weekIndex: number;
  row: number;
};

function getHeatColor(value: number) {
  if (value === 0) return "var(--heatmap-level-0)";
  if (value <= 2) return "var(--heatmap-level-1)";
  if (value <= 4) return "var(--heatmap-level-2)";
  return "var(--heatmap-level-3)";
}

function calculateLongestStreak(values: number[]) {
  let longest = 0;
  let current = 0;

  values.forEach((value) => {
    if (value > 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  });

  return longest;
}

export function ActivityHeatmap({ data }: { data: HeatmapDay[] }) {
  const router = useRouter();
  const [range, setRange] = useState<RangeKey>("365");
  const [metric, setMetric] = useState<HeatmapMetric>("tasksCompleted");
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  const today = startOfDay(new Date());
  const metricLabel = metric === "tasksCompleted" ? "Tasks completed" : metric === "focusSessions" ? "Focus sessions" : "Notes created";

  const filtered = useMemo(() => {
    const days = Number(range);
    const rangeStart = subDays(today, days - 1);

    return data
      .map((item) => {
        const dayDate = parseISO(item.date);
        return {
          ...item,
          dayDate,
          value: metric === "tasksCompleted" ? item.tasksCompleted : metric === "focusSessions" ? item.focusSessions || 0 : item.notesCreated || 0,
        };
      })
      .filter((item) => item.dayDate >= rangeStart && item.dayDate <= today)
      .sort((a, b) => a.dayDate.getTime() - b.dayDate.getTime());
  }, [data, metric, range, today]);

  const daysByKey = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((item) => map.set(item.date, item.value));
    return map;
  }, [filtered]);

  const { grid, columns, weekTotals } = useMemo(() => {
    if (!filtered.length) {
      return { grid: [] as GridDay[], columns: 0, weekTotals: new Map<number, number>() };
    }

    const rangeStart = filtered[0].dayDate;
    const rangeEnd = filtered[filtered.length - 1].dayDate;
    const alignedStart = startOfWeek(rangeStart, { weekStartsOn: 0 });
    const alignedEnd = endOfWeek(rangeEnd, { weekStartsOn: 0 });
    const totalDays = differenceInCalendarDays(alignedEnd, alignedStart) + 1;
    const totals = new Map<number, number>();

    const cells: GridDay[] = Array.from({ length: totalDays }, (_, index) => {
      const date = subDays(alignedEnd, totalDays - index - 1);
      const dateKey = format(date, "yyyy-MM-dd");
      const outOfRange = date < rangeStart || date > rangeEnd;
      const value = outOfRange ? 0 : daysByKey.get(dateKey) || 0;
      const weekIndex = Math.floor(index / 7);

      if (!outOfRange) {
        totals.set(weekIndex, (totals.get(weekIndex) || 0) + value);
      }

      return {
        date,
        dateKey,
        value,
        outOfRange,
        isToday: isToday(date),
        weekIndex,
        row: getDay(date),
      };
    });

    return { grid: cells, columns: Math.ceil(totalDays / 7), weekTotals: totals };
  }, [daysByKey, filtered]);

  const activeValues = filtered.map((item) => item.value);
  const longestStreak = calculateLongestStreak(activeValues);

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = activeValues.length - 1; i >= 0; i -= 1) {
      if (activeValues[i] > 0) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  }, [activeValues]);

  const currentStreakDates = useMemo(() => {
    if (currentStreak <= 0) {
      return new Set<string>();
    }

    const set = new Set<string>();
    for (let i = filtered.length - currentStreak; i < filtered.length; i += 1) {
      const item = filtered[i];
      if (item && item.value > 0) {
        set.add(item.date);
      }
    }
    return set;
  }, [currentStreak, filtered]);

  const insights = useMemo(() => {
    if (!filtered.length) {
      return { mostProductiveDay: "-", activeThisWeek: 0 };
    }

    const weekdayTotals = Array.from({ length: 7 }, () => 0);
    filtered.forEach((item) => {
      weekdayTotals[getDay(item.dayDate)] += item.value;
    });

    const maxIndex = weekdayTotals.indexOf(Math.max(...weekdayTotals));
    const activeThisWeek = filtered.slice(-7).filter((item) => item.value > 0).length;

    return {
      mostProductiveDay: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][maxIndex],
      activeThisWeek,
    };
  }, [filtered]);

  const hoveredWeekTotal = hoveredWeek === null ? null : weekTotals.get(hoveredWeek) || 0;
  const hasAnyActivity = filtered.some((item) => item.value > 0);

  return (
    <Card className="overflow-hidden border-border/80 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_85%,white)_0%,color-mix(in_oklab,var(--divider)_80%,var(--surface))_100%)]">
      <CardHeader className="pb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Consistency</p>
        <CardTitle className="mt-1">Activity Heatmap</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="default">Current streak: {currentStreak} days</Badge>
            <Badge variant="muted">Longest: {longestStreak} days</Badge>
            <Flame className="size-4 text-accent" />
          </div>

          <div className="flex items-center gap-2">
            {([
              ["tasksCompleted", "Tasks"],
              ["focusSessions", "Focus"],
              ["notesCreated", "Notes"],
            ] as const).map(([key, label]) => (
              <Button key={key} type="button" size="sm" variant={metric === key ? "default" : "ghost"} onClick={() => setMetric(key)}>
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["30", "Last 30 days"],
            ["90", "Last 90 days"],
            ["365", "Last 1 year"],
          ] as const).map(([key, label]) => (
            <Button key={key} type="button" size="sm" variant={range === key ? "secondary" : "outline"} onClick={() => setRange(key)}>
              {label}
            </Button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="mt-4 overflow-x-auto">
          <div className="grid min-w-max gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}>
            {grid.map((cell) => {
              const tooltip = `${cell.value} ${metricLabel.toLowerCase()} on ${format(cell.date, "MMM d, yyyy")}`;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  title={tooltip}
                  onMouseEnter={() => setHoveredWeek(cell.weekIndex)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  onClick={() => router.push(`/tasks?completedOn=${cell.dateKey}`)}
                  className={cn(
                    "size-3.5 rounded-[3px] transition-transform duration-150 hover:scale-125",
                    cell.outOfRange && "opacity-25",
                    cell.isToday && "ring-2 ring-primary/80 ring-offset-1 ring-offset-surface",
                    currentStreakDates.has(cell.dateKey) && "ring-1 ring-accent/70",
                  )}
                  style={{
                    gridColumn: cell.weekIndex + 1,
                    gridRow: cell.row + 1,
                    backgroundColor: getHeatColor(cell.value),
                  }}
                  aria-label={tooltip}
                />
              );
            })}
          </div>
        </motion.div>

        <div className="mt-3 text-xs text-text-secondary">
          {hoveredWeekTotal === null ? "Hover a week to see total activity" : `Week total: ${hoveredWeekTotal} ${metricLabel.toLowerCase()}`}
        </div>

        {!hasAnyActivity && (
          <div className="mt-3 rounded-xl border border-border/70 bg-surface/70 p-3 text-center text-sm text-text-secondary">
            No activity yet. Start completing tasks!
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
          <span>Less</span>
          <div className="size-3 rounded-sm" style={{ backgroundColor: "var(--heatmap-level-0)" }} />
          <div className="size-3 rounded-sm" style={{ backgroundColor: "var(--heatmap-level-1)" }} />
          <div className="size-3 rounded-sm" style={{ backgroundColor: "var(--heatmap-level-2)" }} />
          <div className="size-3 rounded-sm" style={{ backgroundColor: "var(--heatmap-level-3)" }} />
          <span>More</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-text-secondary md:grid-cols-2">
          <p>
            You were most productive on <span className="font-semibold text-text-primary">{insights.mostProductiveDay}</span>.
          </p>
          <p>
            You completed {metric === "tasksCompleted" ? "tasks" : metric === "focusSessions" ? "focus sessions" : "notes"} on <span className="font-semibold text-text-primary">{insights.activeThisWeek} days</span> this week.
          </p>
        </div>

        <div className="mt-3 text-xs text-text-muted">Click any day to open Tasks filtered by that date.</div>
      </CardContent>
    </Card>
  );
}
