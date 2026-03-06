import { KeyRound, Star, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function VaultStatsRow({
  total,
  fav,
  strong,
  weak,
  strongLabel = "Strong",
  weakLabel = "At risk",
}: {
  total: number;
  fav: number;
  strong?: number; // optional
  weak?: number;   // optional
  strongLabel?: string;
  weakLabel?: string;
}) {
  const Stat = ({
    icon,
    label,
    value,
    hint,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    hint?: string;
  }) => (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 px-4 py-3",
        "shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white/8 grid place-items-center">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm text-white/70">{label}</div>
          <div className="text-xl text-white font-semibold leading-tight">
            {value}
          </div>
          {hint ? <div className="text-xs text-white/45">{hint}</div> : null}
        </div>
      </div>
    </div>
  );

  const strongVal = typeof strong === "number" ? String(strong) : "—";
  const weakVal = typeof weak === "number" ? String(weak) : "—";

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Stat
        icon={<KeyRound className="h-4 w-4 text-white/80" />}
        label="Total"
        value={String(total)}
      />
      <Stat
        icon={<Star className="h-4 w-4 text-yellow-300/90" />}
        label="Favorites"
        value={String(fav)}
      />
      <Stat
        icon={<ShieldCheck className="h-4 w-4 text-emerald-300/90" />}
        label={strongLabel}
        value={strongVal}
      />
      <Stat
        icon={<AlertTriangle className="h-4 w-4 text-amber-300/90" />}
        label={weakLabel}
        value={weakVal}
      />
    </div>
  );
}