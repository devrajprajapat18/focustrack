import { create } from "zustand";
import { persist } from "zustand/middleware";

type PomodoroMode = "focus" | "break";

interface AppStore {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  pomodoroMode: PomodoroMode;
  focusMinutes: number;
  breakMinutes: number;
  setSidebarCollapsed: (value: boolean) => void;
  setMobileSidebarOpen: (value: boolean) => void;
  toggleSidebar: () => void;
  setPomodoroMode: (mode: PomodoroMode) => void;
  setFocusMinutes: (value: number) => void;
  setBreakMinutes: (value: number) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      pomodoroMode: "focus",
      focusMinutes: 25,
      breakMinutes: 5,
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      setMobileSidebarOpen: (value) => set({ mobileSidebarOpen: value }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setPomodoroMode: (mode) => set({ pomodoroMode: mode }),
      setFocusMinutes: (value) => set({ focusMinutes: value }),
      setBreakMinutes: (value) => set({ breakMinutes: value }),
    }),
    {
      name: "focustrack-app-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        pomodoroMode: state.pomodoroMode,
        focusMinutes: state.focusMinutes,
        breakMinutes: state.breakMinutes,
      }),
    },
  ),
);
