"use client";

import { useState } from "react";

import { createReport, type ReportReason, type ReportTargetType } from "@/lib/supabase/moderation";

const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "spam", label: "Spam" },
  { value: "threats", label: "Threats" },
  { value: "impersonation", label: "Impersonation" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "other", label: "Other" },
];

export function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
}: {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}) {
  const [reason, setReason] = useState<ReportReason>("harassment");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!open) {
    return null;
  }

  async function submitReport() {
    setStatus("loading");
    setMessage("");

    const { error } = await createReport({
      targetType,
      targetId,
      reason,
      details,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("done");
    setMessage("Flag submitted. Ref crew will review it.");
    window.setTimeout(() => {
      onClose();
      setStatus("idle");
      setDetails("");
      setMessage("");
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-black/70 p-4 sm:place-items-center" role="dialog" aria-modal="true">
      <section className="w-full max-w-md rounded-2xl border border-yellow-300/30 bg-[#0b0e16] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-yellow-300">⚑ Ref Flag</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-gray-300"
          >
            Close
          </button>
        </div>

        <h3 className="mt-2 text-2xl font-black italic text-white">Report Content</h3>
        <p className="mt-1 text-xs font-semibold text-gray-400">Attack takes. Not lives.</p>

        <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Reason</label>
        <select
          value={reason}
          onChange={(event) => setReason(event.target.value as ReportReason)}
          className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/45 px-3 text-sm font-black text-white outline-none"
        >
          {REPORT_REASONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#090b13]">
              {option.label}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Details (optional)</label>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          maxLength={280}
          className="mt-2 min-h-20 w-full resize-none rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-sm font-semibold text-white outline-none"
          placeholder="What happened?"
        />

        {message && (
          <p
            className={`mt-3 rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.08em] ${
              status === "error" ? "border-red-300/30 bg-red-500/10 text-red-200" : "border-yellow-300/30 bg-yellow-500/10 text-yellow-200"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={submitReport}
          disabled={status === "loading"}
          className="mt-4 min-h-11 w-full rounded-xl border border-yellow-300/40 bg-yellow-500/15 text-sm font-black uppercase tracking-[0.1em] text-yellow-100 transition hover:bg-yellow-500/25 disabled:opacity-70"
        >
          {status === "loading" ? "Submitting..." : "Submit Report"}
        </button>
      </section>
    </div>
  );
}
