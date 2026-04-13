"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CheckSquare,
  Flame,
  LayoutDashboard,
  Menu,
  Notebook,
  Timer,
  CheckSquare2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";

const iconMap = {
  Dashboard: LayoutDashboard,
  Tasks: CheckSquare,
  Notes: Notebook,
  Pomodoro: Timer,
  Analytics: BarChart3,
};

const items = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tasks", href: "/tasks" },
  { label: "Notes", href: "/notes" },
  { label: "Pomodoro", href: "/pomodoro" },
  { label: "Analytics", href: "/analytics" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const mobileOpen = useAppStore((state) => state.mobileSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const setMobileSidebarOpen = useAppStore((state) => state.setMobileSidebarOpen);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-surface px-3 py-4 transition-all duration-200",
          collapsed ? "w-[88px]" : "w-[250px]",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
      <div className="flex items-center justify-between px-2">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-white">
            <CheckSquare2 className="size-5" />
          </div>
          {!collapsed && <span className="text-2xl font-semibold text-text-primary">FocusTrack</span>}
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu className="size-4" />
        </Button>
      </div>

      <nav className="mt-6 space-y-1">
        {items.map((item) => {
          const Icon = iconMap[item.label];
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                  : "text-text-secondary hover:bg-divider hover:text-text-primary",
              )}
            >
              <Icon className="size-5" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-border bg-background p-5 text-center shadow-md">
        <Flame className="mx-auto size-7 text-accent" />
        <p className="mt-2 text-4xl font-semibold text-text-primary">1</p>
        {!collapsed && <p className="text-sm text-text-secondary">Day Streak</p>}
      </div>
      </aside>
    </>
  );
}
