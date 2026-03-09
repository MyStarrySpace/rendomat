"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticate } from "@neondatabase/neon-js/auth/react/ui";
import { authClient } from "@/lib/auth";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "login" | "signup" | "forgot-password";

export default function AuthPage() {
  const { user } = useAuthenticate({ enabled: false });
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) router.replace("/clients");
  }, [user, router]);

  if (user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "forgot-password") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await (authClient as any).forgetPassword({ email, redirectTo: "/auth" });
        if (res.error) {
          setError(res.error.message || "Could not send reset email.");
        } else {
          setMessage("Check your email for a password reset link.");
        }
        setLoading(false);
        return;
      }

      if (mode === "login") {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) {
          const code = res.error.code;
          // User not found — switch to signup with fields prefilled
          if (
            code === "USER_NOT_FOUND" ||
            code === "INVALID_EMAIL" ||
            res.error.message?.toLowerCase().includes("user not found") ||
            res.error.message?.toLowerCase().includes("no user")
          ) {
            setMode("signup");
            setError("");
            setLoading(false);
            return;
          }
          // Wrong password
          setError("Incorrect password.");
          setLoading(false);
          return;
        }
        // Success
        router.replace("/clients");
        return;
      }

      if (mode === "signup") {
        const res = await authClient.signUp.email({
          email,
          name: name || email.split("@")[0],
          password,
        });
        if (res.error) {
          // If user already exists, switch back to login
          if (
            res.error.code === "USER_ALREADY_EXISTS" ||
            res.error.message?.toLowerCase().includes("already exists")
          ) {
            setMode("login");
            setError("An account with this email already exists. Sign in instead.");
            setLoading(false);
            return;
          }
          setError(res.error.message || "Could not create account.");
          setLoading(false);
          return;
        }
        // Success — auto sign in
        router.replace("/clients");
        return;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const headlineText =
    mode === "login"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : "Reset password";

  const subtitleText =
    mode === "login"
      ? "Sign in to continue to your projects"
      : mode === "signup"
        ? "Get started with Rendomat"
        : "We'll send you a reset link";

  const buttonText =
    mode === "login"
      ? "Sign in"
      : mode === "signup"
        ? "Create account"
        : "Send reset link";

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Rendomat
          </Link>
        </div>
      </nav>

      <div className="pt-32 pb-24 px-6 flex justify-center">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className="caption mb-3">
                {mode === "login"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Get started"
                    : "Forgot password"}
              </p>
              <h1 className="headline text-3xl text-[hsl(var(--foreground))] mb-2">
                {headlineText}
              </h1>
              <p className="text-sm text-[hsl(var(--foreground-muted))] mb-8">
                {subtitleText}
              </p>

              {mode !== "forgot-password" && (
                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await authClient.signIn.social({
                          provider: "github",
                          callbackURL: window.location.origin + "/clients",
                        });
                      } catch {
                        setError("GitHub sign-in is not available right now.");
                      }
                    }}
                    className="w-full h-10 flex items-center justify-center gap-2 text-sm font-medium bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] hover:border-[hsl(var(--border-hover))] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    Continue with GitHub
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await authClient.signIn.social({
                          provider: "google",
                          callbackURL: window.location.origin + "/clients",
                        });
                      } catch {
                        setError("Google sign-in is not available right now.");
                      }
                    }}
                    className="w-full h-10 flex items-center justify-center gap-2 text-sm font-medium bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] hover:border-[hsl(var(--border-hover))] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-[hsl(var(--border))]" />
                    <span className="text-xs text-[hsl(var(--foreground-subtle))] uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-[hsl(var(--border))]" />
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      icon={<User className="w-4 h-4" />}
                      autoComplete="name"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {mode !== "forgot-password" && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<Lock className="w-4 h-4" />}
                      required
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                    />
                  </div>
                )}

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-[hsl(var(--error))]"
                  >
                    {error}
                    {error === "Incorrect password." && (
                      <>
                        {" "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("forgot-password");
                            setError("");
                          }}
                          className="underline underline-offset-2 hover:text-[hsl(var(--foreground))] transition-colors"
                        >
                          Forgot password?
                        </button>
                      </>
                    )}
                  </motion.p>
                )}

                {message && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-[hsl(var(--success))]"
                  >
                    {message}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  {buttonText}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-[hsl(var(--border))]">
                {mode === "login" && (
                  <p className="text-sm text-[hsl(var(--foreground-muted))] text-center">
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => {
                        setMode("signup");
                        setError("");
                        setMessage("");
                      }}
                      className="text-[hsl(var(--foreground))] underline underline-offset-2 hover:text-[hsl(var(--accent))] transition-colors"
                    >
                      Create one
                    </button>
                  </p>
                )}
                {mode === "signup" && (
                  <p className="text-sm text-[hsl(var(--foreground-muted))] text-center">
                    Already have an account?{" "}
                    <button
                      onClick={() => {
                        setMode("login");
                        setError("");
                        setMessage("");
                      }}
                      className="text-[hsl(var(--foreground))] underline underline-offset-2 hover:text-[hsl(var(--accent))] transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {mode === "forgot-password" && (
                  <p className="text-sm text-[hsl(var(--foreground-muted))] text-center">
                    Remembered your password?{" "}
                    <button
                      onClick={() => {
                        setMode("login");
                        setError("");
                        setMessage("");
                      }}
                      className="text-[hsl(var(--foreground))] underline underline-offset-2 hover:text-[hsl(var(--accent))] transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
