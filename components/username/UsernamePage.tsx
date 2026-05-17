"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LocktLogo } from "@/components/LocktLogo";
import { createClient } from "@/lib/supabase/client";

const reminders = [
  { icon: "◉", label: "The Arena", value: "Is Watching", tone: "green" },
  { icon: "◆", label: "Talk Gets", value: "Remembered", tone: "purple" },
  { icon: "▣", label: "No", value: "Take Backs", tone: "green" },
];

export function UsernamePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const validation = useMemo(() => validateUsername(username), [username]);
  const displayName = sanitizeDisplayName(username);
  const availabilityName = displayName || "username";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validation.isValid) {
      setMessage(validation.message);
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the public URL and anon key.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsLoading(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          username: displayName,
        },
        { onConflict: "id" },
      );

    setIsLoading(false);

    if (error) {
      setMessage(error.code === "23505" ? "That username is already taken." : error.message);
      return;
    }

    router.push(`/onboarding/profile-pic?username=${encodeURIComponent(displayName || "FadeKing")}`);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <UsernameAtmosphere />
      <div className="relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,860px)] flex-col py-5 sm:py-7">
        <UsernameHeader />

        <section className="mx-auto flex w-full flex-1 flex-col justify-center py-7 text-center sm:py-10">
          <div className="mx-auto max-w-3xl">
            <h1 className="sports-display text-[5.4rem] italic leading-[0.78] tracking-tight text-white drop-shadow-[0_10px_28px_rgba(255,255,255,0.15)] min-[390px]:text-[6.3rem] sm:text-[8.6rem]">
              Choose
              <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent">
                Your Name
              </span>
            </h1>
            <p className="mt-5 text-base font-black uppercase tracking-[0.18em] text-gray-300 sm:text-xl">
              Receipts <span className="text-lime-300">follow</span> this name.
            </p>
            <div className="mx-auto mt-7 flex w-64 items-center justify-center gap-7">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-lime-300/70" />
              <span className="text-3xl text-lime-300 drop-shadow-[0_0_18px_rgba(132,204,22,0.55)]">⚡</span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-400/70" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto mt-10 w-full max-w-3xl text-left">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.24em] text-lime-300">Create Username</span>
              <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-purple-300/70 bg-black/60 px-5 py-5 shadow-[0_0_34px_rgba(168,85,247,0.24),inset_0_0_34px_rgba(132,204,22,0.05)] transition focus-within:border-lime-300 focus-within:shadow-[0_0_38px_rgba(132,204,22,0.24),inset_0_0_34px_rgba(168,85,247,0.06)] sm:px-7 sm:py-6">
                <span className="scoreboard-number border-r border-white/12 pr-4 text-[3.3rem] leading-none text-purple-400 sm:text-[4.2rem]">
                  @
                </span>
                <input
                  autoComplete="username"
                  className="min-h-14 w-full bg-transparent text-3xl font-black text-white outline-none placeholder:text-gray-600 sm:text-5xl"
                  maxLength={20}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setMessage("");
                  }}
                  placeholder="username"
                  value={username}
                />
              </div>
            </label>

            <div
              className={`mt-5 flex items-center gap-3 rounded-2xl border bg-black/45 px-5 py-4 text-lg font-black ${
                validation.isValid
                  ? "border-lime-300/35 text-lime-300"
                  : "border-white/12 text-gray-300"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${
                  validation.isValid
                    ? "border-lime-300 bg-lime-300 text-black"
                    : "border-white/20 bg-white/5 text-gray-400"
                }`}
                aria-hidden="true"
              >
                {validation.isValid ? "✓" : "!"}
              </span>
              <span>
                @{availabilityName}{" "}
                <span className={validation.isValid ? "text-gray-200" : "text-gray-400"}>
                  {validation.isValid ? "is available" : validation.message}
                </span>
              </span>
            </div>

            {message && (
              <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200">
                {message}
              </p>
            )}

            <ReminderRow />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-10 min-h-16 w-full rounded-2xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-xl font-black uppercase italic tracking-[0.18em] text-black shadow-[0_0_42px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_54px_rgba(168,85,247,0.36)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65 sm:min-h-20 sm:text-2xl"
            >
              {isLoading ? "Saving..." : "Lock It In →"}
            </button>
          </form>
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
      <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="LOCKT home">
        <LocktLogo size={56} />
        <div className="brand-lockup text-3xl leading-[0.82]">
          <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
        </div>
      </Link>
      <div aria-hidden="true" />
    </header>
  );
}

function ReminderRow() {
  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-3">
      {reminders.map((reminder) => (
        <article
          key={reminder.label}
          className="flex items-center justify-center gap-4 border-white/10 bg-black/20 py-3 text-left sm:border-l sm:first:border-l-0"
        >
          <span
            className={`text-4xl ${
              reminder.tone === "green"
                ? "text-lime-300 drop-shadow-[0_0_16px_rgba(132,204,22,0.45)]"
                : "text-purple-400 drop-shadow-[0_0_16px_rgba(168,85,247,0.45)]"
            }`}
            aria-hidden="true"
          >
            {reminder.icon}
          </span>
          <p className="text-sm font-black uppercase leading-6 tracking-[0.12em] text-white sm:text-base">
            {reminder.label}
            <span className="block text-gray-300">{reminder.value}</span>
          </p>
        </article>
      ))}
    </section>
  );
}

function validateUsername(value: string) {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { isValid: false, message: "Enter a username." };
  }

  if (trimmed.length < 3) {
    return { isValid: false, message: "Use at least 3 characters." };
  }

  if (trimmed.length > 20) {
    return { isValid: false, message: "Use 20 characters or fewer." };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { isValid: false, message: "Use letters, numbers, or underscores." };
  }

  return { isValid: true, message: `${trimmed} is available` };
}

function sanitizeDisplayName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
}

function UsernameAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(168,85,247,0.18),transparent_34rem),radial-gradient(circle_at_12%_45%,rgba(132,204,22,0.15),transparent_30rem),linear-gradient(180deg,rgba(2,4,10,0.58),#02040a_78%)]" />
      <div className="absolute left-0 top-0 h-full w-40 bg-[linear-gradient(100deg,rgba(132,204,22,0.14),transparent)] blur-2xl" />
      <div className="absolute right-0 top-0 h-full w-44 bg-[linear-gradient(260deg,rgba(168,85,247,0.18),transparent)] blur-2xl" />
      <div className="absolute left-1/2 top-20 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-[26rem] opacity-28 bg-[repeating-radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.12)_0_1px,transparent_1px_18px)] [mask-image:linear-gradient(to_top,#000_0_28%,transparent_78%)]" />
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
    </div>
  );
}
