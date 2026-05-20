"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { RouteBottomNav } from "@/components/BottomNav";
import { UserAvatar } from "@/components/UserAvatar";
import { avatarOptions, isImageAvatar, normalizeAvatarKey, serializeAvatarKey, type AvatarKey } from "@/lib/avatar";
import { ensurePushSubscription } from "@/lib/push/subscription";
import { getInAppNotificationsEnabled, getSoundMutedPreference, setInAppNotificationsEnabled, setSoundMutedPreference } from "@/lib/preferences";
import { createClient } from "@/lib/supabase/client";
import { getMyNotificationPreferences, updateMyNotificationPreferences, type NotificationPreferences } from "@/lib/supabase/notificationPreferences";
import type { Profile } from "@/lib/supabase/types";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";

export function SettingsPage({ email, profile }: { email?: string | null; profile?: Profile | null }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const username = profile?.username || "TalkHeavy23";
  const teams = profile?.favorite_teams?.length ? profile.favorite_teams : ["Chiefs", "Eagles", "Lions"];
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const [accountVisibility, setAccountVisibility] = useState<"public" | "private">(profile?.account_visibility ?? "public");
  const [privacyMessage, setPrivacyMessage] = useState("");
  const [soundsEnabled, setSoundsEnabled] = useState(() => !getSoundMutedPreference());
  const [inAppEnabled, setInAppEnabled] = useState(() => getInAppNotificationsEnabled());
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    push_enabled: true,
    email_enabled: false,
    follows_enabled: true,
    replies_enabled: true,
    reactions_enabled: true,
    receipts_enabled: true,
  });
  const [notificationPrefsMessage, setNotificationPrefsMessage] = useState("");
  const [pushSubscriptionMessage, setPushSubscriptionMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadPreferences() {
      const { preferences } = await getMyNotificationPreferences();
      if (!mounted) return;
      setNotificationPrefs(preferences);
    }
    void loadPreferences();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase?.auth.signOut();
    router.replace("/signed-out");
  }

  async function updatePrivacy(nextVisibility: "public" | "private") {
    setAccountVisibility(nextVisibility);
    setPrivacyMessage("Saving privacy setting...");
    const supabase = createClient();
    if (!supabase) {
      setPrivacyMessage("Supabase not configured.");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPrivacyMessage("Log in again to update privacy.");
      return;
    }
    const { error } = await supabase.from("profiles").update({ account_visibility: nextVisibility }).eq("id", user.id);
    if (error) {
      setPrivacyMessage(getUserFacingErrorMessage(error, "Unable to update privacy right now."));
      return;
    }
    setPrivacyMessage("Privacy updated.");
  }

  async function updateAvatar(nextAvatarUrl: string) {
    const previousAvatarUrl = avatarUrl;
    setAvatarUrl(nextAvatarUrl);
    setAvatarMessage("Saving profile picture...");
    setIsAvatarSaving(true);

    const supabase = createClient();

    if (!supabase) {
      setAvatarMessage("Profile picture preview updated. Supabase is not configured.");
      setIsAvatarSaving(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setAvatarUrl(previousAvatarUrl);
      setAvatarMessage("Log in again to update your profile picture.");
      setIsAvatarSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? email ?? profile?.email ?? null,
        username: username.replace(/^@/, ""),
        avatar_url: nextAvatarUrl,
      },
      { onConflict: "id" },
    );

    if (error) {
      setAvatarUrl(previousAvatarUrl);
      setAvatarMessage(getUserFacingErrorMessage(error, "Unable to update your profile picture right now."));
      setIsAvatarSaving(false);
      return;
    }

    setAvatarMessage("Profile picture updated.");
    setIsAvatarSaving(false);
  }

  async function handleEnablePushNotifications() {
    setPushSubscriptionMessage("Enabling notifications...");
    const result = await ensurePushSubscription({ requestPermission: true });
    if (result.ok) {
      setPushSubscriptionMessage("Push notifications enabled.");
      return;
    }

    if (result.reason === "permission-denied") {
      setPushSubscriptionMessage("Notifications are blocked. Enable them in your browser settings.");
      return;
    }

    if (result.reason === "missing-vapid-key") {
      setPushSubscriptionMessage("Push setup is incomplete. Missing VAPID public key.");
      return;
    }

    if (result.reason === "unsupported") {
      setPushSubscriptionMessage("Push notifications are not supported on this browser/device.");
      return;
    }

    setPushSubscriptionMessage("Unable to enable push notifications right now.");
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const previewDataUrl = await resizeImageFile(file);
      await updateAvatar(previewDataUrl);
    } catch {
      setAvatarMessage("That image could not be previewed. Try another profile picture.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <>
      <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
        <div className="feed-shell screen-safe-bottom space-y-5">
        <SettingsHeader profile={profile} avatarUrl={avatarUrl} />

        <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-5">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_18%,rgba(132,204,22,0.16),transparent_30%),radial-gradient(circle_at_88%_20%,rgba(168,85,247,0.16),transparent_32%)]" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar avatarUrl={avatarUrl} initials={getInitials(username)} size="lg" active />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">Settings</p>
                <h1 className="mt-1 text-3xl font-black italic leading-none text-white sm:text-4xl">
                  @{username.replace(/^@/, "")}
                </h1>
                <p className="mt-2 text-sm font-semibold text-gray-400">Account, profile, privacy, and session.</p>
              </div>
            </div>
            <Link
              href="/receipts"
              className="min-h-11 rounded-2xl border border-purple-300/35 bg-purple-500/10 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-purple-200 transition hover:-translate-y-0.5 hover:bg-purple-500/15 active:scale-95"
            >
              Back to Receipts
            </Link>
          </div>
        </section>

        <ProfilePictureSettings
          avatarUrl={avatarUrl}
          avatarMessage={avatarMessage}
          isAvatarSaving={isAvatarSaving}
          username={username}
          onAvatarSelect={(avatarKey) => updateAvatar(serializeAvatarKey(avatarKey))}
          onUploadClick={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
        />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <SettingsCard title="Account" eyebrow="Identity">
            <SettingsRow label="Email" value={email || profile?.email || "Not connected"} />
            <SettingsRow label="Username" value={`@${username.replace(/^@/, "")}`} />
            <SettingsRow
              label="Profile picture"
              value={avatarUrl ? "Saved to profile" : "Initials fallback"}
            />
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Selected Teams</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {teams.map((team) => (
                  <span
                    key={team}
                    className="rounded-xl border border-lime-300/25 bg-lime-400/10 px-3 py-2 text-xs font-black uppercase text-lime-200"
                  >
                    {team}
                  </span>
                ))}
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title="Preferences" eyebrow="Controls">
            <ToggleRow
              title="Sounds"
              copy="Play LOCKT sounds for lock, ride/fade, replies, and follows."
              enabled={soundsEnabled}
              onToggle={(enabled) => {
                setSoundsEnabled(enabled);
                setSoundMutedPreference(!enabled);
              }}
            />
            <ToggleRow
              title="In-app notifications"
              copy="Show confirmation toasts in the app."
              enabled={inAppEnabled}
              onToggle={(enabled) => {
                setInAppEnabled(enabled);
                setInAppNotificationsEnabled(enabled);
              }}
            />
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.1em] text-white">Push notifications</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-gray-400">Get browser alerts for follows, replies, reactions, and receipts.</p>
                </div>
                <button
                  type="button"
                  onClick={handleEnablePushNotifications}
                  className="min-h-10 rounded-xl border border-lime-300/40 bg-lime-400/10 px-3 text-xs font-black uppercase text-lime-200 transition hover:border-lime-300 hover:text-lime-100"
                >
                  Enable Notifications
                </button>
              </div>
              {pushSubscriptionMessage ? <p className="mt-2 text-xs font-semibold text-gray-300">{pushSubscriptionMessage}</p> : null}
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
              <p className="text-sm font-black uppercase tracking-[0.1em] text-white">Notification Types</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-gray-400">Choose the updates you want from follows, replies, reactions, and receipts.</p>
              <div className="mt-3 grid gap-2">
                <ToggleRow
                  title="Follows"
                  copy="Follow requests and accepted requests."
                  enabled={notificationPrefs.follows_enabled}
                  onToggle={(enabled) => setNotificationPrefs((current) => ({ ...current, follows_enabled: enabled }))}
                />
                <ToggleRow
                  title="Replies"
                  copy="Replies to your takes."
                  enabled={notificationPrefs.replies_enabled}
                  onToggle={(enabled) => setNotificationPrefs((current) => ({ ...current, replies_enabled: enabled }))}
                />
                <ToggleRow
                  title="Reactions"
                  copy="Ride/Fade on your takes."
                  enabled={notificationPrefs.reactions_enabled}
                  onToggle={(enabled) => setNotificationPrefs((current) => ({ ...current, reactions_enabled: enabled }))}
                />
                <ToggleRow
                  title="Receipts"
                  copy="Pick and receipt status updates."
                  enabled={notificationPrefs.receipts_enabled}
                  onToggle={(enabled) => setNotificationPrefs((current) => ({ ...current, receipts_enabled: enabled }))}
                />
                <ToggleRow
                  title="Push Channel"
                  copy="Allow push delivery when your device is subscribed."
                  enabled={notificationPrefs.push_enabled}
                  onToggle={(enabled) => setNotificationPrefs((current) => ({ ...current, push_enabled: enabled }))}
                />
                <ToggleRow
                  title="Email Channel"
                  copy="Allow email delivery when email fanout is enabled."
                  enabled={notificationPrefs.email_enabled}
                  onToggle={(enabled) => setNotificationPrefs((current) => ({ ...current, email_enabled: enabled }))}
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  setNotificationPrefsMessage("Saving notification preferences...");
                  const { error } = await updateMyNotificationPreferences(notificationPrefs);
                  setNotificationPrefsMessage(error ? "Unable to save notification preferences right now." : "Notification preferences saved.");
                }}
                className="mt-3 min-h-10 rounded-xl border border-lime-300/40 bg-lime-400/10 px-3 text-xs font-black uppercase text-lime-200"
              >
                Save Notification Preferences
              </button>
              {notificationPrefsMessage ? <p className="mt-2 text-xs font-semibold text-gray-300">{notificationPrefsMessage}</p> : null}
            </div>
          </SettingsCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <SettingsCard title="Privacy / Safety" eyebrow="Rules">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
              <p className="text-sm font-black uppercase tracking-[0.1em] text-white">Account Privacy</p>
              <p className="mt-1 text-xs font-semibold text-gray-400">
                {accountVisibility === "public"
                  ? "Anyone can view your profile, follow you, and see your public receipts."
                  : "Only approved followers can view your receipts."}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updatePrivacy("public")}
                  className={`min-h-10 rounded-xl border text-xs font-black uppercase ${accountVisibility === "public" ? "border-lime-300/50 bg-lime-400/10 text-lime-200" : "border-white/10 bg-white/[0.03] text-gray-300"}`}
                >
                  Public Account
                </button>
                <button
                  type="button"
                  onClick={() => updatePrivacy("private")}
                  className={`min-h-10 rounded-xl border text-xs font-black uppercase ${accountVisibility === "private" ? "border-purple-300/50 bg-purple-500/10 text-purple-200" : "border-white/10 bg-white/[0.03] text-gray-300"}`}
                >
                  Private Account
                </button>
              </div>
              {privacyMessage ? <p className="mt-2 text-xs font-semibold text-gray-300">{privacyMessage}</p> : null}
            </div>
            <SettingsLink href="/terms" label="Community rules" detail="Attack takes. Not lives." />
            <SettingsLink href="/terms" label="Terms of Use" detail="How LOCKT works." />
            <SettingsLink href="/privacy" label="Privacy Policy" detail="How your data is handled." />
          </SettingsCard>

          <SettingsCard title="Session" eyebrow="Access">
            <p className="text-sm font-semibold leading-6 text-gray-400">
              Signing out clears this browser session and returns you to the public side of LOCKT.
            </p>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
              <p className="text-sm font-black uppercase tracking-[0.1em] text-white">Add LOCKT to your phone</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-gray-400">
                Save LOCKT to your home screen for faster access during the World Cup.
              </p>
              <p className="mt-2 text-xs font-semibold text-gray-400">iPhone: Tap Share, then Add to Home Screen.</p>
              <p className="mt-1 text-xs font-semibold text-gray-400">Android: Tap Install App or Add to Home Screen.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 min-h-14 w-full rounded-2xl border border-purple-300/50 bg-purple-500/15 px-5 text-sm font-black uppercase tracking-[0.14em] text-purple-100 shadow-[0_0_26px_rgba(168,85,247,0.14)] transition hover:-translate-y-0.5 hover:border-lime-300/45 hover:bg-lime-400/10 hover:text-lime-200 active:scale-[0.985]"
            >
              Log Out
            </button>
          </SettingsCard>
        </section>

        <p className="px-1 text-center text-xs font-semibold text-gray-400 sm:text-left">
          Need help?{" "}
          <a className="font-black text-purple-300 transition hover:text-lime-300" href="mailto:support@getlockt.com">
            Contact support
          </a>
        </p>
        </div>
      </main>
      <RouteBottomNav activeView="settings" />
    </>
  );
}

function SettingsHeader({ profile, avatarUrl }: { profile?: Profile | null; avatarUrl?: string | null }) {
  const username = profile?.username || "LOCKT";
  void avatarUrl;

  return <AppHeader profile={profile} subtitle="Account settings. Keep your identity clean." rightAriaLabel={`${username} settings`} />;
}

function ProfilePictureSettings({
  avatarUrl,
  avatarMessage,
  isAvatarSaving,
  username,
  onAvatarSelect,
  onUploadClick,
}: {
  avatarUrl?: string | null;
  avatarMessage: string;
  isAvatarSaving: boolean;
  username: string;
  onAvatarSelect: (avatarKey: AvatarKey) => void;
  onUploadClick: () => void;
}) {
  const selectedAvatarKey = avatarUrl && !isImageAvatar(avatarUrl) ? normalizeAvatarKey(avatarUrl) : null;

  return (
    <SettingsCard title="Profile Picture" eyebrow="Customize">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <div className="mx-auto md:mx-0">
          <UserAvatar
            avatarUrl={avatarUrl}
            initials={getInitials(username)}
            label={`${username} profile picture preview`}
            size="xl"
            active
            className="!h-24 !w-24 sm:!h-28 sm:!w-28"
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold leading-6 text-gray-400">
            Pick a LOCKT avatar or upload a profile picture. Changes save instantly to your profile.
          </p>
          <button
            type="button"
            onClick={onUploadClick}
            disabled={isAvatarSaving}
            className="mt-4 min-h-11 rounded-2xl border border-lime-300/35 bg-lime-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-lime-200 transition hover:-translate-y-0.5 hover:border-purple-300/55 hover:bg-purple-500/10 hover:text-purple-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Upload Image
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {avatarOptions.map((option) => {
          const isSelected = option.key === selectedAvatarKey;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onAvatarSelect(option.key)}
              disabled={isAvatarSaving}
              aria-pressed={isSelected}
              className={`grid min-h-20 place-items-center gap-1 rounded-2xl border bg-black/45 p-2 transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${
                isSelected
                  ? "border-lime-300 shadow-[0_0_22px_rgba(132,204,22,0.24)]"
                  : "border-white/12 hover:border-purple-300/45"
              }`}
            >
              <UserAvatar
                avatarUrl={serializeAvatarKey(option.key)}
                size="md"
                label={option.label}
                active={isSelected}
              />
              <span className="text-[9px] font-black uppercase tracking-[0.08em] text-gray-400">{option.label}</span>
            </button>
          );
        })}
      </div>

      {avatarMessage && (
        <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-gray-200">
          {avatarMessage}
        </p>
      )}
    </SettingsCard>
  );
}

function SettingsCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.38)]">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">{eyebrow}</p>
      <h2 className="sports-display mt-1 text-3xl italic leading-none text-white">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-2xl border border-white/10 bg-black/35 p-3 sm:grid-cols-[11rem_1fr] sm:items-center">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="break-words text-sm font-black text-white">{value}</p>
    </div>
  );
}

function ToggleRow({
  title,
  copy,
  enabled,
  onToggle,
}: {
  title: string;
  copy: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/35 p-3">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.1em] text-white">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-gray-400">{copy}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
          enabled
            ? "border-lime-300/40 bg-lime-400/10 text-lime-200"
            : "border-white/20 bg-white/[0.03] text-gray-300"
        }`}
      >
        {enabled ? "On" : "Off"}
      </button>
    </div>
  );
}

function SettingsLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link
      href={href}
      className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-3 transition hover:-translate-y-0.5 hover:border-lime-300/30 hover:bg-lime-400/10 active:scale-[0.985]"
    >
      <span>
        <span className="block text-sm font-black uppercase tracking-[0.1em] text-white">{label}</span>
        <span className="mt-1 block text-xs font-semibold text-gray-400">{detail}</span>
      </span>
      <span className="text-2xl text-purple-200">›</span>
    </Link>
  );
}

function getInitials(username: string) {
  const cleanUsername = username.replace(/^@/, "").trim();
  const capitalLetters = cleanUsername.match(/[A-Z]/g);

  if (capitalLetters && capitalLetters.length > 1) {
    return capitalLetters.slice(0, 2).join("");
  }

  return cleanUsername.slice(0, 2).toUpperCase() || "ST";
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
