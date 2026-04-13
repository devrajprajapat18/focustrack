"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const colors = ["#6366F1", "#10B981", "#F59E0B", "#0EA5E9", "#F97316", "#A855F7"];

export function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Category</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 14, borderColor: "var(--border)", background: "var(--surface)" }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-text-secondary">No data yet</div>
        )}
      </CardContent>
    </Card>
  );
}
