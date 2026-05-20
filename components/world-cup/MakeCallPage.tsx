"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { RouteBottomNav } from "@/components/BottomNav";
import { useToast } from "@/components/providers/ToastProvider";
import { getWorldCupKickoffIso, isWorldCupMatchLocked, type WorldCupMatch } from "@/data/worldCupSchedule";
import { playSound } from "@/lib/sound";
import { buildSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/client";
import { lockCurrentUserExactScorePick, lockCurrentUserWinnerPick } from "@/lib/supabase/matchPicks";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";
import type { MatchPick, Profile } from "@/lib/supabase/types";

type MakeCallPageProps = {
  match: WorldCupMatch;
  initialPick: MatchPick | null;
  profile?: Profile | null;
  isAuthenticated: boolean;
};

type PendingCallDraft = {
  matchId: number;
  selectedWinner: string;
  homeScore: string;
  awayScore: string;
  autoLockType?: "winner" | "exact";
  receiptName?: string;
};

const pendingCallKey = "lockt_pending_match_call";

export function MakeCallPage({ match, initialPick, profile, isAuthenticated }: MakeCallPageProps) {
  const { showToast } = useToast();
  const isGroupStage = match.stage === "Group Stage";
  const lockClosed = isWorldCupMatchLocked(match);
  const [selectedWinner, setSelectedWinner] = useState<string>(initialPick?.selected_winner ?? "");
  const [homeScore, setHomeScore] = useState<string>(String(initialPick?.home_score ?? 0));
  const [awayScore, setAwayScore] = useState<string>(String(initialPick?.away_score ?? 0));
  const [winnerLockedAt, setWinnerLockedAt] = useState<string | null>(initialPick?.winner_locked_at ?? null);
  const [exactLockedAt, setExactLockedAt] = useState<string | null>(initialPick?.exact_score_locked_at ?? null);
  const [winnerStatus, setWinnerStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [exactStatus, setExactStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [winnerMessage, setWinnerMessage] = useState("");
  const [exactMessage, setExactMessage] = useState("");
  const [starterRepUnlocked, setStarterRepUnlocked] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [receiptName, setReceiptName] = useState(profile?.username ?? "");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isResumingSavedCall, setIsResumingSavedCall] = useState(false);
  const pendingDraftRef = useRef<PendingCallDraft | null>(null);
  const autoLockQueuedRef = useRef(false);

  const kickoffIso = getWorldCupKickoffIso(match);
  const kickoffLabel = useMemo(() => {
    if (!kickoffIso) {
      return `${match.date} · ${match.kickoffET}`;
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(kickoffIso));
  }, [kickoffIso, match.date, match.kickoffET]);

  function getCurrentPathWithQuery() {
    if (typeof window === "undefined") {
      return `/schedule/${encodeURIComponent(match.id)}/make-call`;
    }

    return `${window.location.pathname}${window.location.search}`;
  }

  function cachePendingDraft(draft: PendingCallDraft) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(pendingCallKey, JSON.stringify(draft));
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawDraft = window.localStorage.getItem(pendingCallKey);
    if (!rawDraft) {
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as PendingCallDraft;
      if (draft.matchId !== match.id) {
        return;
      }
      pendingDraftRef.current = draft;

      const hydrateTimer = window.setTimeout(() => {
        if (draft.selectedWinner) setSelectedWinner(draft.selectedWinner);
        if (draft.homeScore) setHomeScore(draft.homeScore);
        if (draft.awayScore) setAwayScore(draft.awayScore);
        if (draft.receiptName && !profile?.username) setReceiptName(draft.receiptName);

        if (isAuthenticated && draft.autoLockType) {
          setShowAuthGate(false);
          if (draft.autoLockType === "winner") {
            setWinnerMessage("Signed in. Restoring your call and locking it now.");
          } else {
            setExactMessage("Signed in. Restoring your call and locking it now.");
          }
        } else if (!isAuthenticated) {
          setShowAuthGate(true);
        }
      }, 0);

      return () => window.clearTimeout(hydrateTimer);
    } catch {
      window.localStorage.removeItem(pendingCallKey);
    }
  }, [isAuthenticated, match.id, profile?.username]);

  async function shareLockedCall() {
    const url = typeof window !== "undefined" ? window.location.href : "/receipts";
    const payload = {
      title: "LOCKT Receipt",
      text: "I locked my take on LOCKT. Check the receipt.",
      url,
    };

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share(payload);
        showToast("Shared.", "success");
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast("Receipt link copied.", "success");
        return;
      }

      showToast("Unable to share right now.", "error");
    } catch {
      showToast("Unable to share right now.", "error");
    }
  }

  const lockWinner = useCallback(async () => {
    if (!isAuthenticated) {
      cachePendingDraft({
        matchId: match.id,
        selectedWinner,
        homeScore,
        awayScore,
        autoLockType: "winner",
        receiptName: receiptName.trim() || undefined,
      });
      setShowAuthGate(true);
      return;
    }

    if (lockClosed || winnerLockedAt) {
      setWinnerStatus("error");
      setWinnerMessage(lockClosed ? "This match is already locked." : "Your call is already locked.");
      return;
    }

    if (!selectedWinner) {
      setWinnerStatus("error");
      setWinnerMessage("Choose a winner or draw before locking.");
      return;
    }

    setWinnerStatus("saving");
    setWinnerMessage("");

    const { pick, error, starterRepAwarded } = await lockCurrentUserWinnerPick({
      match,
      selectedWinner,
    });

    if (error) {
      setWinnerStatus("error");
      setWinnerMessage(getUserFacingErrorMessage(error, "Unable to save your pick right now."));
      playSound("error");
      showToast("Unable to save your pick right now.", "error");
      return;
    }

    setWinnerLockedAt(pick?.winner_locked_at ?? new Date().toISOString());
    setStarterRepUnlocked(Boolean(starterRepAwarded));
    setWinnerStatus("saved");
    setWinnerMessage(starterRepAwarded ? "You’re on the board." : "Your call is locked. Receipt pending until match ends.");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(pendingCallKey);
    }
    playSound("pick_locked");
    showToast("Pick locked.", "success");
  }, [awayScore, homeScore, isAuthenticated, lockClosed, match, receiptName, selectedWinner, showToast, winnerLockedAt]);

  const lockExactScore = useCallback(async () => {
    if (!isAuthenticated) {
      cachePendingDraft({
        matchId: match.id,
        selectedWinner,
        homeScore,
        awayScore,
        autoLockType: "exact",
        receiptName: receiptName.trim() || undefined,
      });
      setShowAuthGate(true);
      return;
    }

    if (lockClosed || exactLockedAt) {
      setExactStatus("error");
      setExactMessage(lockClosed ? "This match is already locked." : "Your call is already locked.");
      return;
    }

    const parsedHome = Number.parseInt(homeScore, 10);
    const parsedAway = Number.parseInt(awayScore, 10);
    if (!Number.isFinite(parsedHome) || parsedHome < 0 || !Number.isFinite(parsedAway) || parsedAway < 0) {
      setExactStatus("error");
      setExactMessage("Enter valid score predictions.");
      return;
    }

    setExactStatus("saving");
    setExactMessage("");

    const { pick, error, starterRepAwarded } = await lockCurrentUserExactScorePick({
      match,
      homeScore: parsedHome,
      awayScore: parsedAway,
    });

    if (error) {
      setExactStatus("error");
      setExactMessage(getUserFacingErrorMessage(error, "Unable to save your pick right now."));
      playSound("error");
      showToast("Unable to save your pick right now.", "error");
      return;
    }

    setExactLockedAt(pick?.exact_score_locked_at ?? new Date().toISOString());
    setStarterRepUnlocked(Boolean(starterRepAwarded));
    setExactStatus("saved");
    setExactMessage(starterRepAwarded ? "You’re on the board." : "Your call is locked. Receipt pending until match ends.");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(pendingCallKey);
    }
    playSound("pick_locked");
    showToast("Pick locked.", "success");
  }, [awayScore, exactLockedAt, homeScore, isAuthenticated, lockClosed, match, receiptName, selectedWinner, showToast]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isAuthenticated || lockClosed || autoLockQueuedRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const shouldResume = params.get("resume") === "1";
    const draft = pendingDraftRef.current;

    if (!shouldResume || !draft?.autoLockType || draft.matchId !== match.id) {
      return;
    }

    autoLockQueuedRef.current = true;

    setIsResumingSavedCall(true);

    const autoLockTimer = window.setTimeout(() => {
      if (draft.autoLockType === "winner" && !winnerLockedAt) {
        void lockWinner().finally(() => setIsResumingSavedCall(false));
        return;
      }

      if (draft.autoLockType === "exact" && !exactLockedAt) {
        void lockExactScore().finally(() => setIsResumingSavedCall(false));
        return;
      }

      setIsResumingSavedCall(false);
    }, 220);

    return () => {
      window.clearTimeout(autoLockTimer);
      setIsResumingSavedCall(false);
    };
  }, [isAuthenticated, lockClosed, match.id, winnerLockedAt, exactLockedAt, lockWinner, lockExactScore]);

  async function handleLightweightSignup() {
    if (isAuthenticated) return;
    if (!receiptName.trim()) {
      setAuthMessage("Pick a name for your receipt.");
      return;
    }
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthMessage("Email and password are required.");
      return;
    }
    if (!termsAccepted) {
      setAuthMessage("Please confirm you are 13+ and agree to Terms and Privacy Policy.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setAuthMessage("Unable to save your call right now.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const nextPath = `${getCurrentPathWithQuery().includes("?") ? `${getCurrentPathWithQuery()}&` : `${getCurrentPathWithQuery()}?`}resume=1`;
    const { error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
      options: {
        emailRedirectTo: buildSiteUrl(`/auth/callback?next=${encodeURIComponent(nextPath)}`),
      },
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(getUserFacingErrorMessage(error, "Unable to save your call right now."));
      return;
    }

    setAuthMessage("Account created. Check your inbox to verify and resume saving your call.");
  }

  async function handleLightweightGoogle() {
    if (isAuthenticated) return;
    if (!termsAccepted) {
      setAuthMessage("Please confirm you are 13+ and agree to Terms and Privacy Policy.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setAuthMessage("Unable to continue with Google right now.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");
    const currentPath = getCurrentPathWithQuery();
    const nextPath = `${currentPath.includes("?") ? `${currentPath}&` : `${currentPath}?`}resume=1`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildSiteUrl(`/auth/callback?source=oauth&next=${encodeURIComponent(nextPath)}`),
      },
    });

    if (error) {
      setAuthLoading(false);
      setAuthMessage(getUserFacingErrorMessage(error, "Unable to continue with Google right now."));
    }
  }

  return (
    <main className="min-h-dvh bg-black px-4 py-6 pb-28 text-white">
      <div className="page-rhythm mx-auto w-full max-w-2xl screen-safe-bottom">
        <AppHeader
          subtitle="Make your World Cup call before kickoff."
          profile={profile}
          rightAriaLabel="Schedule"
        />

        <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Upcoming Match</p>
          <h1 className="sports-display mt-2 text-3xl italic leading-none text-white sm:text-4xl">MAKE YOUR CALL</h1>
          <p className="mt-2 text-sm font-semibold text-gray-300">Receipt pending until match ends.</p>
          {isResumingSavedCall ? (
            <p className="mt-2 text-[11px] font-semibold text-lime-200">Resuming your saved call…</p>
          ) : null}
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-purple-200">
            {match.stage === "Group Stage" ? "Group Stage" : match.stage} {match.group !== "KO" ? `· Group ${match.group}` : ""}
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            {match.homeTeam} vs {match.awayTeam ?? "TBD"}
          </h2>
          <p className="mt-1 text-xs font-semibold text-gray-400">Venue: {match.city} · {match.venue}</p>
          <p className="mt-1 text-xs font-semibold text-gray-400">Kickoff: {kickoffLabel}</p>
        </section>

        {showAuthGate && !isAuthenticated ? (
          <section className="rounded-[1.75rem] border border-lime-300/35 bg-black/45 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Save Your Call</p>
            <h2 className="sports-display mt-2 text-3xl italic leading-none text-white">Pick a name for your receipt</h2>
            <p className="mt-2 text-sm font-semibold text-gray-300">
              Your call needs a name so we can save it to your receipt board.
            </p>
            <div className="mt-3 grid gap-2">
              <input
                value={receiptName}
                onChange={(event) => setReceiptName(event.target.value)}
                placeholder="Receipt name"
                className="min-h-11 rounded-xl border border-white/15 bg-black/60 px-3 text-sm font-semibold text-white outline-none"
              />
              <input
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="Email"
                type="email"
                className="min-h-11 rounded-xl border border-white/15 bg-black/60 px-3 text-sm font-semibold text-white outline-none"
              />
              <input
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Password"
                type="password"
                className="min-h-11 rounded-xl border border-white/15 bg-black/60 px-3 text-sm font-semibold text-white outline-none"
              />
            </div>
            <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-gray-300">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black accent-lime-300"
              />
              <span>
                By creating an account, you confirm you are at least 13 years old and agree to Lockt&apos;s Terms and Privacy Policy.
              </span>
            </label>
            {authMessage ? <p className="mt-3 text-xs font-semibold text-gray-200">{authMessage}</p> : null}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  void handleLightweightSignup();
                }}
                disabled={authLoading}
                className="min-h-11 rounded-xl border border-lime-300/55 bg-lime-400/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-lime-100 disabled:opacity-50"
              >
                {authLoading ? "Saving..." : "Save My Call"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleLightweightGoogle();
                }}
                disabled={authLoading}
                className="min-h-11 rounded-xl border border-purple-300/55 bg-purple-500/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-purple-100 disabled:opacity-50"
              >
                Continue with Google
              </button>
            </div>
            <p className="mt-3 text-xs font-semibold text-gray-400">
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(getCurrentPathWithQuery())}`} className="font-black text-lime-300">
                Log in
              </Link>
            </p>
            <p className="mt-1 text-xs font-semibold text-gray-400">We&apos;ll save this call to your Lockt profile.</p>
          </section>
        ) : null}

        <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-black/55 p-3 text-xs font-semibold text-gray-300">
            Win/Loss/Tie Call: <span className="font-black text-lime-200">+50 / -25 REP</span> · Exact Score Challenge:{" "}
            <span className="font-black text-purple-200">+100 / -50 REP</span>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">Per match max +150 / -75 REP</p>
            <p className="mt-2 text-[11px] font-semibold text-gray-400">
              Rep is your Lockt reputation score. It has no cash value and cannot be bought, sold, transferred, or redeemed.
            </p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Win/Loss/Tie Call</p>
          <p className="mt-1 text-xs font-semibold text-gray-400">Pick the result and lock your call before kickoff.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {buildWinnerOptions(match.homeTeam, match.awayTeam ?? "TBD", isGroupStage).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedWinner(option.value)}
                disabled={lockClosed || Boolean(winnerLockedAt)}
                className={`min-h-11 rounded-xl border px-3 text-xs font-black uppercase tracking-[0.1em] ${
                  selectedWinner === option.value
                    ? "border-lime-300/70 bg-lime-400/10 text-lime-200"
                    : "border-white/15 bg-white/[0.03] text-white"
                } disabled:opacity-50`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={lockWinner}
            disabled={lockClosed || Boolean(winnerLockedAt) || winnerStatus === "saving"}
            className="mt-3 min-h-11 w-full rounded-xl border border-lime-300/55 bg-lime-400/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-lime-100 disabled:opacity-50"
          >
            {winnerStatus === "saving" ? "Saving..." : "Lock My Call (+50 / -25 REP)"}
          </button>
          {winnerMessage ? (
            <p className={`mt-2 text-xs font-semibold ${winnerStatus === "error" ? "text-red-300" : "text-lime-300"}`}>{winnerMessage}</p>
          ) : null}

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Exact Score Challenge</p>
          <p className="mt-1 text-xs font-semibold text-gray-400">Feeling sharp? Call the exact score for a bigger rep swing.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-gray-300">{match.homeTeam}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={homeScore}
                onChange={(event) => setHomeScore(event.target.value)}
                disabled={lockClosed || Boolean(exactLockedAt)}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm font-semibold text-white outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-gray-300">{match.awayTeam ?? "TBD"}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={awayScore}
                onChange={(event) => setAwayScore(event.target.value)}
                disabled={lockClosed || Boolean(exactLockedAt)}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm font-semibold text-white outline-none"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={lockExactScore}
            disabled={lockClosed || Boolean(exactLockedAt) || exactStatus === "saving"}
            className="mt-4 min-h-11 w-full rounded-xl border border-purple-300/55 bg-purple-500/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-purple-100 disabled:opacity-50"
          >
            {exactStatus === "saving" ? "Saving..." : "Lock My Call (+100 / -50 REP)"}
          </button>
          {exactMessage ? (
            <p className={`mt-2 text-xs font-semibold ${exactStatus === "error" ? "text-red-300" : "text-lime-300"}`}>{exactMessage}</p>
          ) : null}
          {lockClosed ? <p className="mt-2 text-xs font-semibold text-lime-300">Locked before kickoff</p> : null}
          {starterRepUnlocked ? (
            <div className="mt-3 rounded-xl border border-lime-300/35 bg-lime-400/10 p-3">
              <p className="text-sm font-black text-lime-100">You&apos;re on the board.</p>
              <p className="mt-1 text-xs font-semibold text-gray-200">+200 Starter Rep</p>
              <p className="text-xs font-semibold text-gray-200">🏆 First Lock Trophy unlocked</p>
              <p className="text-xs font-semibold text-gray-200">Rookie → Player</p>
              <p className="mt-2 text-xs font-semibold text-gray-300">Your receipt is pending until the match ends.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Link href="/receipts" className="rounded-lg border border-purple-300/35 bg-purple-500/10 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-purple-100">
                  View My Receipt Board
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    void shareLockedCall();
                  }}
                  className="rounded-lg border border-lime-300/35 bg-lime-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-lime-100"
                >
                  Share My Call
                </button>
                <Link href="/schedule" className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-white">
                  Back to Schedule
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </div>
      <RouteBottomNav activeView="schedule" />
    </main>
  );
}

function buildWinnerOptions(homeTeam: string, awayTeam: string, allowDraw: boolean) {
  const options: Array<{ value: string; label: string }> = [
    { value: homeTeam, label: homeTeam },
    { value: awayTeam, label: awayTeam },
  ];

  if (allowDraw) {
    options.push({ value: "Draw", label: "Draw" });
  }

  return options;
}
