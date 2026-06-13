"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import {
  dismissProfileCompletion,
  profileNeedsCompletion,
} from "@/lib/profile/completion";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";

type ProfileCompletionPromptProps = {
  profile: Profile | null | undefined;
  userId: string;
  onUpdated?: (profile: Profile) => void;
  onDismiss?: () => void;
};

function validateUsername(value: string) {
  const cleaned = value.replace(/^@/, "").trim();
  if (!cleaned) {
    return { valid: false as const, message: "Username is required." };
  }

  if (cleaned.length < 3 || cleaned.length > 20) {
    return { valid: false as const, message: "Username must be 3–20 characters." };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
    return { valid: false as const, message: "Use letters, numbers, or underscores only." };
  }

  return { valid: true as const, value: cleaned };
}

export function ProfileCompletionPrompt({
  profile,
  userId,
  onUpdated,
  onDismiss,
}: ProfileCompletionPromptProps) {
  const [username, setUsername] = useState(profile?.username?.replace(/^@/, "") ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  if (!profile || !profileNeedsCompletion(profile)) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateUsername(username);
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .update({
        username: validation.value,
        onboarding_completed: true,
      })
      .eq("id", userId)
      .select("*")
      .single();

    setSaving(false);

    if (error || !data) {
      setMessage(getUserFacingErrorMessage(error, "Unable to save your username right now."));
      return;
    }

    onUpdated?.(data as Profile);
  }

  function handleDismiss() {
    dismissProfileCompletion(userId);
    onDismiss?.();
  }

  return (
    <section className="rounded-2xl border border-lime-300/20 bg-lime-400/[0.06] p-3 shadow-[0_14px_36px_rgba(0,0,0,0.24)]">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Quick profile</p>
      <p className="mt-1 text-sm font-semibold text-gray-200">Add a username so friends recognize you in Game Rooms.</p>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="profile-completion-username">
          Username
        </label>
        <input
          id="profile-completion-username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setMessage("");
          }}
          placeholder="yourname"
          maxLength={20}
          className="min-h-10 flex-1 rounded-xl border border-white/15 bg-black/45 px-3 text-sm font-semibold text-white outline-none focus:border-lime-300/45"
        />
        <button
          type="submit"
          disabled={saving}
          className="min-h-10 rounded-xl border border-lime-300/45 bg-lime-400/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-lime-200 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
      {message ? <p className="mt-2 text-xs font-semibold text-red-300">{message}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-400">
        <Link href="/settings" className="font-black uppercase tracking-[0.08em] text-purple-300 hover:text-purple-200">
          Open settings
        </Link>
        <button type="button" onClick={handleDismiss} className="font-black uppercase tracking-[0.08em] text-gray-500 hover:text-gray-300">
          Not now
        </button>
      </div>
    </section>
  );
}
