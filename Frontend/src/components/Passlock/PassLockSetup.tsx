import { useMemo, useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSetupVault } from "@/hooks/usePasslockApi";
import {
  DEFAULT_KDF,
  bytesToBase64,
  deriveKekArgon2id,
  importAesKey,
  randomBytes,
  wrapVaultKey,
} from "@/lib/passlock/crypto";
import { usePasslock } from "./usePasslock";
import axios from "axios";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

// ─── Password strength calculator ────────────────────────────────────────────
function getStrength(password: string): {
  score: number; // 0–4
  label: string;
  color: string;
} {
  if (password.length === 0) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const map: Record<number, { label: string; color: string }> = {
    0: { label: "Too short", color: "#ef4444" },
    1: { label: "Weak", color: "#f97316" },
    2: { label: "Fair", color: "#eab308" },
    3: { label: "Good", color: "#22c55e" },
    4: { label: "Strong", color: "#10b981" },
  };
  return { score: clamped, ...map[clamped] };
}

// ─── Requirement row ──────────────────────────────────────────────────────────
function Req({ met, label }: { met: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: met ? "#10b981" : "rgba(255,255,255,0.3)" }}>
      {met ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0" />}
      {label}
    </span>
  );
}

// ─── Animated background orbs (same as Unlock) ───────────────────────────────
function BackgroundOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", animation: "orbFloat 8s ease-in-out infinite" }} />
      <div className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", animation: "orbFloat 10s ease-in-out infinite reverse" }} />
      <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)", animation: "orbFloat 6s ease-in-out infinite 2s" }} />
      <div className="absolute inset-0 rounded-2xl opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
    </div>
  );
}

// ─── Shield icon header ───────────────────────────────────────────────────────
function ShieldIcon({ pending }: { pending: boolean }) {
  return (
    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
      {!pending && (
        <>
          <div className="absolute inset-0 rounded-full"
            style={{ border: "1px solid rgba(139,92,246,0.4)", animation: "pulseRing 3s ease-out infinite" }} />
          <div className="absolute inset-0 rounded-full"
            style={{ border: "1px solid rgba(139,92,246,0.2)", animation: "pulseRing 3s ease-out infinite 1s" }} />
        </>
      )}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: pending
            ? "linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.4) 100%)"
            : "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.2) 100%)",
          border: "1px solid rgba(139,92,246,0.35)",
          boxShadow: pending
            ? "0 8px 40px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"
            : "0 8px 32px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
          transition: "all 0.3s ease",
        }}>
        {pending
          ? <Loader2 className="h-7 w-7 animate-spin text-violet-300" />
          : <KeyRound className="h-7 w-7 text-violet-300" strokeWidth={1.5} />}
      </div>
    </div>
  );
}

// ─── Password input with toggle ───────────────────────────────────────────────
function PasswordInput({
  id, value, onChange, placeholder, disabled, inputRef,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="passlock-input h-12 pr-12 text-sm text-white placeholder:text-white/20"
        autoComplete={id === "mp" ? "new-password" : "new-password"}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        aria-label={show ? "Hide" : "Show"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/30 transition-colors hover:text-white/70 focus:outline-none"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PassLockSetup() {
  const [mp, setMp] = useState("");
  const [mp2, setMp2] = useState("");
  const setupMut = useSetupVault();
  const { unlockWithRawVaultKey } = usePasslock();
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }, []);

  const strength = useMemo(() => getStrength(mp), [mp]);

  const matchState = useMemo<"idle" | "match" | "mismatch">(() => {
    if (mp2.length === 0) return "idle";
    return mp === mp2 ? "match" : "mismatch";
  }, [mp, mp2]);

  const canSubmit = useMemo(
    () => mp.length >= 10 && mp === mp2 && !setupMut.isPending,
    [mp, mp2, setupMut.isPending]
  );

  async function onSetup() {
    if (!canSubmit) return;
    try {
      const salt = randomBytes(16);
      const vaultKeyRaw = randomBytes(32);
      const kekRaw = await deriveKekArgon2id(mp, salt, DEFAULT_KDF);
      const kek = await importAesKey(kekRaw);
      const { iv, ct } = await wrapVaultKey(kek, vaultKeyRaw);
      await setupMut.mutateAsync({
        kdf: "argon2id",
        kdfParams: DEFAULT_KDF,
        salt: bytesToBase64(salt),
        encryptedVaultKey: bytesToBase64(ct),
        vaultKeyIv: bytesToBase64(iv),
        vaultKeyAlg: "A256GCM",
        version: 1,
      });
      await unlockWithRawVaultKey(vaultKeyRaw);
      toast.success("Vault created & unlocked", {
        icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
      });
      setMp("");
      setMp2("");
    } catch (e: unknown) {
      let msg = "Setup failed";
      if (axios.isAxiosError(e)) msg = e.response?.data?.detail ?? e.message;
      else if (e instanceof Error) msg = e.message;
      toast.error(msg);
    }
  }

  return (
    <>
      <GlobalStyles />
      <div className="flex min-h-screen items-start justify-center p-4 pt-[2vh]">
        <div
          className="passlock-card relative w-full max-w-md overflow-hidden rounded-2xl p-8"
          style={{ animation: "cardEntrance 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <BackgroundOrbs />

          {/* Header */}
          <div className="relative text-center">
            <ShieldIcon pending={setupMut.isPending} />
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white">Create Vault</h1>
            <p className="mb-8 text-sm text-white/45">
              Choose a strong master password. It encrypts your vault locally and is never sent anywhere.
            </p>
          </div>

          {/* Form */}
          <div className="relative space-y-5">

            {/* Master Password */}
            <div className="space-y-2">
              <Label htmlFor="mp" className="text-xs font-medium uppercase tracking-widest text-white/40">
                Master Password
              </Label>
              <PasswordInput
                id="mp"
                value={mp}
                onChange={setMp}
                placeholder="Minimum 10 characters"
                disabled={setupMut.isPending}
                inputRef={firstInputRef}
              />

              {/* Strength bar */}
              {mp.length > 0 && (
                <div className="space-y-1.5" style={{ animation: "fadeIn 0.2s ease" }}>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= strength.score ? strength.color : "rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <Req met={mp.length >= 10} label="10+ characters" />
                      <Req met={/[A-Z]/.test(mp) && /[a-z]/.test(mp)} label="Upper & lowercase" />
                      <Req met={/[0-9]/.test(mp)} label="Number" />
                      <Req met={/[^A-Za-z0-9]/.test(mp)} label="Symbol" />
                    </div>
                    <span className="ml-2 shrink-0 text-[11px] font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="mp2" className="text-xs font-medium uppercase tracking-widest text-white/40">
                  Confirm Password
                </Label>
                {matchState === "match" && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400" style={{ animation: "fadeIn 0.2s ease" }}>
                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                  </span>
                )}
                {matchState === "mismatch" && (
                  <span className="flex items-center gap-1 text-[11px] text-red-400" style={{ animation: "fadeIn 0.2s ease" }}>
                    <XCircle className="h-3 w-3" /> Doesn't match
                  </span>
                )}
              </div>
              <PasswordInput
                id="mp2"
                value={mp2}
                onChange={setMp2}
                placeholder="Re-enter master password"
                disabled={setupMut.isPending}
              />
              {/* Confirm input border glow override */}
              <style>{`
                #mp2 {
                  border-color: ${
                    matchState === "match"
                      ? "rgba(16,185,129,0.45) !important"
                      : matchState === "mismatch"
                      ? "rgba(239,68,68,0.45) !important"
                      : ""
                  };
                  box-shadow: ${
                    matchState === "match"
                      ? "0 0 0 3px rgba(16,185,129,0.1) !important"
                      : matchState === "mismatch"
                      ? "0 0 0 3px rgba(239,68,68,0.1) !important"
                      : ""
                  };
                }
              `}</style>
            </div>

            {/* Submit */}
            <Button
              className="passlock-btn h-12 w-full text-sm font-medium tracking-wide"
              disabled={!canSubmit}
              onClick={onSetup}
            >
              {setupMut.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating vault…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                  Create Vault
                </span>
              )}
            </Button>
          </div>

          {/* Warning footer */}
          <div className="relative mt-5 flex items-start gap-2 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
            <p className="text-[11px] leading-relaxed text-amber-400/60">
              If you forget this master password, your vault cannot be recovered. Store it somewhere safe.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Global styles (same tokens as PassLockUnlock) ────────────────────────────
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
          0 32px 64px rgba(0,0,0,0.6),
          0 0 80px rgba(99,102,241,0.08);
      }

      .passlock-input {
        background: rgba(255,255,255,0.04) !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        border-radius: 10px !important;
        transition: all 0.2s ease;
      }
      .passlock-input:focus {
        background: rgba(255,255,255,0.06) !important;
        border-color: rgba(139,92,246,0.5) !important;
        box-shadow: 0 0 0 3px rgba(139,92,246,0.12) !important;
        outline: none !important;
      }
      .passlock-input:disabled { opacity: 0.5; cursor: not-allowed; }

      .passlock-btn {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
        border: 1px solid rgba(139,92,246,0.4) !important;
        border-radius: 10px !important;
        color: white !important;
        box-shadow: 0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1) !important;
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
        box-shadow: 0 6px 24px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.15) !important;
      }
      .passlock-btn:active:not(:disabled) {
        transform: translateY(0) !important;
        box-shadow: 0 2px 8px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1) !important;
      }
      .passlock-btn:disabled { opacity: 0.35 !important; cursor: not-allowed !important; }

      @keyframes orbFloat {
        0%, 100% { transform: translateY(0px) scale(1); }
        50%       { transform: translateY(-20px) scale(1.05); }
      }
      @keyframes pulseRing {
        0%   { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      @keyframes cardEntrance {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  );
}