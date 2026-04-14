"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { TaskCard } from "./task-card";
import type { TaskItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskGroupProps {
  title: string;
  icon: string;
  tasks: TaskItem[];
  onToggle: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  dragHandle?: (id: string) => React.ReactNode;
  defaultExpanded?: boolean;
  isOverdue?: boolean;
}

export function TaskGroup({
  title,
  icon,
  tasks,
  onToggle,
  onDelete,
  onPin,
  dragHandle,
  defaultExpanded = true,
  isOverdue,
}: TaskGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (tasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mt-6 first:mt-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-4 py-3 transition-colors",
            isOverdue ? "bg-error/10 hover:bg-error/15" : "bg-divider hover:bg-divider/80"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <h2 className={cn("font-semibold", isOverdue && "text-error")}>{title}</h2>
          </div>
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onPin={onPin}
                dragHandle={dragHandle?.(task.id)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
