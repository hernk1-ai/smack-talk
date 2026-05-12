"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SmackTalkLogo } from "@/components/SmackTalkLogo";

export function ProfilePicPage({ username }: { username?: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cleanUsername = sanitizeUsername(username) || "FadeKing";
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const teamsRoute = `/onboarding/teams?username=${encodeURIComponent(cleanUsername)}`;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return nextPreviewUrl;
    });
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <ProfilePicAtmosphere />
      <div className="relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,760px)] flex-col py-5 sm:py-7">
        <ProfilePicHeader />

        <section className="mx-auto flex w-full flex-1 flex-col justify-center py-8 text-center sm:py-10">
          <ProgressStepper />

          <h1 className="sports-display mt-8 text-[4.6rem] italic leading-[0.84] tracking-tight text-white drop-shadow-[0_10px_28px_rgba(255,255,255,0.15)] min-[390px]:text-[5.6rem] sm:text-[8rem]">
            Add Your
            <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent">
              Profile Pic
            </span>
          </h1>
          <p className="mt-5 text-base font-black uppercase tracking-[0.16em] text-gray-300 sm:text-xl">
            Put a <span className="text-lime-300">face</span> on the receipts.
          </p>

          <div className="mt-7 flex items-center justify-center gap-3 text-3xl font-black text-white sm:text-4xl">
            <span>@{cleanUsername}</span>
            <Link
              href={`/username?username=${encodeURIComponent(cleanUsername)}`}
              className="grid h-10 w-10 place-items-center rounded-xl border border-lime-300/30 bg-lime-300/10 text-xl text-lime-300 transition hover:-translate-y-0.5 hover:border-purple-300/60 hover:text-purple-300"
              aria-label="Edit username"
            >
              ✎
            </Link>
          </div>

          <ProfilePreview previewUrl={previewUrl} />

          <div className="mx-auto mt-7 flex w-full max-w-xl flex-col gap-4">
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-14 rounded-2xl border border-lime-300/40 bg-black/55 px-5 text-base font-black uppercase tracking-[0.16em] text-lime-300 shadow-[0_0_30px_rgba(132,204,22,0.12)] transition hover:-translate-y-0.5 hover:border-purple-300/60 hover:text-purple-300 active:scale-[0.99] sm:min-h-16"
            >
              Upload Profile Picture
            </button>

            <button
              type="button"
              onClick={() => router.push(teamsRoute)}
              className="min-h-16 w-full rounded-2xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-xl font-black uppercase italic tracking-[0.18em] text-black shadow-[0_0_42px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_54px_rgba(168,85,247,0.36)] active:scale-[0.99] sm:min-h-20 sm:text-2xl"
            >
              Continue →
            </button>
            <button
              type="button"
              onClick={() => router.push(teamsRoute)}
              className="mx-auto min-h-11 px-5 text-sm font-black uppercase tracking-[0.22em] text-gray-500 transition hover:text-purple-300 active:scale-95"
            >
              Skip For Now
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfilePicHeader() {
  return (
    <header className="flex items-center justify-center">
      <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="Smack Talk home">
        <SmackTalkLogo size={62} />
        <div className="brand-lockup text-4xl leading-[0.82]">
          <span className="block text-white">Smack</span>
          <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
            Talk
          </span>
        </div>
      </Link>
    </header>
  );
}

function ProgressStepper() {
  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center gap-3" aria-label="Onboarding step 2 of 3">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-lime-300/70" />
      <span className="grid h-8 w-8 place-items-center rounded-full bg-lime-300 text-sm font-black text-black shadow-[0_0_22px_rgba(132,204,22,0.45)]">
        ✓
      </span>
      <span className="h-px w-20 bg-gradient-to-r from-lime-300/70 to-lime-300/70" />
      <span className="grid h-9 w-9 place-items-center rounded-full bg-lime-300 text-base font-black text-black shadow-[0_0_26px_rgba(132,204,22,0.5)]">
        2
      </span>
      <span className="h-px w-20 bg-gradient-to-r from-lime-300/50 to-white/18" />
      <span className="grid h-8 w-8 place-items-center rounded-full border border-white/25 bg-black/45 text-sm font-black text-gray-500">
        3
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
    </div>
  );
}

function ProfilePreview({ previewUrl }: { previewUrl: string | null }) {
  return (
    <section className="relative mx-auto mt-8 grid h-64 w-64 place-items-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_22%,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_35%,rgba(0,0,0,0.42)_72%)] shadow-[0_0_0_3px_rgba(132,204,22,0.35),0_0_0_5px_rgba(168,85,247,0.28),0_0_56px_rgba(168,85,247,0.28)] sm:h-80 sm:w-80">
      {previewUrl ? (
        <div
          className="h-full w-full rounded-full bg-cover bg-center"
          style={{ backgroundImage: `url(${previewUrl})` }}
          aria-label="Selected profile picture preview"
          role="img"
        />
      ) : (
        <div className="relative h-36 w-32 sm:h-44 sm:w-40" aria-hidden="true">
          <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 rounded-full bg-black/60 sm:h-24 sm:w-24" />
          <div className="absolute bottom-0 left-1/2 h-24 w-32 -translate-x-1/2 rounded-t-[4rem] bg-black/60 sm:h-28 sm:w-40" />
        </div>
      )}
      <div className="absolute bottom-2 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full border border-purple-300/70 bg-black/80 text-3xl text-lime-300 shadow-[0_0_28px_rgba(132,204,22,0.26)]">
        📷
      </div>
    </section>
  );
}

function sanitizeUsername(value?: string) {
  return (value ?? "").trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
}

function ProfilePicAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_6%,rgba(168,85,247,0.16),transparent_34rem),radial-gradient(circle_at_14%_47%,rgba(132,204,22,0.14),transparent_30rem),linear-gradient(180deg,rgba(2,4,10,0.58),#02040a_80%)]" />
      <div className="absolute left-0 top-0 h-full w-36 bg-[linear-gradient(105deg,rgba(132,204,22,0.11),transparent)] blur-2xl" />
      <div className="absolute right-0 top-0 h-full w-40 bg-[linear-gradient(255deg,rgba(168,85,247,0.15),transparent)] blur-2xl" />
      <div className="absolute left-1/2 top-24 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-purple-500/8 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
    </div>
  );
}
