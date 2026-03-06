import { usePasslock } from "./usePasslock";

function format(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VaultAutoLockStatus() {
  const { remainingMs, isUnlocked } = usePasslock();

  if (!isUnlocked) return null;

  return (
    <div className="text-xs text-white/60 flex items-center gap-2">
      🔓 Auto-lock in{" "}
      <span className="font-mono text-white/90">
        {format(remainingMs)}
      </span>
    </div>
  );
}