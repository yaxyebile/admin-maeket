import Link from "next/link";
import { LucideIcon, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionHubCardProps {
  href: string;
  title: string;
  description?: string;
  count?: number;
  icon: LucideIcon;
  accent?: string;
}

export function SectionHubCard({
  href,
  title,
  description,
  count,
  icon: Icon,
  accent = "bg-primary/10 text-primary",
}: SectionHubCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={cn("rounded-2xl p-3", accent)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{title}</p>
              {count !== undefined && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                  {count}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
        </CardContent>
      </Card>
    </Link>
  );
}
