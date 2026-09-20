"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCheck,
  Clock3,
  Flame,
  Notebook,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isToday, isYesterday, startOfDay, subDays } from "date-fns";
import { fetcher } from "@/lib/fetcher";
import { percent } from "@/lib/format";
import type { AnalyticsStats, NoteItem, PomodoroSessionItem, TaskItem, UserSession } from "@/lib/types";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeeklyActivityChart } from "@/components/charts/weekly-activity-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  title: string;
  time: Date;
  tone: "task" | "note" | "focus";
};

function getGreetingByTime(hour: number) {
  if (hour < 12) {
    return {
      title: "Good Morning",
      context: "Plan your day and lock in your most important task first.",
    };
  }

  if (hour < 18) {
    return {
      title: "Good Afternoon",
      context: "Keep momentum going. Finish one high-impact task in this block.",
    };
  }

  return {
    title: "Good Evening",
    context: "Review your progress and close the day with intention.",
  };
}

export default function DashboardPage() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: () => fetcher<AnalyticsStats>("/api/analytics/stats"),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetcher<TaskItem[]>("/api/tasks"),
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => fetcher<NoteItem[]>("/api/notes"),
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["pomodoro-sessions", "dashboard"],
    queryFn: () => fetcher<PomodoroSessionItem[]>("/api/pomodoro/sessions"),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => fetcher<UserSession>("/api/auth/me"),
  });

  const isLoading = analyticsLoading || tasksLoading || notesLoading || sessionsLoading;

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-44 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array.from({ length: 8 })].map((_, i) => (
            <Skeleton className="h-28" key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const greeting = getGreetingByTime(now.getHours());

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  const dueToday = pendingTasks.filter((task) => task.dueDate && isToday(new Date(task.dueDate)));
  const overdue = pendingTasks.filter((task) => task.dueDate && new Date(task.dueDate) < todayStart);
  const highPriorityPending = pendingTasks.filter((task) => task.priority === "HIGH");
  const missedYesterday = pendingTasks.filter((task) => task.dueDate && isYesterday(new Date(task.dueDate)));

  const focusTodaySeconds = sessions
    .filter((session) => session.mode === "focus" && isToday(new Date(session.createdAt)))
    .reduce((sum, session) => sum + session.duration, 0);
  const focusTodayMinutes = Math.floor(focusTodaySeconds / 60);

  const topFocusTasks = [...pendingTasks]
    .sort((a, b) => {
      const overdueA = a.dueDate ? new Date(a.dueDate) < todayStart : false;
      const overdueB = b.dueDate ? new Date(b.dueDate) < todayStart : false;
      if (overdueA !== overdueB) {
        return overdueA ? -1 : 1;
      }

      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const priorityA = priorityOrder[a.priority];
      const priorityB = priorityOrder[b.priority];
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      return a.dueDate ? -1 : 1;
    })
    .slice(0, 3);

  const thisWeekCompleted = completedTasks.filter((task) => {
    if (!task.completedAt) {
      return false;
    }
    return new Date(task.completedAt) >= subDays(todayStart, 6);
  }).length;

  const prevWeekCompleted = completedTasks.filter((task) => {
    if (!task.completedAt) {
      return false;
    }
    const completed = new Date(task.completedAt);
    return completed >= subDays(todayStart, 13) && completed < subDays(todayStart, 6);
  }).length;

  const improvement = prevWeekCompleted > 0
    ? Math.round(((thisWeekCompleted - prevWeekCompleted) / prevWeekCompleted) * 100)
    : thisWeekCompleted > 0
      ? 100
      : 0;

  const mostProductiveDay = analytics.weeklyActivity.reduce(
    (best, day) => (day.count > best.count ? day : best),
    analytics.weeklyActivity[0] || { day: "Mon", count: 0 },
  );

  const consistencyDays = analytics.weeklyActivity.filter((day) => day.count > 0).length;
  const productivityScore = Math.min(
    100,
    Math.round(
      analytics.completionRate * 0.4 +
        Math.min(analytics.currentStreak * 2.5, 25) +
        Math.min((focusTodayMinutes / 90) * 20, 20) +
        Math.min((consistencyDays / 7) * 15, 15),
    ),
  );

  const motivation =
    productivityScore >= 80
      ? "Excellent pace. Protect your momentum today."
      : productivityScore >= 60
        ? "Solid progress. One focused session can push you ahead."
        : "Small wins count. Complete one high-priority task to build momentum.";

  const activityFeed: ActivityItem[] = [
    ...completedTasks
      .filter((task) => task.completedAt)
      .map((task) => ({
        id: `task-${task.id}`,
        title: `Completed \"${task.title}\"`,
        time: new Date(task.completedAt as string),
        tone: "task" as const,
      })),
    ...notes.map((note) => ({
      id: `note-${note.id}`,
      title: `Updated note \"${note.title}\"`,
      time: new Date(note.updatedAt),
      tone: "note" as const,
    })),
    ...sessions
      .filter((session) => session.mode === "focus")
      .map((session) => ({
        id: `focus-${session.id}`,
        title: `Finished ${Math.round(session.duration / 60)} min focus session`,
        time: new Date(session.createdAt),
        tone: "focus" as const,
      })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 6);

  const showEmptyState = tasks.length === 0 && notes.length === 0 && sessions.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(130deg,color-mix(in_oklab,var(--primary)_20%,var(--surface))_0%,color-mix(in_oklab,var(--secondary)_12%,var(--surface))_100%)] p-6 shadow-lg md:p-8">
        <div className="absolute -right-16 -top-16 size-52 rounded-full bg-primary/20 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 size-60 rounded-full bg-secondary/15 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-4xl font-semibold md:text-5xl">{greeting.title}, {currentUser?.name || "there"} 👋</h1>
          <p className="mt-2 text-lg text-text-secondary">{greeting.context}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/70 px-3 py-1.5 text-sm text-text-secondary">
            <Sparkles className="size-4 text-primary" />
            {motivation}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Card className="border-border/80 shadow-md transition-transform hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>Focus for Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topFocusTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-divider/70 p-5 text-sm text-text-secondary">
                Start your day by adding a task. Your next best action will appear here.
              </div>
            ) : (
              topFocusTasks.map((task) => {
                const overdueTask = task.dueDate ? new Date(task.dueDate) < todayStart : false;
                const dueTodayTask = task.dueDate ? isToday(new Date(task.dueDate)) : false;

                return (
                  <div key={task.id} className="rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-divider/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary">{task.title}</p>
                        <p className="mt-1 text-sm text-text-secondary">{task.category}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {task.priority === "HIGH" && <Badge variant="danger">High Priority</Badge>}
                        {overdueTask && <Badge variant="warning">Overdue</Badge>}
                        {dueTodayTask && <Badge variant="default">Due Today</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-md transition-transform hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>Backlog Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-warning" />
                <p className="text-lg font-semibold text-text-primary">{overdue.length} overdue tasks</p>
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                Clear overdue items first to reduce backlog pressure and recover momentum.
              </p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-text-secondary">
              <p>
                Due today: <span className="font-semibold text-text-primary">{dueToday.length}</span>
              </p>
              <p>
                High priority pending: <span className="font-semibold text-text-primary">{highPriorityPending.length}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Completed" value={analytics.completedTasks} icon={CheckCheck} iconClassName="bg-secondary" />
        <StatCard title="Pending" value={analytics.totalTasks - analytics.completedTasks} icon={Clock3} iconClassName="bg-primary" />
        <StatCard title="Current Streak" value={`${analytics.currentStreak} 🔥`} icon={Flame} iconClassName="bg-accent" />
        <StatCard title="Completion Rate" value={percent(analytics.completionRate)} icon={TrendingUp} iconClassName="bg-primary" />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="flex min-h-0 min-w-0 flex-col gap-5">
          <WeeklyActivityChart data={analytics.weeklyActivity} />

          <Card className="border-border/80 shadow-md">
            <CardHeader>
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-text-secondary">
              <p>
                <span className={cn("font-semibold", improvement >= 0 ? "text-secondary" : "text-error")}>
                  {improvement >= 0 ? "📈" : "📉"} {Math.abs(improvement)}%
                </span>{" "}
                {improvement >= 0 ? "improvement" : "drop"} compared to last week.
              </p>
              <p>
                🔥 Most productive day this week: <span className="font-semibold text-text-primary">{mostProductiveDay.day}</span>
              </p>
              <p>
                ⚠️ You missed <span className="font-semibold text-text-primary">{missedYesterday.length}</span> tasks yesterday.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80 shadow-md">
          <CardHeader>
            <CardTitle>Smart Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Tasks Due Today", `${dueToday.length} tasks`],
              ["Overdue", `${overdue.length} tasks`],
              ["Focus Today", `${focusTodayMinutes} min`],
              ["Notes This Week", `${notes.filter((note) => new Date(note.createdAt) >= subDays(todayStart, 6)).length} notes`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border/70 bg-divider/70 p-4">
                <p className="font-semibold text-text-primary">{label}</p>
                <p className="text-sm text-text-secondary">{value}</p>
              </div>
            ))}

            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-text-primary">Productivity Score</p>
                <Target className="size-4 text-primary" />
              </div>
              <p className="mt-1 text-3xl font-semibold text-primary">{productivityScore}/100</p>
              <p className="mt-2 text-xs text-text-secondary">
                Based on completion rate, consistency, focus time, and current streak.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/80 shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activityFeed.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-divider/60 p-4 text-sm text-text-secondary">
                No activity yet, let&apos;s build consistency 🔥
              </div>
            ) : (
              activityFeed.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-surface p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block size-2.5 rounded-full",
                        item.tone === "task" && "bg-secondary",
                        item.tone === "note" && "bg-primary",
                        item.tone === "focus" && "bg-accent",
                      )}
                    />
                    <p className="text-sm text-text-primary">{item.title}</p>
                  </div>
                  <p className="text-xs text-text-muted">{format(item.time, "MMM d, HH:mm")}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-md">
          <CardHeader>
            <CardTitle>Today&apos;s Focus Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-secondary">
            <div className="flex items-center justify-between rounded-xl bg-divider/70 p-3">
              <span className="inline-flex items-center gap-2"><Clock3 className="size-4" /> Pending</span>
              <span className="font-semibold text-text-primary">{pendingTasks.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-divider/70 p-3">
              <span className="inline-flex items-center gap-2"><Timer className="size-4" /> Focus minutes</span>
              <span className="font-semibold text-text-primary">{focusTodayMinutes}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-divider/70 p-3">
              <span className="inline-flex items-center gap-2"><Notebook className="size-4" /> Notes total</span>
              <span className="font-semibold text-text-primary">{analytics.totalNotes}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {showEmptyState && (
        <Card className="border-dashed border-border/80 bg-divider/50 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-semibold text-text-primary">Welcome to your productivity cockpit</p>
            <p className="mt-2 text-sm text-text-secondary">Start your day by adding a task and running one focus session. Your insights will appear here automatically.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
