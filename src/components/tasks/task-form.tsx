"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "@/lib/constants";
import type { Priority } from "@/lib/types";

interface TaskFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    category: string;
    priority: Priority;
    dueDate?: string;
  }) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function TaskForm({ onSubmit, isLoading, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Work");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      dueDate: dueDate || undefined,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setCategory("Work");
    setPriority("MEDIUM");
    setDueDate("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Create New Task</CardTitle>
        {onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Task title (required)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            className="font-semibold"
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="min-h-20 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"
            >
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              disabled={isLoading}
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"
            >
              {TASK_PRIORITIES.map((pri) => (
                <option key={pri} value={pri}>
                  {pri}
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isLoading}
              className="h-11"
            />

            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="h-11"
            >
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
