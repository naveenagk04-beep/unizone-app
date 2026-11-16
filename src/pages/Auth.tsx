import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Logo } from "@/components/Logo";
import mark from "@/assets/unizone-mark.svg";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not send the code. Please check the email and try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch {
      setError("That code did not match. Check the email and try again.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start a demo session. Please try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-[#0e1330] text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-24 top-10 size-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "56px 56px" }} />

        <div className="relative flex flex-1 flex-col p-10 xl:p-14">
          <Link to="/" className="inline-flex w-fit items-center gap-2.5">
            <img src={mark} alt="" className="size-10" />
            <span className="font-display text-2xl font-extrabold tracking-[-0.04em]">UniZone</span>
          </Link>

          <div className="my-auto max-w-md py-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
              <Sparkles className="size-3.5" /> One campus, one zone
            </span>
            <h1 className="mt-5 font-display text-[2.4rem] font-bold leading-[1.1] tracking-[-0.035em]">
              Every campus workflow,
              <br />
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
                in one place.
              </span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-indigo-100/60">
              Approvals that follow real policy. Study tools grounded in your own
              syllabus. A canteen token that updates live. It all works together
              because it is one product.
            </p>

            <div className="mt-8 space-y-3">
              {[
                ["Role-checked on every action", "Students, faculty, HODs, admins, canteen and events each get the right scope."],
                ["Your data persists", "Requests, notes, orders and plans stay after refresh and re-login."],
                ["A campus that feels alive", "Seeded demo queues, tokens and resources, ready on first sign-in."],
              ].map(([title, body]) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white/90">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-indigo-100/50">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
            <p className="text-[11px] leading-5 text-indigo-100/70">
              “We replaced four disconnected portals with UniZone. Approvals that took
              three days now close the same afternoon — and the audit trail is complete.”
            </p>
            <p className="mt-2 text-[10px] font-medium text-indigo-200/50">
              Dr. Ananya Rao · HOD, Computer Science
            </p>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col bg-background">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="lg:hidden">
            <Logo size="sm" />
          </Link>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-[400px]">
            <div className="mb-7 hidden items-center gap-3 lg:flex">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LockKeyhole className="size-[18px]" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">Sign in to UniZone</p>
                <p className="text-[11px] text-muted-foreground">Secured with a one-time email code.</p>
              </div>
            </div>

            <div className="uz-card p-6 sm:p-7">
              {step === "signIn" ? (
                <>
                  <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold tracking-tight">
                      Welcome to your campus
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Use your institutional email. We'll send a six-digit code — no
                      password to remember.
                    </p>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-xs font-medium">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          placeholder="you@campus.edu"
                          type="email"
                          autoComplete="email"
                          className="h-11 rounded-xl pl-9"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {error}
                      </div>
                    )}

                    <Button type="submit" className="h-11 w-full gap-2 rounded-xl" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Sending code…
                        </>
                      ) : (
                        <>
                          Send sign-in code <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="my-5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      or explore the demo
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full gap-2 rounded-xl bg-muted/30"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <UserRound className="size-4" />
                    Continue with a demo account
                  </Button>

                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-[10px] leading-4 text-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    Demo accounts choose a portal next, then can preview all six roles
                    from the account menu. Real deployments provision roles from the
                    admin console.
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep("signIn")}
                    className="mb-5 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" /> Use a different email
                  </button>
                  <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold tracking-tight">
                      Check your email
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      We sent a six-digit code to{" "}
                      <span className="font-medium text-foreground">{step.email}</span>.
                      It expires shortly, so use it now.
                    </p>
                  </div>
                  <form onSubmit={handleOtpSubmit} className="space-y-5">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />
                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                            const form = (e.target as HTMLElement).closest("form");
                            if (form) form.requestSubmit();
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} className="size-11" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && (
                      <p className="text-center text-xs text-rose-600">{error}</p>
                    )}
                    <Button
                      type="submit"
                      className="h-11 w-full gap-2 rounded-xl"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Verifying…
                        </>
                      ) : (
                        <>
                          Verify and continue <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>

            <p className="mt-5 text-center text-[10px] leading-4 text-muted-foreground">
              By continuing you agree to the campus acceptable-use policy. UniZone
              never exposes private contact details to other students.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
