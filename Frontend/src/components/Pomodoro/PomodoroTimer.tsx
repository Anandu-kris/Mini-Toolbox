import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PomodoroDurations } from "./PomodoroSettings";
import PomodoroTasks, { type PomodoroTask } from "@/components/Pomodoro/PomodorTasks";
import { notify } from "@/lib/pomodoro_notify";

type Mode = "focus" | "short" | "long";
type ModeDef = { key: Mode; label: string; mins: number };

const THEME: Record<Mode, {
  ring: string; glow: string; accent: string; dot: string; tab: string; glowBtn: string;
}> = {
  focus: {
    ring: "#60a5fa", glow: "rgba(96,165,250,0.5)", accent: "#3b82f6",
    dot: "#93c5fd", tab: "rgba(59,130,246,0.2)", glowBtn: "rgba(59,130,246,0.45)",
  },
  short: {
    ring: "#34d399", glow: "rgba(52,211,153,0.5)", accent: "#10b981",
    dot: "#6ee7b7", tab: "rgba(16,185,129,0.2)", glowBtn: "rgba(16,185,129,0.45)",
  },
  long: {
    ring: "#a78bfa", glow: "rgba(167,139,250,0.5)", accent: "#8b5cf6",
    dot: "#c4b5fd", tab: "rgba(139,92,246,0.2)", glowBtn: "rgba(139,92,246,0.45)",
  },
};

function pad2(n: number) { return String(n).padStart(2, "0"); }
function formatMMSS(s: number) { return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`; }

function ClockFace({ progress, mode, children }: {
  progress: number; mode: Mode; children: React.ReactNode;
}) {
  const theme = THEME[mode];
  const R = 108; const CX = 120; const CY = 120;
  const circumference = 2 * Math.PI * R;
  const offset = circumference * (1 - progress);

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const inner = isMajor ? R - 12 : R - 7;
    return {
      x1: CX + inner * Math.cos(angle), y1: CY + inner * Math.sin(angle),
      x2: CX + (R - 1) * Math.cos(angle), y2: CY + (R - 1) * Math.sin(angle),
      isMajor,
    };
  });

  const dotAngle = (2 * Math.PI * progress) - Math.PI / 2;

  return (
    <div style={{ position: "relative", width: 240, height: 240, flexShrink: 0 }}>
      <svg width="240" height="240" viewBox="0 0 240 240" style={{ position: "absolute", inset: 0 }}>
        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        {/* Progress arc */}
        <circle
          cx={CX} cy={CY} r={R} fill="none"
          stroke={theme.ring} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{
            filter: `drop-shadow(0 0 8px ${theme.glow})`,
            transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1), stroke 0.5s ease",
          }}
        />
        {/* Ticks */}
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.09)"}
            strokeWidth={t.isMajor ? 1.8 : 1} strokeLinecap="round" />
        ))}
        {/* Head dot */}
        {progress > 0 && (
          <circle
            cx={CX + R * Math.cos(dotAngle)} cy={CY + R * Math.sin(dotAngle)}
            r={5} fill={theme.dot}
            style={{
              filter: `drop-shadow(0 0 6px ${theme.glow})`,
              transition: "cx 0.8s cubic-bezier(.4,0,.2,1), cy 0.8s cubic-bezier(.4,0,.2,1)",
            }}
          />
        )}
      </svg>
      {/* Center content */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
      }}>
        {children}
      </div>
    </div>
  );
}

export default function PomodoroTimer({
  durations,
}: {
  durations: PomodoroDurations;
  onDurationsChange?: (next: PomodoroDurations) => void;
  onOpenSettingsRequest?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("focus");
  const [running, setRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const CYCLE = 4;

  const MODES: ModeDef[] = useMemo(() => [
    { key: "focus", label: "FOCUS", mins: durations.focus },
    { key: "short", label: "SHORT BREAK", mins: durations.short },
    { key: "long", label: "LONG BREAK", mins: durations.long },
  ], [durations]);

  const selected = useMemo(() => MODES.find((m) => m.key === mode)!, [MODES, mode]);
  const initialSeconds = selected.mins * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const theme = THEME[mode];

  const goToNextSession = useCallback(() => {
    setRunning(false);
    let nextMode: Mode = "focus";
    if (mode === "focus") {
      const nextCount = pomodoroCount + 1;
      setPomodoroCount(nextCount);
      nextMode = nextCount % CYCLE === 0 ? "long" : "short";
    } else { nextMode = "focus"; }
    notify.sessionComplete(mode);
    notify.modeChanged(nextMode);
    setMode(nextMode);
    setTimeout(() => { setRunning(true); setHasStartedOnce(true); notify.timerStarted(nextMode); }, 400);
  }, [mode, pomodoroCount]);

  useEffect(() => {
    setRunning(false); setSecondsLeft(initialSeconds); setHasStartedOnce(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null; }
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((p) => (p <= 0 ? 0 : p - 1));
    }, 1000);
    return () => { if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0 && running) goToNextSession();
  }, [secondsLeft, running, goToNextSession]);

  function handleStartPause() {
    if (!running && secondsLeft === 0) setSecondsLeft(initialSeconds);
    if (!running) { setHasStartedOnce(true); notify.timerStarted(mode); }
    else { notify.timerPaused(); }
    setRunning((s) => !s);
  }

  function handleReset() {
    setSecondsLeft(initialSeconds); setHasStartedOnce(false);
    setRunning(false); setPomodoroCount(0); notify.timerReset();
  }

  // ── Tasks state ──
  const TASKS_KEY = "pomodoro_tasks_v1";
  const ACTIVE_TASK_KEY = "pomodoro_active_task_v1";

  const [tasks, setTasks] = useState<PomodoroTask[]>(() => {
    try { return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]"); } catch { return []; }
  });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    try { return localStorage.getItem(ACTIVE_TASK_KEY) || null; } catch { return null; }
  });

  function persistTasks(next: PomodoroTask[]) {
    setTasks(next); localStorage.setItem(TASKS_KEY, JSON.stringify(next));
  }
  function persistActive(id: string | null) {
    setActiveTaskId(id);
    if (id) localStorage.setItem(ACTIVE_TASK_KEY, id);
    else localStorage.removeItem(ACTIVE_TASK_KEY);
  }
  function addTask(title: string) {
    const t: PomodoroTask = { id: crypto.randomUUID(), title, createdAt: Date.now() };
    const next = [t, ...tasks]; persistTasks(next);
    if (!activeTaskId) persistActive(t.id);
  }
  function deleteTask(id: string) {
    const next = tasks.filter((t) => t.id !== id); persistTasks(next);
    if (activeTaskId === id) persistActive(next[0]?.id ?? null);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600;700&display=swap');
        .pomo-card * { box-sizing: border-box; }
        .pomo-card {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          padding: 18px 20px 14px;
          width: 100%; max-width: 480px; height: 100%; max-height: 620px;
          box-shadow: 0 30px 70px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.03);
          position: relative; overflow: hidden;
          backdrop-filter: blur(24px);
        }
        .pomo-card::before {
          content: ''; position: absolute;
          top: -80px; left: 50%; transform: translateX(-50%);
          width: 280px; height: 180px; border-radius: 50%;
          background: var(--pomo-glow); filter: blur(65px); opacity: 0.13;
          transition: background 0.6s ease; pointer-events: none;
        }
        /* Tabs */
        .pomo-tabs { 
          display: flex; gap: 4px; margin-bottom: 14px; position: relative; z-index: 1;
          }
        .pomo-tab {
          flex: 1; padding: 5px 0; border-radius: 99px;
          border: 1px solid transparent; background: transparent;
          color: rgba(255,255,255,0.3); font-size: 11.5px; font-weight: 600;
          letter-spacing: 0.09em; cursor: pointer; transition: all 0.2s ease;
          font-family: 'Outfit', sans-serif; text-transform: uppercase;
        }
        .pomo-tab:hover:not(.pt-active) { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.55); }
        .pomo-tab.pt-active { color: #fff; border-color: var(--pomo-accent-30); background: var(--pomo-tab-bg); }
        /* Clock */
        .pomo-clock-row { display: flex; justify-content: center; margin-bottom: 14px; position: relative; z-index: 1; }
        .pomo-time {
          font-family: 'DM Mono', monospace; font-size: 42px; font-weight: 400;
          letter-spacing: -0.02em; color: #fff; line-height: 1;
        }
        .pomo-mode-lbl {
          font-size: 9px; font-weight: 700; letter-spacing: 0.16em;
          color: var(--pomo-ring); margin-top: 4px;
          font-family: 'Outfit', sans-serif; text-transform: uppercase;
          transition: color 0.4s ease;
        }
        .pomo-dots { display: flex; gap: 5px; margin-top: 5px; justify-content: center; }
        .pomo-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.15); transition: background 0.3s ease; }
        .pomo-dot.pd-filled { background: var(--pomo-dot); }
        /* Controls */
        .pomo-controls { display: flex; gap: 8px; margin-bottom: 18px; position: relative; z-index: 1; }
        .pomo-btn-start {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 10px 0; border-radius: 12px; border: none; margin-bottom: 6px;
          background: var(--pomo-accent); color: #fff; font-size: 12px; font-weight: 700;
          letter-spacing: 0.06em; cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 6px 20px var(--pomo-glow-btn); font-family: 'Outfit', sans-serif;
        }
        .pomo-btn-start:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .pomo-btn-start:active { transform: scale(0.98); }
        .pomo-btn-reset {
          width: 42px; height: 42px; display: grid; place-items: center;
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4);
          cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
        }
        .pomo-btn-reset:hover:not(:disabled) { background: rgba(255,255,255,0.09); color: #fff; }
        .pomo-btn-reset:disabled { opacity: 0.25; cursor: not-allowed; }
      `}</style>

      <div
        className="pomo-card"
        style={{
          "--pomo-ring":      theme.ring,
          "--pomo-glow":      theme.glow,
          "--pomo-accent":    theme.accent,
          "--pomo-accent-30": `${theme.accent}55`,
          "--pomo-tab-bg":    theme.tab,
          "--pomo-dot":       theme.dot,
          "--pomo-glow-btn":  theme.glowBtn,
        } as React.CSSProperties}
      >
        {/* ── Mode tabs ── */}
        <div className="pomo-tabs">
          {MODES.map((m) => (
            <button
              key={m.key}
              className={`pomo-tab${mode === m.key ? " pt-active" : ""}`}
              onClick={() => { if (running) { notify.timerPaused(); return; } setMode(m.key); }}
              title={running && mode !== m.key ? "Pause to switch" : ""}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ── Clock face ── */}
        <div className="pomo-clock-row">
          <ClockFace progress={secondsLeft / initialSeconds} mode={mode}>
            <div className="pomo-time">{formatMMSS(secondsLeft)}</div>
            <div className="pomo-mode-lbl">{selected.label}</div>
            {mode === "focus" && (
              <div className="pomo-dots">
                {Array.from({ length: CYCLE }, (_, i) => (
                  <div key={i} className={`pomo-dot${i < pomodoroCount ? " pd-filled" : ""}`} />
                ))}
              </div>
            )}
          </ClockFace>
        </div>

        {/* ── Controls ── */}
        <div className="pomo-controls">
          <button className="pomo-btn-start" onClick={handleStartPause}>
            {running ? (
              <>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
                  <rect x="1" y="1" width="3" height="9" rx="0.8"/>
                  <rect x="7" y="1" width="3" height="9" rx="0.8"/>
                </svg>
                PAUSE
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
                  <path d="M2 1.5l7.5 4L2 9.5V1.5z"/>
                </svg>
                START
              </>
            )}
          </button>

          <button
            className="pomo-btn-reset"
            onClick={handleReset}
            disabled={!hasStartedOnce}
            title={!hasStartedOnce ? "Start the timer first" : "Reset"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>

        <PomodoroTasks
          running={running}
          mode={mode}
          tasks={tasks}
          activeTaskId={activeTaskId}
          onAdd={addTask}
          onSetActive={persistActive}
          onDelete={deleteTask}
          accentColor={theme.accent}
        />
      </div>
    </>
  );
}