"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CalendarPicker } from "./calendar-picker";

export interface TaskFilters {
  search: string;
  category: string;
  priority: string;
  status: "all" | "active" | "completed";
  selectedDate?: Date;
}

interface TaskFiltersProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

export function TaskFiltersBar({ filters, onChange }: TaskFiltersProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    }

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCalendar]);

  return (
    <div className="space-y-4">
      {/* Search and Calendar */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={filters.search}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value })
            }
          />
        </div>

        <div className="relative" ref={calendarRef}>
          <Button
            variant={filters.selectedDate ? "default" : "outline"}
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full md:w-auto"
          >
            <Calendar className="size-4" />
            {filters.selectedDate
              ? format(filters.selectedDate, "MMM d")
              : "Filter by date"}
            {filters.selectedDate && (
              <X
                className="ml-1 size-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ ...filters, selectedDate: undefined });
                }}
              />
            )}
          </Button>

          {showCalendar && (
            <div className="absolute right-0 top-full mt-2 z-50">
              <CalendarPicker
                value={filters.selectedDate}
                onChange={(date) =>
                  onChange({ ...filters, selectedDate: date })
                }
                onClose={() => setShowCalendar(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Category, Priority, Status filters */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <select
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
        >
          <option value="All">All Categories</option>
          {TASK_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        >
          <option value="All">All Priorities</option>
          {TASK_PRIORITIES.map((pri) => (
            <option key={pri} value={pri}>
              {pri}
            </option>
          ))}
        </select>

        <select
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as "all" | "active" | "completed",
            })
          }
        >
          <option value="all">All Tasks</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Active filters display */}
      {(filters.search ||
        filters.category !== "All" ||
        filters.priority !== "All" ||
        filters.status !== "all" ||
        filters.selectedDate) && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-text-secondary">Active filters:</span>
          {filters.search && (
            <span className="rounded-full bg-divider px-2 py-1">
              Search: {filters.search}
            </span>
          )}
          {filters.category !== "All" && (
            <span className="rounded-full bg-divider px-2 py-1">
              {filters.category}
            </span>
          )}
          {filters.priority !== "All" && (
            <span className="rounded-full bg-divider px-2 py-1">
              {filters.priority}
            </span>
          )}
          {filters.status !== "all" && (
            <span className="rounded-full bg-divider px-2 py-1">
              {filters.status === "active" ? "Active" : "Completed"}
            </span>
          )}
          {filters.selectedDate && (
            <span className="rounded-full bg-divider px-2 py-1">
              {format(filters.selectedDate, "MMM d, yyyy")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
