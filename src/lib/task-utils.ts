import { isToday, isTomorrow, isPast, startOfDay, compareAsc, differenceInDays } from "date-fns";
import type { TaskItem } from "@/lib/types";

export type TaskGroupKey = "today" | "tomorrow" | "upcoming" | "overdue" | "completed";

export interface GroupedTasks {
  today: TaskItem[];
  tomorrow: TaskItem[];
  upcoming: TaskItem[];
  overdue: TaskItem[];
  completed: TaskItem[];
}

export function groupTasksByDate(tasks: TaskItem[]): GroupedTasks {
  const grouped: GroupedTasks = {
    today: [],
    tomorrow: [],
    upcoming: [],
    overdue: [],
    completed: [],
  };

  const now = new Date();
  const today = startOfDay(now);

  tasks.forEach((task) => {
    if (task.completed) {
      grouped.completed.push(task);
      return;
    }

    if (!task.dueDate) {
      grouped.upcoming.push(task);
      return;
    }

    const dueDate = new Date(task.dueDate);
    const dueDateStart = startOfDay(dueDate);

    if (isToday(dueDateStart)) {
      grouped.today.push(task);
    } else if (isTomorrow(dueDateStart)) {
      grouped.tomorrow.push(task);
    } else if (isPast(dueDateStart) && compareAsc(dueDateStart, today) < 0) {
      grouped.overdue.push(task);
    } else {
      grouped.upcoming.push(task);
    }
  });

  // Sort each group by priority and creation date
  const sortByPriority = (a: TaskItem, b: TaskItem) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const aPriority = priorityOrder[a.priority] || 999;
    const bPriority = priorityOrder[b.priority] || 999;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };

  Object.keys(grouped).forEach((key) => {
    grouped[key as TaskGroupKey].sort(sortByPriority);
  });

  return grouped;
}

export function getTasksForDate(tasks: TaskItem[], selectedDate: Date): TaskItem[] {
  const dateStart = startOfDay(selectedDate);
  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    return compareAsc(startOfDay(new Date(task.dueDate)), dateStart) === 0;
  });
}

export function getGroupLabel(key: TaskGroupKey, count: number): string {
  const labels: Record<TaskGroupKey, string> = {
    today: "Today",
    tomorrow: "Tomorrow",
    upcoming: "Upcoming",
    overdue: "Overdue",
    completed: "Completed",
  };
  return `${labels[key]} (${count})`;
}

export function getGroupIcon(key: TaskGroupKey): string {
  const icons: Record<TaskGroupKey, string> = {
    today: "📅",
    tomorrow: "⏳",
    upcoming: "🔜",
    overdue: "⚠️",
    completed: "✅",
  };
  return icons[key];
}

export function getDaysUntilDue(dueDate: string | null | undefined): number | null {
  if (!dueDate) return null;
  return differenceInDays(new Date(dueDate), new Date());
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    HIGH: "text-red-600 dark:text-red-400",
    MEDIUM: "text-amber-600 dark:text-amber-400",
    LOW: "text-green-600 dark:text-green-400",
  };
  return colors[priority] || "text-text-primary";
}

export function getPriorityBgColor(priority: string): string {
  const colors: Record<string, string> = {
    HIGH: "bg-red-100 dark:bg-red-950",
    MEDIUM: "bg-amber-100 dark:bg-amber-950",
    LOW: "bg-green-100 dark:bg-green-950",
  };
  return colors[priority] || "bg-divider";
}
