export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface UserSession {
  id: string;
  email: string;
  name: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  priority: Priority;
  dueDate?: string | null;
  completed: boolean;
  completedAt?: string | null;
  pinned: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroSessionItem {
  id: string;
  mode: "focus" | "break";
  duration: number;
  createdAt: string;
}

export interface AnalyticsStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  focusSessions: number;
  totalNotes: number;
  focusHours: number;
  weeklyActivity: { day: string; count: number }[];
  tasksByCategory: { name: string; value: number }[];
  heatmap: { date: string; tasksCompleted: number; focusSessions?: number; notesCreated?: number }[];
}
