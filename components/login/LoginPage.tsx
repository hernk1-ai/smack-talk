"use client";

import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleProviderButton } from "@/components/auth/GoogleProviderButton";
import { LocktLogo } from "@/components/LocktLogo";
import { buildSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile, getPostLoginRedirect } from "@/lib/supabase/profiles";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";

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
    body: "Real matchups. Real receipts.",
    icon: "♕",
  },
  {
    title: "Receipts Never Lie",
    body: "The tape doesn't forget.",
    icon: "▤",
  },
];

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

    const supabase = createClient();

    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the public URL and anon key.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setIsLoading(false);
      setMessage(getUserFacingErrorMessage(error, "Unable to log in right now. Try again."));
      return;
    }

    const { profile } = await getCurrentProfile(supabase);
    setIsLoading(false);
    router.push(getPostLoginRedirect(profile));
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();

    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the public URL and anon key.");
      return;
    }

    setIsGoogleLoading(true);
    setMessage("");

    const redirectTo = buildSiteUrl("/auth/callback?source=oauth");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setIsGoogleLoading(false);
      setMessage(getUserFacingErrorMessage(error, "Unable to continue with Google right now. Try again."));
      return;
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <LoginAtmosphere />
      <div className="relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,1180px)] flex-col py-6">
        <header className="flex justify-center">
          <LogoLockup size="large" />
        </header>

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-8 text-center">
          <h1 className="sports-display text-[5rem] italic leading-[0.8] text-white drop-shadow-[0_10px_28px_rgba(255,255,255,0.15)] min-[390px]:text-[6rem] sm:text-[8.5rem]">
            Welcome
            <span className="block bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 bg-clip-text text-transparent">
              Back
            </span>
          </h1>
          <div className="mx-auto mt-4 h-1.5 w-56 rounded-full bg-gradient-to-r from-lime-300 via-white/50 to-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.34)]" />
          <p className="mt-5 text-base font-black uppercase tracking-[0.14em] text-gray-300 sm:text-xl">
            The Arena&apos;s still talking.
          </p>

          <LoginCard
            email={email}
            keepSignedIn={keepSignedIn}
            message={message}
            password={password}
            setEmail={setEmail}
            setKeepSignedIn={setKeepSignedIn}
            setMessage={setMessage}
            setPassword={setPassword}
            setShowPassword={setShowPassword}
            showPassword={showPassword}
            isLoading={isLoading}
            isGoogleLoading={isGoogleLoading}
            onSubmit={handleSubmit}
            onGoogleSignIn={handleGoogleSignIn}
          />
        </section>

        <FeatureRow />
        <ProofSection />
        <LoginFooter />
      </div>
    </main>
  );
}

function LoginCard({
  email,
  keepSignedIn,
  message,
  password,
  setEmail,
  setKeepSignedIn,
  setMessage,
  setPassword,
  setShowPassword,
  showPassword,
  isLoading,
  isGoogleLoading,
  onSubmit,
  onGoogleSignIn,
}: {
  email: string;
  keepSignedIn: boolean;
  message: string;
  password: string;
  isLoading: boolean;
  setEmail: (value: string) => void;
  setKeepSignedIn: (value: boolean) => void;
  setMessage: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  showPassword: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn: () => Promise<void>;
  isGoogleLoading: boolean;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 w-full max-w-xl rounded-[1.75rem] border border-white/15 bg-black/60 p-5 text-left shadow-[0_28px_90px_rgba(0,0,0,0.62),0_0_42px_rgba(168,85,247,0.12)] backdrop-blur-xl sm:p-7"
    >
      <SectionTitle>Log In To Your Account</SectionTitle>

      <label className="mt-7 block">
        <span className="text-xs font-black uppercase tracking-[0.22em] text-white">Email</span>
        <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 shadow-inner shadow-black/35 transition focus-within:border-lime-300/55 focus-within:bg-white/[0.1]">
          <span className="text-2xl text-lime-300">♙</span>
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
        <span className="text-xs font-black uppercase tracking-[0.22em] text-white">Password</span>
        <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 shadow-inner shadow-black/35 transition focus-within:border-lime-300/55 focus-within:bg-white/[0.1]">
          <span className="text-2xl text-lime-300">▣</span>
          <input
            className="min-h-10 w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-gray-500"
            onChange={(event) => {
              setPassword(event.target.value);
              setMessage("");
            }}
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-gray-300 transition hover:bg-white/10 hover:text-white active:scale-95"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            ◉
          </button>
        </div>
      </label>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm font-semibold text-gray-300">
          <input
            checked={keepSignedIn}
            className="h-5 w-5 rounded border-white/20 bg-black accent-lime-300"
            onChange={(event) => setKeepSignedIn(event.target.checked)}
            type="checkbox"
          />
          Keep me signed in
        </label>
        <Link className="text-sm font-black text-purple-300 transition hover:text-lime-300" href="/forgot-password">
          Forgot Password?
        </Link>
      </div>

      {message && (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-gray-200">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || isGoogleLoading}
        className="mt-6 min-h-14 w-full rounded-xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-lg font-black uppercase italic tracking-[0.14em] text-black shadow-[0_0_34px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_46px_rgba(168,85,247,0.34)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
      >
        {isLoading ? "Logging In..." : "Log In →"}
      </button>

      <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-xs font-black uppercase tracking-[0.16em] text-gray-500">
        <span className="h-px bg-white/10" />
        Or
        <span className="h-px bg-white/10" />
      </div>

      <GoogleProviderButton
        loading={isGoogleLoading}
        disabled={isLoading || isGoogleLoading}
        onClick={() => {
          void onGoogleSignIn();
        }}
      />

      <Link
        href="/signup"
        className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-purple-300/45 hover:bg-purple-500/10 active:scale-[0.99]"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full border border-purple-300/35 bg-purple-500/15 text-3xl text-purple-300">
          ⚽
        </span>
        <span>
          <span className="block text-sm font-black uppercase tracking-[0.12em] text-lime-300">New Here?</span>
          <span className="mt-1 block text-sm font-semibold text-gray-300">Claim your spot in the Arena.</span>
        </span>
        <span className="text-3xl text-gray-300">›</span>
      </Link>
    </form>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/70" />
      <h2 className="text-center text-sm font-black uppercase tracking-[0.22em] text-purple-300">{children}</h2>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-500/70" />
    </div>
  );
}

function FeatureRow() {
  return (
    <section className="grid gap-3 border-t border-white/10 py-8 sm:grid-cols-2 lg:grid-cols-4">
      {featureCards.map((card) => (
        <article
          key={card.title}
          className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center transition hover:-translate-y-1 hover:border-purple-300/40 hover:bg-white/[0.035]"
        >
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
    <section className="rounded-[1.75rem] border border-white/10 bg-black/45 p-6 text-center shadow-[0_22px_70px_rgba(0,0,0,0.42)]">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <p className="hidden text-6xl leading-none text-lime-300 sm:block">“</p>
        <div>
          <h2 className="sports-display text-4xl italic leading-none text-white sm:text-5xl">The world is watching.</h2>
          <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-gray-400">
            Your receipts. Your legacy. Your name on the board.
          </p>
          <div className="mx-auto mt-5 h-1 w-40 rounded-full bg-gradient-to-r from-lime-300 to-purple-500" />
        </div>
        <p className="hidden text-6xl leading-none text-lime-300 sm:block">”</p>
      </div>
    </section>
  );
}

function LoginFooter() {
  return (
    <footer className="grid gap-4 py-7 text-center text-xs font-semibold text-gray-400 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:text-left">
      <LogoLockup size="small" />
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

function LogoLockup({ size }: { size: "small" | "large" }) {
  const markSize = size === "large" ? 70 : 40;
  const textSize = size === "large" ? "text-4xl" : "text-2xl";

  return (
    <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="LOCKT home">
      <LocktLogo size={markSize} />
      <div className={`brand-lockup ${textSize} leading-[0.82]`}>
        <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
      </div>
    </Link>
  );
}

function LoginAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_4%,rgba(168,85,247,0.2),transparent_34rem),radial-gradient(circle_at_18%_42%,rgba(132,204,22,0.12),transparent_28rem),linear-gradient(180deg,rgba(2,4,10,0.62),#02040a_76%)]" />
      <div className="absolute left-1/2 top-12 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-white/8 blur-3xl" />
      <div className="absolute left-0 top-40 hidden h-[44rem] w-1/3 bg-[linear-gradient(100deg,rgba(168,85,247,0.16),transparent)] blur-xl md:block" />
      <div className="absolute right-0 top-40 hidden h-[44rem] w-1/3 bg-[linear-gradient(260deg,rgba(132,204,22,0.1),rgba(168,85,247,0.12),transparent)] blur-xl md:block" />
      <div className="absolute inset-x-0 bottom-16 h-[34rem] opacity-35 bg-[repeating-radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.11)_0_1px,transparent_1px_18px)] [mask-image:linear-gradient(to_top,#000_0_28%,transparent_74%)]" />
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
    </div>
  );
}
