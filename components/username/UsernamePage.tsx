"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";

const takenNames = ["buckets", "admin", "smacktalk", "talkheavy23"];
const blockedWords = ["badword"];

const requirements = [
  "3-20 characters",
  "No profanity",
  "No impersonation",
  "Unique",
];

const examples = [
  { name: "FadeKing", status: "available" },
  { name: "Buckets", status: "already taken" },
  { name: "ClutchTalker", status: "available" },
];

export function UsernamePage() {
  const [username, setUsername] = useState("FadeKing");
  const [message, setMessage] = useState("");

  const validation = useMemo(() => validateUsername(username), [username]);
  const displayName = sanitizeDisplayName(username) || "FadeKing";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(validation.isValid ? `${displayName} is locked for future auth.` : validation.message);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <UsernameAtmosphere />
      <div className="relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,960px)] flex-col py-5 sm:py-7">
        <UsernameHeader />

        <section className="mx-auto flex w-full flex-1 flex-col items-center justify-center py-6 text-center sm:py-8">
          <ProgressDots />

          <p className="mt-6 text-[0.7rem] font-black uppercase tracking-[0.22em] text-gray-400">Step 4 of 5</p>
          <h1 className="sports-display mt-6 text-[4.1rem] italic leading-[0.82] tracking-tight text-white drop-shadow-[0_10px_28px_rgba(255,255,255,0.15)] min-[390px]:text-[4.9rem] sm:text-[7rem]">
            Choose Your
            <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent">
              Talker Identity
            </span>
          </h1>
          <p className="mt-5 text-xl font-black text-gray-300">Receipts follow this name.</p>

          <IdentityPreview username={displayName} />

          <form onSubmit={handleSubmit} className="mt-8 w-full max-w-3xl text-left">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-white">Choose a Username</span>
              <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-purple-300/70 bg-black/60 px-5 py-4 shadow-[0_0_32px_rgba(168,85,247,0.22)] transition focus-within:border-lime-300/70 focus-within:shadow-[0_0_34px_rgba(132,204,22,0.22)]">
                <input
                  className="min-h-12 w-full bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-gray-600"
                  maxLength={20}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setMessage("");
                  }}
                  placeholder="FadeKing"
                  value={username}
                />
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full border text-lg font-black ${
                    validation.isValid
                      ? "border-lime-300/70 bg-lime-300/15 text-lime-300"
                      : "border-rose-400/60 bg-rose-500/10 text-rose-300"
                  }`}
                  aria-hidden="true"
                >
                  {validation.isValid ? "✓" : "!"}
                </span>
              </div>
            </label>

            <p
              className={`mt-4 flex items-center gap-2 text-sm font-black ${
                validation.isValid ? "text-lime-300" : "text-rose-300"
              }`}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-current text-[11px] text-black">
                {validation.isValid ? "✓" : "!"}
              </span>
              {validation.message}
            </p>

            <RequirementCard />
            <ExamplesRow />

            {message && (
              <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-gray-200">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="mt-8 min-h-16 w-full rounded-xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-lg font-black uppercase italic tracking-[0.16em] text-black shadow-[0_0_42px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_52px_rgba(168,85,247,0.34)] active:scale-[0.99]"
            >
              Lock In My Identity →
            </button>
          </form>

          <p className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-gray-400">
            <span aria-hidden="true">▣</span>
            Your identity is permanent. Choose wisely.
          </p>
        </section>
      </div>
    </main>
  );
}

function UsernameHeader() {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <Link
        href="/verify-email"
        className="justify-self-start text-xs font-black uppercase tracking-[0.22em] text-gray-300 transition hover:text-lime-300"
      >
        ← Back
      </Link>
      <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="Smack Talk home">
        <SmackTalkLogo size={56} />
        <div className="brand-lockup text-3xl leading-[0.82]">
          <span className="block text-white">Smack</span>
          <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
            Talk
          </span>
        </div>
      </Link>
      <div aria-hidden="true" />
    </header>
  );
}

function ProgressDots() {
  return (
    <div className="flex items-center justify-center gap-2" aria-label="Step 4 of 5">
      {[0, 1, 2, 3].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full border text-sm font-black ${
              step < 3
                ? "border-lime-300/60 bg-lime-300/10 text-lime-300"
                : "border-lime-300 bg-lime-300 text-black shadow-[0_0_28px_rgba(132,204,22,0.5)]"
            }`}
          >
            {step < 3 ? "✓" : ""}
          </span>
          {step < 3 && <span className="h-px w-7 bg-gradient-to-r from-lime-300/80 to-purple-500/60" />}
        </div>
      ))}
    </div>
  );
}

function IdentityPreview({ username }: { username: string }) {
  return (
    <section className="relative isolate mt-8 w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-purple-300/25 bg-black/60 px-5 py-9 shadow-[0_28px_90px_rgba(0,0,0,0.58),0_0_46px_rgba(168,85,247,0.14)] backdrop-blur-xl sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.18),transparent_18rem),radial-gradient(circle_at_15%_80%,rgba(132,204,22,0.12),transparent_16rem)]" />
      <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-300">This Will Be Your Identity</p>
      <div className="mt-7 flex min-w-0 items-center justify-center gap-3 sm:gap-5">
        <span className="scoreboard-number text-[4.5rem] italic leading-none text-lime-300 drop-shadow-[0_12px_22px_rgba(132,204,22,0.18)] sm:text-[6rem]">
          @
        </span>
        <p className="sports-display min-w-0 truncate text-[4rem] italic leading-none text-white drop-shadow-[0_16px_28px_rgba(255,255,255,0.12)] sm:text-[6rem]">
          {username.toUpperCase()}
        </p>
      </div>
      <div className="mx-auto mt-5 h-px w-3/4 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </section>
  );
}

function RequirementCard() {
  return (
    <section className="mt-7 rounded-2xl border border-white/12 bg-black/45 p-5 shadow-inner shadow-black/35">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Username Requirements</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {requirements.map((requirement) => (
          <div key={requirement} className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime-300 text-[11px] font-black text-black">
              ✓
            </span>
            {requirement}
          </div>
        ))}
      </div>
    </section>
  );
}

function ExamplesRow() {
  return (
    <section className="mt-7">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Examples</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {examples.map((example) => {
          const isAvailable = example.status === "available";
          return (
            <div
              key={example.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm font-black text-white"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`grid h-5 w-5 place-items-center rounded text-[11px] ${
                    isAvailable ? "bg-lime-300 text-black" : "bg-rose-400 text-black"
                  }`}
                >
                  {isAvailable ? "✓" : "×"}
                </span>
                {example.name}
              </span>
              <span className={isAvailable ? "text-lime-300" : "text-rose-300"}>{example.status}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function validateUsername(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();

  if (trimmed.length < 3) {
    return { isValid: false, message: "Username must be at least 3 characters." };
  }

  if (trimmed.length > 20) {
    return { isValid: false, message: "Username must be 20 characters or fewer." };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { isValid: false, message: "Use letters, numbers, or underscores only." };
  }

  if (blockedWords.some((word) => normalized.includes(word))) {
    return { isValid: false, message: "Choose a cleaner Talker ID." };
  }

  if (takenNames.includes(normalized)) {
    return { isValid: false, message: `${trimmed} is already taken.` };
  }

  return { isValid: true, message: `${trimmed} is available` };
}

function sanitizeDisplayName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
}

function UsernameAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_4%,rgba(168,85,247,0.2),transparent_34rem),radial-gradient(circle_at_15%_48%,rgba(132,204,22,0.13),transparent_28rem),linear-gradient(180deg,rgba(2,4,10,0.62),#02040a_74%)]" />
      <div className="absolute left-1/2 top-20 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute left-0 top-72 h-80 w-80 rounded-full bg-lime-300/10 blur-3xl" />
      <div className="absolute right-0 top-24 h-[34rem] w-1/2 bg-[linear-gradient(260deg,rgba(168,85,247,0.16),transparent)] blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-[30rem] opacity-30 bg-[repeating-radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.11)_0_1px,transparent_1px_18px)] [mask-image:linear-gradient(to_top,#000_0_28%,transparent_78%)]" />
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
    </div>
  );
}
