"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Search, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetcher, mutateJson } from "@/lib/fetcher";
import { formatDueDate } from "@/lib/format";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "@/lib/constants";
import type { TaskItem, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

const priorityVariant: Record<Priority, "success" | "warning" | "danger"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
};

function SortableTask({
  task,
  onToggle,
  onDelete,
}: {
  task: TaskItem;
  onToggle: (task: TaskItem) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task)}
            className="mt-1 size-5 rounded border-border accent-secondary"
          />
          <div>
            <p className={cn("font-semibold", task.completed && "line-through text-text-muted")}>{task.title}</p>
            <p className="text-sm text-text-secondary">{task.category}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
              <Calendar className="size-3" />
              {formatDueDate(task.dueDate)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
          <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor));

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    category: "Work",
    priority: "MEDIUM" as Priority,
    dueDate: "",
  });

  const { data = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetcher<TaskItem[]>("/api/tasks"),
  });

  const createTask = useMutation({
    mutationFn: () =>
      mutateJson<TaskItem>("/api/tasks", "POST", {
        title: newTask.title,
        category: newTask.category,
        priority: newTask.priority,
        dueDate: newTask.dueDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
      setShowForm(false);
      setNewTask({ title: "", category: "Work", priority: "MEDIUM", dueDate: "" });
      toast.success("Task created");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create task");
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TaskItem> }) =>
      mutateJson<TaskItem>(`/api/tasks/${id}`, "PUT", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => mutateJson<{ ok: true }>(`/api/tasks/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
      toast.success("Task removed");
    },
  });

  const filtered = useMemo(() => {
    return data.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || task.category === categoryFilter;
      const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [data, search, categoryFilter, priorityFilter]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = filtered.findIndex((item) => item.id === active.id);
    const newIndex = filtered.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const moved = arrayMove(filtered, oldIndex, newIndex);
    moved.forEach((task, index) => {
      if (task.order !== index) {
        updateTask.mutate({ id: task.id, payload: { order: index } });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-semibold">Tasks</h1>
          <p className="mt-2 text-xl text-text-secondary">
            {data.filter((task) => !task.completed).length} pending · {data.filter((task) => task.completed).length} completed
          </p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)}>
          <Plus className="size-4" /> Add Task
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input placeholder="Search tasks..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select className="h-11 rounded-xl border border-border bg-surface px-3" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="All">All Categories</option>
          {TASK_CATEGORIES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select className="h-11 rounded-xl border border-border bg-surface px-3" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
          <option value="All">All Priorities</option>
          {TASK_PRIORITIES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </section>

      {showForm && (
        <Card>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Task title"
              value={newTask.title}
              onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))}
            />
            <select className="h-11 rounded-xl border border-border bg-surface px-3" value={newTask.category} onChange={(event) => setNewTask((prev) => ({ ...prev, category: event.target.value }))}>
              {TASK_CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select className="h-11 rounded-xl border border-border bg-surface px-3" value={newTask.priority} onChange={(event) => setNewTask((prev) => ({ ...prev, priority: event.target.value as Priority }))}>
              {TASK_PRIORITIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <Input type="date" value={newTask.dueDate} onChange={(event) => setNewTask((prev) => ({ ...prev, dueDate: event.target.value }))} />
            <div className="md:col-span-2 lg:col-span-4">
              <Button disabled={!newTask.title || createTask.isPending} onClick={() => createTask.mutate()}>
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={filtered.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filtered.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onToggle={(item) => updateTask.mutate({ id: item.id, payload: { completed: !item.completed } })}
                  onDelete={(id) => deleteTask.mutate(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="grid h-44 place-items-center text-xl text-text-secondary">No tasks yet. Create your first task!</CardContent>
        </Card>
      )}
    </div>
  );
}
