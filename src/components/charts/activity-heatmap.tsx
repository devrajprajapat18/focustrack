import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function getCellLevel(count: number) {
  if (count === 0) return "bg-divider";
  if (count <= 1) return "bg-indigo-200 dark:bg-indigo-900";
  if (count <= 3) return "bg-indigo-400 dark:bg-indigo-700";
  return "bg-indigo-600 dark:bg-indigo-500";
}

export function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(18,minmax(0,1fr))] gap-2">
          {data.map((item) => (
            <div
              key={item.date}
              className={cn("size-4 rounded-full", getCellLevel(item.count))}
              title={`${item.date}: ${item.count}`}
            />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
          <span>Less</span>
          <div className="size-3 rounded-full bg-divider" />
          <div className="size-3 rounded-full bg-indigo-200 dark:bg-indigo-900" />
          <div className="size-3 rounded-full bg-indigo-400 dark:bg-indigo-700" />
          <div className="size-3 rounded-full bg-indigo-600 dark:bg-indigo-500" />
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
