"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCheck, Flame, Notebook, Timer, ListTodo, TrendingUp, Hourglass } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import type { AnalyticsStats } from "@/lib/types";
import { percent } from "@/lib/format";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyActivityChart } from "@/components/charts/weekly-activity-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: () => fetcher<AnalyticsStats>("/api/analytics/stats"),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array.from({ length: 8 })].map((_, i) => (
            <Skeleton className="h-28" key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-5xl font-semibold">Analytics</h1>
        <p className="mt-2 text-xl text-text-secondary">Track your productivity over time.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Tasks" value={data.totalTasks} icon={ListTodo} iconClassName="bg-primary" />
        <StatCard title="Completed" value={data.completedTasks} icon={CheckCheck} iconClassName="bg-secondary" />
        <StatCard title="Completion Rate" value={percent(data.completionRate)} icon={TrendingUp} iconClassName="bg-primary" />
        <StatCard title="Current Streak" value={`${data.currentStreak} days`} icon={Flame} iconClassName="bg-accent" />
        <StatCard title="Longest Streak" value={`${data.longestStreak} days`} icon={BarChart3} iconClassName="bg-primary" />
        <StatCard title="Focus Sessions" value={data.focusSessions} icon={Timer} iconClassName="bg-secondary" />
        <StatCard title="Total Notes" value={data.totalNotes} icon={Notebook} iconClassName="bg-primary" />
        <StatCard title="Focus Hours" value={`${data.focusHours}h`} icon={Hourglass} iconClassName="bg-accent" />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <WeeklyActivityChart data={data.weeklyActivity} />
        <CategoryPieChart data={data.tasksByCategory} />
      </section>

      <ActivityHeatmap data={data.heatmap} />
    </div>
  );
}
