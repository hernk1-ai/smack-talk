"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const SECRET_STORAGE_KEY = "lockt_admin_secret";
const STATUS_OPTIONS = ["scheduled", "live", "final"] as const;
type GameStatus = (typeof STATUS_OPTIONS)[number];

type AdminGameRow = {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  status: string;
  updated_at: string;
};

type RowDraft = {
  homeScore: string;
  awayScore: string;
  status: GameStatus;
};

type RowState = {
  saving: boolean;
  message: string | null;
  error: boolean;
};

function toGameStatus(value: string): GameStatus {
  return (STATUS_OPTIONS as readonly string[]).includes(value) ? (value as GameStatus) : "scheduled";
}

export default function GameControlPage() {
  const [secret, setSecret] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [games, setGames] = useState<AdminGameRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const hydrateDrafts = useCallback((rows: AdminGameRow[]) => {
    const next: Record<string, RowDraft> = {};
    for (const row of rows) {
      next[row.id] = {
        homeScore: String(row.home_score),
        awayScore: String(row.away_score),
        status: toGameStatus(row.status),
      };
    }
    setDrafts(next);
  }, []);

  const loadGames = useCallback(
    async (activeSecret: string) => {
      setLoading(true);
      setGlobalError(null);
      try {
        const res = await fetch("/api/admin/game-control", {
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
          setGlobalError(data?.error ?? "Unable to load games.");
          return;
        }

        const data = (await res.json()) as { games: AdminGameRow[] };
        setGames(data.games);
        hydrateDrafts(data.games);
        setUnlocked(true);
      } catch {
        setGlobalError("Network error while loading games.");
      } finally {
        setLoading(false);
      }
    },
    [hydrateDrafts],
  );

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SECRET_STORAGE_KEY);
    if (stored) {
      setSecret(stored);
      void loadGames(stored);
    }
  }, [loadGames]);

  const handleUnlock = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const trimmed = secretInput.trim();
      if (!trimmed) {
        return;
      }
      window.sessionStorage.setItem(SECRET_STORAGE_KEY, trimmed);
      setSecret(trimmed);
      setSecretInput("");
      await loadGames(trimmed);
    },
    [secretInput, loadGames],
  );

  const handleLock = useCallback(() => {
    window.sessionStorage.removeItem(SECRET_STORAGE_KEY);
    setSecret("");
    setUnlocked(false);
    setGames([]);
    setDrafts({});
    setRowState({});
  }, []);

  const updateDraft = useCallback((id: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const submitUpdate = useCallback(
    async (id: string, payload: { homeScore?: number; awayScore?: number; status?: GameStatus }) => {
      setRowState((prev) => ({ ...prev, [id]: { saving: true, message: null, error: false } }));
      try {
        const res = await fetch("/api/admin/game-control", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-admin-secret": secret },
          body: JSON.stringify({ id, ...payload }),
        });

        if (res.status === 401) {
          handleLock();
          setGlobalError("Session expired. Enter the admin secret again.");
          return;
        }

        const data = (await res.json().catch(() => null)) as { game?: AdminGameRow; error?: string } | null;

        if (!res.ok || !data?.game) {
          setRowState((prev) => ({
            ...prev,
            [id]: { saving: false, message: data?.error ?? "Update failed.", error: true },
          }));
          return;
        }

        const updated = data.game;
        setGames((prev) => prev.map((row) => (row.id === id ? updated : row)));
        setDrafts((prev) => ({
          ...prev,
          [id]: {
            homeScore: String(updated.home_score),
            awayScore: String(updated.away_score),
            status: toGameStatus(updated.status),
          },
        }));
        setRowState((prev) => ({ ...prev, [id]: { saving: false, message: "Saved.", error: false } }));
      } catch {
        setRowState((prev) => ({
          ...prev,
          [id]: { saving: false, message: "Network error.", error: true },
        }));
      }
    },
    [secret, handleLock],
  );

  const saveRow = useCallback(
    (id: string) => {
      const draft = drafts[id];
      if (!draft) {
        return;
      }
      const homeScore = Number(draft.homeScore);
      const awayScore = Number(draft.awayScore);
      if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
        setRowState((prev) => ({
          ...prev,
          [id]: { saving: false, message: "Scores must be whole numbers.", error: true },
        }));
        return;
      }
      void submitUpdate(id, { homeScore, awayScore, status: draft.status });
    },
    [drafts, submitUpdate],
  );

  const content = useMemo(() => {
    if (!unlocked) {
      return null;
    }

    if (loading && games.length === 0) {
      return <p className="text-sm text-gray-400">Loading World Cup games…</p>;
    }

    if (games.length === 0) {
      return <p className="text-sm text-gray-400">No World Cup games found.</p>;
    }

    return (
      <div className="flex flex-col gap-4">
        {games.map((game) => {
          const draft = drafts[game.id];
          const state = rowState[game.id];
          if (!draft) {
            return null;
          }
          return (
            <div key={game.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs text-gray-400">{game.id}</p>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  updated {new Date(game.updated_at).toLocaleString()}
                </p>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-300">
                    {game.home_team} <span className="text-gray-500">(home_score)</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={draft.homeScore}
                    onChange={(e) => updateDraft(game.id, { homeScore: e.target.value })}
                    className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-300">
                    {game.away_team} <span className="text-gray-500">(away_score)</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={draft.awayScore}
                    onChange={(e) => updateDraft(game.id, { awayScore: e.target.value })}
                    className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-300">Status</span>
                <select
                  value={draft.status}
                  onChange={(e) => updateDraft(game.id, { status: toGameStatus(e.target.value) })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white sm:w-48"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={state?.saving}
                  onClick={() => saveRow(game.id)}
                  className="rounded-lg bg-lime-400 px-3 py-2 text-xs font-bold uppercase tracking-wide text-black disabled:opacity-50"
                >
                  Save Score/Status
                </button>
                <button
                  type="button"
                  disabled={state?.saving}
                  onClick={() => void submitUpdate(game.id, { status: "live" })}
                  className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-lime-200 disabled:opacity-50"
                >
                  Mark Live
                </button>
                <button
                  type="button"
                  disabled={state?.saving}
                  onClick={() => void submitUpdate(game.id, { status: "final" })}
                  className="rounded-lg border border-purple-300/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-purple-200 disabled:opacity-50"
                >
                  Mark Final
                </button>
                {state?.message ? (
                  <span className={`text-xs ${state.error ? "text-red-400" : "text-lime-300"}`}>{state.message}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [unlocked, loading, games, drafts, rowState, updateDraft, saveRow, submitUpdate]);

  return (
    <main className="min-h-dvh bg-[#02040a] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide">Game Control</h1>
            <p className="mt-1 text-xs text-gray-500">World Cup score &amp; status — internal use only.</p>
          </div>
          {unlocked ? (
            <button
              type="button"
              onClick={handleLock}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-300"
            >
              Lock
            </button>
          ) : null}
        </header>

        {globalError ? (
          <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {globalError}
          </p>
        ) : null}

        {!unlocked ? (
          <form onSubmit={handleUnlock} className="mt-6 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-300">Admin secret</span>
              <input
                type="password"
                autoComplete="off"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                placeholder="Enter ADMIN_SECRET"
              />
            </label>
            <button
              type="submit"
              disabled={loading || secretInput.trim().length === 0}
              className="self-start rounded-lg bg-lime-400 px-4 py-2 text-xs font-bold uppercase tracking-wide text-black disabled:opacity-50"
            >
              {loading ? "Checking…" : "Unlock"}
            </button>
          </form>
        ) : (
          <div className="mt-6">{content}</div>
        )}
      </div>
    </main>
  );
}
