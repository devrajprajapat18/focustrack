"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, RotateCcw, Brain, Coffee } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetcher, mutateJson } from "@/lib/fetcher";
import type { PomodoroSessionItem } from "@/lib/types";
import { useAppStore } from "@/store/use-app-store";

function formatTime(seconds: number) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function PomodoroPage() {
  const queryClient = useQueryClient();
  const mode = useAppStore((state) => state.pomodoroMode);
  const focusMinutes = useAppStore((state) => state.focusMinutes);
  const breakMinutes = useAppStore((state) => state.breakMinutes);
  const setMode = useAppStore((state) => state.setPomodoroMode);

  const baseSeconds = useMemo(() => (mode === "focus" ? focusMinutes * 60 : breakMinutes * 60), [mode, focusMinutes, breakMinutes]);
  const [secondsLeft, setSecondsLeft] = useState(baseSeconds);
  const [running, setRunning] = useState(false);

  const switchMode = (nextMode: "focus" | "break") => {
    setMode(nextMode);
    setRunning(false);
    setSecondsLeft(nextMode === "focus" ? focusMinutes * 60 : breakMinutes * 60);
  };

  const { data = [] } = useQuery({
    queryKey: ["pomodoro-sessions"],
    queryFn: () => fetcher<PomodoroSessionItem[]>("/api/pomodoro/sessions"),
  });

  const createSession = useMutation({
    mutationFn: (duration: number) => mutateJson<PomodoroSessionItem>("/api/pomodoro/sessions", "POST", { mode, duration }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pomodoro-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
    },
  });

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          createSession.mutate(baseSeconds);
          toast.success("Session completed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, createSession, baseSeconds]);

  const progress = Math.max(0, Math.min(100, ((baseSeconds - secondsLeft) / baseSeconds) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-5xl font-semibold">Pomodoro Timer</h1>
        <p className="mt-2 text-xl text-text-secondary">Stay focused with timed work sessions.</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant={mode === "focus" ? "default" : "outline"} onClick={() => switchMode("focus")}>
          <Brain className="size-4" /> Focus
        </Button>
        <Button variant={mode === "break" ? "default" : "outline"} onClick={() => switchMode("break")}>
          <Coffee className="size-4" /> Break
        </Button>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardContent className="grid place-items-center py-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="grid size-72 place-items-center rounded-full border-[12px] border-divider"
            style={{
              background: `conic-gradient(var(--primary) ${progress * 3.6}deg, var(--divider) ${progress * 3.6}deg)`,
            }}
          >
            <div className="grid size-60 place-items-center rounded-full bg-surface">
              <div className="text-center">
                <p className="text-7xl font-semibold tracking-tight">{formatTime(secondsLeft)}</p>
                <p className="text-text-secondary">{mode === "focus" ? "Focus Mode" : "Break Mode"}</p>
              </div>
            </div>
          </motion.div>

          <div className="mt-8 flex items-center gap-3">
            <Button onClick={() => setRunning((prev) => !prev)}>{running ? <Pause className="size-4" /> : <Play className="size-4" />} {running ? "Pause" : "Start"}</Button>
            <Button variant="outline" onClick={() => { setSecondsLeft(baseSeconds); setRunning(false); }}>
              <RotateCcw className="size-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.length ? (
            data.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-xl bg-divider px-3 py-2">
                <div>
                  <p className="font-semibold capitalize">{session.mode} session</p>
                  <p className="text-sm text-text-secondary">{new Date(session.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant={session.mode === "focus" ? "default" : "warning"}>{Math.round(session.duration / 60)} min</Badge>
              </div>
            ))
          ) : (
            <p className="text-text-secondary">No sessions completed today. Start focusing!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
