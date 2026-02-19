import { useEffect, useState } from "react";

export type PomodoroDurations = {
  focus: number; // minutes
  short: number; // minutes
  long: number; // minutes
};

type PomodoroFormState = {
  focus: number | "";
  short: number | "";
  long: number | "";
};

type PomodoroSettingsProps = {
  open: boolean;
  initial: PomodoroDurations;
  onClose: () => void;
  onSave: (next: PomodoroDurations) => void;
};

export default function PomodoroSettings({
  open,
  initial,
  onClose,
  onSave,
}: PomodoroSettingsProps) {
  const [form, setForm] = useState<PomodoroFormState>(initial);

  // Reset draft when dialog opens (or initial changes)
  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  // Close on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!open) return null;

  function clampMinutes(v: number) {
    if (!Number.isFinite(v)) return 1;
    return Math.max(1, Math.min(180, Math.floor(v)));
  }

  function handleChange(key: keyof PomodoroFormState, raw: string) {
    // allow empty typing temporarily -> treat as 1 on save
    const num = raw === "" ? NaN : Number(raw);
    setForm((prev) => ({
      ...prev,
      [key]: Number.isNaN(num) ? "" : clampMinutes(num),
    }));
  }

  function normalizeAndSave() {
    const next: PomodoroDurations = {
      focus: clampMinutes(form.focus === "" ? 0 : form.focus),
      short: clampMinutes(form.short === "" ? 0 : form.short),
      long: clampMinutes(form.long === "" ? 0 : form.long),
    };

    onSave(next);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        // click outside to close
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[480px] rounded-2xl border border-white/10 bg-[#1b1333]/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Timer Settings</h2>
            <p className="mt-1 text-sm text-white/60">
              Change durations (in minutes)
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <Field
            label="Focus"
            value={form.focus}
            onChange={(v) => handleChange("focus", v)}
          />
          <Field
            label="Short break"
            value={form.short}
            onChange={(v) => handleChange("short", v)}
          />
          <Field
            label="Long break"
            value={form.long}
            onChange={(v) => handleChange("long", v)}
          />
        </div>

        <div className="mt-8 flex justify-between gap-3">
          <button
            onClick={() => setForm(initial)}
            className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 hover:bg-red-400/80"
          >
            Reset
          </button>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              onClick={normalizeAndSave}
              className="rounded-full bg-linear-to-r from-purple-600 to-fuchsia-600 px-7 py-2 text-sm font-medium text-white shadow-[0_12px_30px_rgba(124,58,237,0.35)] hover:brightness-110 active:scale-[0.99]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | "";
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-white/70">{label} (min)</span>
      <input
        type="number"
        min={1}
        max={180}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40"
      />
    </label>
  );
}
