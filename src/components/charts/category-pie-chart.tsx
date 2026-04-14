"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const colors = ["#2563EB", "#10B981", "#F59E0B", "#0EA5E9", "#F97316", "#EC4899"];

export function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="overflow-hidden border-border/80 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_85%,white)_0%,color-mix(in_oklab,var(--divider)_80%,var(--surface))_100%)]">
      <CardHeader className="pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Distribution</p>
        <CardTitle className="mt-1">Tasks by Category</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {data.length ? (
          <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={98} paddingAngle={2}>
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 14, borderColor: "var(--border)", background: "var(--surface)", boxShadow: "0 10px 24px rgba(0,0,0,0.08)" }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 overflow-auto pr-1">
              {data.map((item, index) => {
                const share = total ? Math.round((item.value / total) * 100) : 0;

                return (
                  <div key={item.name} className="flex items-center justify-between rounded-lg border border-border/70 bg-surface/70 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                      <span className="text-sm text-text-primary">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-text-secondary">{share}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid h-full place-items-center text-text-secondary">No data yet</div>
        )}
      </CardContent>
    </Card>
  );
}
