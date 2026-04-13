import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="mt-1 text-5xl font-semibold leading-none text-text-primary">{value}</p>
        </div>
        <div className={cn("grid size-12 place-items-center rounded-2xl", iconClassName)}>
          <Icon className="size-6 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}
