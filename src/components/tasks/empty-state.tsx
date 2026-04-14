"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "🎉",
  title = "No tasks yet",
  description = "Create your first task to get started!",
  actionLabel = "Add Task",
  onAction,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="grid h-64 place-items-center text-center">
        <div className="space-y-4">
          <div className="text-6xl">{icon}</div>
          <div>
            <h3 className="font-semibold text-text-primary">{title}</h3>
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          </div>
          {onAction && (
            <Button onClick={onAction} size="sm">
              {actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
