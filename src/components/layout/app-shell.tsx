"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useAppStore((state) => state.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn("transition-all duration-200", "ml-0", collapsed ? "lg:ml-[88px]" : "lg:ml-[250px]")}>
        <Topbar />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
