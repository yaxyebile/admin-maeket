import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  loading,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn("rounded-2xl p-3", iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-1 h-8 w-24 animate-pulse rounded-lg bg-slate-200" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
