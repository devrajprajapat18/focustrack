import { NextRequest } from "next/server";
import { addDays, eachDayOfInterval, format, subDays } from "date-fns";
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
  const heatmapStart = subDays(today, 364);
  const heatmapEndExclusive = addDays(today, 1);

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
    heatmapFocusSessions,
    heatmapNotes,
  ] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, completed: true } }),
    prisma.note.count({ where: { userId } }),
    prisma.pomodoroSession.count({ where: { userId, mode: "focus" } }),
    prisma.pomodoroSession.aggregate({ where: { userId, mode: "focus" }, _sum: { duration: true } }),
    prisma.task.groupBy({ by: ["category"], where: { userId }, _count: { _all: true } }),
    prisma.task.findMany({ where: { userId, createdAt: { gte: last7 } }, select: { createdAt: true } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.task.findMany({ where: { userId, completed: true, completedAt: { gte: heatmapStart, lt: heatmapEndExclusive } }, select: { completedAt: true } }),
    prisma.pomodoroSession.findMany({ where: { userId, mode: "focus", createdAt: { gte: heatmapStart, lt: heatmapEndExclusive } }, select: { createdAt: true } }),
    prisma.note.findMany({ where: { userId, createdAt: { gte: heatmapStart, lt: heatmapEndExclusive } }, select: { createdAt: true } }),
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

  const tasksByDay = new Map<string, number>();
  heatmapTasks.forEach((task) => {
    if (!task.completedAt) {
      return;
    }
    const day = format(task.completedAt, "yyyy-MM-dd");
    tasksByDay.set(day, (tasksByDay.get(day) || 0) + 1);
  });

  const focusByDay = new Map<string, number>();
  heatmapFocusSessions.forEach((session) => {
    const day = format(session.createdAt, "yyyy-MM-dd");
    focusByDay.set(day, (focusByDay.get(day) || 0) + 1);
  });

  const notesByDay = new Map<string, number>();
  heatmapNotes.forEach((note) => {
    const day = format(note.createdAt, "yyyy-MM-dd");
    notesByDay.set(day, (notesByDay.get(day) || 0) + 1);
  });

  const heatmap = eachDayOfInterval({ start: heatmapStart, end: today }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    return {
      date,
      tasksCompleted: tasksByDay.get(date) || 0,
      focusSessions: focusByDay.get(date) || 0,
      notesCreated: notesByDay.get(date) || 0,
    };
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
