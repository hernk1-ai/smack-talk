"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GUEST_DISPLAY_NAME_MAX, sanitizeGuestDisplayName } from "@/lib/guest/displayName";

type GuestJoinModalProps = {
  open: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  loginHref?: string;
  onClose: () => void;
  onJoin: (displayName: string) => void | Promise<void>;
};

export function GuestJoinModal({
  open,
  loading = false,
  errorMessage,
  loginHref = "/login",
  onClose,
  onJoin,
}: GuestJoinModalProps) {
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onJoin(sanitizeGuestDisplayName(displayName));
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-join-title"
        className="relative w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#050814] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.65)] sm:p-6"
      >
        <h2 id="guest-join-title" className="sports-display text-2xl italic leading-tight text-white sm:text-3xl">
          Choose your Game Room name
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-gray-300">
          No full account needed. This is how your calls and comments will show in the room.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={GUEST_DISPLAY_NAME_MAX}
              autoFocus
              placeholder="e.g. Kris"
              className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-sm font-semibold text-white outline-none focus:border-lime-300/50"
            />
          </label>

          {errorMessage ? <p className="text-xs font-semibold text-red-300">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-xl border border-lime-300/50 bg-lime-400/15 text-sm font-black uppercase tracking-[0.1em] text-lime-200 transition hover:bg-lime-400/25 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Joining..." : "Join Game Room"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs font-semibold text-gray-400">
          Already have an account?{" "}
          <Link href={loginHref} className="font-black text-purple-300 hover:text-purple-100">
            Log in
          </Link>
        </p>
        <p className="mt-3 text-center text-[11px] font-semibold leading-5 text-gray-500">
          You can claim your profile later to keep your calls across devices.
        </p>
      </div>
    </div>
  );
}
