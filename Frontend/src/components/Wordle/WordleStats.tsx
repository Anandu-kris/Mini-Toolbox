
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuessDistribution } from "./GuessDistribution";

type GuessDist = Record<number, number>;

export type WordleStats = {
  played: number;
  winPct: number;
  currentStreak: number;
  maxStreak: number;
  guessDist: GuessDist;
};

export function WordleStatsDialog({
  open,
  onOpenChange,
  stats,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stats: WordleStats;
  loading?: boolean;
  errorText?: string;
}) {
  return (
    <>
      <style>{`
        /* Match your URL shortener / wordle glass vibe */
        .wsd {
          font-family: 'Sora', sans-serif;
        }

        .wsd-content {
          padding: 0;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(26px);
          border-radius: 22px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 40px 120px rgba(0,0,0,0.55);
          overflow: hidden;
        }

        .wsd-top {
          padding: 26px 26px 18px 26px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .wsd-title {
          font-size: 26px;
          background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin: 0;
        }

        .wsd-close {
          position: absolute;
          top: 14px;
          right: 14px;
          height: 42px;
          width: 42px;
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.75);
          display: grid;
          place-items: center;
          transition: all .15s;
        }
        .wsd-close:hover {
          background: rgba(255,255,255,0.10);
          color: #fff;
        }

        .wsd-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 12px;
          padding: 18px 26px 20px 26px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        @media (max-width: 640px) {
          .wsd-kpis { grid-template-columns: repeat(2, minmax(0,1fr)); }
        }

        .wsd-kpi {
          text-align: center;
          padding: 14px 10px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .wsd-kpi .num {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: rgba(255,255,255,0.95);
          line-height: 1;
          margin-bottom: 6px;
        }
        .wsd-kpi .label {
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          font-weight: 600;
        }

        .wsd-body {
          padding: 22px 26px 26px 26px;
        }

        .wsd-section {
          margin-top: 18px;
        }
        .wsd-section:first-child { margin-top: 0; }

        .wsd-h {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .wsd-bars {
          display: grid;
          gap: 10px;
        }

        .wsd-bar-row {
          display: grid;
          grid-template-columns: 18px 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .wsd-bar-num {
          font-size: 12px;
          color: rgba(255,255,255,0.70);
          font-weight: 700;
          text-align: right;
        }

        .wsd-bar-track {
          height: 24px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          overflow: hidden;
          position: relative;
        }

        .wsd-bar-fill {
          height: 100%;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(34,197,94,0.85), rgba(16,185,129,0.55));
          box-shadow: 0 10px 24px rgba(34,197,94,0.20);
        }

        .wsd-bar-count {
          font-size: 12px;
          color: rgba(255,255,255,0.75);
          font-weight: 700;
          min-width: 18px;
          text-align: left;
        }

        .wsd-muted {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          line-height: 1.6;
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("wsd w-[min(760px,92vw)]", "wsd-content")}>
          <DialogHeader className="wsd-top">
            <DialogTitle className="wsd-title">Statistics</DialogTitle>
          </DialogHeader>

          {/* KPIs */}
          <div className="wsd-kpis">
            <div className="wsd-kpi">
              <div className="num">{stats.played}</div>
              <div className="label">Played</div>
            </div>
            <div className="wsd-kpi">
              <div className="num">{Math.round(stats.winPct)}</div>
              <div className="label">Win %</div>
            </div>
            <div className="wsd-kpi">
              <div className="num">{stats.currentStreak}</div>
              <div className="label">Current Streak</div>
            </div>
            <div className="wsd-kpi">
              <div className="num">{stats.maxStreak}</div>
              <div className="label">Max Streak</div>
            </div>
          </div>

          <div className="wsd-body">
            {/* Guess distribution */}
            <div className="wsd-section">
              <GuessDistribution
                dist={{
                  1: stats.guessDist[1],
                  2: stats.guessDist[2],
                  3: stats.guessDist[3],
                  4: stats.guessDist[4],
                  5: stats.guessDist[5],
                  6: stats.guessDist[6],
                }}
                maxScale={7}
                highlightAttempt={4}
              />

              <div className="wsd-muted mt-4">
                Tip: Keep your streak going — a new puzzle drops daily.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
