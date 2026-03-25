import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  accent?: "blue" | "violet" | "emerald" | "rose";
  className?: string;
};

const accentMap = {
  blue: {
    topBarColor: "#60a5fa",   // blue-400
    bloomColor: "#3b82f6",    // blue-500
    iconBg: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-400",
    dot: "bg-blue-400",
    glow: "shadow-blue-500/10",
  },
  violet: {
    topBarColor: "#a78bfa",   // violet-400
    bloomColor: "#8b5cf6",    // violet-500
    iconBg: "bg-violet-500/10 border-violet-500/20",
    iconColor: "text-violet-400",
    dot: "bg-violet-400",
    glow: "shadow-violet-500/10",
  },
  emerald: {
    topBarColor: "#34d399",   // emerald-400
    bloomColor: "#10b981",    // emerald-500
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
    dot: "bg-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  rose: {
    topBarColor: "#fb7185",   // rose-400
    bloomColor: "#f43f5e",    // rose-500
    iconBg: "bg-rose-500/10 border-rose-500/20",
    iconColor: "text-rose-400",
    dot: "bg-rose-400",
    glow: "shadow-rose-500/10",
  },
};


const FinanceStatCard = ({
  title,
  value,
  helper,
  icon,
  accent = "blue",
  className,
}: Props) => {
  const a = accentMap[accent];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/4 backdrop-blur-md",
        "border border-white/8",
        "shadow-xl",
        a.glow,
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:bg-white/6",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px]"
        style={{
          background: `linear-gradient(to right, transparent, ${a.topBarColor}99, transparent)`,
        }}
      />

      <div
        className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full opacity-[0.15]"
        style={{ background: a.bloomColor, filter: "blur(32px)" }}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", a.dot)} />
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400/80 truncate">
                {title}
              </p>
            </div>

            <h3 className="mt-3 text-[1.75rem] font-semibold leading-none tracking-tight text-white">
              {value}
            </h3>

            {helper ? (
              <p className={cn("mt-2.5 flex items-center gap-1 text-xs font-light",)}>
                <span>{helper}</span>
              </p>
            ) : null}
          </div>

          {icon ? (
            <div
              className={cn(
                "mt-0.5 shrink-0 rounded-xl border p-2.5",
                a.iconBg,
                a.iconColor,
                "transition-transform duration-300 hover:scale-110"
              )}
            >
              {icon}
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "absolute inset-x-5 bottom-0 h-px opacity-30",
            `bg-linear-to-r from-transparent via-current to-transparent`,
            a.iconColor
          )}
        />
      </div>
    </div>
  );
};

export default FinanceStatCard;