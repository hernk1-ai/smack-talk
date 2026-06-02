"use client";

import Link from "next/link";
import { dismissClaimPrompt } from "@/lib/supabase/guest";

type ClaimProfilePromptProps = {
  userId: string;
  claimHref: string;
  onDismiss?: () => void;
};

export function ClaimProfilePrompt({ userId, claimHref, onDismiss }: ClaimProfilePromptProps) {
  function handleDismiss() {
    dismissClaimPrompt(userId);
    onDismiss?.();
  }

  return (
    <section className="rounded-[1.5rem] border border-purple-300/30 bg-purple-500/10 p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.1em] text-white">Keep your calls across devices?</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-gray-300">
        Claim this profile with email or Google so you can come back anytime.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={claimHref}
          className="inline-flex min-h-10 items-center rounded-xl border border-lime-300/50 bg-lime-400/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-lime-200"
        >
          Claim My Profile
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex min-h-10 items-center rounded-xl border border-white/15 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-[0.1em] text-gray-300"
        >
          Not now
        </button>
      </div>
    </section>
  );
}
