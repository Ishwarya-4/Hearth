import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { acceptPendingInvitations } from "@/lib/space";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { HearthAuthCanvas } from "@/components/three/lazy-canvas";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, CalendarDays, Heart, Lock, Sparkles } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Hearth" }] }),
  validateSearch: (search: Record<string, unknown>): { unconfirmed?: boolean } => ({
    unconfirmed: search.unconfirmed === true || search.unconfirmed === "true",
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(72);
const nameSchema = z.string().trim().min(1, "Required").max(80);

type Mode = "signin" | "signup" | "forgot";

const EASE = [0.16, 1, 0.3, 1] as const;

const COPY: Record<Mode, { title: string; sub: string }> = {
  signin: { title: "Welcome back", sub: "Sign in to your shared space." },
  signup: { title: "Create your account", sub: "Start planning together in under a minute." },
  forgot: { title: "Reset your password", sub: "We'll email you a secure reset link." },
};

function AuthPage() {
  const navigate = useNavigate();
  const { unconfirmed } = Route.useSearch();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Magic-link / invite emails land here with tokens in the URL hash.
  useEffect(() => {
    let routed = false;

    async function enterApp() {
      if (routed) return;
      routed = true;
      try {
        await acceptPendingInvitations();
      } catch {
        /* RPC may not exist until migration is applied */
      }
      navigate({ to: "/today" });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        void enterApp();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void enterApp();
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (unconfirmed) {
      toast.error("Please confirm your email first — check your inbox for the link.");
    }
  }, [unconfirmed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ep = emailSchema.safeParse(email);
    if (!ep.success) return toast.error(ep.error.issues[0].message);

    if (mode === "forgot") {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Check your inbox for the reset link.");
        setMode("signin");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
      return;
    }

    const pp = passwordSchema.safeParse(password);
    if (!pp.success) return toast.error(pp.error.issues[0].message);
    if (mode === "signup") {
      const np = nameSchema.safeParse(fullName);
      if (!np.success) return toast.error(np.error.issues[0].message);
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/today`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          toast.error("That email already has an account. Try signing in.");
          setMode("signin");
          return;
        }
        if (data.session) {
          navigate({ to: "/today" });
        } else {
          toast.success("Almost there — check your email to confirm your account.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/today" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/today` },
    });
    if (error) {
      toast.error(error.message || "Google sign-in failed");
      setOauthLoading(false);
    }
  }

  const copy = COPY[mode];
  const showModeSwitch = mode !== "forgot";

  return (
    <div className="cinema-void grain relative min-h-screen overflow-hidden text-foreground">
      <div className="aurora" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.72_0.18_288)] shadow-[0_0_12px_oklch(0.66_0.2_288/0.9)]" />
            <span className="text-lg font-semibold tracking-tight">Hearth</span>
          </Link>
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-white/55 px-4 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </header>

        <main className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-8">
          <motion.section
            className="mx-auto w-full max-w-[430px]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.2_288)]" />
                Private shared space
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                {mode === "signin" && "Welcome back."}
                {mode === "signup" && "Start your Hearth."}
                {mode === "forgot" && "Reset access."}
              </h1>
              <p className="mt-3 max-w-sm text-base text-muted-foreground">{copy.sub}</p>
            </div>

            <div className="glass-dark glow-soft rounded-[1.5rem] p-5 sm:p-6">
              {showModeSwitch && (
                <div className="mb-5 grid grid-cols-2 rounded-2xl border border-border/70 bg-white/45 p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={mode === "signin" ? "auth-tab-active" : "auth-tab"}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={mode === "signup" ? "auth-tab-active" : "auth-tab"}
                  >
                    Create account
                  </button>
                </div>
              )}

              <AnimatePresence initial={false}>
                {mode !== "forgot" && (
                  <motion.div
                    key="google"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <button
                      type="button"
                      onClick={handleGoogle}
                      disabled={oauthLoading || loading}
                      className="btn-ghost-glass flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {oauthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                      Continue with Google
                    </button>

                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        or use email
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <AnimatePresence initial={false}>
                  {mode === "signup" && (
                    <FieldShell key="name">
                      <AuthField
                        id="name"
                        label="Full name"
                        value={fullName}
                        onChange={setFullName}
                        placeholder="Jordan Rivera"
                        autoComplete="name"
                        maxLength={80}
                      />
                    </FieldShell>
                  )}
                </AnimatePresence>

                <AuthField
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={255}
                  required
                />

                <AnimatePresence initial={false}>
                  {mode !== "forgot" && (
                    <FieldShell key="password">
                      <AuthField
                        id="password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="At least 8 characters"
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        minLength={8}
                        maxLength={72}
                        trailing={
                          mode === "signin" ? (
                            <button
                              type="button"
                              onClick={() => setMode("forgot")}
                              className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                              Forgot?
                            </button>
                          ) : undefined
                        }
                      />
                    </FieldShell>
                  )}
                </AnimatePresence>

                <MagneticButton
                  type="submit"
                  strength={0.12}
                  disabled={loading || oauthLoading}
                  className="btn-glow mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={loading ? "loading" : mode}
                      className="inline-flex items-center gap-2"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {mode === "signin" && "Sign in"}
                          {mode === "signup" && "Create account"}
                          {mode === "forgot" && "Send reset link"}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </motion.span>
                  </AnimatePresence>
                </MagneticButton>
              </form>

              <div className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "forgot" ? (
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                  </button>
                ) : (
                  <>
                    {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                      className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {mode === "signin" ? "Create a shared space" : "Sign in"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
              By continuing, you agree to our{" "}
              <span className="cursor-pointer underline-offset-2 hover:underline">Terms</span> and{" "}
              <span className="cursor-pointer underline-offset-2 hover:underline">Privacy Policy</span>.
            </p>
          </motion.section>

          <motion.section
            className="relative hidden min-h-[560px] overflow-hidden rounded-[2rem] border border-border/70 bg-white/45 shadow-[0_30px_90px_-55px_oklch(0.28_0.05_285/0.45)] backdrop-blur-xl lg:block"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
          >
            <div className="pointer-events-none absolute inset-0">
              <HearthAuthCanvas className="h-full w-full opacity-45" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-white via-white/85 to-transparent" />
            <div className="relative flex h-full flex-col justify-between p-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-[oklch(0.52_0.17_288)]" />
                  Built for your people
                </span>
                <h2 className="mt-5 max-w-md font-display text-4xl font-semibold tracking-tight">
                  One quiet place for what is next, now, and remembered.
                </h2>
              </div>

              <div className="grid gap-3">
                <AuthPreview />
                <div className="grid grid-cols-3 gap-3">
                  <AuthBenefit icon={CalendarDays} label="Shared plans" />
                  <AuthBenefit icon={Heart} label="Daily moments" />
                  <AuthBenefit icon={Lock} label="Private" />
                </div>
              </div>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}

/* Collapsible wrapper for fields that appear/disappear between modes */
function FieldShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
      style={{ overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}

/* Premium field: glass input with animated periwinkle focus ring + label */
function AuthField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  minLength,
  required,
  trailing,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <div className="pb-0.5">
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
          {label}
        </label>
        {trailing}
      </div>
      <div className="group relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          required={required}
          className="h-12 w-full rounded-xl border border-border bg-white/70 px-4 text-sm text-foreground shadow-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/70 focus:border-[oklch(0.56_0.17_288)]/60 focus:bg-white focus:ring-2 focus:ring-[oklch(0.62_0.2_288)]/25"
        />
      </div>
    </div>
  );
}

function AuthPreview() {
  return (
    <div className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Today in your Hearth</p>
          <p className="text-xs text-muted-foreground">Friday, June 26</p>
        </div>
        <span className="rounded-full bg-[oklch(0.62_0.2_288)]/10 px-2.5 py-1 text-[10px] font-semibold text-[oklch(0.48_0.16_288)]">
          Live
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4">
        <div className="space-y-2">
          <div className="rounded-xl border border-border/70 bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Next up
            </p>
            <p className="mt-1 text-sm font-semibold">Dinner with Mom</p>
            <p className="text-xs text-muted-foreground">7:00 PM tonight</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Memory prompt
            </p>
            <p className="mt-1 text-sm font-semibold">What made you smile?</p>
          </div>
        </div>
        <div className="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.2_288)]/15 to-[oklch(0.7_0.13_230)]/12 text-center">
          <div>
            <p className="font-display text-3xl font-semibold">24</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthBenefit({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white/70 p-3 text-center shadow-sm">
      <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[oklch(0.62_0.2_288)]/10 text-[oklch(0.48_0.16_288)]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 text-xs font-semibold">{label}</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.36-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.16-3.16C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
