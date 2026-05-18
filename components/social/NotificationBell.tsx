"use client";

import { useEffect, useState } from "react";
import { getMyNotifications, getMyUnreadNotificationCount, markNotificationRead, type LocktNotification } from "@/lib/supabase/notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<LocktNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadCount() {
      const { count } = await getMyUnreadNotificationCount();
      if (!mounted) return;
      setUnreadCount(count);
    }
    loadCount();
    return () => {
      mounted = false;
    };
  }, []);

  async function openPanel() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen) return;
    setLoading(true);
    const [{ notifications: rows }, { count }] = await Promise.all([getMyNotifications(20), getMyUnreadNotificationCount()]);
    setNotifications(rows);
    setUnreadCount(count);
    setLoading(false);
  }

  async function markRead(id: string) {
    setNotifications((current) =>
      current.map((note) => (note.id === id ? { ...note, read_at: note.read_at ?? new Date().toISOString() } : note)),
    );
    setUnreadCount((current) => Math.max(current - 1, 0));
    await markNotificationRead(id);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/[0.04] text-xl text-white shadow-[0_0_22px_rgba(255,255,255,0.06)] transition active:scale-95"
        aria-label="Notifications"
        onClick={openPanel}
      >
        🔔
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-purple-500 text-[10px] font-black text-white">
            {Math.min(unreadCount, 99)}
          </span>
        ) : null}
      </button>
      {open ? (
        <section className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-white/10 bg-[#090b12] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.55)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-lime-300">Notifications</p>
            <span className="text-[10px] font-black uppercase text-gray-400">{unreadCount} unread</span>
          </div>
          {loading ? <p className="text-xs font-semibold text-gray-400">Loading notifications...</p> : null}
          {!loading && notifications.length === 0 ? (
            <p className="text-xs font-semibold text-gray-400">No notifications yet.</p>
          ) : null}
          {!loading ? (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {notifications.map((note) => (
                <article key={note.id} className={`rounded-xl border p-2 ${note.read_at ? "border-white/10 bg-black/35" : "border-lime-300/30 bg-lime-400/8"}`}>
                  <p className="text-xs font-black text-white">{note.title}</p>
                  {note.body ? <p className="mt-1 text-xs font-semibold text-gray-300">{note.body}</p> : null}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-gray-500">{formatAge(note.created_at)}</p>
                    {!note.read_at ? (
                      <button
                        type="button"
                        onClick={() => markRead(note.id)}
                        className="text-[10px] font-black uppercase text-purple-300"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function formatAge(value: string) {
  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
