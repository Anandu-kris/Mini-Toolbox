import { useState } from "react";
import PomodoroTimer from "@/components/Pomodoro/PomodoroTimer";
import PomodoroSettings, { type PomodoroDurations } from "@/components/Pomodoro/PomodoroSettings";
import { Settings, Timer, Brain, Coffee, Target } from "lucide-react";

const STORAGE_KEY = "pomodoro_durations_v1";

function loadDurations(): PomodoroDurations {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { focus: 25, short: 5, long: 20 };
    const p = JSON.parse(saved);
    return { focus: Number(p.focus) || 25, short: Number(p.short) || 5, long: Number(p.long) || 20 };
  } catch { return { focus: 25, short: 5, long: 20 }; }
}

const features = [
  {
    icon: Brain, title: "Deep Work Cycles",
    desc: "Structure your sessions around 25-minute bursts of uninterrupted focus — the exact sweet spot for peak cognitive performance.",
    color: "#60a5fa", bg: "rgba(59,130,246,0.1)",
  },
  {
    icon: Coffee, title: "Intentional Rest",
    desc: "Short breaks recharge your working memory. Long breaks every 4 sessions let your brain consolidate what you've learned.",
    color: "#34d399", bg: "rgba(52,211,153,0.1)",
  },
  {
    icon: Target, title: "Task-Linked Sessions",
    desc: "Attach tasks to your timer so every pomodoro has a clear purpose. Watch your to-do list shrink session by session.",
    color: "#a78bfa", bg: "rgba(139,92,246,0.1)",
  },
];


const PomodoroPage = () => {
  const [durations, setDurations] = useState<PomodoroDurations>(loadDurations);
  const [settingsOpen, setSettingsOpen] = useState(false);

  function saveDurations(next: PomodoroDurations) {
    setDurations(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pp-shell {
          height: 100vh;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          position: relative;
          font-family: 'Sora', sans-serif;
          margin-top: -20px;
        }

        /* Subtle dot grid */
        .pp-shell::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .pp-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 120px;
          max-width: 1280px;
          width: 100%;
          padding: 0 40px;
          position: relative; z-index: 1;
        }

        @media (max-width: 860px) {
          .pp-shell { height: auto; overflow: auto; padding: 40px 0; }
          .pp-inner { grid-template-columns: 1fr; gap: 40px; padding: 0 20px; }
          .pp-left { align-items: center; text-align: center; }
          .pp-stats { justify-content: center; }
        }

        /* LEFT COLUMN */
        .pp-left { 
        display: flex; flex-direction: column;
        animation: uspFade 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes uspFade {
          from { opacity:0; transform:translateX(-24px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .pp-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.2);
          border-radius: 99px; padding: 4px 13px 4px 5px;
          margin-bottom: 18px; width: fit-content;
        }
        .pp-badge-icon {
          width: 20px; height: 20px; border-radius: 50%;
          background: linear-gradient(135deg,#3b82f6,#1d4ed8);
          display: flex; align-items: center; justify-content: center;
        }
        .pp-badge-text {
          font-size: 10px; font-weight: 700; color: #93c5fd;
          letter-spacing: 0.1em; font-family: 'Sora', sans-serif;
          text-transform: uppercase;
        }

        .pp-headline {
          font-size: clamp(32px, 4.5vw, 54px);
          font-weight: 900; line-height: 1.0;
          letter-spacing: -0.04em; color: #fff;
          margin-bottom: 2px;
        }
        .pp-headline-accent {
          background: linear-gradient(125deg, #60a5fa 0%, #a78bfa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pp-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; color: rgba(255,255,255,0.42);
          line-height: 1.75; margin: 15px 0 24px;
          max-width: 380px;
        }

        .pp-stats {
          display: flex; gap: 0; align-items: stretch;
          margin-bottom: 24px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden; width: fit-content;
        }
        .pp-stat {
          display: flex; flex-direction: column; gap: 2px;
          padding: 12px 20px;
          background: rgba(255,255,255,0.025);
        }
        .pp-stat + .pp-stat { border-left: 1px solid rgba(255,255,255,0.07); }
        .pp-stat-val {
          font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800;
          color: #fff; letter-spacing: -0.03em; line-height: 1;
        }
        .pp-stat-lbl {
          font-family: 'DM Sans', sans-serif; font-size: 10px;
          color: rgba(255,255,255,0.32); text-transform: uppercase;
          letter-spacing: 0.07em; font-weight: 500;
        }

        .pp-features { display: flex; flex-direction: column; gap: 8px; }
        .pp-feature {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 11px 13px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: background 0.2s;
        }
        .pp-feature:hover { background: rgba(255,255,255,0.035); }
        .pp-feat-icon {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .pp-feat-title {
          font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 700;
          color: #fff; margin-bottom: 2px;
        }
        .pp-feat-desc {
          font-family: 'DM Sans', sans-serif; font-size: 11.5px;
          color: rgba(255,255,255,0.37); line-height: 1.6;
        }

        /* Settings button */
        .pp-settings-btn {
          position: absolute; top: 96px; right: 46px;
          width: 38px; height: 38px; display: grid; place-items: center;
          border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.55);
          cursor: pointer; transition: all 0.2s; z-index: 50;
          backdrop-filter: blur(12px);
        }
        .pp-settings-btn:hover { background: rgba(255,255,255,0.09); color: #fff; }

        /* RIGHT COLUMN */
        .pp-right { 
            display: flex; justify-content: center;
            animation: uspFadeRight 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both;
        }
            
        @keyframes uspFadeRight {
          from { opacity:0; transform:translateX(24px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>

      {/* Settings  */}
      <button className="pp-settings-btn" onClick={() => setSettingsOpen(true)} title="Settings">
        <Settings size={16} />
      </button>

      <PomodoroSettings
        open={settingsOpen}
        initial={durations}
        onClose={() => setSettingsOpen(false)}
        onSave={saveDurations}
      />

      <div className="pp-shell">

        <div className="pp-inner">
          {/* LEFT */}
          <div className="pp-left">
            <div className="pp-badge">
              <div className="pp-badge-icon"><Timer size={11} color="#fff" /></div>
              <span className="pp-badge-text">Pomodoro Timer</span>
            </div>

            <h1 className="pp-headline">
              Deep focus.<br />
              <span className="pp-headline-accent">Big results.</span>
            </h1>

            <p className="pp-sub">
              Transform scattered hours into laser-focused sessions. Work in timed sprints,
              rest intentionally, and watch your output compound every single day.
            </p>


            {/* Feature cards */}
            <div className="pp-features">
              {features.map((f) => (
                <div key={f.title} className="pp-feature">
                  <div className="pp-feat-icon" style={{ background: f.bg }}>
                    <f.icon size={15} color={f.color} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="pp-feat-title">{f.title}</div>
                    <div className="pp-feat-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="pp-right">
            <PomodoroTimer
              durations={durations}
              onDurationsChange={saveDurations}
              onOpenSettingsRequest={() => setSettingsOpen(true)}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PomodoroPage;