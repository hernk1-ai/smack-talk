"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LocktLogo } from "@/components/LocktLogo";
import { getSafeNextPath } from "@/lib/signup/signupCopy";
import { createClient } from "@/lib/supabase/client";
import { setClaimedGuestPassword } from "@/lib/supabase/guestClaim";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";

export function ClaimPasswordPage({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const safeNext = getSafeNextPath(nextPath);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.trim().length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await setClaimedGuestPassword(supabase, password);
    setSaving(false);

    if (error) {
      setMessage(getUserFacingErrorMessage(error, "Unable to finish claiming your profile."));
      return;
    }

    router.replace(safeNext);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-white/10 bg-black/45 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-3">
          <LocktLogo size={48} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">Claim profile</p>
            <h1 className="text-xl font-black text-white">Set your password</h1>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-gray-300">
          Your email is verified. Add a password to keep your Game Room name and activity on any device.
        </p>
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-white">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setMessage("");
              }}
              className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-black/55 px-3 text-sm font-semibold text-white outline-none focus:border-lime-300/45"
              placeholder="At least 8 characters"
            />
          </label>
          {message ? <p className="text-sm font-semibold text-red-300">{message}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="min-h-12 w-full rounded-xl bg-gradient-to-r from-lime-300 to-purple-500 px-4 text-sm font-black uppercase tracking-[0.1em] text-black disabled:opacity-60"
          >
            {saving ? "Saving..." : "Finish claim"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs font-semibold text-gray-400">
          <Link href={safeNext} className="text-lime-300 hover:text-lime-200">
            Skip for now
          </Link>
        </p>
      </div>
    </main>
  );
}
