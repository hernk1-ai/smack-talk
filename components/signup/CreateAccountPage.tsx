"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";

const featureCards = [
  {
    title: "Back Your Takes",
    body: "No cap. Just you.",
    icon: "♜",
  },
  {
    title: "Build Your Rep",
    body: "Earn respect. Lose it fast.",
    icon: "☷",
  },
  {
    title: "Compete Daily",
    body: "Real matchups. Real rivalries.",
    icon: "♕",
  },
  {
    title: "Receipts Never Lie",
    body: "The tape does not forget.",
    icon: "▤",
  },
];

const proofStats = [
  { value: "12.8K", label: "Online Now" },
  { value: "2.4M", label: "Takes Today" },
  { value: "84K", label: "Receipts Added" },
  { value: "97%", label: "Smack IQ Rate" },
];

export function CreateAccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    setMessage("Account flow ready. Auth connection comes next.");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <SignupAtmosphere />
      <div className="relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,1180px)] flex-col">
        <SignupHeader />

        <section className="flex flex-1 items-center justify-center py-5 sm:py-7 lg:py-7">
          <div className="mx-auto w-full max-w-2xl text-center">
            <p className="text-[0.7rem] font-black uppercase italic tracking-[0.22em] text-lime-300">
              Built on takes. <span className="text-purple-400">Backed by receipts.</span>
            </p>
            <h1 className="sports-display mt-4 text-[5rem] italic leading-[0.78] tracking-tight text-white drop-shadow-[0_10px_28px_rgba(255,255,255,0.16)] min-[390px]:text-[6rem] sm:text-[8rem] lg:text-[9rem]">
              Enter
              <span className="block bg-gradient-to-r from-purple-500 via-purple-300 to-lime-300 bg-clip-text text-transparent">
                The Arena
              </span>
            </h1>
            <div className="mx-auto mt-3 h-1.5 w-56 rounded-full bg-gradient-to-r from-lime-300 via-white/50 to-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.34)]" />
            <p className="mt-4 text-base font-black uppercase tracking-[0.12em] text-gray-300 sm:text-xl">
              Lock your takes. Build your REP.
            </p>

            <SignupCard
              email={email}
              message={message}
              password={password}
              setEmail={setEmail}
              setPassword={setPassword}
              setShowPassword={setShowPassword}
              setTermsAccepted={setTermsAccepted}
              showPassword={showPassword}
              termsAccepted={termsAccepted}
              onSubmit={handleSubmit}
            />
          </div>
        </section>

        <FeatureRow />
        <ProofSection />
        <StatsRow />
      </div>
    </main>
  );
}

function SignupHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 py-5">
      <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="Smack Talk home">
        <SmackTalkLogo size={54} />
        <div className="brand-lockup text-3xl leading-[0.82]">
          <span className="block text-white">Smack</span>
          <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
            Talk
          </span>
        </div>
      </Link>

      <nav className="hidden items-center gap-9 text-xs font-black uppercase tracking-[0.22em] text-gray-300 md:flex">
        <a className="transition hover:text-lime-300" href="#about">
          About
        </a>
        <a className="transition hover:text-lime-300" href="#features">
          Features
        </a>
        <a className="transition hover:text-lime-300" href="#community">
          Community
        </a>
        <a className="transition hover:text-lime-300" href="#top-talkers">
          Top Talkers
        </a>
      </nav>

      <a
        className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:border-purple-300/60 hover:bg-purple-500/10 active:scale-95"
        href="#login"
      >
        Log In
      </a>
    </header>
  );
}

function SignupCard({
  email,
  message,
  password,
  setEmail,
  setPassword,
  setShowPassword,
  setTermsAccepted,
  showPassword,
  termsAccepted,
  onSubmit,
}: {
  email: string;
  message: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  setTermsAccepted: (value: boolean) => void;
  showPassword: boolean;
  termsAccepted: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-6 max-w-xl rounded-[1.75rem] border border-white/15 bg-black/55 p-5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_36px_rgba(168,85,247,0.12)] backdrop-blur-xl sm:p-6"
    >
      <div className="mb-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/70" />
        <h2 className="text-center text-sm font-black uppercase tracking-[0.22em] text-purple-300">Create Your Account</h2>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-500/70" />
      </div>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.22em] text-white">Email</span>
        <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 shadow-inner shadow-black/35 transition focus-within:border-lime-300/55 focus-within:bg-white/[0.1]">
          <span className="text-lime-300">♙</span>
          <input
            className="min-h-10 w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-gray-500"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@domain.com"
            type="email"
            value={email}
          />
        </div>
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-black uppercase tracking-[0.22em] text-white">Password</span>
        <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 shadow-inner shadow-black/35 transition focus-within:border-lime-300/55 focus-within:bg-white/[0.1]">
          <span className="text-lime-300">▣</span>
          <input
            className="min-h-10 w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-gray-500"
            onChange={(event) => setPassword(event.target.value)}
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
          <a className="font-black text-lime-300 transition hover:text-purple-300" href="#terms">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="font-black text-lime-300 transition hover:text-purple-300" href="#privacy">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {message && (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-gray-200">
          {message}
        </p>
      )}

      <button
        type="submit"
        className="mt-5 min-h-14 w-full rounded-xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-lg font-black uppercase italic tracking-[0.12em] text-black shadow-[0_0_34px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_46px_rgba(168,85,247,0.34)] active:scale-[0.99]"
      >
        Lock My Spot →
      </button>

      <p id="login" className="mt-4 text-center text-sm font-semibold text-gray-400">
        Already have an account?{" "}
        <a className="font-black text-purple-300 transition hover:text-lime-300" href="#login">
          Log in
        </a>
      </p>
    </form>
  );
}

function FeatureRow() {
  return (
    <section id="features" className="grid gap-3 border-y border-white/10 py-6 sm:grid-cols-2 lg:grid-cols-4">
      {featureCards.map((card) => (
        <article key={card.title} className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center transition hover:-translate-y-1 hover:border-purple-300/40 hover:bg-white/[0.035]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-purple-300/40 bg-purple-500/10 text-3xl text-purple-300">
            {card.icon}
          </div>
          <h3 className="mt-4 text-sm font-black uppercase tracking-[0.1em] text-white">{card.title}</h3>
          <p className="mt-2 text-sm font-semibold leading-5 text-gray-400">{card.body}</p>
        </article>
      ))}
    </section>
  );
}

function ProofSection() {
  return (
    <section id="community" className="my-6 rounded-[1.75rem] border border-white/10 bg-black/45 p-5 text-center shadow-[0_22px_70px_rgba(0,0,0,0.42)] sm:p-6">
      <p className="text-5xl leading-none text-lime-300">“</p>
      <h2 className="sports-display text-4xl italic leading-none text-white sm:text-5xl">The world is watching.</h2>
      <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-gray-400">
        Your receipts. Your legacy. Your name on the board.
      </p>
      <div className="mx-auto mt-5 h-1 w-40 rounded-full bg-gradient-to-r from-lime-300 to-purple-500" />
    </section>
  );
}

function StatsRow() {
  return (
    <section id="top-talkers" className="grid gap-3 pb-8 sm:grid-cols-2 lg:grid-cols-4">
      {proofStats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center">
          <p className="scoreboard-number text-4xl text-lime-300">{stat.value}</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}

function SignupAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.18),transparent_34rem),radial-gradient(circle_at_12%_35%,rgba(132,204,22,0.12),transparent_28rem),linear-gradient(180deg,rgba(2,4,10,0.72),#02040a_70%)]" />
      <div className="absolute left-1/2 top-28 h-80 w-[80rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute left-0 top-72 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />
      <div className="absolute right-0 top-64 h-80 w-80 rounded-full bg-purple-500/14 blur-3xl" />
      <div className="absolute inset-x-0 top-28 h-[34rem] opacity-30 bg-[repeating-radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.11)_0_1px,transparent_1px_18px)] [mask-image:linear-gradient(to_top,#000_0_28%,transparent_72%)]" />
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
    </div>
  );
}
