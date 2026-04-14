"use client";

import { Bell, Moon, Sun, LogOut, User, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { fetcher } from "@/lib/fetcher";
import type { UserSession } from "@/lib/types";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const setMobileSidebarOpen = useAppStore((state) => state.setMobileSidebarOpen);
  const { setTheme, resolvedTheme } = useTheme();
  
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: () => fetcher<UserSession>("/api/auth/me"),
  });

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle sidebar"
          onClick={() => {
            toggleSidebar();
            setMobileSidebarOpen(true);
          }}
          className="lg:hidden"
        >
          <PanelLeftOpen className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Toggle sidebar" onClick={toggleSidebar} className="hidden lg:inline-flex">
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-accent" />
        </Button>

        <div className="relative">
          <button
            className={cn(
              "grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            )}
            onClick={() => setOpen((prev) => !prev)}
            type="button"
          >
            {user?.name?.[0]?.toUpperCase() || "U"}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-surface p-2 shadow-lg">
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-divider" type="button">
                <User className="size-4" />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-error hover:bg-divider"
                type="button"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
