"use client";

import { useCallback, useEffect, useState } from "react";

import {
  WORLD_CUP_VIDEO_PHASE_OPTIONS,
  type WorldCupVideoMatchPhase,
} from "@/lib/worldCup/matchPhase";
import {
  WORLD_CUP_VIDEO_CATEGORY_OPTIONS,
  WORLD_CUP_VIDEO_CATEGORY_LABELS,
  isMatchHubNewsDeskEligible,
  type WorldCupVideo,
  type WorldCupVideoCategory,
} from "@/lib/worldCup/worldCupVideos";
import { buildYoutubeWatchUrl } from "@/lib/worldCup/youtube";

const SECRET_STORAGE_KEY = "lockt_admin_secret";

type VideoForm = {
  title: string;
  youtubeUrl: string;
  sourceLabel: string;
  category: WorldCupVideoCategory;
  relatedMatchId: string;
  relatedTeam: string;
  matchPhase: WorldCupVideoMatchPhase;
  priority: string;
  isActive: boolean;
  showForAllTeams: boolean;
};

const emptyForm = (): VideoForm => ({
  title: "",
  youtubeUrl: "",
  sourceLabel: "",
  category: "general",
  relatedMatchId: "",
  relatedTeam: "",
  matchPhase: "any",
  priority: "0",
  isActive: true,
  showForAllTeams: false,
});

function formFromVideo(video: WorldCupVideo): VideoForm {
  const showForAllTeams = !video.relatedMatchId && !video.relatedTeam;

  return {
    title: video.title,
    youtubeUrl: buildYoutubeWatchUrl(video.youtubeId),
    sourceLabel: video.sourceLabel ?? "",
    category: video.category,
    relatedMatchId: showForAllTeams ? "" : (video.relatedMatchId ?? ""),
    relatedTeam: showForAllTeams ? "" : (video.relatedTeam ?? ""),
    matchPhase: video.matchPhase,
    priority: String(video.priority),
    isActive: video.isActive,
    showForAllTeams,
  };
}

function formatVideoTargeting(video: WorldCupVideo) {
  if (!video.relatedMatchId && !video.relatedTeam) {
    return "All teams";
  }

  const parts: string[] = [];
  if (video.relatedMatchId) {
    parts.push(`Match: ${video.relatedMatchId}`);
  }
  if (video.relatedTeam) {
    parts.push(`Team: ${video.relatedTeam}`);
  }

  return parts.join(" · ");
}

export default function WorldCupVideosAdminPage() {
  const [secret, setSecret] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [videos, setVideos] = useState<WorldCupVideo[]>([]);
  const [form, setForm] = useState<VideoForm>(emptyForm);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);
  const [matchHubSettingId, setMatchHubSettingId] = useState<string | null>(null);

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
    cancelEdit();
  };

  function cancelEdit() {
    setEditingVideoId(null);
    setForm(emptyForm());
    setFormMessage(null);
  }

  function startEdit(video: WorldCupVideo) {
    setEditingVideoId(video.id);
    setForm(formFromVideo(video));
    setFormMessage(null);
    setGlobalError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormMessage(null);

    const payload = {
      title: form.title,
      youtubeUrl: form.youtubeUrl,
      sourceLabel: form.sourceLabel || null,
      category: form.category,
      relatedMatchId: form.showForAllTeams ? null : form.relatedMatchId || null,
      relatedTeam: form.showForAllTeams ? null : form.relatedTeam || null,
      matchPhase: form.matchPhase,
      priority: Number(form.priority) || 0,
      isActive: form.isActive,
    };

    try {
      const res = await fetch("/api/admin/world-cup-videos", {
        method: editingVideoId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify(
          editingVideoId
            ? {
                id: editingVideoId,
                ...payload,
              }
            : payload,
        ),
      });

      const data = (await res.json().catch(() => null)) as { video?: WorldCupVideo; error?: string } | null;

      if (!res.ok || !data?.video) {
        setFormMessage(data?.error ?? "Unable to save video.");
        return;
      }

      if (editingVideoId) {
        setVideos((current) => current.map((row) => (row.id === data.video!.id ? data.video! : row)));
        cancelEdit();
        setFormMessage("Video updated.");
      } else {
        setVideos((current) => [data.video!, ...current.filter((item) => item.id !== data.video!.id)]);
        setForm(emptyForm());
        setFormMessage("Video added.");
      }
    } catch {
      setFormMessage("Network error while saving video.");
    } finally {
      setSaving(false);
    }
  }

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

      if (editingVideoId === video.id) {
        setForm((current) => ({ ...current, isActive: data.video!.isActive }));
      }
    } catch {
      setGlobalError("Network error while updating video.");
    }
  };

  const setForMatchHub = async (video: WorldCupVideo) => {
    setMatchHubSettingId(video.id);
    setCatalogMessage(null);
    setGlobalError(null);

    try {
      const res = await fetch("/api/admin/world-cup-videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ id: video.id, setForMatchHub: true }),
      });

      const data = (await res.json().catch(() => null)) as { video?: WorldCupVideo; error?: string } | null;
      if (!res.ok || !data?.video) {
        setGlobalError(data?.error ?? "Unable to update video.");
        return;
      }

      await loadVideos(secret);
      setCatalogMessage("Video set for Match Hub.");

      if (editingVideoId === video.id) {
        setForm(formFromVideo(data.video));
      }
    } catch {
      setGlobalError("Network error while updating video.");
    } finally {
      setMatchHubSettingId(null);
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">
          {editingVideoId ? "Edit Video" : "Add Video"}
        </p>
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
            {WORLD_CUP_VIDEO_CATEGORY_OPTIONS.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
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
        <label className="block text-xs font-semibold text-gray-400">Show during</label>
        <select
          value={form.matchPhase}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              matchPhase: event.target.value as WorldCupVideoMatchPhase,
            }))
          }
          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm"
        >
          {WORLD_CUP_VIDEO_PHASE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/35 p-3">
          <input
            type="checkbox"
            checked={form.showForAllTeams}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                showForAllTeams: event.target.checked,
                relatedMatchId: event.target.checked ? "" : current.relatedMatchId,
                relatedTeam: event.target.checked ? "" : current.relatedTeam,
              }))
            }
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-300">Show for all teams</span>
            <span className="mt-1 block text-xs font-semibold text-gray-500">
              Use this video across every World Cup Game Room.
            </span>
          </span>
        </label>
        <input
          value={form.relatedMatchId}
          onChange={(event) => setForm((current) => ({ ...current, relatedMatchId: event.target.value }))}
          placeholder="Related match id (wc-2026-3)"
          disabled={form.showForAllTeams}
          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        />
        <input
          value={form.relatedTeam}
          onChange={(event) => setForm((current) => ({ ...current, relatedTeam: event.target.value }))}
          placeholder="Related team (Canada)"
          disabled={form.showForAllTeams}
          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        />
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
          />
          Active
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl border border-lime-300/40 bg-lime-400/10 px-4 py-2 text-xs font-black uppercase text-lime-200 disabled:opacity-60"
          >
            {saving ? "Saving..." : editingVideoId ? "Save Changes" : "Add Video"}
          </button>
          {editingVideoId ? (
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="rounded-xl border border-white/15 bg-black/45 px-4 py-2 text-xs font-black uppercase text-gray-300 disabled:opacity-60"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
        {formMessage ? <p className="text-sm text-gray-300">{formMessage}</p> : null}
      </form>

      <section className="mt-8 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-purple-300">Catalog</p>
        {catalogMessage ? <p className="text-sm text-lime-300">{catalogMessage}</p> : null}
        {loading ? <p className="text-sm text-gray-400">Loading videos…</p> : null}
        {globalError ? <p className="text-sm text-red-300">{globalError}</p> : null}
        {!loading && !videos.length ? <p className="text-sm text-gray-400">No videos yet.</p> : null}
        {videos.map((video) => (
          <article
            key={video.id}
            className={`rounded-xl border bg-black/45 p-3 ${
              editingVideoId === video.id ? "border-lime-300/40" : "border-white/10"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-white">{video.title}</p>
                  {isMatchHubNewsDeskEligible(video) ? (
                    <span className="rounded-md border border-lime-300/35 bg-lime-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-lime-200">
                      Match Hub
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {WORLD_CUP_VIDEO_CATEGORY_LABELS[video.category] ?? video.category}
                  {video.sourceLabel ? ` · ${video.sourceLabel}` : ""} · priority {video.priority}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {WORLD_CUP_VIDEO_PHASE_OPTIONS.find((option) => option.value === video.matchPhase)?.label ??
                    video.matchPhase}
                  {" · "}
                  {formatVideoTargeting(video)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void setForMatchHub(video)}
                  disabled={matchHubSettingId === video.id}
                  className="rounded-lg border border-purple-300/40 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase text-purple-200 transition hover:border-purple-300/70 hover:text-purple-100 disabled:opacity-60"
                >
                  {matchHubSettingId === video.id ? "Saving..." : "Match Hub"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(video)}
                  className="rounded-lg border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-black uppercase text-gray-300 transition hover:border-purple-300/40 hover:text-purple-200"
                >
                  Edit
                </button>
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
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
