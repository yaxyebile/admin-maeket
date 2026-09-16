import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#D2F7FF] to-[#C4F4FF] p-1 shadow-sm shrink-0 border border-[#9DE6FF]">
        <img
          src="/logo.png"
          alt="EMARA Logo"
          className="h-9 w-9 rounded-xl object-cover"
        />
      </div>
      {!compact && (
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight text-[#0A1C28] leading-none">
            EMARA
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00A8E8] mt-0.5">
            Admin Market System
          </span>
        </div>
      )}
    </div>
  );
}
