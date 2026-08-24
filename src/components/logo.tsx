import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-2xl font-black tracking-tight text-primary">HELLO</span>
      {!compact && (
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
          Buy. Sell. Anything. Anywhere.
        </span>
      )}
    </div>
  );
}
