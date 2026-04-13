"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCheck, Clock3, Flame, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { fetcher } from "@/lib/fetcher";
import { percent } from "@/lib/format";
import type { AnalyticsStats } from "@/lib/types";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyActivityChart } from "@/components/charts/weekly-activity-chart";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: () => fetcher<AnalyticsStats>("/api/analytics/stats"),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-80" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array.from({ length: 4 })].map((_, i) => (
            <Skeleton className="h-28" key={i} />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-5xl font-semibold">Good Morning! 👋</h1>
        <p className="mt-2 text-xl text-text-secondary">Here&apos;s your productivity overview for today.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Completed Today" value={data.completedTasks} icon={CheckCheck} iconClassName="bg-secondary" />
        <StatCard title="Pending" value={data.totalTasks - data.completedTasks} icon={Clock3} iconClassName="bg-primary" />
        <StatCard title="Current Streak" value={`${data.currentStreak} 🔥`} icon={Flame} iconClassName="bg-accent" />
        <StatCard title="Completion Rate" value={percent(data.completionRate)} icon={TrendingUp} iconClassName="bg-primary" />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
        <WeeklyActivityChart data={data.weeklyActivity} />

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Total Tasks", `${data.totalTasks} created`],
              ["Notes", `${data.totalNotes} saved`],
              ["Longest Streak", `${data.longestStreak} days`],
              ["Focus Sessions", `${data.focusSessions} completed`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-divider p-4">
                <p className="font-semibold text-text-primary">{label}</p>
                <p className="text-sm text-text-secondary">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}
