"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LocktLogo } from "@/components/LocktLogo";
import { buildSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Email is required.");
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the public URL and anon key.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: buildSiteUrl("/auth/callback?next=/reset-password"),
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(`/reset-email-sent?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <ResetShell>
      <ResetCard eyebrow="1. Enter Email">
        <BackToLogin />
        <ResetLogo />
        <ResetHeadline first="Reset Your" second="Access" />
        <p className="mt-6 text-center text-base font-semibold text-gray-300">The Arena isn&apos;t going anywhere.</p>
        <MailMark />

        <form onSubmit={handleSubmit} className="mt-9 text-left">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-white">Enter Your Email</span>
            <input
              className="mt-4 min-h-14 w-full rounded-xl border border-white/15 bg-white/[0.065] px-4 text-base font-bold text-white outline-none transition placeholder:text-gray-500 focus:border-lime-300/65 focus:bg-white/[0.09] focus:shadow-[0_0_28px_rgba(132,204,22,0.16)]"
              onChange={(event) => {
                setEmail(event.target.value);
                setMessage("");
              }}
              placeholder="you@domain.com"
              type="email"
              value={email}
            />
          </label>

          {message && <p className="mt-4 text-sm font-black text-rose-300">{message}</p>}

          <PrimaryButton disabled={isLoading} type="submit">
            {isLoading ? "Sending..." : "Send Reset Link →"}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm font-semibold text-gray-400">
          Remember your password?{" "}
          <Link className="font-black text-lime-300 transition hover:text-purple-300" href="/login">
            Log in
          </Link>
        </p>
      </ResetCard>
    </ResetShell>
  );
}

export function ResetEmailSentPage({ email = "" }: { email?: string }) {
  return (
    <ResetShell>
      <ResetCard eyebrow="2. Reset Email Sent">
        <ResetLogo />
        <ResetHeadline first="Check Your" second="Email" />
        <EnvelopeCheck />

        <div className="mx-auto mt-8 max-w-md text-center">
          <p className="text-base font-semibold leading-7 text-gray-300">
            We sent a reset link to your email.
            {email ? <span className="block font-black text-white">{email}</span> : null}
          </p>
          <p className="mt-5 text-sm font-semibold leading-6 text-gray-400">
            If you don&apos;t see it, check your spam folder.
          </p>
        </div>

        {process.env.NODE_ENV === "development" ? (
          <Link
            href="/password-reset-email-preview"
            className="mt-4 grid min-h-12 w-full place-items-center rounded-xl border border-purple-300/40 bg-purple-500/10 px-5 text-sm font-black uppercase italic tracking-[0.14em] text-purple-200 transition hover:-translate-y-0.5 hover:bg-purple-500/20 active:scale-[0.99]"
          >
            Preview Reset Email
          </Link>
        ) : null}

        <Link
          href="/login"
          className="mt-10 grid min-h-14 w-full place-items-center rounded-xl border border-white/15 bg-white/[0.035] px-5 text-base font-black uppercase italic tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:border-purple-300/60 hover:bg-purple-500/10 hover:text-purple-200 active:scale-[0.99]"
        >
          Back To Login
        </Link>
      </ResetCard>
    </ResetShell>
  );
}

export function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password || !confirmPassword) {
      setMessage("Both password fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords must match.");
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the public URL and anon key.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated. Sending you back to login.");
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <ResetShell>
      <ResetCard eyebrow="3. Reset Password">
        <BackToLogin />
        <ResetHeadline first="Create New" second="Password" />
        <p className="mt-5 text-base font-semibold text-gray-300">Make it strong. Make it yours.</p>

        <form onSubmit={handleSubmit} className="mt-8 text-left">
          <PasswordField
            label="New Password"
            onChange={(value) => {
              setPassword(value);
              setMessage("");
            }}
            onToggleVisibility={() => setShowPassword(!showPassword)}
            showPassword={showPassword}
            value={password}
          />
          <StrengthBar />
          <PasswordField
            label="Confirm New Password"
            onChange={(value) => {
              setConfirmPassword(value);
              setMessage("");
            }}
            onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
            showPassword={showConfirmPassword}
            valid={password === confirmPassword && confirmPassword.length > 0}
            value={confirmPassword}
          />

          {message && <p className="mt-4 text-sm font-black text-gray-200">{message}</p>}

          <PrimaryButton disabled={isLoading} type="submit">
            {isLoading ? "Updating..." : "Update Password →"}
          </PrimaryButton>
        </form>
      </ResetCard>
    </ResetShell>
  );
}

export function PasswordResetEmailPreviewPage() {
  return (
    <ResetShell>
      <PasswordResetEmailPreview />
    </ResetShell>
  );
}

function ResetShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <ResetAtmosphere />
      <div
        className={`relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,1180px)] items-center justify-center py-8 ${
          wide ? "max-w-5xl" : "max-w-md"
        }`}
      >
        {children}
      </div>
    </main>
  );
}

function ResetCard({ children, eyebrow }: { children: React.ReactNode; eyebrow: string }) {
  return (
    <section className="w-full">
      <p className="mb-4 text-center text-xs font-black uppercase tracking-[0.22em] text-gray-300">{eyebrow}</p>
      <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/62 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.62),0_0_42px_rgba(168,85,247,0.11)] backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_52%,rgba(132,204,22,0.11),transparent_18rem),radial-gradient(circle_at_85%_30%,rgba(168,85,247,0.14),transparent_18rem)]" />
        {children}
      </div>
    </section>
  );
}

function ResetLogo() {
  return (
    <Link href="/" className="mx-auto flex w-fit items-center gap-3 transition hover:-translate-y-0.5" aria-label="LOCKT home">
      <LocktLogo size={52} />
      <div className="brand-lockup text-3xl leading-[0.82]">
        <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
      </div>
    </Link>
  );
}

function ResetHeadline({ first, second }: { first: string; second: string }) {
  return (
    <h1 className="sports-display mx-auto mt-12 max-w-full px-2 text-center text-[4.25rem] italic leading-[0.82] text-white drop-shadow-[0_10px_26px_rgba(255,255,255,0.13)] min-[390px]:text-[4.85rem]">
      {first}
      <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent">
        {second}
      </span>
    </h1>
  );
}

function BackToLogin() {
  return (
    <Link
      href="/login"
      className="inline-flex text-xs font-black uppercase tracking-[0.18em] text-gray-300 transition hover:text-lime-300"
    >
      ← Back To Login
    </Link>
  );
}

function MailMark() {
  return (
    <div className="mx-auto mt-10 grid h-28 w-40 place-items-center rounded-xl border border-white/12 bg-black/50 shadow-[0_0_34px_rgba(168,85,247,0.14)]">
      <div className="relative grid h-20 w-32 place-items-center rounded-lg bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(0,0,0,0.75))] [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_48%,rgba(132,204,22,0.7)_49%,rgba(168,85,247,0.72)_58%,transparent_59%)]" />
        <span className="relative text-6xl text-lime-300 drop-shadow-[0_0_18px_rgba(132,204,22,0.45)]">⚽</span>
      </div>
    </div>
  );
}

function EnvelopeCheck() {
  return (
    <div className="mx-auto mt-12 grid h-44 w-44 place-items-center rounded-full border border-lime-300/50 bg-black/45 shadow-[0_0_44px_rgba(132,204,22,0.2)]">
      <div className="relative">
        <div className="grid h-20 w-28 place-items-center rounded-xl border-2 border-white/40 bg-black/55">
          <div className="h-12 w-20 border-b-2 border-l-2 border-lime-300/55 border-r-2 border-white/40 [clip-path:polygon(0_0,50%_56%,100%_0,100%_100%,0_100%)]" />
        </div>
        <span className="absolute -right-8 -top-8 grid h-11 w-11 place-items-center rounded-full bg-lime-300 text-2xl font-black text-black shadow-[0_0_28px_rgba(132,204,22,0.52)]">
          ✓
        </span>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  onChange,
  onToggleVisibility,
  showPassword,
  valid,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  showPassword: boolean;
  valid?: boolean;
  value: string;
}) {
  return (
    <label className="mt-6 block first:mt-0">
      <span className="text-xs font-black uppercase tracking-[0.22em] text-white">{label}</span>
      <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-white/15 bg-white/[0.065] px-4 py-3 transition focus-within:border-lime-300/65 focus-within:bg-white/[0.09]">
        <input
          className="min-h-10 w-full bg-transparent text-base font-bold text-white outline-none placeholder:text-gray-500"
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••••"
          type={showPassword ? "text" : "password"}
          value={value}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="text-xs font-black uppercase tracking-[0.14em] text-gray-300 transition hover:text-lime-300"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
        {valid && <span className="text-lime-300">✓</span>}
      </div>
    </label>
  );
}

function StrengthBar() {
  return (
    <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-4">
      <div className="grid grid-cols-4 gap-1">
        <span className="h-1.5 rounded-full bg-lime-300" />
        <span className="h-1.5 rounded-full bg-lime-300" />
        <span className="h-1.5 rounded-full bg-lime-300" />
        <span className="h-1.5 rounded-full bg-white/10" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">Strong</span>
    </div>
  );
}

function PrimaryButton({
  children,
  disabled = false,
  type,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      disabled={disabled}
      type={type || "button"}
      className="mt-8 min-h-14 w-full rounded-xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-base font-black uppercase italic tracking-[0.16em] text-black shadow-[0_0_34px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_46px_rgba(168,85,247,0.34)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
    >
      {children}
    </button>
  );
}

function PasswordResetEmailPreview() {
  return (
    <section>
      <p className="mb-4 text-center text-xs font-black uppercase tracking-[0.22em] text-gray-300">Password Reset Email</p>
      <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/62 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.62),0_0_42px_rgba(168,85,247,0.11)] backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_22%,rgba(168,85,247,0.16),transparent_17rem),radial-gradient(circle_at_15%_64%,rgba(132,204,22,0.11),transparent_17rem)]" />
        <ResetLogo />
        <h2 className="sports-display mt-8 text-[3.25rem] italic leading-[0.86] text-white sm:text-[4rem]">
          Reset Your
          <span className="bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent"> Access.</span>
        </h2>
        <p className="mt-4 text-xl font-black text-white">The Arena is waiting.</p>
        <p className="mt-6 max-w-md text-sm font-semibold leading-6 text-gray-400">
          We received a request to reset your LOCKT password. Click the button below to create a new password and
          get back in the game.
        </p>
        <Link
          href="/reset-password"
          className="mt-8 grid min-h-14 place-items-center rounded-xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-base font-black uppercase italic tracking-[0.16em] text-black shadow-[0_0_34px_rgba(132,204,22,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_0_46px_rgba(168,85,247,0.32)] active:scale-[0.99]"
        >
          Reset Password
        </Link>
        <p className="mt-5 text-center text-xs font-semibold text-gray-500">This link will expire in 60 minutes.</p>
        <p className="mt-8 text-sm font-semibold text-gray-400">
          Thank you,
          <span className="block font-black text-lime-300">LOCKT Team</span>
        </p>
        <div className="mt-6 flex gap-5 text-xl text-gray-500">
          <span>X</span>
          <span>◎</span>
          <span>♪</span>
          <span>♟</span>
        </div>
      </div>
    </section>
  );
}

function ResetAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_42%,rgba(132,204,22,0.13),transparent_26rem),radial-gradient(circle_at_72%_28%,rgba(168,85,247,0.15),transparent_28rem),linear-gradient(180deg,rgba(2,4,10,0.7),#02040a_74%)]" />
      <div className="absolute left-1/2 top-20 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute left-0 bottom-20 h-80 w-80 rounded-full bg-lime-300/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-[32rem] opacity-30 bg-[repeating-radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.11)_0_1px,transparent_1px_18px)] [mask-image:linear-gradient(to_top,#000_0_28%,transparent_76%)]" />
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
    </div>
  );
}
