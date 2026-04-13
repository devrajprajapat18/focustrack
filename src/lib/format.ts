import { format, isToday, isTomorrow } from "date-fns";

export function formatDueDate(value?: string | null) {
  if (!value) {
    return "No due date";
  }

  const date = new Date(value);
  if (isToday(date)) {
    return "Today";
  }

  if (isTomorrow(date)) {
    return "Tomorrow";
  }

  return format(date, "MMM d");
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}
