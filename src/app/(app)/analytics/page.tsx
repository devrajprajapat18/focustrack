"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, CheckCheck, Flame, Notebook, Timer, ListTodo, TrendingUp, Hourglass } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import type { AnalyticsStats } from "@/lib/types";
import { percent } from "@/lib/format";
import { WeeklyActivityChart } from "@/components/charts/weekly-activity-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const metricStyles = [
  "from-sky-500/15 to-sky-500/5 text-sky-600",
  "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
  "from-indigo-500/15 to-indigo-500/5 text-indigo-600",
  "from-amber-500/15 to-amber-500/5 text-amber-600",
  "from-violet-500/15 to-violet-500/5 text-violet-600",
  "from-rose-500/15 to-rose-500/5 text-rose-600",
  "from-cyan-500/15 to-cyan-500/5 text-cyan-600",
  "from-orange-500/15 to-orange-500/5 text-orange-600",
] as const;

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: () => fetcher<AnalyticsStats>("/api/analytics/stats"),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array.from({ length: 8 })].map((_, i) => (
            <Skeleton className="h-28" key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Skeleton className="h-[360px]" />
          <Skeleton className="h-[360px]" />
        </div>
        <Skeleton className="h-60" />
      </div>
    );
  }

  const metrics = [
    { title: "Total Tasks", value: data.totalTasks, icon: ListTodo },
    { title: "Completed", value: data.completedTasks, icon: CheckCheck },
    { title: "Completion Rate", value: percent(data.completionRate), icon: TrendingUp },
    { title: "Current Streak", value: `${data.currentStreak} days`, icon: Flame },
    { title: "Longest Streak", value: `${data.longestStreak} days`, icon: BarChart3 },
    { title: "Focus Sessions", value: data.focusSessions, icon: Timer },
    { title: "Total Notes", value: data.totalNotes, icon: Notebook },
    { title: "Focus Hours", value: `${data.focusHours}h`, icon: Hourglass },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_30%,var(--surface))_0%,color-mix(in_oklab,var(--secondary)_18%,var(--surface))_100%)] p-6 text-text-primary shadow-xl md:p-8">
        <div className="absolute -right-14 -top-14 size-52 rounded-full bg-primary/20 blur-2xl" />
        <div className="absolute -bottom-20 left-1/4 size-56 rounded-full bg-secondary/20 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-text-secondary">Productivity Insights</p>
            <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Analytics Dashboard</h1>
            <p className="mt-3 max-w-2xl text-base text-text-secondary md:text-lg">
              Your progress across tasks, focus, and notes in one view. Keep an eye on trends and build momentum every day.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-surface/70 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Completion Rate</p>
              <p className="mt-1 text-2xl font-semibold">{percent(data.completionRate)}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-surface/70 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Focus Time</p>
              <p className="mt-1 text-2xl font-semibold">{data.focusHours}h</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, index) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="overflow-hidden border-border/80">
              <CardContent className="relative p-0">
                <div className={cn("absolute inset-0 bg-gradient-to-br", metricStyles[index % metricStyles.length])} />
                <div className="relative flex items-start justify-between p-5">
                  <div>
                    <p className="text-sm text-text-secondary">{item.title}</p>
                    <p className="mt-2 text-4xl font-semibold leading-none text-text-primary">{item.value}</p>
                  </div>
                  <div className="grid size-11 place-items-center rounded-xl bg-surface/90 shadow-sm ring-1 ring-border">
                    <Icon className="size-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.5fr_1fr]">
        <WeeklyActivityChart data={data.weeklyActivity} />
        <CategoryPieChart data={data.tasksByCategory} />
      </section>

      <ActivityHeatmap data={data.heatmap} />
    </motion.div>
  );
}
