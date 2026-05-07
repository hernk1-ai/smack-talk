"use client";

import { FormEvent, useState } from "react";

type FormState = "idle" | "success";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!isValidEmail) {
      setError("Drop a real email so we can hold your spot.");
      setFormState("idle");
      return;
    }

    setError("");
    setFormState("success");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-white/10 bg-black/55 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.44)] backdrop-blur"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-200">Be there for opening night.</p>
      <p className="mt-2 text-sm font-semibold text-gray-400">Join the first wave. Reserve your spot.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
          type="email"
          placeholder="Enter your email"
          className="min-h-[3.25rem] min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white outline-none placeholder:text-gray-600 focus:border-green-300/60"
          aria-label="Email address"
        />
        <button
          type="submit"
          className="min-h-[3.25rem] rounded-2xl bg-white px-5 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_0_26px_rgba(255,255,255,0.14)] transition active:scale-95"
        >
          Claim Your Spot
        </button>
      </div>

      {error && <p className="mt-3 text-sm font-bold text-red-200">{error}</p>}
      {formState === "success" && (
        <p className="mt-3 rounded-2xl border border-green-300/20 bg-green-300/10 px-3 py-2 text-sm font-bold text-green-100">
          You are on the list. Opening night is calling.
        </p>
      )}
      <p className="mt-3 text-xs font-bold text-gray-500">No spam. No BS. Just early access.</p>
    </form>
  );
}
