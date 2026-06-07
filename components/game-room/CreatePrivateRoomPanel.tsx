"use client";

import { useState } from "react";
import { buildPrivateRoomPath } from "@/lib/gameRoom/roomCode";
import { createPrivateRoom } from "@/lib/gameRoom/rootingApi";
import { getShareUrl } from "@/lib/site-url";

const shareButtonClass =
  "inline-flex min-h-10 items-center rounded-xl border border-purple-300/45 bg-purple-500/10 px-3 text-xs font-black uppercase tracking-[0.1em] text-purple-200 transition hover:bg-purple-500/20";

const secondaryButtonClass =
  "inline-flex min-h-10 items-center rounded-xl border border-white/15 bg-black/35 px-3 text-xs font-black uppercase tracking-[0.1em] text-gray-100 transition hover:border-lime-300/35 hover:text-lime-200 disabled:cursor-not-allowed disabled:opacity-60";

type PublicGameRoomShareSectionProps = {
  gameId: string;
  onSharePublic: () => void | Promise<void>;
};

export function PublicGameRoomShareSection({ gameId, onSharePublic }: PublicGameRoomShareSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPath, setCreatedPath] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  async function handleCreate() {
    setLoading(true);
    setError(null);

    const result = await createPrivateRoom(gameId);
    setLoading(false);

    if (result.error || !result.roomCode || !result.invitePath) {
      setError(result.error || "Unable to create a private room right now.");
      return;
    }

    setCreatedPath(result.invitePath);
  }

  async function handleCopyInvite() {
    if (!createdPath) {
      return;
    }

    try {
      await navigator.clipboard.writeText(getShareUrl(createdPath));
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setError("Unable to copy invite link.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void onSharePublic()} className={shareButtonClass}>
          Share Match Room
        </button>
        {!createdPath ? (
          <button type="button" onClick={() => void handleCreate()} disabled={loading} className={secondaryButtonClass}>
            {loading ? "Creating…" : "Create Private Room"}
          </button>
        ) : null}
      </div>

      {error && !createdPath ? <p className="text-xs font-semibold text-red-300">{error}</p> : null}

      {createdPath ? (
        <PrivateRoomCreatedBanner
          invitePath={createdPath}
          copyState={copyState}
          onCopy={() => void handleCopyInvite()}
        />
      ) : null}
    </div>
  );
}

type PrivateGameRoomShareSectionProps = {
  gameId: string;
  roomCode: string;
  onSharePrivate: () => void | Promise<void>;
};

export function PrivateGameRoomShareSection({ gameId, roomCode, onSharePrivate }: PrivateGameRoomShareSectionProps) {
  const invitePath = buildPrivateRoomPath(gameId, roomCode);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  async function handleCopyInvite() {
    try {
      await navigator.clipboard.writeText(getShareUrl(invitePath));
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("idle");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void onSharePrivate()} className={shareButtonClass}>
        Share Match Room
      </button>
      <button type="button" onClick={() => void handleCopyInvite()} className={secondaryButtonClass}>
        {copyState === "copied" ? "Link Copied" : "Copy Invite Link"}
      </button>
    </div>
  );
}

function PrivateRoomCreatedBanner({
  invitePath,
  copyState,
  onCopy,
}: {
  invitePath: string;
  copyState: "idle" | "copied";
  onCopy: () => void;
}) {
  return (
    <section className="rounded-[1.25rem] border border-lime-300/35 bg-lime-400/10 p-4">
      <p className="text-sm font-black uppercase tracking-[0.08em] text-lime-200">Private room created</p>
      <p className="mt-1 text-sm font-semibold text-gray-300">Only people with this link can join.</p>
      <p className="mt-3 break-all rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-gray-300">
        {getShareUrl(invitePath)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onCopy} className={secondaryButtonClass}>
          {copyState === "copied" ? "Link copied" : "Copy Invite Link"}
        </button>
        <a href={invitePath} className={secondaryButtonClass}>
          Open Private Room
        </a>
      </div>
    </section>
  );
}
