"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";
import { createClient } from "@/lib/supabase/client";

const statCards = [
  {
    icon: "🔥",
    label: "Heat Level",
    value: "HIGH",
    context: "Crowd reaction",
    tone: "green",
    line: "M2 30 L18 25 L31 16 L43 19 L56 8 L72 13 L90 5",
  },
  {
    icon: "💀",
    label: "Fade Pressure",
    value: "RISING",
    context: "Fade side climbing",
    tone: "purple",
    line: "M2 28 L15 29 L28 24 L40 21 L52 17 L68 11 L90 6",
  },
  {
    icon: "👁",
    label: "Arena Watching",
    value: "12.8K",
    context: "Live viewers",
    tone: "green",
    line: "M2 24 L15 22 L28 23 L42 18 L58 20 L72 12 L90 10",
  },
  {
    icon: "⚠",
    label: "Arena Mood",
    value: "HOSTILE",
    context: "Volatility high",
    tone: "purple",
    line: "M2 23 L14 13 L25 24 L38 12 L51 22 L66 9 L90 18",
  },
];

export function CreateAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Email is required.");
      return;
    }

    if (!password.trim()) {
      setMessage("Password is required.");
      return;
    }

    if (!termsAccepted) {
      setMessage("Agree to the terms before entering the arena.");
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the public URL and anon key.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const emailRedirectTo = `${window.location.origin}/auth/callback?next=/username`;
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo,
        data: {
          source: "signup",
        },
      },
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <SignupAtmosphere />
      <div className="relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,1180px)] flex-col py-5">
        <SignupHeader />

        <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-7 py-7 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
          <div className="min-w-0 text-center lg:text-left">
            <p className="text-[0.7rem] font-black uppercase italic tracking-[0.24em] text-lime-300">
              Live pressure check
            </p>
            <h1 className="sports-display mt-4 text-[4.6rem] italic leading-[0.82] tracking-tight text-white drop-shadow-[0_10px_28px_rgba(255,255,255,0.14)] min-[390px]:text-[5.4rem] sm:text-[7rem] lg:text-[8rem]">
              Think You Have
              <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent">
                What It Takes?
              </span>
            </h1>
            <div className="mx-auto mt-4 h-1.5 w-64 rounded-full bg-gradient-to-r from-lime-300 via-white/50 to-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.34)] lg:mx-0" />
            <p className="mt-5 text-base font-black uppercase tracking-[0.13em] text-gray-300 sm:text-xl">
              The internet never forgets a bad take.
            </p>

            <ChallengeCard />
          </div>

          <SignupCard
            email={email}
            message={message}
            password={password}
            setEmail={setEmail}
            setMessage={setMessage}
            setPassword={setPassword}
            setShowPassword={setShowPassword}
            setTermsAccepted={setTermsAccepted}
            showPassword={showPassword}
            termsAccepted={termsAccepted}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        </section>

        <StatCards />
        <SignupFooterLockup />
      </div>
    </main>
  );
}

function SignupHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
      <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="LOCKT home">
        <SmackTalkLogo size={54} />
        <div className="brand-lockup text-3xl leading-[0.82]">
          <span className="block text-white">Smack</span>
          <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
            Talk
          </span>
        </div>
      </Link>

      <Link
        className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:border-purple-300/60 hover:bg-purple-500/10 active:scale-95"
        href="/login"
      >
        Log In
      </Link>
    </header>
  );
}

function ChallengeCard() {
  return (
    <section className="relative isolate mx-auto mt-7 max-w-2xl overflow-hidden rounded-[1.75rem] border border-purple-300/30 bg-black/60 p-5 text-left shadow-[0_26px_88px_rgba(0,0,0,0.62),0_0_40px_rgba(168,85,247,0.14)] backdrop-blur-xl lg:mx-0">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(132,204,22,0.14),transparent_16rem),radial-gradient(circle_at_78%_64%,rgba(168,85,247,0.16),transparent_18rem)]" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">Live Take</p>
        <span className="rounded-full border border-red-400/50 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-300">
          Locked
        </span>
      </div>

      <h2 className="sports-display mt-5 text-[3.7rem] italic leading-[0.86] text-white sm:text-[5rem]">
        “Lakers Are
        <span className="block bg-gradient-to-r from-lime-300 to-purple-400 bg-clip-text text-transparent">
          Cooked.”
        </span>
      </h2>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/45 p-4 shadow-inner shadow-black/40">
        <div className="mb-4 flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-gray-400">
          <span>The Crowd</span>
          <span className="text-lime-300">Your take is live</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div className="min-w-0">
            <p className="scoreboard-number text-4xl leading-none text-lime-300">428</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-gray-400">Riding</p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black text-lg text-lime-300 shadow-[0_0_18px_rgba(132,204,22,0.18)]">
            ⚡
          </div>
          <div className="min-w-0 text-right">
            <p className="scoreboard-number text-4xl leading-none text-purple-300">612</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-gray-400">Fading</p>
          </div>
        </div>
        <div className="relative mt-4 overflow-hidden rounded-full border border-white/10 bg-white/10 p-1">
          <div className="grid h-4 grid-cols-[41fr_59fr] overflow-hidden rounded-full">
            <div className="bg-gradient-to-r from-lime-300 to-lime-400 shadow-[0_0_22px_rgba(132,204,22,0.45)]" />
            <div className="bg-gradient-to-r from-purple-500 to-violet-500 shadow-[0_0_22px_rgba(168,85,247,0.45)]" />
          </div>
          <div className="absolute left-[41%] top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-[#050508] text-[10px] font-black uppercase tracking-tight text-white shadow-[0_0_18px_rgba(0,0,0,0.65)]">
            VS
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em]">
          <span className="text-lime-300">41% Ride</span>
          <span className="text-purple-300">59% Fade</span>
        </div>
      </div>
    </section>
  );
}

function SignupCard({
  email,
  message,
  password,
  setEmail,
  setMessage,
  setPassword,
  setShowPassword,
  setTermsAccepted,
  showPassword,
  termsAccepted,
  isLoading,
  onSubmit,
}: {
  email: string;
  message: string;
  password: string;
  setEmail: (value: string) => void;
  setMessage: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  setTermsAccepted: (value: boolean) => void;
  showPassword: boolean;
  termsAccepted: boolean;
  isLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="relative isolate w-full rounded-[1.75rem] border border-white/15 bg-black/65 p-5 text-left shadow-[0_28px_90px_rgba(0,0,0,0.62),0_0_44px_rgba(132,204,22,0.1)] backdrop-blur-xl sm:p-7"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-[1.75rem] bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.12),transparent_16rem)]" />
      <h2 className="text-center text-sm font-black uppercase tracking-[0.22em] text-purple-300">Get Your Smack Game Ready</h2>

      <label className="mt-7 block">
        <span className="text-xs font-black uppercase tracking-[0.22em] text-white">Email Address</span>
        <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 shadow-inner shadow-black/35 transition focus-within:border-lime-300/55 focus-within:bg-white/[0.1]">
          <span className="text-lime-300">♙</span>
          <input
            className="min-h-10 w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-gray-500"
            onChange={(event) => {
              setEmail(event.target.value);
              setMessage("");
            }}
            placeholder="you@domain.com"
            type="email"
            value={email}
          />
        </div>
      </label>

      <label className="mt-5 block">
        <span className="text-xs font-black uppercase tracking-[0.22em] text-white">Create a Password</span>
        <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 shadow-inner shadow-black/35 transition focus-within:border-lime-300/55 focus-within:bg-white/[0.1]">
          <span className="text-lime-300">▣</span>
          <input
            className="min-h-10 w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-gray-500"
            onChange={(event) => {
              setPassword(event.target.value);
              setMessage("");
            }}
            placeholder="••••••••••••"
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-gray-400 transition hover:bg-white/10 hover:text-white active:scale-95"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            ◉
          </button>
        </div>
      </label>

      <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-gray-300">
        <input
          checked={termsAccepted}
          className="mt-0.5 h-5 w-5 rounded border-white/20 bg-black accent-lime-300"
          onChange={(event) => setTermsAccepted(event.target.checked)}
          type="checkbox"
        />
        <span>
          I agree to the{" "}
          <Link className="font-black text-lime-300 transition hover:text-purple-300" href="/terms">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link className="font-black text-lime-300 transition hover:text-purple-300" href="/privacy">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {message && (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-gray-200">
          {message}
        </p>
      )}

      <button
        disabled={isLoading}
        type="submit"
        className="mt-6 min-h-14 w-full rounded-xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-base font-black uppercase italic tracking-[0.12em] text-black shadow-[0_0_34px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_46px_rgba(168,85,247,0.34)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
      >
        {isLoading ? "Creating Account..." : "Get Your Smack Game Ready"}
      </button>

      <p className="mt-5 text-center text-xs font-black uppercase tracking-[0.14em] text-gray-400">
        Receipts are permanent. No switching sides. The Arena is watching.
      </p>
    </form>
  );
}

function StatCards() {
  return (
    <section className="grid gap-3 border-y border-white/10 py-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <article
          key={stat.label}
          className={`group relative isolate overflow-hidden rounded-2xl border bg-black/55 p-4 shadow-[0_18px_54px_rgba(0,0,0,0.46)] transition hover:-translate-y-0.5 ${
            stat.tone === "green"
              ? "border-lime-300/25 hover:border-lime-300/45 hover:shadow-[0_0_34px_rgba(132,204,22,0.12)]"
              : "border-purple-300/25 hover:border-purple-300/45 hover:shadow-[0_0_34px_rgba(168,85,247,0.14)]"
          }`}
        >
          <div
            className={`pointer-events-none absolute inset-0 -z-10 opacity-70 ${
              stat.tone === "green"
                ? "bg-[radial-gradient(circle_at_18%_0%,rgba(132,204,22,0.16),transparent_11rem)]"
                : "bg-[radial-gradient(circle_at_18%_0%,rgba(168,85,247,0.18),transparent_11rem)]"
            }`}
          />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{stat.label}</p>
              <p className={`scoreboard-number mt-2 text-4xl ${stat.tone === "green" ? "text-lime-300" : "text-purple-300"}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-bold text-gray-400">{stat.context}</p>
            </div>
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-2xl ${
                stat.tone === "green"
                  ? "border-lime-300/30 bg-lime-300/10"
                  : "border-purple-300/30 bg-purple-500/10"
              }`}
            >
              {stat.icon}
            </div>
          </div>
          <svg className="mt-4 h-12 w-full overflow-visible" viewBox="0 0 92 36" fill="none" aria-hidden="true">
            <path d="M2 9 H90 M2 20 H90 M2 31 H90" stroke="rgba(255,255,255,0.055)" strokeWidth="1" />
            <path d="M2 31 H90" stroke="rgba(255,255,255,0.13)" strokeWidth="1.5" />
            <path
              d={stat.line}
              stroke={stat.tone === "green" ? "#bef264" : "#c084fc"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              className={stat.tone === "green" ? "drop-shadow-[0_0_7px_rgba(132,204,22,0.65)]" : "drop-shadow-[0_0_7px_rgba(168,85,247,0.65)]"}
            />
          </svg>
          <div className="mt-2 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em] text-gray-600">
            <span>Now</span>
            <span>Live signal</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function SignupFooterLockup() {
  return (
    <footer className="py-6">
      <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-center shadow-[0_18px_60px_rgba(0,0,0,0.42)]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(132,204,22,0.1),transparent_32%,rgba(168,85,247,0.12))]" />
        <p className="text-xs font-black uppercase tracking-[0.19em] text-gray-400">
          <span className="text-lime-300">Receipts are permanent.</span>{" "}
          <span className="text-white">No switching sides.</span>{" "}
          <span className="text-purple-300">The Arena is watching.</span>
        </p>
      </div>
    </footer>
  );
}

function SignupAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_18%,rgba(132,204,22,0.12),transparent_28rem),radial-gradient(circle_at_75%_30%,rgba(168,85,247,0.2),transparent_34rem),linear-gradient(180deg,rgba(2,4,10,0.66),#02040a_72%)]" />
      <div className="absolute left-1/2 top-20 h-80 w-[72rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute left-0 top-72 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />
      <div className="absolute right-0 top-48 h-96 w-96 rounded-full bg-purple-500/14 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-[36rem] opacity-32 bg-[repeating-radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.11)_0_1px,transparent_1px_18px)] [mask-image:linear-gradient(to_top,#000_0_28%,transparent_74%)]" />
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
    </div>
  );
}
