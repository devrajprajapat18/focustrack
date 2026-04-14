"use client";

import { CheckCircle2, Trash2, Pin, PinOff, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDueDate } from "@/lib/format";
import { getPriorityColor, getPriorityBgColor, getDaysUntilDue } from "@/lib/task-utils";
import type { TaskItem, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: TaskItem;
  onToggle: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  isDragHandle?: boolean;
  dragHandle?: React.ReactNode;
}

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onPin,
  dragHandle,
}: TaskCardProps) {
  const daysUntil = getDaysUntilDue(task.dueDate);
  const isOverdue = daysUntil !== null && daysUntil < 0 && !task.completed;
  const priorityColor = getPriorityColor(task.priority);
  const priorityBgColor = getPriorityBgColor(task.priority);

  const priorityBadgeVariants: Record<Priority, "success" | "warning" | "danger"> = {
    LOW: "success",
    MEDIUM: "warning",
    HIGH: "danger",
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        task.completed && "opacity-60",
        task.pinned && "ring-2 ring-primary/50"
      )}
    >
      <CardContent className="flex items-start gap-3 py-4">
        {dragHandle}

        <button
          type="button"
          className="mt-1 flex-shrink-0"
          onClick={() => onToggle(task)}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="Toggle task"
        >
          <CheckCircle2
            className={cn(
              "size-5 transition-colors",
              task.completed
                ? "text-success fill-success"
                : "text-text-muted hover:text-text-primary"
            )}
          />
        </button>

        <div className="flex-grow">
          <h3
            className={cn(
              "font-semibold leading-tight",
              task.completed && "line-through text-text-muted"
            )}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1 text-sm text-text-secondary">{task.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="muted" className="bg-surface">
              {task.category}
            </Badge>

            {task.dueDate && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  isOverdue && "text-error"
                )}
              >
                {isOverdue && <AlertCircle className="size-3" />}
                <Calendar className="size-3" />
                <span>{formatDueDate(task.dueDate)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge
            variant={priorityBadgeVariants[task.priority]}
            className={cn(priorityBgColor, priorityColor)}
          >
            {task.priority}
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onPin(task.id, !task.pinned)}
            title={task.pinned ? "Unpin" : "Pin"}
          >
            {task.pinned ? (
              <PinOff className="size-4" />
            ) : (
              <Pin className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onDelete(task.id)}
            className="text-error hover:text-error"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
