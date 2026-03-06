import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";
import {
  useWordleDaily,
  useWordleFinish,
  useWordleGuess,
  useWordleStats,
} from "@/hooks/useWordle";
import type { Tile } from "@/services/wordle.service";
import { WordleHowToPlay } from "./WordleHowtoPlay";
import { BarChart3, HelpCircle } from "lucide-react";
import { WordleStatsDialog } from "./WordleStats";

const WORD_LEN = 5;
const MAX_ATTEMPTS = 6;

type Row = { guess: string; eval?: Tile[] };

function storageKey(dayId: string) {
  return `wordle_daily_${dayId}`;
}

function mergeKeyStatus(
  prev: Record<string, Tile>,
  guess: string,
  evaluation: Tile[],
) {
  const rank: Record<Tile, number> = { absent: 0, present: 1, correct: 2 };
  const next = { ...prev };
  for (let i = 0; i < guess.length; i++) {
    const ch = guess[i].toUpperCase();
    const s = evaluation[i];
    const cur = next[ch];
    if (!cur || rank[s] > rank[cur]) next[ch] = s;
  }
  return next;
}

export function WordleGame() {
  const dailyQ = useWordleDaily();
  const guessMut = useWordleGuess();
  const finishMut = useWordleFinish();

  const dayId = dailyQ.data?.dayId ?? "";

  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [keyStatus, setKeyStatus] = useState<Record<string, Tile>>({});
  const [howOpen, setHowOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const finishedOnceRef = useRef(false);

  const statsQ = useWordleStats(statsOpen);

  type WordleStats = {
    played: number;
    winPct: number;
    currentStreak: number;
    maxStreak: number;
    guessDist: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
      6: number;
    };
  };

  const statsForDialog: WordleStats = useMemo(() => {
    const s = statsQ.data;

    const played = s?.played ?? 0;
    const wins = s?.wins ?? 0;

    const winPct = played > 0 ? Math.round((wins / played) * 100) : 0;

    const d = s?.distribution ?? {};
    const guessDist = {
      1: Number(d["1"] ?? 0),
      2: Number(d["2"] ?? 0),
      3: Number(d["3"] ?? 0),
      4: Number(d["4"] ?? 0),
      5: Number(d["5"] ?? 0),
      6: Number(d["6"] ?? 0),
    };

    return {
      played,
      winPct,
      currentStreak: s?.currentStreak ?? 0,
      maxStreak: s?.maxStreak ?? 0,
      guessDist,
    };
  }, [statsQ.data]);

  useEffect(() => {
    if (!dayId) return;

    finishedOnceRef.current = false;

    const raw = localStorage.getItem(storageKey(dayId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          rows: Row[];
          draft: string;
          status: "playing" | "won" | "lost";
          keyStatus: Record<string, Tile>;
        };
        setRows(parsed.rows ?? []);
        setDraft(parsed.draft ?? "");
        setStatus(parsed.status ?? "playing");
        setKeyStatus(parsed.keyStatus ?? {});
        return;
      } catch {
        // ignore
      }
    }

    setRows([]);
    setDraft("");
    setStatus("playing");
    setKeyStatus({});
  }, [dayId]);

  useEffect(() => {
    if (!dayId) return;
    localStorage.setItem(
      storageKey(dayId),
      JSON.stringify({ rows, draft, status, keyStatus }),
    );
  }, [dayId, rows, draft, status, keyStatus]);

  const attemptsUsed = rows.length;
  const canType = status === "playing" && attemptsUsed < MAX_ATTEMPTS;

  async function submit() {
    if (!dayId) return;
    if (!canType) return;

    const guess = draft.trim().toLowerCase();
    if (guess.length !== WORD_LEN) {
      toast.error("Not enough letters");
      return;
    }

    try {
      const res = await guessMut.mutateAsync({ dayId, guess });

      setRows((r) => [
        ...r,
        { guess: res.guess.toUpperCase(), eval: res.evaluation },
      ]);
      setDraft("");
      setStatus(res.status);
      setKeyStatus((ks) => mergeKeyStatus(ks, res.guess, res.evaluation));

      if (res.status === "won") {
        toast.success("🎉 You solved it!", {
          description: `Solved in ${res.attemptsUsed} guesses`,
        });
      }

      if (res.status === "lost") {
        toast.error("😵 Game over", {
          description: "Better luck tomorrow!",
        });
      }

      if (
        (res.status === "won" || res.status === "lost") &&
        !finishedOnceRef.current
      ) {
        finishedOnceRef.current = true;
        void finishMut
          .mutateAsync({
            dayId,
            status: res.status,
            attemptsUsed: res.attemptsUsed,
          })
          .catch(() => {});
      }
    } catch (e: unknown) {
      let msg = "Guess failed";
      if (axios.isAxiosError(e)) msg = e.response?.data?.detail ?? e.message;
      toast.error(msg);
    }
  }

  function onKey(k: string) {
    if (!canType) return;
    if (k === "ENTER") return void submit();
    if (k === "BACKSPACE") return setDraft((d) => d.slice(0, -1));
    if (/^[A-Z]$/.test(k))
      setDraft((d) => (d.length < WORD_LEN ? d + k.toLowerCase() : d));
  }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const key = e.key;
      if (key === "Enter") return onKey("ENTER");
      if (key === "Backspace") return onKey("BACKSPACE");
      const up = key.toUpperCase();
      if (/^[A-Z]$/.test(up)) onKey(up);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canType, draft, status, attemptsUsed]);

  const board = useMemo(() => {
    const out: { ch: string; state?: Tile }[][] = [];
    for (let r = 0; r < MAX_ATTEMPTS; r++) {
      const row = rows[r];
      const guess =
        row?.guess ?? (r === rows.length ? draft.toUpperCase() : "");
      const evals = row?.eval;

      out.push(
        Array.from({ length: WORD_LEN }, (_, i) => ({
          ch: guess[i] ?? "",
          state: evals?.[i],
        })),
      );
    }
    return out;
  }, [rows, draft]);

  const keys = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    ["ENTER", ..."ZXCVBNM".split(""), "BACKSPACE"],
  ];

  return (
    <>
      <style>{`
        .wg-card {
          width: 100%;
          max-width: 560px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px;
          padding: 28px;
          backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 32px 64px rgba(0,0,0,0.45),
            0 0 80px rgba(99,102,241,0.08);
          display: flex;
          flex-direction: column;
          max-height: calc(100dvh - 200px);
          min-height: 600px;
        }

        @media (max-width: 900px) {
          .wg-card { max-height: none; min-height: unset; padding: 22px; }
        }

        .wg-header {
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          margin-bottom: 12px;
        }

        .wg-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .wg-title-icon {
          width: 32px; height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg,#6366f1,#4f46e5);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(99,102,241,0.4);
          flex-shrink: 0;
        }

        .wg-title {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .wg-subtitle {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin-left: 42px;
        }

        .wg-help {
          height: 38px;
          padding: 0 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.65);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .wg-help:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.18);
          color: #fff;
        }

        /* Main area: allow scroll INSIDE the card when needed */
        .wg-body {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;        /* was 18px */
          overflow: auto; /* IMPORTANT: no scroll */
          padding-right: 0;
        }

        /* Board */
        .wg-board { display: grid; gap: 8px; margin-top: 4px; }
        .wg-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }

        .wg-tile {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 16px;
          color: rgba(255,255,255,0.92);
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset;
        }

        /* Make it fit on shorter heights */
        @media (max-height: 780px) {
          .wg-tile { width: 48px; height: 48px; border-radius: 12px; font-size: 16px; }
          .wg-board { gap: 8px; }
          .wg-row { gap: 8px; }
        }

        /* Tile states – vibrant */
        .wg-correct {
          background: linear-gradient(135deg, rgba(34,197,94,0.35), rgba(16,185,129,0.22));
          border-color: rgba(74,222,128,0.28);
          box-shadow: 0 10px 26px rgba(34,197,94,0.18);
        }
        .wg-present {
          background: linear-gradient(135deg, rgba(234,179,8,0.32), rgba(245,158,11,0.20));
          border-color: rgba(250,204,21,0.25);
          box-shadow: 0 10px 26px rgba(234,179,8,0.16);
        }
        .wg-absent {
          background: rgba(255,255,255,0.035);
          border-color: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.42);
        }

        /* Keyboard */
        .wg-keys { width: 100%; max-width: 520px; display: grid; gap: 8px; padding-bottom: 4px; }
        .wg-keyrow { display: flex; justify-content: center; gap: 8px; }

        .wg-key {
          height: 38px;
          border-radius: 12px;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.82);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          transition: all 0.18s;
        }
        .wg-key:hover { background: rgba(255,255,255,0.09); }

        .wg-key.correct {
          background: rgba(34,197,94,0.18);
          border-color: rgba(74,222,128,0.28);
          color: #d1fae5;
        }
        .wg-key.present {
          background: rgba(234,179,8,0.18);
          border-color: rgba(250,204,21,0.25);
          color: #fef9c3;
        }
        .wg-key.absent {
          background: rgba(255,255,255,0.035);
          color: rgba(255,255,255,0.42);
        }

        @media (max-height: 780px) {
          .wg-key { height: 40px; border-radius: 12px; font-size: 12px; }
          .wg-keyrow { gap: 8px; }
          .wg-keys { gap: 8px; }
        }

        .wg-submit-row { display: flex; justify-content: center; padding-top: 4px; }
        .wg-status { font-size: 13px; color: rgba(255,255,255,0.75); text-align:center; padding-top: 6px; }
      `}</style>

      <div className="wg-card">
        {/* Header */}
        <div className="wg-header">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatsOpen(true)}
              className="wg-help"
              aria-label="Stats"
            >
              <BarChart3 size={14} />
            </button>

            <button
              type="button"
              onClick={() => setHowOpen(true)}
              className="wg-help"
              aria-label="How to play"
            >
              <HelpCircle size={14} />
            </button>
          </div>

          <WordleHowToPlay open={howOpen} onOpenChange={setHowOpen} />

          <WordleStatsDialog
            open={statsOpen}
            onOpenChange={setStatsOpen}
            stats={statsForDialog}
            loading={statsQ.isLoading}
            errorText={
              statsQ.error?.response?.data?.detail ?? statsQ.error?.message
            }
          />
        </div>

        {/* Body (scrolls if needed) */}
        <div className="wg-body">
          {/* Board */}
          <div className="wg-board">
            {board.map((row, rIdx) => (
              <div key={rIdx} className="wg-row">
                {row.map((c, i) => (
                  <div
                    key={i}
                    className={cn(
                      "wg-tile",
                      c.state === "correct" && "wg-correct",
                      c.state === "present" && "wg-present",
                      c.state === "absent" && "wg-absent",
                    )}
                  >
                    {c.ch}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Keyboard */}
          <div className="wg-keys">
            {keys.map((row, idx) => (
              <div key={idx} className="wg-keyrow">
                {row.map((k) => {
                  const st = keyStatus[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onKey(k)}
                      className={cn(
                        "wg-key",
                        (k === "ENTER" || k === "BACKSPACE") && "px-3",
                        st === "correct" && "correct",
                        st === "present" && "present",
                        st === "absent" && "absent",
                      )}
                    >
                      {k === "BACKSPACE" ? "⌫" : k}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
