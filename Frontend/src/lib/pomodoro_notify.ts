import { toast } from "sonner";

export type PomodoroMode = "focus" | "short" | "long";

function modeLabel(mode: PomodoroMode) {
  switch (mode) {
    case "focus":
      return "Focus";
    case "short":
      return "Short Break";
    case "long":
      return "Long Break";
  }
}

function modeEmoji(mode: PomodoroMode) {
  switch (mode) {
    case "focus":
      return "🎯";
    case "short":
      return "☕";
    case "long":
      return "🌴";
  }
}

export const notify = {
  timerStarted(mode: PomodoroMode) {
    toast.info(`${modeEmoji(mode)} ${modeLabel(mode)} started`, {
      description:
        mode === "focus"
          ? "Stay focused. You got this 💪"
          : "Relax and recharge.",
    });
  },

  timerPaused() {
    toast("⏸️ Timer paused", {
      description: "Resume when you're ready",
    });
  },

  timerReset() {
    toast("🔄 Timer reset");
  },

  sessionComplete(prevMode: PomodoroMode) {
    toast.success(
      prevMode === "focus"
        ? "✅ Focus session completed"
        : "✅ Break finished",
      {
        description:
          prevMode === "focus"
            ? "Nice work! Time for a break."
            : "Ready for the next round?",
      },
    );
  },

  modeChanged(nextMode: PomodoroMode) {
    toast(`${modeEmoji(nextMode)} Switched to ${modeLabel(nextMode)}`, {
      description:
        nextMode === "focus"
          ? "Back to deep work"
          : nextMode === "short"
            ? "Take a short breather"
            : "Take a longer rest",
    });
  },

  taskLocked(title?: string) {
    toast.warning("Task locked during focus", {
      description: title
        ? `Working on: ${title}`
        : "You cannot change tasks while focusing",
    });
  },
};
