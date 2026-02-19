// src/components/LoginForm.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import GoogleLogo from "@/assets/google-icon.svg";

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
  email: z.email("Enter a valid email"),
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

  // Navigate after success
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
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-bold text-3xl">Login</CardTitle>
        <CardDescription>Enter your credentials below</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@gmail.com"
                      autoComplete="email"
                      {...field}
                    />
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
                <FormItem className="relative">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="*********"
                      autoComplete="current-password"
                      {...field}
                      className="pr-10"
                    />
                  </FormControl>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-8 h-8 w-8 text-muted-foreground hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </Button>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
            </Button>

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              onClick={loginWithGoogle}
              className="w-full"
              asChild
            >
              <Link to="/auth/google/login">
                <img src={GoogleLogo} alt="Google" className="h-5 w-5" />
                Continue with Google
              </Link>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link to="/signup">Don&apos;t have an account? Sign up</Link>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
