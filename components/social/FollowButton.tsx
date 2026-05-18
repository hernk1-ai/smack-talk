"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { playSound } from "@/lib/sound";
import { followUser, getCurrentUserId, getFollowStatus, unfollowUser } from "@/lib/supabase/follows";
import type { Follow, Profile } from "@/lib/supabase/types";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";

type FollowButtonProps = {
  targetUserId?: string | null;
  targetAccountVisibility?: Profile["account_visibility"] | null;
  currentFollowStatus?: Follow["status"] | null;
  size?: "sm" | "md";
  variant?: "default" | "ghost";
};

export function FollowButton({
  targetUserId,
  targetAccountVisibility = "public",
  currentFollowStatus,
  size = "md",
  variant = "default",
}: FollowButtonProps) {
  const [status, setStatus] = useState<Follow["status"] | null>(currentFollowStatus ?? null);
  const { showToast } = useToast();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function boot() {
      if (!targetUserId) return;
      const userId = await getCurrentUserId();
      if (!mounted) return;
      setIsOwnProfile(Boolean(userId && userId === targetUserId));
      if (!currentFollowStatus && userId && userId !== targetUserId) {
        const { follow } = await getFollowStatus(targetUserId);
        if (!mounted) return;
        setStatus(follow?.status ?? null);
      }
    }
    boot();
    return () => {
      mounted = false;
    };
  }, [targetUserId, currentFollowStatus]);

  if (!targetUserId || isOwnProfile) {
    return null;
  }

  async function onClick() {
    if (!targetUserId) {
      return;
    }

    setError("");
    setIsLoading(true);
    if (status === "active" || status === "pending") {
      const { error: unfollowError } = await unfollowUser(targetUserId);
      if (unfollowError) {
        setError(getUserFacingErrorMessage(unfollowError, "Unable to update follow right now."));
        playSound("error");
        showToast("Unable to save right now.", "error");
      } else {
        setStatus(null);
        playSound("success");
        showToast("Follow removed.", "info");
      }
      setIsLoading(false);
      return;
    }

    const { follow, error: followError } = await followUser({
      id: targetUserId,
      account_visibility: targetAccountVisibility ?? "public",
    });
    if (followError) {
      setError(getUserFacingErrorMessage(followError, "Unable to follow right now."));
      playSound("error");
      showToast("Unable to save right now.", "error");
    } else {
      setStatus(follow?.status ?? null);
      const pending = follow?.status === "pending";
      playSound(pending ? "follow_request" : "follow_accepted");
      showToast(pending ? "Follow request sent." : "Following.", "success");
    }
    setIsLoading(false);
  }

  const label =
    status === "active"
      ? "Following"
      : status === "pending"
        ? "Requested"
        : targetAccountVisibility === "private"
          ? "Request Follow"
          : "Follow";

  const cls =
    variant === "ghost"
      ? "border-white/20 bg-white/[0.03] text-white"
      : status === "active"
        ? "border-lime-300/50 bg-lime-400/10 text-lime-200"
        : status === "pending"
          ? "border-purple-300/50 bg-purple-500/10 text-purple-200"
          : "border-white/20 bg-white/[0.03] text-white";

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className={`rounded-xl border px-3 font-black uppercase tracking-[0.1em] disabled:opacity-60 ${size === "sm" ? "min-h-9 text-[10px]" : "min-h-11 text-xs"} ${cls}`}
      >
        {isLoading ? "..." : label}
      </button>
      {error ? <p className="text-[10px] font-semibold text-red-300">{error}</p> : null}
    </div>
  );
}
