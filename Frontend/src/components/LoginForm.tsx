// src/components/LoginForm.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon, Loader2, ArrowRight } from "lucide-react";
import GoogleLogo from "@/assets/google-icon.svg";
import { MiniToolboxIllustration } from "@/components/MiniIllustration";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be at most 72 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (loginMutation.isSuccess) {
      const t = setTimeout(() => navigate("/home"), 800);
      return () => clearTimeout(t);
    }
  }, [loginMutation.isSuccess, navigate]);

  const getErrorMessage = (err: unknown) => {
    if (!err) return "Login failed";
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message;
    const maybe = err as { response?: { data?: { detail?: string } } };
    return maybe?.response?.data?.detail ?? "Login failed";
  };

  function onSubmit(values: LoginValues) {
    loginMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Login successful!");
        form.reset();
      },
      onError: (err: unknown) => {
        const message = getErrorMessage(err);
        toast.error(message);
        form.setError("root", { message });
      },
    });
  }

  const busy = loginMutation.isPending;

  const loginWithGoogle = () => {
    window.location.href = "http://localhost:8000/auth/google/login";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        /* ── Outer shell ── */
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

        /* ── Left — form panel ── */
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

        /* ── Right — illustration panel ── */
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

        /* ── Form internals (unchanged from before) ── */
        .login-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(160,130,255,0.9);
          margin-bottom: 12px;
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
          margin-bottom: 6px;
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

        .login-form-panel [data-slot="form-label"],
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

        .login-form-panel [data-slot="form-message"] {
          font-family: 'Sora', sans-serif !important;
          font-size: 12px !important;
          color: #ff6b6b !important;
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

        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

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

        .signup-link:hover { color: rgba(255,255,255,0.6); }
        .signup-link:hover span { color: #a082ff; }

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

        .forgot-link {
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          color: rgba(160,130,255,0.7);
          text-decoration: none;
          transition: color 0.2s;
          float: right;
          margin-top: -2px;
        }

        .forgot-link:hover { color: #a082ff; }

        .field-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
      `}</style>

      {/* ── Outer shell: form + illustration side-by-side ── */}
      <div className="login-shell">

        {/* Left — form */}
        <div className="login-form-panel">
          <div className="login-eyebrow">
            <span className="login-eyebrow-dot" />
            Welcome back
          </div>
          <h1 className="login-title">Sign in</h1>
          <p className="login-subtitle">Enter your credentials to continue</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" autoComplete="email" {...field}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <div className="field-header">
                      <FormLabel style={{ marginBottom: 0 }}>Password</FormLabel>
                      <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                    </div>
                    <FormControl>
                      <div className="password-field-wrapper">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••"
                          autoComplete="current-password"
                          {...field}
                          style={{ paddingRight: '44px' }}
                        />
                        <Button type="button" className="eye-btn" onClick={() => setShowPassword(s => !s)} tabIndex={-1}>
                          {showPassword ? <EyeOffIcon size={16}/> : <EyeIcon size={16}/>}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="btn-primary" disabled={busy} style={{ marginTop: '6px' }}>
                {busy
                  ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/>
                  : <><span>Login</span><ArrowRight size={16}/></>
                }
              </Button>

              <div className="login-divider">
                <div className="login-divider-line"/>
                <span className="login-divider-text">or</span>
                <div className="login-divider-line"/>
              </div>

              <Button type="button" className="btn-google" onClick={loginWithGoogle}>
                <img src={GoogleLogo} alt="Google" style={{ width: 18, height: 18 }}/>
                Continue with Google
              </Button>
            </form>
          </Form>

          <Link to="/signup" className="signup-link">
            Don&apos;t have an account? <span>Create one</span>
          </Link>
        </div>

        {/* Right — illustration */}
        <div className="login-illustration-panel">
          <MiniToolboxIllustration />
        </div>

      </div>
    </>
  );
}