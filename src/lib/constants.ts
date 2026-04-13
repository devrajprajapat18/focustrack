export const TASK_CATEGORIES = [
  "Work",
  "Personal",
  "Health",
  "Learning",
  "Finance",
  "Other",
] as const;

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Tasks", href: "/tasks", icon: "CheckSquare" },
  { label: "Notes", href: "/notes", icon: "Notebook" },
  { label: "Pomodoro", href: "/pomodoro", icon: "Timer" },
  { label: "Analytics", href: "/analytics", icon: "BarChart3" },
] as const;
