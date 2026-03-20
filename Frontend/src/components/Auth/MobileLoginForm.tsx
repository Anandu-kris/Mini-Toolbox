import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ChevronLeft, Loader2, RotateCcw } from "lucide-react";
import { MiniToolboxIllustration } from "@/components/MiniIllustration";
import { useRequestMobileOtp, useVerifyMobileOtp } from "@/hooks/useAuth";
import { toast } from "sonner";
import { maskMobileNumber } from "@/helper/MobileNumberMask";

export function MobileLoginForm() {
  const navigate = useNavigate();

  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [countdown, setCountdown] = useState(0);

  const requestOtpMutation = useRequestMobileOtp();
  const verifyOtpMutation = useVerifyMobileOtp();

  const busy = requestOtpMutation.isPending || verifyOtpMutation.isPending;

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = () => {
    if (!isValidMobile) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    requestOtpMutation.mutate(
      { mobileNumber: fullMobileNumber },
      {
        onSuccess: (data) => {
          toast.success(data.message || "OTP sent");
          setStep("otp");
          setCountdown(30);
        },
        onError: (err) => {
          toast.error("Failed to send OTP");
          console.error(err);
        },
      },
    );
  };

  const handleVerifyOtp = () => {
    verifyOtpMutation.mutate(
      { mobileNumber: fullMobileNumber, otpCode },
      {
        onSuccess: (data) => {
          toast.success(data.message || "Login successful");
          navigate("/home");
        },
        onError: () => {
          toast.error("Invalid OTP");
        },
      },
    );
  };

  const handleResendOtp = () => {
    if (countdown > 0 || busy) return;
    handleSendOtp();
  };

  const fullMobileNumber = useMemo(() => {
    if (!mobileNumber) return "";
    return `+91${mobileNumber}`;
  }, [mobileNumber]);

  const isValidMobile = mobileNumber.length === 10;

  const maskedMobile = useMemo(() => {
    return maskMobileNumber(fullMobileNumber);
  }, [fullMobileNumber]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .login-shell {
          display: flex;
          width: 100%;
          max-width: 960px;
          min-height: 580px;
          border-radius: 28px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.06) inset,
            0 40px 80px rgba(0,0,0,0.5),
            0 0 120px rgba(120,80,255,0.12);
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .login-form-panel {
          flex: 0 0 420px;
          background: rgba(255,255,255,0.04);
          border-right: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          font-family: 'Sora', sans-serif;
        }

        .login-illustration-panel {
          flex: 1;
          display: none;
          overflow: hidden;
          border-radius: 0 28px 28px 0;
        }

        @media (min-width: 768px) {
          .login-illustration-panel {
            display: block;
          }
        }

        .login-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(160,130,255,0.9);
          margin-bottom: 16px;
        }

        .login-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #a082ff;
          box-shadow: 0 0 8px #a082ff;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(0.8); }
        }

        .login-title {
          font-size: 26px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .login-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 28px;
          font-weight: 300;
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 5px 0;
        }

        .login-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        .login-divider-text {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .login-form-panel label {
          font-family: 'Sora', sans-serif !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          color: rgba(255,255,255,0.55) !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
          margin-bottom: 6px !important;
        }

        .login-form-panel input {
          font-family: 'Sora', sans-serif !important;
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          color: #fff !important;
          font-size: 14px !important;
          height: 46px !important;
          padding: 0 14px !important;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s !important;
        }

        .login-form-panel input::placeholder {
          color: rgba(255,255,255,0.2) !important;
        }

        .login-form-panel input:focus {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(160,130,255,0.5) !important;
          box-shadow: 0 0 0 3px rgba(160,130,255,0.12) !important;
          outline: none !important;
        }

        .btn-primary {
          width: 100%;
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
          position: relative;
          overflow: hidden;
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          border-radius: inherit;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(124,92,252,0.5);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-google {
          width: 100%;
          height: 46px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn-google:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.2);
          color: #fff;
        }

        .signup-link {
          display: block;
          text-align: center;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin-top: 20px;
          text-decoration: none;
          transition: color 0.2s;
        }

        .signup-link span {
          color: rgba(160,130,255,0.9);
          font-weight: 500;
        }

        .signup-link:hover {
          color: rgba(255,255,255,0.6);
        }

        .signup-link:hover span {
          color: #a082ff;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          margin-bottom: 18px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: rgba(255,255,255,0.8);
        }

        .otp-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: -6px;
        }

        .otp-meta-text {
          font-size: 12px;
          color: rgba(255,255,255,0.42);
          font-family: 'Sora', sans-serif;
        }

        .resend-link {
          border: none;
          background: transparent;
          color: rgba(160,130,255,0.88);
          font-size: 12px;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          padding: 0;
        }

        .resend-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .otp-hint {
          font-size: 12px;
          color: rgba(255,255,255,0.38);
          margin-top: -8px;
          line-height: 1.5;
          font-family: 'Sora', sans-serif;
        }

        .field-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      `}</style>

      <div className="login-shell">
        <div className="login-form-panel">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="back-link"
          >
            <ChevronLeft size={16} />
            Back to sign in
          </button>

          <div className="login-eyebrow">
            <span className="login-eyebrow-dot" />
            Secure access
          </div>

          <h1 className="login-title">Login with mobile</h1>

          <p className="login-subtitle">
            {step === "mobile"
              ? "Enter your mobile number to continue with OTP login"
              : `Enter the OTP sent to ${maskedMobile || "your mobile number"}`}
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            {step === "mobile" && (
              <>
                <div className="field-block">
                  <label>Mobile number</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        height: "46px",
                        minWidth: "64px",
                        padding: "0 14px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.58)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      +91
                    </div>

                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="XXXXXXXXXX"
                      autoComplete="tel"
                      value={mobileNumber}
                      onChange={(e) =>
                        setMobileNumber(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <p className="otp-hint">Enter your 10-digit mobile number. </p>

                <Button
                  type="button"
                  className="btn-primary"
                  disabled={busy || !isValidMobile}
                  onClick={handleSendOtp}
                  style={{ marginTop: "6px" }}
                >
                  {busy ? (
                    <Loader2
                      size={18}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>

                <div className="login-divider">
                  <div className="login-divider-line" />
                  <span className="login-divider-text">or</span>
                  <div className="login-divider-line" />
                </div>

                <Button
                  type="button"
                  className="btn-google"
                  onClick={() => navigate("/login")}
                >
                  <ChevronLeft size={16} />
                  Use email instead
                </Button>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="field-block">
                  <label>One-time password</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6 digit OTP"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                </div>

                <div className="otp-meta-row">
                  <span className="otp-meta-text">Sent to {maskedMobile}</span>
                  <button
                    type="button"
                    className="resend-link"
                    disabled={countdown > 0 || busy}
                    onClick={handleResendOtp}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>

                <Button
                  type="button"
                  className="btn-primary"
                  disabled={busy || otpCode.length !== 6}
                  style={{ marginTop: "6px" }}
                  onClick={handleVerifyOtp}
                >
                  {busy ? (
                    <Loader2
                      size={18}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <>
                      <span>Verify & Login</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  className="btn-google"
                  onClick={() => {
                    setStep("mobile");
                    setOtpCode("");
                  }}
                >
                  <RotateCcw size={16} />
                  Change mobile number
                </Button>
              </>
            )}
          </div>

          <Link to="/signup" className="signup-link">
            Don&apos;t have an account? <span>Create one</span>
          </Link>
        </div>

        <div className="login-illustration-panel">
          <MiniToolboxIllustration />
        </div>
      </div>
    </>
  );
}
