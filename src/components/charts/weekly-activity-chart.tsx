"use client";

import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WeeklyActivityChart({ data }: { data: { day: string; count: number }[] }) {
  const highestCount = Math.max(...data.map((item) => item.count), 0);

  return (
    <Card className="h-full overflow-hidden border-border/80 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_85%,white)_0%,color-mix(in_oklab,var(--divider)_80%,var(--surface))_100%)]">
      <CardHeader className="pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Trends</p>
        <CardTitle className="mt-1">Weekly Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] pt-0">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-border/70 bg-surface/80 px-3 py-2">
          <p className="text-sm text-text-secondary">Peak Day Tasks</p>
          <p className="text-sm font-semibold text-text-primary">{highestCount}</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
              contentStyle={{ borderRadius: 14, borderColor: "var(--border)", background: "var(--surface)", boxShadow: "0 10px 24px rgba(0,0,0,0.08)" }}
            />
            <Bar dataKey="count" radius={[10, 10, 2, 2]} fill="var(--primary)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
