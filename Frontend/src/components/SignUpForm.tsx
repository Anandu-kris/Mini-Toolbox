// src/components/SignUpForm.tsx
import { useEffect, useState } from "react";
import { useSignup } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, EyeIcon, EyeOffIcon, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { MiniToolboxIllustration } from "@/components/MiniIllustration";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const signupSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(72, "Password must be at most 72 characters"),
    confirm: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignUpForm() {
  const signupMutation = useSignup();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirm: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (signupMutation.isSuccess) {
      const t = setTimeout(() => navigate("/login"), 1200);
      return () => clearTimeout(t);
    }
  }, [signupMutation.isSuccess, navigate]);

  function onSubmit(values: SignupFormValues) {
    signupMutation.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onSuccess: () => form.reset(),
        onError: (err: unknown) => {
          const anyErr = err as { response?: { data?: { detail?: string } } };
          const msg = anyErr?.response?.data?.detail || "Signup failed";
          form.setError("root", { message: msg });
        },
      }
    );
  }

  const busy = signupMutation.isPending;
  const passwordValue = form.watch("password");

  const strength = !passwordValue
    ? 0
    : passwordValue.length < 6
    ? 1
    : passwordValue.length < 10
    ? 2
    : /[A-Z]/.test(passwordValue) && /[0-9]/.test(passwordValue)
    ? 4
    : 3;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "#ff6b6b", "#f5a623", "#a3e635", "#4ade80"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        /* ── Outer shell ── */
        .signup-shell {
          display: flex;
          width: 100%;
          max-width: 960px;
          min-height: 620px;
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

        /* ── Left — form panel ── */
        .signup-form-panel {
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

        /* ── Right — illustration panel ── */
        .signup-illustration-panel {
          flex: 1;
          display: none;
          overflow: hidden;
          border-radius: 0 28px 28px 0;
        }

        @media (min-width: 768px) {
          .signup-illustration-panel {
            display: block;
          }
        }

        /* ── Form internals ── */
        .signup-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(160,130,255,0.9);
          margin-bottom: 8px;
        }

        .signup-eyebrow-dot {
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

        .signup-title {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .signup-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 28px;
          font-weight: 300;
        }

        .signup-form-panel [data-slot="form-label"],
        .signup-form-panel label {
          font-family: 'Sora', sans-serif !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          color: rgba(255,255,255,0.55) !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
          margin-bottom: 6px !important;
        }

        .signup-form-panel input {
          font-family: 'Sora', sans-serif !important;
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          color: #fff !important;
          font-size: 14px !important;
          height: 42px !important;
          padding: 0 14px !important;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s !important;
        }

        .signup-form-panel input::placeholder {
          color: rgba(255,255,255,0.2) !important;
        }

        .signup-form-panel input:focus {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(160,130,255,0.5) !important;
          box-shadow: 0 0 0 3px rgba(160,130,255,0.12) !important;
          outline: none !important;
        }

        .signup-form-panel [data-slot="form-message"] {
          font-family: 'Sora', sans-serif !important;
          font-size: 12px !important;
          color: #ff6b6b !important;
        }

        .strength-bar-track {
          display: flex;
          gap: 4px;
          margin-top: 7px;
        }

        .strength-bar-seg {
          flex: 1;
          height: 3px;
          border-radius: 99px;
          background: rgba(255,255,255,0.08);
          transition: background 0.3s;
        }

        .strength-label {
          font-size: 11px;
          margin-top: 4px;
          font-family: 'Sora', sans-serif;
          transition: color 0.3s;
        }

        .btn-signup-primary {
          width: 100%;
          height: 44px;
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
          margin-top: 26px;
        }

        .btn-signup-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          border-radius: inherit;
        }

        .btn-signup-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(124,92,252,0.5);
        }

        .btn-signup-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-signup-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .success-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.25);
          border-radius: 12px;
          padding: 12px 14px;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          color: #4ade80;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,107,107,0.1);
          border: 1px solid rgba(255,107,107,0.25);
          border-radius: 12px;
          padding: 12px 14px;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          color: #ff6b6b;
        }

        .eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.2s;
        }

        .eye-btn:hover { color: rgba(255,255,255,0.7); }

        .password-field-wrapper { position: relative; }

        .login-link {
          display: block;
          text-align: center;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin-top: 2px;
          text-decoration: none;
          transition: color 0.2s;
        }

        .login-link span {
          color: rgba(160,130,255,0.9);
          font-weight: 500;
        }

        .login-link:hover { color: rgba(255,255,255,0.6); }
        .login-link:hover span { color: #a082ff; }
      `}</style>

      {/* ── Outer shell: form + illustration side-by-side ── */}
      <div className="signup-shell">

        {/* Left — form */}
        <div className="signup-form-panel">
          <div className="signup-eyebrow">
            <span className="signup-eyebrow-dot" />
            Get started
          </div>
          <h1 className="signup-title">Create your account</h1>
          <p className="signup-subtitle">Fill in your details below to sign up</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" type="email" autoComplete="email" {...field}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="password-field-wrapper">
                        <Input
                          placeholder="••••••••••"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          {...field}
                          style={{ paddingRight: '44px' }}
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowPassword(s => !s)} tabIndex={-1}>
                          {showPassword ? <EyeOffIcon size={16}/> : <EyeIcon size={16}/>}
                        </button>
                      </div>
                    </FormControl>
                    {passwordValue && (
                      <>
                        <div className="strength-bar-track">
                          {[1,2,3,4].map(i => (
                            <div
                              key={i}
                              className="strength-bar-seg"
                              style={{ background: i <= strength ? strengthColor[strength] : undefined }}
                            />
                          ))}
                        </div>
                        <div className="strength-label" style={{ color: strengthColor[strength] }}>
                          {strengthLabel[strength]}
                        </div>
                      </>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="password-field-wrapper">
                        <Input
                          placeholder="••••••••••"
                          type={showConfirm ? "text" : "password"}
                          autoComplete="new-password"
                          {...field}
                          style={{ paddingRight: '44px' }}
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowConfirm(s => !s)} tabIndex={-1}>
                          {showConfirm ? <EyeOffIcon size={16}/> : <EyeIcon size={16}/>}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root?.message && (
                <div className="error-banner">
                  {form.formState.errors.root.message}
                </div>
              )}

              {signupMutation.isSuccess && (
                <div className="success-banner">
                  <CheckCircle2 size={16}/>
                  Account created! Redirecting to login…
                </div>
              )}

              <Button type="submit" className="btn-signup-primary" disabled={busy}>
                {busy
                  ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/>
                  : <><span>Create account</span><ArrowRight size={16}/></>
                }
              </Button>
            </form>
          </Form>

          <Link to="/login" className="login-link">
            Already have an account? <span>Sign in</span>
          </Link>
        </div>

        {/* Right — illustration */}
        <div className="signup-illustration-panel">
          <MiniToolboxIllustration />
        </div>

      </div>
    </>
  );
}