import { CalendarDaysIcon } from "lucide-react";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-400/25">
        <CalendarDaysIcon className="size-4 text-violet-300" strokeWidth={2.25} />
      </span>
      <span className="font-semibold text-xl tracking-tight leading-none">
        <span className="text-white">Rota</span>
        <span className="bg-clip-text text-transparent bg-linear-to-r from-violet-300 to-indigo-400">Book</span>
      </span>
    </span>
  );
}
