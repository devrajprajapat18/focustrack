"use client";

import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WeeklyActivityChart({ data }: { data: { day: string; count: number }[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 14, borderColor: "var(--border)", background: "var(--surface)" }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="var(--primary)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
