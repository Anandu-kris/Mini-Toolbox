import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PomodoroSettings, { type PomodoroDurations } from "./PomodoroSettings";
import { Settings } from "lucide-react";
import PomodoroTasks, {
  type PomodoroTask,
} from "@/components/Pomodoro/PomodorTasks";
import { notify } from "@/lib/pomodoro_notify";

type Mode = "focus" | "short" | "long";

type ModeDef = {
  key: Mode;
  title: string;
  mins: number;
  icon: "target" | "shortBreak" | "longBreak";
};

const STORAGE_KEY = "pomodoro_durations_v1";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMMSS(totalSeconds: number) {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${pad2(mm)}:${pad2(ss)}`;
}

/** Icons (keep your existing ones; you can swap shortBreak SVG later) */
function Icon({
  name,
  className = "",
}: {
  name: "target" | "shortBreak" | "longBreak";
  className?: string;
}) {
  if (name === "target") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="12" cy="12" r="9" opacity="0.75" />
        <circle cx="12" cy="12" r="5" opacity="0.6" />
        <circle cx="12" cy="12" r="1.7" />
      </svg>
    );
  }

  if (name === "shortBreak") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2h12" opacity="0.8" />
        <path d="M6 22h12" opacity="0.8" />
        <path d="M8 2v4c0 2.2 2.3 4 4 5-1.7 1-4 2.8-4 5v6" />
        <path d="M16 2v4c0 2.2-2.3 4-4 5 1.7 1 4 2.8 4 5v6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
      <path d="M16 10h2a2 2 0 0 1 0 4h-2" />
      <path d="M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4" opacity="0.7" />
    </svg>
  );
}

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("focus");
  const [running, setRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const CYCLE = 4;

  const [durations, setDurations] = useState<PomodoroDurations>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return { focus: 25, short: 5, long: 20 };

      const parsed = JSON.parse(saved);

      // safety fallback
      return {
        focus: Number(parsed.focus) || 25,
        short: Number(parsed.short) || 5,
        long: Number(parsed.long) || 20,
      };
    } catch {
      return { focus: 25, short: 5, long: 20 };
    }
  });

  //  settings dialog state
  const [settingsOpen, setSettingsOpen] = useState(false);

  //  build MODES from durations (dynamic)
  const MODES: ModeDef[] = useMemo(
    () => [
      { key: "focus", title: "Focus", mins: durations.focus, icon: "target" },
      {
        key: "short",
        title: "Short break",
        mins: durations.short,
        icon: "shortBreak",
      },
      {
        key: "long",
        title: "Long break",
        mins: durations.long,
        icon: "longBreak",
      },
    ],
    [durations],
  );

  const goToNextSession = useCallback(() => {
    setRunning(false);

    let nextMode: Mode = "focus";

    if (mode === "focus") {
      const nextCount = pomodoroCount + 1;
      setPomodoroCount(nextCount);

      nextMode = nextCount % CYCLE === 0 ? "long" : "short";
    } else {
      nextMode = "focus";
    }

    notify.sessionComplete(mode);
    notify.modeChanged(nextMode);

    setMode(nextMode);

    // auto start next session
    setTimeout(() => {
      setRunning(true);
      setHasStartedOnce(true);
      notify.timerStarted(nextMode);
    }, 400);
  }, [mode, pomodoroCount]);

  // track seconds remaining
  const selected = useMemo(
    () => MODES.find((m) => m.key === mode)!,
    [MODES, mode],
  );
  const initialSeconds = selected.mins * 60;

  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setRunning(false);
    setSecondsLeft(initialSeconds);
    setHasStartedOnce(false);
  }, [initialSeconds]);

  // Countdown effect
  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!running) return;

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0 && running) {
      goToNextSession();
    }
  }, [secondsLeft, running, goToNextSession]);

  const display = formatMMSS(secondsLeft);
  const canReset = hasStartedOnce;

  function handleStartPause() {
    if (!running && secondsLeft === 0) setSecondsLeft(initialSeconds);

    if (!running) {
      setHasStartedOnce(true);
      notify.timerStarted(mode);
    } else {
      notify.timerPaused();
    }

    setRunning((s) => !s);
  }

  function handleReset() {
    setSecondsLeft(initialSeconds);
    setHasStartedOnce(false);
    setRunning(false);
    setPomodoroCount(0);
    notify.timerReset();
  }

  function openSettings() {
    // optional rule: block opening while running
    if (running) return;
    setSettingsOpen(true);
  }

  //Tasks
  const TASKS_KEY = "pomodoro_tasks_v1";
  const ACTIVE_TASK_KEY = "pomodoro_active_task_v1";

  function uid() {
    return crypto.randomUUID();
  }

  const [tasks, setTasks] = useState<PomodoroTask[]>(() => {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      return raw ? (JSON.parse(raw) as PomodoroTask[]) : [];
    } catch {
      return [];
    }
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_TASK_KEY) || null;
    } catch {
      return null;
    }
  });

  function persistTasks(next: PomodoroTask[]) {
    setTasks(next);
    localStorage.setItem(TASKS_KEY, JSON.stringify(next));
  }

  function persistActive(id: string | null) {
    setActiveTaskId(id);
    if (id) localStorage.setItem(ACTIVE_TASK_KEY, id);
    else localStorage.removeItem(ACTIVE_TASK_KEY);
  }

  function addTask(title: string) {
    const nextTask: PomodoroTask = { id: uid(), title, createdAt: Date.now() };
    const next = [nextTask, ...tasks];
    persistTasks(next);

    // if no active task, set it automatically
    if (!activeTaskId) persistActive(nextTask.id);
  }

  function deleteTask(id: string) {
    const next = tasks.filter((t) => t.id !== id);
    persistTasks(next);

    if (activeTaskId === id) {
      persistActive(next[0]?.id ?? null);
    }
  }

  return (
    <div className="min-h-[420px] w-full">
      <div className="relative mx-auto w-full overflow-hidden rounded-2xl px-6 py-10 md:px-40 md:py-14">
        {/* settings icon top-right */}
        <button
          onClick={openSettings}
          title={running ? "Pause timer to open settings" : "Settings"}
          className={[
            "absolute right-14 top-2 z-20 grid h-11 w-11 place-items-center rounded-xl",
            "border border-white/10 bg-white/5 text-white/70 backdrop-blur-xl",
            "shadow-[0_14px_40px_rgba(0,0,0,0.25)]",
            "transition hover:bg-white/10 hover:text-white active:scale-[0.99]",
            running ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* settings dialog */}
        <PomodoroSettings
          open={settingsOpen}
          initial={durations}
          onClose={() => setSettingsOpen(false)}
          onSave={(next) => {
            setDurations(next);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          }}
        />

        {/* star dots overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)",
              backgroundSize: "70px 70px",
              backgroundPosition: "0 0",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "110px 110px",
              backgroundPosition: "30px 10px",
            }}
          />
        </div>

        {/* content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* big time */}
          <div className="select-none text-[72px] font-semibold tracking-tight text-white sm:text-[92px] md:text-[120px]">
            {display}
          </div>
          <div className="mt-2 text-sm text-white/70">
            {mode === "focus" && (
              <span>
                Pomodoro {Math.min(pomodoroCount + (running ? 1 : 0), CYCLE)} /{" "}
                {CYCLE}
              </span>
            )}
          </div>

          {/* buttons row */}
          <div className="mt-5 flex items-center gap-8">
            <button
              onClick={handleStartPause}
              className={[
                "rounded-full px-14 py-3 text-sm font-medium text-white",
                "bg-linear-to-r from-purple-600 to-fuchsia-600",
                "shadow-[0_12px_30px_rgba(124,58,237,0.35)]",
                "border border-white/10",
                "transition active:scale-[0.99] hover:brightness-110",
              ].join(" ")}
            >
              {running ? "Pause" : "Start"}
            </button>

            <button
              onClick={handleReset}
              disabled={!canReset}
              className={[
                "rounded-full px-14 py-3 text-sm font-medium",
                "border border-white/12 bg-white/5 text-white/80 backdrop-blur-xl",
                "transition active:scale-[0.99] hover:bg-white/8",
                !canReset ? "cursor-not-allowed opacity-40" : "",
              ].join(" ")}
              title={
                !canReset
                  ? "Reset is enabled after the timer starts ticking"
                  : "Reset"
              }
            >
              Reset
            </button>
          </div>

          {/* mode cards */}
          <div className="mt-10 grid w-full grid-cols-1 gap-4 md:mt-12 md:grid-cols-3">
            {MODES.map((m) => {
              const active = m.key === mode;
              const shouldPulse = running && active && m.key === "focus";

              return (
                <button
                  key={m.key}
                  title={running && !active ? "Pause timer to switch mode" : ""}
                  onClick={() => {
                    if (running) {
                      notify.timerPaused(); 
                      return;
                    }
                    setMode(m.key);
                  }}
                  className={[
                    "group relative w-full rounded-xl p-4 text-left",
                    "border border-white/10 bg-white/5 backdrop-blur-xl",
                    "shadow-[0_16px_50px_rgba(0,0,0,0.25)]",
                    "transition",
                    !running && "hover:bg-white/7 cursor-pointer",
                    running && !active && "opacity-50 cursor-not-allowed",
                    active ? "ring-1 ring-purple-500/55 bg-white/6" : "ring-0",
                  ].join(" ")}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-b from-white/6 to-transparent opacity-60" />

                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-white/80">{m.title}</div>
                      <div className="mt-1 text-lg font-semibold text-white">
                        {m.mins} min
                      </div>
                    </div>

                    <div
                      className={[
                        "grid h-12 w-12 place-items-center rounded-lg",
                        "border border-white/10 bg-white/5 text-white/70",
                        active ? "text-white" : "",
                      ].join(" ")}
                    >
                      <Icon
                        name={m.icon}
                        className={[
                          "h-6 w-6 transition",
                          shouldPulse
                            ? "animate-soft-pulse text-purple-200"
                            : "",
                        ].join(" ")}
                      />
                    </div>
                  </div>

                  {active && (
                    <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
          <PomodoroTasks
            running={running}
            mode={mode}
            tasks={tasks}
            activeTaskId={activeTaskId}
            onAdd={addTask}
            onSetActive={(id) => persistActive(id)}
            onDelete={deleteTask}
          />
        </div>
      </div>
    </div>
  );
}
