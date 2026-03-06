import { useMemo, useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useVaultMeta } from "@/hooks/usePasslockApi";
import {
  base64ToBytes,
  deriveKekArgon2id,
  importAesKey,
  unwrapVaultKey,
} from "@/lib/passlock/crypto";
import { usePasslock } from "./usePasslock";
import axios from "axios";
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// ─── Animated background orbs ────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {/* Primary orb */}
      <div
        className="absolute -top-16 -left-16 h-56 w-56 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          animation: "orbFloat 8s ease-in-out infinite",
        }}
      />
      {/* Secondary orb */}
      <div
        className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          animation: "orbFloat 10s ease-in-out infinite reverse",
        }}
      />
      {/* Accent orb */}
      <div
        className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
          animation: "orbFloat 6s ease-in-out infinite 2s",
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 rounded-2xl opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

// ─── Animated Lock Icon ───────────────────────────────────────────────────────
function LockIcon({ unlocking }: { unlocking: boolean }) {
  return (
    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
      {/* Outer pulse ring */}
      {!unlocking && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid rgba(139,92,246,0.4)",
            animation: "pulseRing 3s ease-out infinite",
          }}
        />
      )}
      {/* Second pulse ring (delayed) */}
      {!unlocking && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid rgba(139,92,246,0.2)",
            animation: "pulseRing 3s ease-out infinite 1s",
          }}
        />
      )}
      {/* Icon container */}
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.2) 100%)",
          border: "1px solid rgba(139,92,246,0.35)",
          boxShadow:
            "0 8px 32px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
          transition: "all 0.3s ease",
          ...(unlocking && {
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.4) 100%)",
            boxShadow:
              "0 8px 40px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
          }),
        }}
      >
        {unlocking ? (
          <Loader2 className="h-7 w-7 animate-spin text-violet-300" />
        ) : (
          <Lock className="h-7 w-7 text-violet-300" strokeWidth={1.5} />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PassLockUnlock() {
  const [mp, setMp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: meta, isLoading, isError, error } = useVaultMeta(true);
  const { unlockWithRawVaultKey } = usePasslock();

  // Auto-focus input when loaded
  useEffect(() => {
    if (!isLoading && !isError) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading, isError]);

  const errMsg = useMemo(() => {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.detail ??
        error.message ??
        "Failed to load vault metadata"
      );
    }
    if (error instanceof Error) return error.message;
    return "Failed to load vault metadata";
  }, [error]);

  const canUnlock = useMemo(
    () => mp.length >= 1 && !!meta && !isUnlocking,
    [mp, meta, isUnlocking],
  );

  async function onUnlock() {
    if (!meta || !canUnlock) return;
    setIsUnlocking(true);
    try {
      const salt = base64ToBytes(meta.salt);
      const wrapped = base64ToBytes(meta.encryptedVaultKey);
      const iv = base64ToBytes(meta.vaultKeyIv);
      const kekRaw = await deriveKekArgon2id(mp, salt, meta.kdfParams);
      const kek = await importAesKey(kekRaw);
      const vaultKeyRaw = await unwrapVaultKey(kek, wrapped, iv);
      await unlockWithRawVaultKey(vaultKeyRaw);
      toast.success("Vault unlocked", {
        icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
      });
      setMp("");
    } catch {
      toast.error("Wrong master password — try again");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setMp("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setIsUnlocking(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") onUnlock();
  }

  if (isLoading) {
    return (
      <>
        <GlobalStyles />
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="passlock-card relative w-full max-w-sm overflow-hidden rounded-2xl p-8">
            <BackgroundOrbs />
            <LockIcon unlocking={true} />
            <div className="text-center">
              <h1 className="mb-1 text-xl font-semibold tracking-tight text-white">
                PassLock
              </h1>
              <p className="text-sm text-white/40">Fetching vault info…</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <GlobalStyles />
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="passlock-card relative w-full max-w-sm overflow-hidden rounded-2xl p-8">
            <BackgroundOrbs />
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle
                className="h-7 w-7 text-red-400"
                strokeWidth={1.5}
              />
            </div>
            <div className="text-center">
              <h1 className="mb-1 text-xl font-semibold text-white">
                Something went wrong
              </h1>
              <p className="text-sm leading-relaxed text-red-400/80">
                {errMsg}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className="flex min-h-screen items-start justify-center p-4 pt-[6vh]">
        <div
          className="passlock-card relative w-full max-w-md overflow-hidden rounded-2xl p-8"
          style={{
            animation: "cardEntrance 0.5s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <BackgroundOrbs />

          {/* Header */}
          <div className="relative text-center">
            <LockIcon unlocking={isUnlocking} />
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white">
              PassLock
            </h1>
            <p className="mb-8 text-sm text-white/45">
              Enter your master password to decrypt your vault.
            </p>
          </div>

          {/* Form */}
          <div
            className="relative space-y-4"
            style={
              shake
                ? { animation: "shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97)" }
                : {}
            }
          >
            <div className="space-y-2">
              <Label
                htmlFor="master-password"
                className="text-xs font-medium uppercase tracking-widest text-white/40"
              >
                Master Password
              </Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="master-password"
                  type={showPassword ? "text" : "password"}
                  value={mp}
                  onChange={(e) => setMp(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Enter master password…"
                  disabled={isUnlocking}
                  className="passlock-input h-12 pr-12 text-sm text-white placeholder:text-white/20"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/30 transition-colors hover:text-white/70 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              className="passlock-btn h-12 w-full text-sm font-medium tracking-wide"
              disabled={!canUnlock}
              onClick={onUnlock}
            >
              {isUnlocking ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Decrypting vault…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" strokeWidth={2} />
                  Unlock Vault
                </span>
              )}
            </Button>
          </div>

          {/* Footer */}
          <p className="relative mt-6 text-center text-[11px] text-white/20">
            Your vault is decrypted locally — never sent to any server.
          </p>
        </div>
      </div>
    </>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

      * { font-family: 'DM Sans', sans-serif; }

      .passlock-card {
        background: rgba(10, 8, 20, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.07);
        backdrop-filter: blur(32px) saturate(180%);
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.03) inset,
          0 32px 64px rgba(0, 0, 0, 0.6),
          0 0 80px rgba(99, 102, 241, 0.08);
      }

      .passlock-input {
        background: rgba(255, 255, 255, 0.04) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 10px !important;
        transition: all 0.2s ease;
      }
      .passlock-input:focus {
        background: rgba(255, 255, 255, 0.06) !important;
        border-color: rgba(139, 92, 246, 0.5) !important;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
        outline: none !important;
      }
      .passlock-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .passlock-btn {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
        border: 1px solid rgba(139, 92, 246, 0.4) !important;
        border-radius: 10px !important;
        color: white !important;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1) !important;
        transition: all 0.2s ease !important;
        position: relative;
        overflow: hidden;
      }
      .passlock-btn::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
        border-radius: 10px;
      }
      .passlock-btn:hover:not(:disabled) {
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 24px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255,255,255,0.15) !important;
      }
      .passlock-btn:active:not(:disabled) {
        transform: translateY(0) !important;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1) !important;
      }
      .passlock-btn:disabled {
        opacity: 0.35 !important;
        cursor: not-allowed !important;
      }

      @keyframes orbFloat {
        0%, 100% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-20px) scale(1.05); }
      }
      @keyframes pulseRing {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      @keyframes cardEntrance {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        15%       { transform: translateX(-8px); }
        30%       { transform: translateX(7px); }
        45%       { transform: translateX(-6px); }
        60%       { transform: translateX(5px); }
        75%       { transform: translateX(-3px); }
        90%       { transform: translateX(2px); }
      }
    `}</style>
  );
}
