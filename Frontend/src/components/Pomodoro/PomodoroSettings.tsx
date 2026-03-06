// src/components/Pomodoro/PomodoroSettings.tsx
import { useEffect, useState } from "react";
import { X, Timer, Coffee, Moon } from "lucide-react";

export type PomodoroDurations = {
  focus: number;
  short: number;
  long: number;
};

type FormState = { focus: number | ""; short: number | ""; long: number | "" };

type Props = {
  open: boolean;
  initial: PomodoroDurations;
  onClose: () => void;
  onSave: (next: PomodoroDurations) => void;
};

const FIELD_META = [
  { key: "focus" as const, label: "Focus",       sub: "Deep work session",   icon: Timer,  color: "#818cf8", min: 1, max: 180 },
  { key: "short" as const, label: "Short Break",  sub: "Quick rest",          icon: Coffee, color: "#34d399", min: 1, max: 60  },
  { key: "long"  as const, label: "Long Break",   sub: "Extended recovery",   icon: Moon,   color: "#a78bfa", min: 1, max: 120 },
];

const PRESETS: { label: string; values: PomodoroDurations }[] = [
  { label: "Classic",   values: { focus: 25, short: 5,  long: 20 } },
  { label: "Extended",  values: { focus: 50, short: 10, long: 30 } },
  { label: "Sprint",    values: { focus: 15, short: 3,  long: 15 } },
];

export default function PomodoroSettings({ open, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(initial);

  useEffect(() => { if (open) setForm(initial); }, [open, initial]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  function clamp(v: number) {
    if (!Number.isFinite(v)) return 1;
    return Math.max(1, Math.min(180, Math.floor(v)));
  }

  function handleChange(key: keyof FormState, raw: string) {
    const num = raw === "" ? NaN : Number(raw);
    setForm(prev => ({ ...prev, [key]: Number.isNaN(num) ? "" : clamp(num) }));
  }

  function applyPreset(p: PomodoroDurations) { setForm(p); }

  function save() {
    onSave({
      focus: clamp(form.focus === "" ? 0 : form.focus),
      short: clamp(form.short === "" ? 0 : form.short),
      long:  clamp(form.long  === "" ? 0 : form.long),
    });
    onClose();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .ps-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: grid; place-items: center;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          animation: psOverlayIn 0.2s ease both;
        }

        @keyframes psOverlayIn {
          from { opacity:0; } to { opacity:1; }
        }

        .ps-dialog {
          font-family: 'Sora', sans-serif;
          width: 480px;
          max-width: calc(100vw - 32px);
          background: #0f0c1e;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
          animation: psDialogIn 0.25s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes psDialogIn {
          from { opacity:0; transform:translateY(16px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)     scale(1); }
        }

        .ps-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }

        .ps-title { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .ps-sub   { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 2px; }

        .ps-close {
          width: 32px; height: 32px; border-radius: 9px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: rgba(255,255,255,0.4); transition: all 0.2s;
        }
        .ps-close:hover { background: rgba(255,80,80,0.12); border-color: rgba(255,80,80,0.25); color: #ff6b6b; }

        /* Presets */
        .ps-presets {
          display: flex; gap: 8px; margin-bottom: 24px;
        }

        .ps-preset {
          flex: 1; height: 32px; border-radius: 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 500;
          color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s;
        }
        .ps-preset:hover { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.25); color: #a78bfa; }
        .ps-preset.active { background: rgba(99,102,241,0.16); border-color: rgba(99,102,241,0.35); color: #c4b5fd; }

        /* Field cards */
        .ps-field {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: border-color 0.2s;
        }

        .ps-field:focus-within { border-color: rgba(99,102,241,0.3); }

        .ps-field-icon {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .ps-field-info { flex: 1; }
        .ps-field-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); }
        .ps-field-sub   { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 1px; }

        .ps-field-input-wrap {
          display: flex; align-items: center; gap: 6px;
        }

        .ps-input {
          width: 68px; height: 38px;
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: #fff !important;
          font-family: 'Sora', sans-serif !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          text-align: center;
          outline: none;
          transition: all 0.2s;
          -moz-appearance: textfield;
        }

        .ps-input::-webkit-inner-spin-button,
        .ps-input::-webkit-outer-spin-button { -webkit-appearance: none; }

        .ps-input:focus {
          border-color: rgba(99,102,241,0.5) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
        }

        .ps-unit {
          font-size: 11px; color: rgba(255,255,255,0.3);
          font-family: 'Sora', sans-serif;
        }

        /* Stepper buttons */
        .ps-step {
          width: 26px; height: 26px; border-radius: 7px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5); cursor: pointer; font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; font-family: monospace;
        }
        .ps-step:hover { background: rgba(255,255,255,0.1); color: #fff; }

        /* Footer buttons */
        .ps-footer {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 24px;
        }

        .ps-btn-reset {
          height: 40px; padding: 0 18px; border-radius: 10px;
          background: rgba(255,80,80,0.07); border: 1px solid rgba(255,80,80,0.15);
          color: rgba(255,107,107,0.7); font-family: 'Sora', sans-serif;
          font-size: 13px; cursor: pointer; transition: all 0.2s;
        }
        .ps-btn-reset:hover { background: rgba(255,80,80,0.14); color: #ff6b6b; border-color: rgba(255,80,80,0.3); }

        .ps-footer-right { display: flex; gap: 8px; }

        .ps-btn-cancel {
          height: 40px; padding: 0 18px; border-radius: 10px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.55); font-family: 'Sora', sans-serif;
          font-size: 13px; cursor: pointer; transition: all 0.2s;
        }
        .ps-btn-cancel:hover { background: rgba(255,255,255,0.09); color: #fff; }

        .ps-btn-save {
          height: 40px; padding: 0 24px; border-radius: 10px;
          background: linear-gradient(135deg,#6366f1,#4f46e5);
          border: none; color: #fff; font-family: 'Sora', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          box-shadow: 0 4px 16px rgba(99,102,241,0.4);
          transition: all 0.2s;
        }
        .ps-btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.5); }
      `}</style>

      <div className="ps-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="ps-dialog">
          {/* Header */}
          <div className="ps-header">
            <div>
              <div className="ps-title">Timer Settings</div>
              <div className="ps-sub">Adjust durations to fit your flow</div>
            </div>
            <button className="ps-close" onClick={onClose}><X size={14}/></button>
          </div>

          {/* Presets */}
          <div className="ps-presets">
            {PRESETS.map(p => {
              const active = form.focus === p.values.focus && form.short === p.values.short && form.long === p.values.long;
              return (
                <button key={p.label} className={`ps-preset ${active ? "active" : ""}`} onClick={() => applyPreset(p.values)}>
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Fields */}
          {FIELD_META.map(f => {
            const Icon = f.icon;
            const val  = form[f.key];
            const num  = typeof val === "number" ? val : 1;
            return (
              <div key={f.key} className="ps-field">
                <div className="ps-field-icon" style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                  <Icon size={16} color={f.color}/>
                </div>
                <div className="ps-field-info">
                  <div className="ps-field-label">{f.label}</div>
                  <div className="ps-field-sub">{f.sub}</div>
                </div>
                <div className="ps-field-input-wrap">
                  <button className="ps-step" onClick={() => handleChange(f.key, String(Math.max(f.min, num - 1)))}>−</button>
                  <input
                    className="ps-input"
                    type="number"
                    min={f.min}
                    max={f.max}
                    value={val}
                    onChange={e => handleChange(f.key, e.target.value)}
                  />
                  <button className="ps-step" onClick={() => handleChange(f.key, String(Math.min(f.max, num + 1)))}>+</button>
                  <span className="ps-unit">min</span>
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div className="ps-footer">
            <button className="ps-btn-reset" onClick={() => setForm(initial)}>Reset</button>
            <div className="ps-footer-right">
              <button className="ps-btn-cancel" onClick={onClose}>Cancel</button>
              <button className="ps-btn-save" onClick={save}>Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}