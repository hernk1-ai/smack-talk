"use client";

import { useCallback, useEffect, useState } from "react";

import { WORLD_CUP_VIDEO_CATEGORIES, type WorldCupVideo, type WorldCupVideoCategory } from "@/lib/worldCup/worldCupVideos";

const SECRET_STORAGE_KEY = "lockt_admin_secret";

type VideoForm = {
  title: string;
  youtubeUrl: string;
  sourceLabel: string;
  category: WorldCupVideoCategory;
  relatedMatchId: string;
  relatedTeam: string;
  priority: string;
  isActive: boolean;
};

const emptyForm = (): VideoForm => ({
  title: "",
  youtubeUrl: "",
  sourceLabel: "",
  category: "general",
  relatedMatchId: "",
  relatedTeam: "",
  priority: "0",
  isActive: true,
});

export default function WorldCupVideosAdminPage() {
  const [secret, setSecret] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [videos, setVideos] = useState<WorldCupVideo[]>([]);
  const [form, setForm] = useState<VideoForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const loadVideos = useCallback(async (activeSecret: string) => {
    setLoading(true);
    setGlobalError(null);

    try {
      const res = await fetch("/api/admin/world-cup-videos", {
        method: "GET",
        headers: { "x-admin-secret": activeSecret },
        cache: "no-store",
      });

      if (res.status === 401) {
        setGlobalError("Invalid admin secret.");
        setUnlocked(false);
        setSecret("");
        window.sessionStorage.removeItem(SECRET_STORAGE_KEY);
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setGlobalError(data?.error ?? "Unable to load videos.");
        return;
      }

      const data = (await res.json()) as { videos: WorldCupVideo[] };
      setVideos(data.videos);
      setUnlocked(true);
    } catch {
      setGlobalError("Network error while loading videos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SECRET_STORAGE_KEY);
    if (stored) {
      setSecret(stored);
      void loadVideos(stored);
    }
  }, [loadVideos]);

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = secretInput.trim();
    if (!trimmed) {
      return;
    }

    window.sessionStorage.setItem(SECRET_STORAGE_KEY, trimmed);
    setSecret(trimmed);
    setSecretInput("");
    await loadVideos(trimmed);
  };

  const handleLock = () => {
    window.sessionStorage.removeItem(SECRET_STORAGE_KEY);
    setSecret("");
    setUnlocked(false);
    setVideos([]);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormMessage(null);

    try {
      const res = await fetch("/api/admin/world-cup-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({
          title: form.title,
          youtubeUrl: form.youtubeUrl,
          sourceLabel: form.sourceLabel || null,
          category: form.category,
          relatedMatchId: form.relatedMatchId || null,
          relatedTeam: form.relatedTeam || null,
          priority: Number(form.priority) || 0,
          isActive: form.isActive,
        }),
      });

      const data = (await res.json().catch(() => null)) as { video?: WorldCupVideo; error?: string } | null;

      if (!res.ok || !data?.video) {
        setFormMessage(data?.error ?? "Unable to save video.");
        return;
      }

      setVideos((current) => [data.video!, ...current]);
      setForm(emptyForm());
      setFormMessage("Video added.");
    } catch {
      setFormMessage("Network error while saving video.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (video: WorldCupVideo) => {
    try {
      const res = await fetch("/api/admin/world-cup-videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ id: video.id, isActive: !video.isActive }),
      });

      const data = (await res.json().catch(() => null)) as { video?: WorldCupVideo; error?: string } | null;
      if (!res.ok || !data?.video) {
        setGlobalError(data?.error ?? "Unable to update video.");
        return;
      }

      setVideos((current) => current.map((row) => (row.id === video.id ? data.video! : row)));
    } catch {
      setGlobalError("Network error while updating video.");
    }
  };

  if (!unlocked) {
    return (
      <main className="mx-auto min-h-dvh max-w-lg px-4 py-10 text-white">
        <h1 className="text-2xl font-black">World Cup TV Admin</h1>
        <p className="mt-2 text-sm text-gray-400">Enter the admin secret to manage curated videos.</p>
        <form onSubmit={handleUnlock} className="mt-6 space-y-3">
          <input
            type="password"
            value={secretInput}
            onChange={(event) => setSecretInput(event.target.value)}
            placeholder="Admin secret"
            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl border border-lime-300/40 bg-lime-400/10 px-4 py-2 text-xs font-black uppercase text-lime-200"
          >
            Unlock
          </button>
        </form>
        {globalError ? <p className="mt-3 text-sm text-red-300">{globalError}</p> : null}
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-8 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">World Cup TV Admin</h1>
          <p className="mt-1 text-sm text-gray-400">Add FOX, ESPN, FIFA, and fan YouTube videos for Game Rooms.</p>
        </div>
        <button
          type="button"
          onClick={handleLock}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-black uppercase text-gray-300"
        >
          Lock
        </button>
      </div>

      <form onSubmit={handleCreate} className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">Add Video</p>
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Title"
          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm"
          required
        />
        <input
          value={form.youtubeUrl}
          onChange={(event) => setForm((current) => ({ ...current, youtubeUrl: event.target.value }))}
          placeholder="YouTube URL or video ID"
          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm"
          required
        />
        <input
          value={form.sourceLabel}
          onChange={(event) => setForm((current) => ({ ...current, sourceLabel: event.target.value }))}
          placeholder="Source label (FOX, ESPN, FIFA, etc.)"
          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value as WorldCupVideoCategory }))
            }
            className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm"
          >
            {WORLD_CUP_VIDEO_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            value={form.priority}
            onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
            placeholder="Priority"
            type="number"
            className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm"
          />
        </div>
        <input
          value={form.relatedMatchId}
          onChange={(event) => setForm((current) => ({ ...current, relatedMatchId: event.target.value }))}
          placeholder="Related match id (wc-2026-3)"
          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm"
        />
        <input
          value={form.relatedTeam}
          onChange={(event) => setForm((current) => ({ ...current, relatedTeam: event.target.value }))}
          placeholder="Related team (Canada)"
          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
          />
          Active
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl border border-lime-300/40 bg-lime-400/10 px-4 py-2 text-xs font-black uppercase text-lime-200 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add Video"}
        </button>
        {formMessage ? <p className="text-sm text-gray-300">{formMessage}</p> : null}
      </form>

      <section className="mt-8 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-purple-300">Catalog</p>
        {loading ? <p className="text-sm text-gray-400">Loading videos…</p> : null}
        {globalError ? <p className="text-sm text-red-300">{globalError}</p> : null}
        {!loading && !videos.length ? <p className="text-sm text-gray-400">No videos yet.</p> : null}
        {videos.map((video) => (
          <article key={video.id} className="rounded-xl border border-white/10 bg-black/45 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{video.title}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {video.category}
                  {video.sourceLabel ? ` · ${video.sourceLabel}` : ""} · priority {video.priority}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {video.relatedMatchId ? `Match: ${video.relatedMatchId}` : "No match"}
                  {video.relatedTeam ? ` · Team: ${video.relatedTeam}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void toggleActive(video)}
                className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${
                  video.isActive
                    ? "border border-lime-300/40 bg-lime-400/10 text-lime-200"
                    : "border border-white/15 bg-black/40 text-gray-400"
                }`}
              >
                {video.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
