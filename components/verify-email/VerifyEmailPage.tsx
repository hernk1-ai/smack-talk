"use client";

import { useState } from "react";
import Link from "next/link";
import { LocktLogo } from "@/components/LocktLogo";
import { buildSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/client";

const steps = [
  { label: "Sign Up", state: "complete", icon: "✓" },
  { label: "Verify Email", state: "active", icon: "✉" },
  { label: "Arena Access", state: "locked", icon: "▣" },
];

export function VerifyEmailPage({ email }: { email?: string }) {
  const displayEmail = email || "you@domain.com";

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <VerifyAtmosphere />
      <div className="relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,1180px)] flex-col">
        <header className="flex justify-center py-8 sm:py-10">
          <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="LOCKT home">
            <LocktLogo size={68} />
            <div className="brand-lockup text-4xl leading-[0.82]">
              <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
            </div>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center pb-8">
          <section className="mx-auto w-full max-w-3xl">
            <ProgressStepper />
            <VerifyCard email={displayEmail} canResend={Boolean(email)} />
          </section>
        </div>

        <VerifyFooter />
      </div>
    </main>
  );
}

function ProgressStepper() {
  return (
    <div className="mx-auto mb-6 grid max-w-xl grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
      {steps.map((step, index) => (
        <div key={step.label} className="contents">
          <div className="grid justify-items-center gap-2">
            <div
              className={`grid h-12 w-12 place-items-center rounded-full border text-xl font-black shadow-[0_0_24px_rgba(0,0,0,0.35)] ${
                step.state === "complete"
                  ? "border-purple-300/45 bg-purple-500/20 text-purple-200"
                  : step.state === "active"
                    ? "border-lime-300/70 bg-lime-300 text-black shadow-[0_0_34px_rgba(132,204,22,0.5)]"
                    : "border-white/15 bg-white/[0.04] text-gray-500"
              }`}
            >
              {step.icon}
            </div>
            <p
              className={`text-center text-[10px] font-black uppercase tracking-[0.16em] ${
                step.state === "active" ? "text-white" : step.state === "complete" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {step.label}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className="h-px w-full bg-gradient-to-r from-purple-500/70 via-lime-300/45 to-white/10" />
          )}
        </div>
      ))}
    </div>
  );
}

function VerifyCard({ canResend, email }: { canResend: boolean; email: string }) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function resendEmail() {
    if (!canResend) {
      setMessage("Open the verification link from your inbox, or sign up again with your email.");
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the public URL and anon key.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: buildSiteUrl("/auth/callback?next=/username"),
      },
    });

    setIsLoading(false);
    setMessage(error ? error.message : "Verification email sent again.");
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/15 bg-black/65 p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.62),0_0_42px_rgba(168,85,247,0.12)] backdrop-blur-xl sm:p-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(132,204,22,0.14),transparent_18rem),radial-gradient(circle_at_50%_52%,rgba(168,85,247,0.1),transparent_20rem)]" />
      <EnvelopeHero />

      <h1 className="sports-display mt-8 text-[4rem] italic leading-[0.8] text-white drop-shadow-[0_10px_26px_rgba(255,255,255,0.14)] min-[390px]:text-[5rem] sm:text-[7rem]">
        Check Your
        <span className="block bg-gradient-to-r from-lime-300 via-lime-300 to-purple-400 bg-clip-text text-transparent">
          Inbox
        </span>
      </h1>
      <div className="mx-auto mt-4 h-1.5 w-56 rounded-full bg-gradient-to-r from-lime-300 via-white/45 to-purple-500 shadow-[0_0_24px_rgba(132,204,22,0.3)]" />

      <p className="mx-auto mt-5 max-w-md text-base font-semibold leading-7 text-gray-300">
        We sent a verification link to
        <span className="block font-black text-lime-300">{email}</span>
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-gray-400">
        Click the link to verify your email and unlock full access to LOCKT.
      </p>

      {message && (
        <p className="mx-auto mt-5 max-w-md rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-gray-200">
          {message}
        </p>
      )}

      <div className="mx-auto mt-8 grid max-w-lg gap-3">
        <button
          type="button"
          onClick={resendEmail}
          disabled={isLoading}
          className="min-h-14 rounded-xl bg-gradient-to-r from-lime-300 to-lime-500 px-5 text-base font-black uppercase tracking-[0.14em] text-black shadow-[0_0_34px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_46px_rgba(132,204,22,0.38)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
        >
          {isLoading ? "Sending..." : "Resend Email ↗"}
        </button>
        <Link
          href="/login"
          className="grid min-h-14 place-items-center rounded-xl border border-purple-300/55 bg-purple-500/10 px-5 text-base font-black uppercase tracking-[0.14em] text-purple-200 transition hover:-translate-y-0.5 hover:bg-purple-500/20 hover:shadow-[0_0_26px_rgba(168,85,247,0.18)] active:scale-[0.99]"
        >
          ← Back To Login
        </Link>
      </div>

      <div className="mx-auto mt-8 grid max-w-lg grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left shadow-inner shadow-black/40">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-purple-300/35 bg-purple-500/10 text-3xl text-purple-300">
          ♜
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-300">Verification link expires in:</p>
          <p className="scoreboard-number mt-1 text-3xl text-lime-300">14:59</p>
        </div>
      </div>
    </section>
  );
}

function EnvelopeHero() {
  return (
    <div className="mx-auto grid h-48 w-64 place-items-center rounded-full bg-[radial-gradient(circle,rgba(132,204,22,0.14),transparent_68%)]">
      <div className="relative">
        <div className="absolute -top-8 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full border border-lime-300/80 bg-black shadow-[0_0_36px_rgba(132,204,22,0.6)]">
          <span className="text-5xl text-lime-300">✓</span>
        </div>
        <div className="grid h-28 w-44 place-items-center rounded-2xl border-2 border-white/80 bg-black/45 shadow-[0_0_34px_rgba(255,255,255,0.18),0_0_40px_rgba(132,204,22,0.18)]">
          <div className="h-16 w-32 border-b-2 border-l-2 border-lime-300/65 border-r-2 border-white/70 border-t-0 [clip-path:polygon(0_0,50%_56%,100%_0,100%_100%,0_100%)]" />
        </div>
        <div className="absolute -bottom-3 left-1/2 h-2 w-44 -translate-x-1/2 rounded-full bg-lime-300 blur-sm" />
      </div>
    </div>
  );
}

function VerifyFooter() {
  return (
    <footer className="grid gap-4 border-t border-white/10 py-5 text-center text-xs font-semibold text-gray-400 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:text-left">
      <LocktLogo size={34} />
      <p className="font-black uppercase tracking-[0.18em] text-lime-300">
        Built on takes. <span className="text-purple-400">Backed by receipts.</span>
      </p>
      <p>
        Need help?{" "}
        <a className="font-black text-purple-300 transition hover:text-lime-300" href="mailto:support@getlockt.com">
          Contact support
        </a>
      </p>
    </footer>
  );
}

function VerifyAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_4%,rgba(168,85,247,0.18),transparent_34rem),radial-gradient(circle_at_50%_38%,rgba(132,204,22,0.1),transparent_24rem),linear-gradient(180deg,rgba(2,4,10,0.68),#02040a_76%)]" />
      <div className="absolute left-1/2 top-12 h-60 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute left-0 top-40 h-[42rem] w-1/3 bg-[linear-gradient(100deg,rgba(168,85,247,0.18),transparent)] blur-xl" />
      <div className="absolute right-0 top-40 h-[42rem] w-1/3 bg-[linear-gradient(260deg,rgba(132,204,22,0.1),rgba(168,85,247,0.12),transparent)] blur-xl" />
      <div className="absolute inset-x-0 bottom-12 h-[32rem] opacity-35 bg-[repeating-radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.11)_0_1px,transparent_1px_18px)] [mask-image:linear-gradient(to_top,#000_0_28%,transparent_74%)]" />
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
    </div>
  );
}
