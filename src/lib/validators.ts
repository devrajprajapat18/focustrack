import { z } from "zod";
import { TASK_PRIORITIES } from "@/lib/constants";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(64),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
});

export const taskSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().max(500).optional().nullable(),
  category: z.string().min(2).max(32),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  pinned: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const noteSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1),
  tags: z.array(z.string().max(32)).optional(),
  pinned: z.boolean().optional(),
});

export const pomodoroSessionSchema = z.object({
  mode: z.enum(["focus", "break"]),
  duration: z.number().int().positive().max(3600),
});
