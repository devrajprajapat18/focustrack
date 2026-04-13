import { NextRequest } from "next/server";
import { subDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";

export async function GET(request: NextRequest) {
  const auth = await requireRequestUser(request);
  if ("error" in auth) {
    return auth.error;
  }

  const userId = auth.session.id;
  const today = new Date();
  const last7 = subDays(today, 6);
  const last90 = subDays(today, 89);

  const [
    totalTasks,
    completedTasks,
    notesCount,
    focusSessions,
    focusSum,
    byCategory,
    weeklyTasks,
    user,
    heatmapTasks,
  ] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, completed: true } }),
    prisma.note.count({ where: { userId } }),
    prisma.pomodoroSession.count({ where: { userId, mode: "focus" } }),
    prisma.pomodoroSession.aggregate({ where: { userId, mode: "focus" }, _sum: { duration: true } }),
    prisma.task.groupBy({ by: ["category"], where: { userId }, _count: { _all: true } }),
    prisma.task.findMany({ where: { userId, createdAt: { gte: last7 } }, select: { createdAt: true } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.task.findMany({ where: { userId, createdAt: { gte: last90 } }, select: { createdAt: true } }),
  ]);

  const completionRate = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
  const byDayMap = new Map<string, number>();

  for (let i = 0; i < 7; i += 1) {
    const date = subDays(today, 6 - i);
    byDayMap.set(format(date, "EEE"), 0);
  }

  weeklyTasks.forEach((task) => {
    const day = format(task.createdAt, "EEE");
    byDayMap.set(day, (byDayMap.get(day) || 0) + 1);
  });

  const heatmapMap = new Map<string, number>();
  heatmapTasks.forEach((task) => {
    const day = format(task.createdAt, "yyyy-MM-dd");
    heatmapMap.set(day, (heatmapMap.get(day) || 0) + 1);
  });

  const heatmap = Array.from({ length: 90 }, (_, index) => {
    const date = format(subDays(today, 89 - index), "yyyy-MM-dd");
    return { date, count: heatmapMap.get(date) || 0 };
  });

  return apiSuccess({
    totalTasks,
    completedTasks,
    completionRate,
    currentStreak: user?.loginStreak || 1,
    longestStreak: user?.longestStreak || 1,
    focusSessions,
    totalNotes: notesCount,
    focusHours: Number(((focusSum._sum.duration || 0) / 3600).toFixed(1)),
    weeklyActivity: Array.from(byDayMap.entries()).map(([day, count]) => ({ day, count })),
    tasksByCategory: byCategory.map((item) => ({ name: item.category, value: item._count._all })),
    heatmap,
  });
}
