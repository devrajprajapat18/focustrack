"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarPickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  onClose?: () => void;
}

export function CalendarPicker({
  value,
  onChange,
  onClose,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad with previous month's days
  const startDate = days[0];
  const dayOfWeek = startDate.getDay();
  const previousDays = dayOfWeek > 0
    ? eachDayOfInterval({
        start: subMonths(startDate, 1),
        end: startDate,
      }).slice(-dayOfWeek)
    : [];

  const allDays = [...previousDays, ...days];

  return (
    <div className="w-80 rounded-xl border border-border bg-surface p-4 shadow-lg">
      <div className="flex items-center justify-between gap-2 pb-4">
        <h3 className="font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="h-8 w-8"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(new Date())}
          className="text-xs"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="h-8 w-8"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-text-secondary">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((day, index) => (
          <button
            key={index}
            onClick={() => {
              onChange(day);
              onClose?.();
            }}
            className={cn(
              "h-8 text-sm font-medium transition-colors rounded",
              !isSameMonth(day, currentMonth) && "text-text-muted opacity-50",
              value && format(value, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                ? "bg-primary text-white"
                : isToday(day)
                  ? "bg-accent/20 text-accent font-bold"
                  : "hover:bg-divider"
            )}
          >
            {format(day, "d")}
          </button>
        ))}
      </div>

      {/* Clear button */}
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(undefined);
            onClose?.();
          }}
          className="mt-3 w-full text-xs"
        >
          Clear Selection
        </Button>
      )}
    </div>
  );
}
