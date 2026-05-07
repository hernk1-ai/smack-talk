"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/utils/supabaseClient";
import { captureLandingEvent } from "@/utils/posthogClient";

type FormState = "idle" | "loading" | "success" | "duplicate" | "error" | "invalid";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    captureLandingEvent("claim_spot_clicked");

    const trimmedEmail = email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!isValidEmail) {
      setError("Drop a real email so we can hold your spot.");
      setFormState("invalid");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError("Waitlist is almost ready. Supabase env vars are missing.");
      setFormState("error");
      captureLandingEvent("waitlist_email_error", {
        reason: "missing_supabase_env",
      });
      return;
    }

    setError("");
    setFormState("loading");

    const { error: insertError } = await supabase
      .from("waitlist")
      .insert({
        email: trimmedEmail.toLowerCase(),
        source: "landing_page",
      });

    if (insertError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Supabase waitlist insert error", insertError);
      }

      const isDuplicate = insertError.code === "23505";

      setError(isDuplicate ? "You already claimed your spot." : "Couldn’t save your spot. Try again in a minute.");
      setFormState(isDuplicate ? "duplicate" : "error");
      captureLandingEvent(isDuplicate ? "waitlist_email_duplicate" : "waitlist_email_error", {
        code: insertError.code || "unknown",
      });
      return;
    }

    setFormState("success");
    setEmail("");
    captureLandingEvent("waitlist_email_submitted");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-lime-300/35 bg-black/58 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.44),0_0_44px_rgba(132,204,22,0.08)] backdrop-blur sm:p-5"
    >
      <p className="text-center text-sm font-black uppercase italic tracking-[0.16em] text-lime-300 sm:text-base">
        Be there for opening night.
      </p>
      <p className="mt-2 text-center text-sm font-semibold text-gray-300">Join the first wave. Reserve your spot.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
            setFormState("idle");
          }}
          type="email"
          placeholder="Enter your email"
          className="min-h-[3.4rem] min-w-0 flex-1 rounded-xl border border-white/20 bg-white/[0.055] px-4 text-base font-semibold text-white outline-none placeholder:text-gray-500 transition focus:border-lime-300/70 focus:shadow-[0_0_20px_rgba(132,204,22,0.13)]"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={formState === "loading"}
          className="neon-cta min-h-[3.4rem] rounded-xl px-5 text-base font-black uppercase italic tracking-[0.12em] text-black shadow-[0_0_34px_rgba(132,204,22,0.22)] transition hover:scale-[1.015] focus:outline-none focus:ring-2 focus:ring-lime-200/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-48"
        >
          {formState === "loading" ? (
            "Claiming..."
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              Claim Your Spot
              <Image
                src="/smack-talk-logo.png"
                alt=""
                width={20}
                height={20}
                className="rounded-md object-contain"
              />
            </span>
          )}
        </button>
      </div>

      {error && (
        <p className={`mt-3 text-sm font-bold ${formState === "duplicate" ? "text-yellow-100" : "text-red-200"}`}>
          {error}
        </p>
      )}
      {formState === "success" && (
        <p className="mt-3 rounded-2xl border border-green-300/20 bg-green-300/10 px-3 py-2 text-sm font-bold text-green-100">
          You are on the list. Opening night is calling.
        </p>
      )}
      <p className="mt-4 text-center text-xs font-bold text-gray-400">🔒 No spam. No BS. Just early access.</p>
    </form>
  );
}
