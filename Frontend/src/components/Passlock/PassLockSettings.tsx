import { useState } from "react";
import { Button } from "@/components/ui/button";
import ChangeMasterPassword from "./ChangeMasterPassword";
import { usePasslock } from "./usePasslock";
import LockConfirmDialog from "@/components/LockConfirmDialog";
import { ArrowLeft, Lock, ShieldCheck, ChevronDown } from "lucide-react";

export default function PassLockSettings({ onBack }: { onBack: () => void }) {
  const { lock } = usePasslock();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <div className="min-h-full space-y-6 px-1">
      {/* Back nav */}
      <Button
        onClick={onBack}
        className="group inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/90 transition-colors duration-200"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Back
      </Button>

      {/* Page header */}
      <div className="pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-1">
          PassLock
        </p>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Settings
        </h1>
      </div>

      {/* Section: Security */}
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30 px-1 mb-3">
          Security
        </p>

        {/* Vault lock row */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-linear-to-br from-white/6 to-white/2 p-5 transition-all duration-200 hover:border-white/12 hover:from-white/8 hover:to-white/4">
          {/* Subtle glow on hover */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.015), transparent 40%)",
            }}
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
                <Lock
                  className="h-4.5 w-4.5 text-red-400"
                  style={{ height: "18px", width: "18px" }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Lock Vault</p>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                  Clears the vault key from memory immediately
                </p>
              </div>
            </div>

            <button
              onClick={() => setConfirmOpen(true)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 active:scale-[0.97]"
            >
              <Lock className="h-3.5 w-3.5" />
              Lock now
            </button>
          </div>
        </div>

        {/* Master password accordion */}
        <div className="rounded-2xl border border-white/[0.07] bg-linear-to-br from-white/6 to-white/2 overflow-hidden transition-all duration-200">
          <button
            onClick={() => setPasswordOpen((v) => !v)}
            className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/3 transition-colors duration-150"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <ShieldCheck
                style={{ height: "18px", width: "18px" }}
                className="text-emerald-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                Master Password
              </p>
              <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                Change the password used to unlock your vault
              </p>
            </div>
            <ChevronDown
              className="h-5 w-5 text-white/40 shrink-0 transition-transform duration-300"
              style={{
                transform: passwordOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {/* Collapsible body */}
          <div
            className="grid transition-all duration-300 ease-in-out"
            style={{ gridTemplateRows: passwordOpen ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="px-5 pb-5 pt-1">
                <div className="rounded-xl border border-white/6 bg-black/20 p-4">
                  <ChangeMasterPassword />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LockConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={lock}
      />
    </div>
  );
}
