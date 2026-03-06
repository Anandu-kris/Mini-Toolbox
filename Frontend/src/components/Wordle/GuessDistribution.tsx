import { cn } from "@/lib/utils";

type Dist = Record<number, number>;

export function GuessDistribution({
  dist,
  highlightAttempt,
  maxScale = 7,
}: {
  dist: Dist;                 
  highlightAttempt?: number;  
  maxScale?: number;          
}) {
  const rows = [1, 2, 3, 4, 5, 6];

  const maxVal = Math.max(maxScale, ...rows.map((k) => dist[k] ?? 0));

  return (
    <div className="space-y-2">
      {rows.map((k) => {
        const v = dist[k] ?? 0;
        const pct = maxVal === 0 ? 0 : (v / maxVal) * 100;
        const isHighlight = highlightAttempt === k && v > 0;
        const showInside = pct >= 14 && v > 0;

        return (
          <div key={k} className="flex items-center gap-3">
            {/* Left label */}
            <div className="w-4 text-xs font-semibold text-white/70 tabular-nums">
              {k}
            </div>

            {/* Track */}
            <div className="relative h-9 flex-1 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              {/* Fill */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-xl",
                  "bg-emerald-500/85",
                  "shadow-[0_10px_24px_rgba(16,185,129,0.18)]",
                  isHighlight && "bg-emerald-400",
                )}
                style={{ width: `${pct}%` }}
              />

              {showInside ? (
                <div className="absolute inset-y-0 left-0 flex items-center justify-end pr-3 tabular-nums font-semibold text-sm text-white">
                  <div style={{ width: `${pct}%` }}>{v}</div>
                </div>
              ) : null}
            </div>

            {!showInside ? (
              <div className="w-6 text-xs font-semibold text-white/50 tabular-nums text-right">
                {v}
              </div>
            ) : (
              <div className="w-6" />
            )}
          </div>
        );
      })}
    </div>
  );
}