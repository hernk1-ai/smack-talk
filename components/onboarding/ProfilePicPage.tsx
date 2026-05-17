"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LocktLogo } from "@/components/LocktLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { avatarOptions, normalizeAvatarKey, serializeAvatarKey, type AvatarKey } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";

export function ProfilePicPage({ username }: { username?: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const routeUsername = sanitizeUsername(username);
  const [selectedAvatarKey, setSelectedAvatarKey] = useState<AvatarKey>("logo");
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadSavedAvatar() {
      if (!supabase) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data } = await supabase.from("profiles").select("avatar_url, username").eq("id", user.id).maybeSingle();

      if (!isMounted || !data) {
        return;
      }

      if (data.username) {
        setProfileUsername(data.username);
      }

      if (!data.avatar_url) {
        return;
      }

      if (data.avatar_url.startsWith("data:") || data.avatar_url.startsWith("http")) {
        setPreviewDataUrl(data.avatar_url);
      } else {
        setSelectedAvatarKey(normalizeAvatarKey(data.avatar_url));
      }
    }

    loadSavedAvatar();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");

    try {
      const nextPreview = await resizeImageFile(file);
      setPreviewDataUrl(nextPreview);
    } catch {
      setMessage("That image could not be previewed. Try another profile picture.");
    }
  }

  async function saveProfile({ withAvatar }: { withAvatar: boolean }) {
    const supabase = createClient();
    const avatarUrl = previewDataUrl ?? serializeAvatarKey(selectedAvatarKey);
    const effectiveUsername = sanitizeUsername(profileUsername || routeUsername || username || "");
    const cleanUsername = effectiveUsername || "LocktFan";
    const avatarRouteKey = withAvatar && previewDataUrl ? "custom" : selectedAvatarKey;
    const teamsRoute = `/onboarding/teams?username=${encodeURIComponent(cleanUsername)}&avatar=${encodeURIComponent(
      avatarRouteKey,
    )}`;

    if (!supabase) {
      router.push(teamsRoute);
      return;
    }

    setIsSaving(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsSaving(false);
      router.push("/login");
      return;
    }

    const payload: { id: string; email: string | null; username?: string; avatar_url?: string } = {
      id: user.id,
      email: user.email ?? null,
    };

    if (effectiveUsername) {
      payload.username = effectiveUsername;
    }

    if (withAvatar) {
      payload.avatar_url = avatarUrl;
    }

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

    setIsSaving(false);

    if (error) {
      setMessage(getUserFacingErrorMessage(error, "Unable to save your profile right now. Try again."));
      return;
    }

    router.push(teamsRoute);
  }

  function handleContinue() {
    saveProfile({ withAvatar: true });
  }

  function handleSkip() {
    saveProfile({ withAvatar: false });
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
            <span>@{sanitizeUsername(profileUsername || routeUsername || username || "LocktFan")}</span>
          </div>

          <ProfilePreview avatarKey={selectedAvatarKey} previewDataUrl={previewDataUrl} />

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

            <AvatarChoices
              selectedAvatarKey={selectedAvatarKey}
              onSelect={(avatarKey) => {
                setSelectedAvatarKey(avatarKey);
                setPreviewDataUrl(null);
                setMessage("");
              }}
            />

            <button
              type="button"
              onClick={handleContinue}
              disabled={isSaving}
              className="min-h-16 w-full rounded-2xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-xl font-black uppercase italic tracking-[0.18em] text-black shadow-[0_0_42px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_54px_rgba(168,85,247,0.36)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65 sm:min-h-20 sm:text-2xl"
            >
              {isSaving ? "Saving..." : "Continue →"}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSaving}
              className="mx-auto min-h-11 px-5 text-sm font-black uppercase tracking-[0.22em] text-gray-500 transition hover:text-purple-300 active:scale-95"
            >
              Skip For Now
            </button>
            {message && (
              <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-gray-200">
                {message}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfilePicHeader() {
  return (
    <header className="flex items-center justify-center">
      <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="LOCKT home">
        <LocktLogo size={62} />
        <div className="brand-lockup text-4xl leading-[0.82]">
          <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
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

function AvatarChoices({
  selectedAvatarKey,
  onSelect,
}: {
  selectedAvatarKey: AvatarKey;
  onSelect: (avatarKey: AvatarKey) => void;
}) {
  return (
    <section className="rounded-[1.35rem] border border-white/10 bg-black/40 p-3 text-left">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
        Or use a LOCKT avatar
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {avatarOptions.map((option) => {
          const isSelected = option.key === selectedAvatarKey;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option.key)}
              aria-pressed={isSelected}
              className={`grid min-h-20 place-items-center gap-1 rounded-2xl border bg-black/45 p-2 transition hover:-translate-y-0.5 active:scale-[0.98] ${
                isSelected
                  ? "border-lime-300 shadow-[0_0_22px_rgba(132,204,22,0.22)]"
                  : "border-white/12 hover:border-purple-300/45"
              }`}
            >
              <UserAvatar avatarUrl={serializeAvatarKey(option.key)} size="md" label={option.label} active={isSelected} />
              <span className="text-[9px] font-black uppercase tracking-[0.08em] text-gray-400">{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProfilePreview({
  avatarKey,
  previewDataUrl,
}: {
  avatarKey: AvatarKey;
  previewDataUrl: string | null;
}) {
  const avatarUrl = previewDataUrl ?? serializeAvatarKey(avatarKey);

  return (
    <section className="relative mx-auto mt-8 grid h-64 w-64 place-items-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_22%,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_35%,rgba(0,0,0,0.42)_72%)] shadow-[0_0_0_3px_rgba(132,204,22,0.35),0_0_0_5px_rgba(168,85,247,0.28),0_0_56px_rgba(168,85,247,0.28)] sm:h-80 sm:w-80">
      <UserAvatar avatarUrl={avatarUrl} size="xl" label="Selected profile picture preview" active className="!h-full !w-full !text-6xl" />
      <div className="absolute bottom-2 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full border border-purple-300/70 bg-black/80 text-3xl text-lime-300 shadow-[0_0_28px_rgba(132,204,22,0.26)]">
        📷
      </div>
    </section>
  );
}

function sanitizeUsername(value?: string) {
  return (value ?? "").trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
}

function resizeImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read image"));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("Could not load image"));
      image.onload = () => {
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not create preview"));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
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
