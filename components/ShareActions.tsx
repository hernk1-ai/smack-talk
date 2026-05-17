"use client";

import { useMemo, useState } from "react";

export type ShareType = "call" | "profile" | "match" | "receipt";

type ShareActionsProps = {
  type: ShareType;
  title: string;
  text: string;
  url: string;
  imageUrl?: string;
  caption?: string;
  className?: string;
};

export function ShareActions({ type, title, text, url, imageUrl, caption, className }: ShareActionsProps) {
  const [status, setStatus] = useState("");
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const finalCaption = caption ?? text;
  const xHref = useMemo(() => {
    const message = `${finalCaption} ${url}`.trim();
    return `https://x.com/intent/tweet?text=${encodeURIComponent(message)}`;
  }, [finalCaption, url]);
  const smsHref = useMemo(() => `sms:?&body=${encodeURIComponent(`${finalCaption} ${url}`.trim())}`, [finalCaption, url]);

  async function copyText(value: string, okMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(okMessage);
      window.setTimeout(() => setStatus(""), 1600);
    } catch {
      setStatus("Copy failed. Try again.");
    }
  }

  async function shareNative() {
    if (!canNativeShare) {
      return;
    }
    try {
      await navigator.share({ title, text: finalCaption, url });
      setStatus("Shared");
      window.setTimeout(() => setStatus(""), 1600);
    } catch {
      setStatus("");
    }
  }

  return (
    <div className={className ?? ""}>
      <div className="grid gap-2 sm:grid-cols-2">
        {canNativeShare ? (
          <button
            type="button"
            onClick={shareNative}
            className="min-h-10 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-black uppercase tracking-[0.1em] text-white"
          >
            Share
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => copyText(url, "Link copied")}
          className="min-h-10 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-black uppercase tracking-[0.1em] text-white"
        >
          Copy Link
        </button>
        <button
          type="button"
          onClick={() => copyText(finalCaption, "Caption copied")}
          className="min-h-10 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-black uppercase tracking-[0.1em] text-white"
        >
          Copy Caption
        </button>
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          className="grid min-h-10 place-items-center rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-black uppercase tracking-[0.1em] text-white"
        >
          Share to X
        </a>
        <a
          href={smsHref}
          className="grid min-h-10 place-items-center rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-black uppercase tracking-[0.1em] text-white"
        >
          Text It
        </a>
        {imageUrl ? (
          <a
            href={imageUrl}
            download
            className="grid min-h-10 place-items-center rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-black uppercase tracking-[0.1em] text-white"
          >
            Download Image
          </a>
        ) : null}
      </div>
      {(type === "call" || type === "profile" || type === "receipt") && (
        <p className="mt-2 text-xs font-semibold text-gray-400">
          Download the card and post it to Instagram or TikTok.
        </p>
      )}
      {status ? <p className="mt-2 text-xs font-semibold text-lime-300">{status}</p> : null}
    </div>
  );
}
