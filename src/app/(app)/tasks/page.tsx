"use client";

import { useState, useMemo } from "react";
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
import { Plus, GripVertical, List, CalendarDays, Columns3 } from "lucide-react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  format,
} from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher, mutateJson } from "@/lib/fetcher";
import type { TaskItem, Priority } from "@/lib/types";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskFiltersBar, type TaskFilters } from "@/components/tasks/task-filters";
import { TaskGroup } from "@/components/tasks/task-group";
import { EmptyState } from "@/components/tasks/empty-state";
import {
  groupTasksByDate,
  getGroupLabel,
  getGroupIcon,
  getTasksForDate,
} from "@/lib/task-utils";

function SortableDragHandle({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef } = useSortable({ id });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className="rounded-lg p-1 text-text-muted hover:bg-divider hover:text-text-primary transition-colors"
      aria-label="Drag task"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor));

  const [view, setView] = useState<"list" | "calendar" | "board">("list");
  const [showForm, setShowForm] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | undefined>(undefined);
  const [filters, setFilters] = useState<TaskFilters>({
    search: "",
    category: "All",
    priority: "All",
    status: "all",
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetcher<TaskItem[]>("/api/tasks"),
  });

  // Create task mutation
  const createTask = useMutation({
    mutationFn: (taskData: {
      title: string;
      description?: string;
      category: string;
      priority: Priority;
      dueDate?: string;
    }) => mutateJson<TaskItem>("/api/tasks", "POST", taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
      setShowForm(false);
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create task");
    },
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TaskItem> }) =>
      mutateJson<TaskItem>(`/api/tasks/${id}`, "PUT", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
    },
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: (id: string) => mutateJson<{ ok: true }>(`/api/tasks/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
      toast.success("Task deleted");
    },
  });

  // Filter tasks based on active filters
  const filteredTasks = useMemo(() => {
    let result = data;

    // Search filter
    if (filters.search) {
      result = result.filter((task) =>
        task.title.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Category filter
    if (filters.category !== "All") {
      result = result.filter((task) => task.category === filters.category);
    }

    // Priority filter
    if (filters.priority !== "All") {
      result = result.filter((task) => task.priority === filters.priority);
    }

    // Status filter
    if (filters.status === "active") {
      result = result.filter((task) => !task.completed);
    } else if (filters.status === "completed") {
      result = result.filter((task) => task.completed);
    }

    // Date filter
    if (filters.selectedDate) {
      result = getTasksForDate(result, filters.selectedDate);
    }

    return result;
  }, [data, filters]);

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    if (filters.selectedDate) {
      // If a specific date is selected, don't group
      return { active: filteredTasks, completed: [] };
    }
    const grouped = groupTasksByDate(filteredTasks);
    return {
      active: [
        ...grouped.overdue,
        ...grouped.today,
        ...grouped.tomorrow,
        ...grouped.upcoming,
      ],
      completed: grouped.completed,
    };
  }, [filteredTasks, filters.selectedDate]);

  // Pinned tasks
  const pinnedTasks = useMemo(
    () => groupedTasks.active.filter((task) => task.pinned),
    [groupedTasks]
  );

  const activeTasks = useMemo(
    () => groupedTasks.active.filter((task) => !task.pinned),
    [groupedTasks]
  );

  const completedTasks = groupedTasks.completed;
  const groupedActive = useMemo(() => groupTasksByDate(activeTasks), [activeTasks]);

  const boardColumns = useMemo(() => {
    return {
      todo: [...groupedActive.upcoming, ...groupedActive.tomorrow],
      inProgress: [...groupedActive.today, ...groupedActive.overdue],
      done: completedTasks,
    };
  }, [groupedActive, completedTasks]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const monthTaskCount = useMemo(() => {
    const map = new Map<string, number>();
    filteredTasks.forEach((task) => {
      if (!task.dueDate) {
        return;
      }
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [filteredTasks]);

  const calendarTasks = useMemo(() => {
    if (!calendarSelectedDate) {
      return [] as TaskItem[];
    }
    return filteredTasks.filter((task) => {
      if (!task.dueDate) {
        return false;
      }
      return format(new Date(task.dueDate), "yyyy-MM-dd") === format(calendarSelectedDate, "yyyy-MM-dd");
    });
  }, [filteredTasks, calendarSelectedDate]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const allActive = [...pinnedTasks, ...activeTasks];
    const oldIndex = allActive.findIndex((item) => item.id === active.id);
    const newIndex = allActive.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const moved = arrayMove(allActive, oldIndex, newIndex);
    moved.forEach((task, index) => {
      if (task.order !== index) {
        updateTask.mutate({ id: task.id, payload: { order: index } });
      }
    });
  };

  // Calculate stats
  const stats = useMemo(
    () => ({
      total: data.length,
      completed: data.filter((t) => t.completed).length,
      pending: data.filter((t) => !t.completed).length,
    }),
    [data]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const hasFiltersApplied =
    filters.search ||
    filters.category !== "All" ||
    filters.priority !== "All" ||
    filters.status !== "all" ||
    filters.selectedDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Tasks</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <p className="text-text-secondary">
              <span className="font-semibold text-text-primary">{stats.pending}</span>{" "}
              pending
            </p>
            <p className="text-text-secondary">
              <span className="font-semibold text-text-primary">
                {stats.completed}
              </span>{" "}
              completed
            </p>
            <p className="text-text-secondary">
              <span className="font-semibold text-text-primary">{stats.total}</span> total
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="lg">
          <Plus className="size-4" />
          Add Task
        </Button>
      </div>

      <div className="inline-flex w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-2 md:w-auto">
        <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")}>
          <List className="size-4" />
          List
        </Button>
        <Button variant={view === "calendar" ? "default" : "ghost"} size="sm" onClick={() => setView("calendar")}>
          <CalendarDays className="size-4" />
          Calendar
        </Button>
        <Button variant={view === "board" ? "default" : "ghost"} size="sm" onClick={() => setView("board")}>
          <Columns3 className="size-4" />
          Board
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <TaskForm
          onSubmit={(data) => createTask.mutate(data)}
          isLoading={createTask.isPending}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filters */}
      <TaskFiltersBar filters={filters} onChange={setFilters} />

      {/* Tasks */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={hasFiltersApplied ? "🔍" : "🎉"}
          title={
            hasFiltersApplied
              ? "No tasks match your filters"
              : "No tasks yet"
          }
          description={
            hasFiltersApplied
              ? "Try adjusting your filters to find tasks"
              : "Create your first task to get started!"
          }
          actionLabel="New Task"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          {view === "list" && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-4">
                {pinnedTasks.length > 0 && !filters.selectedDate && (
                  <>
                    <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-3">
                      <span className="text-lg">📌</span>
                      <h2 className="font-semibold text-accent">Pinned ({pinnedTasks.length})</h2>
                    </div>
                    <SortableContext
                      items={pinnedTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {pinnedTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={(t) =>
                              updateTask.mutate({
                                id: t.id,
                                payload: { completed: !t.completed },
                              })
                            }
                            onDelete={(id) => deleteTask.mutate(id)}
                            onPin={(id, pinned) =>
                              updateTask.mutate({
                                id,
                                payload: { pinned },
                              })
                            }
                            dragHandle={<SortableDragHandle id={task.id} />}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </>
                )}

                {!filters.selectedDate && (
                  <>
                    {groupedActive.overdue.length > 0 && (
                      <TaskGroup
                        title={getGroupLabel("overdue", groupedActive.overdue.length)}
                        icon={getGroupIcon("overdue")}
                        tasks={groupedActive.overdue}
                        onToggle={(t) =>
                          updateTask.mutate({
                            id: t.id,
                            payload: { completed: !t.completed },
                          })
                        }
                        onDelete={(id) => deleteTask.mutate(id)}
                        onPin={(id, pinned) =>
                          updateTask.mutate({ id, payload: { pinned } })
                        }
                        dragHandle={(id) => <SortableDragHandle id={id} />}
                        defaultExpanded={true}
                        isOverdue={true}
                      />
                    )}

                    {groupedActive.today.length > 0 && (
                      <TaskGroup
                        title={getGroupLabel("today", groupedActive.today.length)}
                        icon={getGroupIcon("today")}
                        tasks={groupedActive.today}
                        onToggle={(t) =>
                          updateTask.mutate({
                            id: t.id,
                            payload: { completed: !t.completed },
                          })
                        }
                        onDelete={(id) => deleteTask.mutate(id)}
                        onPin={(id, pinned) =>
                          updateTask.mutate({ id, payload: { pinned } })
                        }
                        dragHandle={(id) => <SortableDragHandle id={id} />}
                        defaultExpanded={true}
                      />
                    )}

                    {groupedActive.tomorrow.length > 0 && (
                      <TaskGroup
                        title={getGroupLabel("tomorrow", groupedActive.tomorrow.length)}
                        icon={getGroupIcon("tomorrow")}
                        tasks={groupedActive.tomorrow}
                        onToggle={(t) =>
                          updateTask.mutate({
                            id: t.id,
                            payload: { completed: !t.completed },
                          })
                        }
                        onDelete={(id) => deleteTask.mutate(id)}
                        onPin={(id, pinned) =>
                          updateTask.mutate({ id, payload: { pinned } })
                        }
                        dragHandle={(id) => <SortableDragHandle id={id} />}
                        defaultExpanded={true}
                      />
                    )}

                    {groupedActive.upcoming.length > 0 && (
                      <TaskGroup
                        title={getGroupLabel("upcoming", groupedActive.upcoming.length)}
                        icon={getGroupIcon("upcoming")}
                        tasks={groupedActive.upcoming}
                        onToggle={(t) =>
                          updateTask.mutate({
                            id: t.id,
                            payload: { completed: !t.completed },
                          })
                        }
                        onDelete={(id) => deleteTask.mutate(id)}
                        onPin={(id, pinned) =>
                          updateTask.mutate({ id, payload: { pinned } })
                        }
                        dragHandle={(id) => <SortableDragHandle id={id} />}
                        defaultExpanded={false}
                      />
                    )}
                  </>
                )}

                {completedTasks.length > 0 && !filters.selectedDate && (
                  <TaskGroup
                    title={getGroupLabel("completed", completedTasks.length)}
                    icon={getGroupIcon("completed")}
                    tasks={completedTasks}
                    onToggle={(t) =>
                      updateTask.mutate({
                        id: t.id,
                        payload: { completed: !t.completed },
                      })
                    }
                    onDelete={(id) => deleteTask.mutate(id)}
                    onPin={(id, pinned) =>
                      updateTask.mutate({ id, payload: { pinned } })
                    }
                    dragHandle={(id) => <SortableDragHandle id={id} />}
                    defaultExpanded={false}
                  />
                )}

                {filters.selectedDate && activeTasks.length > 0 && (
                  <SortableContext
                    items={activeTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {activeTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggle={(t) =>
                            updateTask.mutate({
                              id: t.id,
                              payload: { completed: !t.completed },
                            })
                          }
                          onDelete={(id) => deleteTask.mutate(id)}
                          onPin={(id, pinned) =>
                            updateTask.mutate({
                              id,
                              payload: { pinned },
                            })
                          }
                          dragHandle={<SortableDragHandle id={task.id} />}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </div>
            </DndContext>
          )}

          {view === "calendar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
                <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>Prev</Button>
                <h2 className="font-semibold">{format(calendarMonth, "MMMM yyyy")}</h2>
                <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>Next</Button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-text-secondary">
                {[
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const count = monthTaskCount.get(key) || 0;
                  const selected = calendarSelectedDate && format(calendarSelectedDate, "yyyy-MM-dd") === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCalendarSelectedDate(day)}
                      className={`rounded-xl border border-border p-2 text-left transition hover:bg-divider ${selected ? "bg-primary/10 ring-2 ring-primary/30" : "bg-surface"}`}
                    >
                      <div className={`text-sm font-semibold ${isToday(day) ? "text-primary" : "text-text-primary"}`}>{format(day, "d")}</div>
                      <div className="mt-2 min-h-5 text-xs text-text-secondary">{count ? `${count} task${count > 1 ? "s" : ""}` : ""}</div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
                <h3 className="font-semibold">
                  {calendarSelectedDate ? `Tasks on ${format(calendarSelectedDate, "MMM d, yyyy")}` : "Pick a date to view tasks"}
                </h3>
                {calendarSelectedDate && calendarTasks.length === 0 && (
                  <EmptyState
                    icon="🎉"
                    title="No tasks for this date"
                    description="Plan something meaningful for this day."
                    actionLabel="Add Task"
                    onAction={() => setShowForm(true)}
                  />
                )}
                {calendarTasks.length > 0 && (
                  <div className="space-y-2">
                    {calendarTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={(t) =>
                          updateTask.mutate({
                            id: t.id,
                            payload: { completed: !t.completed },
                          })
                        }
                        onDelete={(id) => deleteTask.mutate(id)}
                        onPin={(id, pinned) =>
                          updateTask.mutate({
                            id,
                            payload: { pinned },
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "board" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {[
                { key: "todo", title: "Todo", tasks: boardColumns.todo },
                { key: "inProgress", title: "In Progress", tasks: boardColumns.inProgress },
                { key: "done", title: "Done", tasks: boardColumns.done },
              ].map((column) => (
                <div key={column.key} className="rounded-xl border border-border bg-surface p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">{column.title}</h3>
                    <span className="rounded-full bg-divider px-2 py-0.5 text-xs text-text-secondary">{column.tasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {column.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={(t) =>
                          updateTask.mutate({
                            id: t.id,
                            payload: { completed: !t.completed },
                          })
                        }
                        onDelete={(id) => deleteTask.mutate(id)}
                        onPin={(id, pinned) =>
                          updateTask.mutate({
                            id,
                            payload: { pinned },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
