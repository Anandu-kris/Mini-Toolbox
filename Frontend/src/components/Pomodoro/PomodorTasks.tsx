// src/components/Pomodoro/PomodoroTasks.tsx
import { Plus, Trash2, Lock, CheckCircle2, ChevronDown } from "lucide-react";
import { useState } from "react";

export type PomodoroTask = {
  id: string;
  title: string;
  createdAt: number;
};

type Props = {
  running: boolean;
  mode: "focus" | "short" | "long";
  activeTaskId: string | null;
  tasks: PomodoroTask[];
  onAdd: (title: string) => void;
  onSetActive: (id: string) => void;
  onDelete: (id: string) => void;
  /** The accent color from the current mode theme, e.g. "#3b82f6" */
  accentColor?: string;
};

export default function PomodoroTasks({
  running,
  mode,
  activeTaskId,
  tasks,
  onAdd,
  onSetActive,
  onDelete,
  accentColor = "#3b82f6",
}: Props) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const isLocked = running && mode === "focus";
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  function handleAdd() {
    const title = draft.trim();
    if (!title) return;
    onAdd(title);
    setDraft("");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        .ptasks-wrap { font-family: 'Outfit', sans-serif; width: 100%; }

        /* ── Accordion header ── */
        .ptasks-accordion-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 0;
          background: transparent; border: none; cursor: pointer;
          border-top: 1px solid rgba(255,255,255,0.09);
        }

        .ptasks-accordion-left {
          display: flex; align-items: center; gap: 8px;
          min-width: 0; /* allow text truncation */
        }

        .ptasks-label {
          font-size: 14px; font-weight: 600; letter-spacing: 0.13em;
          text-transform: uppercase; color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }

        .ptasks-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 17px; height: 17px; border-radius: 99px;
          font-size: 12px; font-weight: 700;
          padding: 0 4px; flex-shrink: 0;
          transition: background 0.4s ease, border-color 0.4s ease, color 0.4s ease;
        }

        .ptasks-active-preview {
          font-size: 12px; color: rgba(255,255,255,0.38);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .ptasks-chevron {
          flex-shrink: 0; margin-left: 8px;
          transition: transform 0.25s cubic-bezier(.4,0,.2,1);
          color: rgba(255,255,255,0.3);
        }
        .ptasks-chevron.open { transform: rotate(180deg); }

        /* ── Accordion body ── */
        .ptasks-body {
          overflow: hidden;
          transition: max-height 0.32s cubic-bezier(.4,0,.2,1);
        }

        .ptasks-body-inner { padding-bottom: 4px; }

        /* ── Lock banner ── */
        .ptasks-lock-banner {
          display: flex; align-items: center; gap: 8px;
          background: rgba(129,140,248,0.08);
          border: 1px solid rgba(129,140,248,0.18);
          border-radius: 10px; padding: 8px 12px;
          margin-bottom: 10px;
          font-size: 12px; color: rgba(129,140,248,0.9);
          animation: ptFadeIn 0.25s ease both;
        }

        @keyframes ptFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Add row ── */
        .ptasks-add-row { display: flex; gap: 7px; margin-bottom: 9px; }

        .ptasks-input {
          flex: 1; height: 36px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          padding: 0 12px;
          outline: none;
          transition: all 0.2s;
        }
        .ptasks-input::placeholder { color: rgba(255,255,255,0.2); }
        .ptasks-input:focus:not(:disabled) {
          border-color: var(--pt-accent-40, rgba(59,130,246,0.4));
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px var(--pt-accent-10, rgba(59,130,246,0.1));
        }
        .ptasks-input:disabled { opacity: 0.4; cursor: not-allowed; }

        .ptasks-add-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--pt-accent-14, rgba(59,130,246,0.14));
          border: 1px solid var(--pt-accent-28, rgba(59,130,246,0.28));
          color: var(--pt-accent, #3b82f6);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .ptasks-add-btn:hover:not(:disabled) {
          background: var(--pt-accent-24, rgba(59,130,246,0.24));
        }
        .ptasks-add-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── Task list ── */
        .ptasks-list {
          display: flex; flex-direction: column; gap: 5px;
          max-height: 148px; overflow-y: auto;
        }
        .ptasks-list::-webkit-scrollbar { width: 3px; }
        .ptasks-list::-webkit-scrollbar-track { background: transparent; }
        .ptasks-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        .ptask-row {
          display: flex; align-items: center; gap: 9px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 7px 10px;
          transition: all 0.2s; cursor: pointer;
        }
        .ptask-row:hover:not(.locked-inactive) {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }
        .ptask-row.active {
          background: var(--pt-accent-10, rgba(59,130,246,0.1));
          border-color: var(--pt-accent-35, rgba(59,130,246,0.35));
        }
        .ptask-row.locked-inactive { opacity: 0.4; cursor: not-allowed; }

        .ptask-indicator {
          width: 13px; height: 13px; border-radius: 50%; flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .ptask-indicator.active {
          border-color: var(--pt-accent, #3b82f6);
          background: var(--pt-accent, #3b82f6);
        }
        .ptask-indicator-dot {
          width: 4px; height: 4px; border-radius: 50%; background: #fff;
        }

        .ptask-title {
          flex: 1; font-size: 14px; color: rgba(255,255,255,0.55);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          transition: color 0.2s; text-align: left;
        }
        .ptask-row.active .ptask-title { color: #fff; font-weight: 600; }

        .ptask-delete {
          width: 34px; height: 34px; border-radius: 7px;
          background: transparent; border: 1px solid transparent;
          color: rgba(255,255,255,0.5); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .ptask-delete:hover:not(:disabled) {
          background: rgba(248,113,113,0.1);
          border-color: rgba(248,113,113,0.25);
          color: #f87171;
        }
        .ptask-delete:disabled { opacity: 0.2; cursor: not-allowed; }

        /* ── Empty state ── */
        .ptasks-empty {
          text-align: center; padding: 16px 12px;
          font-size: 10.5px; color: rgba(255,255,255,0.2);
          border: 1px dashed rgba(255,255,255,0.07);
          border-radius: 10px;
          display: flex; flex-direction: column; align-items: center; gap: 5px;
        }
      `}</style>

      <div
        className="ptasks-wrap"
        style={{
          "--pt-accent":      accentColor,
          "--pt-accent-10":   `${accentColor}1a`,
          "--pt-accent-14":   `${accentColor}24`,
          "--pt-accent-24":   `${accentColor}3d`,
          "--pt-accent-28":   `${accentColor}47`,
          "--pt-accent-35":   `${accentColor}59`,
          "--pt-accent-40":   `${accentColor}66`,
          "--pt-accent-40b":  `${accentColor}1a`,  // badge bg
        } as React.CSSProperties}
      >
        {/* ── Accordion header ── */}
        <button className="ptasks-accordion-btn" onClick={() => setOpen((o) => !o)}>
          <div className="ptasks-accordion-left">
            <span className="ptasks-label">Tasks</span>

            {tasks.length > 0 && (
              <span
                className="ptasks-badge"
                style={{
                  background: `${accentColor}28`,
                  border: `1px solid ${accentColor}44`,
                  color: accentColor,
                }}
              >
                {tasks.length}
              </span>
            )}

            {/* Active task preview when collapsed */}
            {!open && activeTask && (
              <span className="ptasks-active-preview">— {activeTask.title}</span>
            )}
          </div>

          <ChevronDown
            size={14}
            className={`ptasks-chevron${open ? " open" : ""}`}
          />
        </button>

        <div
          className="ptasks-body"
          style={{ maxHeight: open ? "320px" : "0px" }}
        >
          <div className="ptasks-body-inner">

            {/* Lock banner */}
            {isLocked && (
              <div className="ptasks-lock-banner">
                <Lock size={11} />
                Task editing locked during Focus — stay in the zone
              </div>
            )}

            {/* Add row */}
            <div className="ptasks-add-row">
              <input
                className="ptasks-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What are you working on?"
                disabled={isLocked}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              />
              <button
                className="ptasks-add-btn"
                onClick={handleAdd}
                disabled={isLocked || !draft.trim()}
                title={isLocked ? "Locked during focus" : "Add task"}
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* List */}
            <div className="ptasks-list">
              {tasks.length === 0 ? (
                <div className="ptasks-empty">
                  <CheckCircle2 size={18} color="rgba(255,255,255,0.12)" />
                  <span>No tasks yet — add one above</span>
                </div>
              ) : (
                tasks.map((t) => {
                  const isActive = t.id === activeTaskId;
                  const lockedInactive = isLocked && !isActive;
                  return (
                    <div
                      key={t.id}
                      className={`ptask-row${isActive ? " active" : ""}${lockedInactive ? " locked-inactive" : ""}`}
                      onClick={() => { if (!isLocked) onSetActive(t.id); }}
                      title={isLocked && !isActive ? "Locked during focus" : undefined}
                    >
                      <div className={`ptask-indicator${isActive ? " active" : ""}`}>
                        {isActive && <div className="ptask-indicator-dot" />}
                      </div>

                      <span className="ptask-title">{t.title}</span>

                      <button
                        className="ptask-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!(isLocked && isActive)) onDelete(t.id);
                        }}
                        disabled={isLocked && isActive}
                        title={
                          isLocked && isActive
                            ? "Can't delete active task during focus"
                            : "Delete task"
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}