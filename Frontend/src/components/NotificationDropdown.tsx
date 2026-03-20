import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  Clock3,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { AppNotification } from "@/types/notifications.types";

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;

  return date.toLocaleDateString();
}

function SeverityIcon({
  severity,
  className,
}: {
  severity?: AppNotification["severity"];
  className?: string;
}) {
  switch (severity) {
    case "success":
      return <CheckCircle2 className={className} size={15} />;
    case "warning":
      return <AlertTriangle className={className} size={15} />;
    case "error":
      return <XCircle className={className} size={15} />;
    default:
      return <Info className={className} size={15} />;
  }
}

export default function NotificationDropdown({
  notifications,
  onMarkAllRead,
  onMarkOneRead,
}: {
  notifications: AppNotification[];
  onMarkAllRead?: () => void;
  onMarkOneRead?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-2xl",
          "border border-white/10 bg-white/4 text-white/70",
          "backdrop-blur-xl transition-all duration-200",
          "hover:border-white/15 hover:bg-white/[0.07] hover:text-white",
          open && "border-violet-400/30 bg-violet-500/10 text-white",
        )}
        aria-label="Open notifications"
      >
        <Bell size={18} />

        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 min-w-5 rounded-full px-1.5 py-0.5",
              "border border-violet-300/20 bg-linear-to-r from-violet-500 to-fuchsia-500",
              "text-center text-[10px] font-semibold leading-none text-white shadow-lg",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-[calc(100%+12px)] z-80 w-[380px] overflow-hidden rounded-3xl",
            "border border-white/10 bg-[#0f0f14]/95 shadow-2xl backdrop-blur-2xl",
          )}
        >
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Notifications
              </h3>
              <p className="text-xs text-white/45">{unreadCount} unread</p>
            </div>

            <button
              type="button"
              onClick={onMarkAllRead}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border border-white/10",
                "bg-white/4 px-3 py-2 text-xs font-medium text-white/70",
                "transition hover:bg-white/8 hover:text-white",
              )}
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-3 rounded-2xl border border-white/10 bg-white/4 p-3 text-white/60">
                  <Bell size={20} />
                </div>
                <p className="text-sm font-medium text-white/80">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Live alerts from Notes, Tasks, Pomodoro and other tools will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onMarkOneRead?.(item.id)}
                    className={cn(
                      "mb-2 w-full rounded-2xl border px-3 py-3 text-left transition",
                      item.read
                        ? "border-white/6 bg-white/3"
                        : "border-violet-400/15 bg-violet-500/8",
                      "hover:border-white/12 hover:bg-white/6",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 rounded-xl border p-2",
                          item.severity === "success" &&
                            "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
                          item.severity === "warning" &&
                            "border-amber-400/20 bg-amber-500/10 text-amber-300",
                          item.severity === "error" &&
                            "border-rose-400/20 bg-rose-500/10 text-rose-300",
                          (!item.severity || item.severity === "info") &&
                            "border-sky-400/20 bg-sky-500/10 text-sky-300",
                        )}
                      >
                        <SeverityIcon severity={item.severity} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className={cn(
                              "line-clamp-1 text-sm font-semibold",
                              item.read ? "text-white/82" : "text-white",
                            )}
                          >
                            {item.title}
                          </p>

                          {!item.read && (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/55">
                          {item.message}
                        </p>

                        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-white/38">
                          <Clock3 size={12} />
                          {formatRelativeTime(item.createdAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
