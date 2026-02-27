import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "violet" | "cyan" | "emerald" | "gray" | "rose" | "amber" | "sky" | "indigo" | "teal" | "lime" | "yellow";
};

const variantConfig = {
  violet: {
    glow: "rgba(139, 92, 246, 0.35)",
    iconBg: "rgba(139, 92, 246, 0.15)",
    iconBorder: "rgba(139, 92, 246, 0.25)",
    iconColor: "#c4b5fd",
    accent: "#8b5cf6",
  },
  cyan: {
    glow: "rgba(34, 211, 238, 0.3)",
    iconBg: "rgba(34, 211, 238, 0.12)",
    iconBorder: "rgba(34, 211, 238, 0.22)",
    iconColor: "#67e8f9",
    accent: "#22d3ee",
  },
  emerald: {
    glow: "rgba(52, 211, 153, 0.3)",
    iconBg: "rgba(52, 211, 153, 0.12)",
    iconBorder: "rgba(52, 211, 153, 0.22)",
    iconColor: "#6ee7b7",
    accent: "#34d399",
  },
  gray: {
    glow: "rgba(148, 163, 184, 0.2)",
    iconBg: "rgba(148, 163, 184, 0.1)",
    iconBorder: "rgba(148, 163, 184, 0.18)",
    iconColor: "#cbd5e1",
    accent: "#94a3b8",
  },
  rose: {
    glow: "rgba(251, 113, 133, 0.3)",
    iconBg: "rgba(251, 113, 133, 0.12)",
    iconBorder: "rgba(251, 113, 133, 0.22)",
    iconColor: "#fda4af",
    accent: "#fb7185",
  },
  amber: {
    glow: "rgba(251, 191, 36, 0.28)",
    iconBg: "rgba(251, 191, 36, 0.1)",
    iconBorder: "rgba(251, 191, 36, 0.2)",
    iconColor: "#fcd34d",
    accent: "#fbbf24",
  },
  sky: {
    glow: "rgba(56, 189, 248, 0.3)",
    iconBg: "rgba(56, 189, 248, 0.12)",
    iconBorder: "rgba(56, 189, 248, 0.22)",
    iconColor: "#7dd3fc",
    accent: "#38bdf8",
  },
  indigo: {
    glow: "rgba(99, 102, 241, 0.35)",
    iconBg: "rgba(99, 102, 241, 0.14)",
    iconBorder: "rgba(99, 102, 241, 0.24)",
    iconColor: "#a5b4fc",
    accent: "#6366f1",
  },
  teal: {
    glow: "rgba(45, 212, 191, 0.3)",
    iconBg: "rgba(45, 212, 191, 0.12)",
    iconBorder: "rgba(45, 212, 191, 0.22)",
    iconColor: "#5eead4",
    accent: "#2dd4bf",
  },
  lime: {
    glow: "rgba(163, 230, 53, 0.28)",
    iconBg: "rgba(163, 230, 53, 0.1)",
    iconBorder: "rgba(163, 230, 53, 0.2)",
    iconColor: "#bef264",
    accent: "#a3e635",
  },
  yellow: {
    glow: "rgba(255, 242, 0, 0.25)",
    iconBg: "rgba(255, 242, 0, 0.08)",
    iconBorder: "rgba(255, 242, 0, 0.2)",
    iconColor: "#fff176",
    accent: "#fff200",
  },
};

export default function FeatureCard({
  title,
  description,
  icon,
  onClick,
  disabled,
  variant = "violet",
}: Props) {
  const v = variantConfig[variant];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .feature-card {
          font-family: 'Sora', sans-serif;
          position: relative;
          border-radius: 18px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                      border-color 0.3s ease,
                      box-shadow 0.3s ease;
          will-change: transform;
        }

        .feature-card:not(.feature-card--disabled):hover {
          transform: translateY(-4px) scale(1.01);
          border-color: rgba(255, 255, 255, 0.14);
        }

        .feature-card--disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Spotlight sweep on hover */
        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255,255,255,0.04),
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: inherit;
          pointer-events: none;
          z-index: 0;
        }

        .feature-card:not(.feature-card--disabled):hover::before {
          opacity: 1;
        }

        /* Bottom glow */
        .feature-card-glow {
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 80px;
          border-radius: 50%;
          filter: blur(28px);
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
          z-index: 0;
        }

        .feature-card:not(.feature-card--disabled):hover .feature-card-glow {
          opacity: 1;
        }

        /* Top accent line */
        .feature-card-line {
          position: absolute;
          top: 0;
          left: 24px;
          right: 24px;
          height: 1px;
          border-radius: 99px;
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
          z-index: 1;
        }

        .feature-card:not(.feature-card--disabled):hover .feature-card-line {
          opacity: 1;
        }

        .feature-card-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .feature-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.3s ease;
        }

        .feature-card:not(.feature-card--disabled):hover .feature-card-icon {
          transform: scale(1.1) rotate(-4deg);
        }

        .feature-card-title {
          font-size: 15px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: -0.02em;
          margin-bottom: 4px;
          transition: color 0.2s;
        }

        .feature-card:not(.feature-card--disabled):hover .feature-card-title {
          color: #ffffff;
        }

        .feature-card-desc {
          font-size: 12.5px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.38);
          line-height: 1.5;
          transition: color 0.2s;
        }

        .feature-card:not(.feature-card--disabled):hover .feature-card-desc {
          color: rgba(255, 255, 255, 0.55);
        }

        .feature-card-arrow {
          position: absolute;
          bottom: 22px;
          right: 22px;
          opacity: 0;
          transform: translate(-4px, 4px);
          transition: opacity 0.25s ease, transform 0.25s ease;
          font-size: 16px;
          pointer-events: none;
          z-index: 1;
        }

        .feature-card:not(.feature-card--disabled):hover .feature-card-arrow {
          opacity: 0.6;
          transform: translate(0, 0);
        }
      `}</style>

      <div
        className={cn("feature-card", disabled && "feature-card--disabled")}
        onClick={!disabled ? onClick : undefined}
        onMouseMove={(e) => {
          if (disabled) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
          e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
        }}
        style={{
          boxShadow: `0 4px 32px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Bottom glow blob */}
        <div
          className="feature-card-glow"
          style={{ background: v.glow }}
        />

        {/* Top accent line */}
        <div
          className="feature-card-line"
          style={{ background: `linear-gradient(90deg, transparent, ${v.accent}, transparent)` }}
        />

        <div className="feature-card-content">
          {/* Icon */}
          <div
            className="feature-card-icon"
            style={{
              background: v.iconBg,
              borderColor: v.iconBorder,
              color: v.iconColor,
              boxShadow: `0 0 12px ${v.glow}`,
            }}
          >
            {icon}
          </div>

          {/* Text */}
          <div>
            <div className="feature-card-title">{title}</div>
            <div className="feature-card-desc">{description}</div>
          </div>
        </div>

        {/* Arrow hint */}
        <div className="feature-card-arrow" style={{ color: v.iconColor }}>
          ↗
        </div>
      </div>
    </>
  );
}