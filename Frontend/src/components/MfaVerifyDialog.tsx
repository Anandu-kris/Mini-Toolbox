import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2, X, ArrowRight } from "lucide-react";

type MfaVerifyDialogProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose?: () => void;
  onVerify: (code: string) => void;
};

export function MfaVerifyDialog({
  open,
  busy = false,
  error = null,
  onClose,
  onVerify,
}: MfaVerifyDialogProps) {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!open) {
      setCode("");
    }
  }, [open]);

  const isValid = useMemo(() => /^\d{6}$/.test(code), [code]);

  if (!open) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .mfa-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          background: rgba(5, 2, 18, 0.62);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: mfaFade 0.22s ease-out;
        }

        .mfa-card {
          width: 100%;
          max-width: 420px;
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03) inset,
            0 28px 80px rgba(0,0,0,0.45),
            0 0 80px rgba(124,92,252,0.14);
          padding: 28px 24px 22px;
          font-family: 'Sora', sans-serif;
          position: relative;
          animation: mfaUp 0.28s cubic-bezier(0.16,1,0.3,1);
        }

        @keyframes mfaFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes mfaUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .mfa-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mfa-close:hover {
          color: #fff;
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.14);
        }

        .mfa-badge {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 30% 30%, rgba(160,130,255,0.36), transparent 60%),
            rgba(124,92,252,0.14);
          border: 1px solid rgba(160,130,255,0.24);
          box-shadow: 0 0 20px rgba(124,92,252,0.2);
          margin-bottom: 16px;
        }

        .mfa-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(160,130,255,0.92);
          margin-bottom: 10px;
        }

        .mfa-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #a082ff;
          box-shadow: 0 0 8px #a082ff;
        }

        .mfa-title {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #fff;
          margin: 0 0 8px;
        }

        .mfa-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.42);
          line-height: 1.6;
          margin: 0 0 22px;
        }

        .mfa-label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
        }

        .mfa-input {
          font-family: 'Sora', sans-serif !important;
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          color: #fff !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          letter-spacing: 0.28em !important;
          text-align: center;
          height: 50px !important;
          padding: 0 14px !important;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s !important;
        }

        .mfa-input::placeholder {
          color: rgba(255,255,255,0.18) !important;
          letter-spacing: 0.1em !important;
          font-weight: 400 !important;
        }

        .mfa-input:focus {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(160,130,255,0.5) !important;
          box-shadow: 0 0 0 3px rgba(160,130,255,0.12) !important;
          outline: none !important;
        }

        .mfa-error {
          font-size: 12px;
          color: #ff7f7f;
          margin-top: 8px;
          min-height: 18px;
        }

        .mfa-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .mfa-btn-primary {
          flex: 1;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c5cfc 0%, #5b3fe8 100%);
          border: none;
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(124,92,252,0.35);
        }

        .mfa-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(124,92,252,0.5);
        }

        .mfa-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mfa-btn-secondary {
          min-width: 96px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.82);
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mfa-btn-secondary:hover:not(:disabled) {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.2);
          color: #fff;
        }

        .mfa-note {
          margin-top: 14px;
          font-size: 12px;
          color: rgba(255,255,255,0.34);
          line-height: 1.6;
        }
      `}</style>

      <div className="mfa-overlay">
        <div className="mfa-card" role="dialog" aria-modal="true" aria-labelledby="mfa-title">
          {!!onClose && (
            <button
              type="button"
              className="mfa-close"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          )}

          <div className="mfa-badge">
            <ShieldCheck size={24} color="#c5b6ff" />
          </div>

          <div className="mfa-eyebrow">
            <span className="mfa-eyebrow-dot" />
            Extra protection
          </div>

          <h2 id="mfa-title" className="mfa-title">
            Verify it’s you
          </h2>

          <p className="mfa-subtitle">
            Enter the 6-digit code from your authenticator app to complete sign in.
          </p>

          <div>
            <label className="mfa-label">Authenticator code</label>
            <Input
              className="mfa-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid && !busy) {
                  onVerify(code);
                }
              }}
            />
            <div className="mfa-error">{error || ""}</div>
          </div>

          <div className="mfa-actions">
            {!!onClose && (
              <button
                type="button"
                className="mfa-btn-secondary"
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </button>
            )}

            <Button
              type="button"
              className="mfa-btn-primary"
              disabled={!isValid || busy}
              onClick={() => onVerify(code)}
            >
              {busy ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Verify</span>
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>

          <p className="mfa-note">
            Open Google Authenticator, Authy, Microsoft Authenticator, or your preferred TOTP app to get the current code.
          </p>
        </div>
      </div>
    </>
  );
}