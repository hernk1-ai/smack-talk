"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  editRoomChatMessage,
  fetchRoomChatMessages,
  getChatDisplayName,
  sendRoomChatMessage,
  type MatchRoomMessage,
} from "@/lib/gameRoom/chatApi";
import { canEditChatMessageLocally, validateRoomChatMessage } from "@/lib/gameRoom/chatValidation";
import { getOrCreateVoterKey } from "@/lib/gameRoom/voterKey";
import { COMMENT_TEXT_MAX } from "@/lib/security/constants";

/** Stable placeholder for SSR and the first client paint — avoids hydration mismatch. */
const CHAT_DISPLAY_NAME_PLACEHOLDER = "Guest";

type GameRoomChatProps = {
  gameId: string;
  /** Pass a roomCode for private rooms. Omit (or null) for the public match chat. */
  roomCode?: string | null;
};

export function GameRoomChat({ gameId, roomCode = null }: GameRoomChatProps) {
  const isPrivate = Boolean(roomCode);
  const [messages, setMessages] = useState<MatchRoomMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatDisplayName, setChatDisplayName] = useState(CHAT_DISPLAY_NAME_PLACEHOLDER);
  const [senderKey, setSenderKey] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setChatDisplayName(getChatDisplayName());
    setSenderKey(getOrCreateVoterKey());
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const loadMessages = useCallback(async () => {
    const { messages: nextMessages, error: loadError } = await fetchRoomChatMessages(gameId, roomCode);
    setMessages(nextMessages);
    setLoading(false);

    if (loadError) {
      setError(loadError);
    }
  }, [gameId, roomCode]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadMessages();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [loadMessages]);

  const editableMessageIds = useMemo(() => {
    if (!senderKey) {
      return new Set<string>();
    }

    return new Set(
      messages
        .filter((message) => canEditChatMessageLocally(message, senderKey, nowMs))
        .map((message) => message.id),
    );
  }, [messages, senderKey, nowMs]);

  async function handleSend() {
    const validation = validateRoomChatMessage(draft);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSending(true);
    setError(null);

    const { message, error: sendError } = await sendRoomChatMessage(gameId, roomCode, validation.value);
    setSending(false);

    if (sendError || !message) {
      setError(sendError ?? "Unable to send message.");
      return;
    }

    setDraft("");
    setMessages((current) => [message, ...current.filter((item) => item.id !== message.id)]);
  }

  function startEditing(message: MatchRoomMessage) {
    setEditingMessageId(message.id);
    setEditDraft(message.messageText);
    setEditError(null);
  }

  function cancelEditing() {
    setEditingMessageId(null);
    setEditDraft("");
    setEditError(null);
  }

  async function handleSaveEdit(messageId: string) {
    const validation = validateRoomChatMessage(editDraft);
    if (!validation.valid) {
      setEditError(validation.error);
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    const { message, error: saveError } = await editRoomChatMessage(messageId, validation.value);
    setSavingEdit(false);

    if (saveError || !message) {
      setEditError(saveError ?? "Unable to edit message.");
      return;
    }

    setMessages((current) => current.map((item) => (item.id === message.id ? message : item)));
    cancelEditing();
  }

  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">
          {isPrivate ? "Private Room Chat" : "Match Chat"}
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-300">
          {isPrivate
            ? "Chat with everyone in this private room."
            : "React live with everyone watching the match."}
        </p>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Say something about the match…"
          maxLength={COMMENT_TEXT_MAX}
          className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-sm font-semibold text-white outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-gray-400">
            {draft.length}/{COMMENT_TEXT_MAX}
          </p>
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-lime-300/50 bg-lime-400/10 px-3 text-[11px] font-black uppercase tracking-[0.12em] text-lime-200 transition hover:bg-lime-400/20 disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
        </div>
        <p className="mt-2 text-xs font-semibold text-gray-400">Chatting as {chatDisplayName}.</p>
        {error ? (
          <p className="mt-2 text-xs font-semibold text-red-300">
            {error}{" "}
            <button type="button" onClick={() => void loadMessages()} className="underline">
              Retry
            </button>
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/80 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">
            {isPrivate ? "Room Chat" : "Match Chat"} <span className="text-gray-400">{messages.length}</span>
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Newest First</p>
        </div>
        <div className="max-h-[32rem] space-y-3 overflow-y-auto p-3">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm font-semibold text-gray-300">Loading room chat…</p>
            </div>
          ) : null}
          {!loading && !messages.length ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm font-semibold text-gray-300">No messages yet. Start the conversation.</p>
            </div>
          ) : null}
          {messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              canEdit={editableMessageIds.has(message.id)}
              isEditing={editingMessageId === message.id}
              editDraft={editingMessageId === message.id ? editDraft : message.messageText}
              savingEdit={savingEdit && editingMessageId === message.id}
              editError={editingMessageId === message.id ? editError : null}
              onStartEdit={() => startEditing(message)}
              onCancelEdit={cancelEditing}
              onEditDraftChange={setEditDraft}
              onSaveEdit={() => void handleSaveEdit(message.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ChatMessageItem({
  message,
  canEdit,
  isEditing,
  editDraft,
  savingEdit,
  editError,
  onStartEdit,
  onCancelEdit,
  onEditDraftChange,
  onSaveEdit,
}: {
  message: MatchRoomMessage;
  canEdit: boolean;
  isEditing: boolean;
  editDraft: string;
  savingEdit: boolean;
  editError: string | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditDraftChange: (value: string) => void;
  onSaveEdit: () => void;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-white">
            {message.displayName?.trim() || CHAT_DISPLAY_NAME_PLACEHOLDER}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <time className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              {formatMessageTime(message.createdAt)}
            </time>
            {message.editedAt ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">edited</span>
            ) : null}
          </div>
        </div>
        {canEdit && !isEditing ? (
          <button
            type="button"
            onClick={onStartEdit}
            className="shrink-0 rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-gray-300 transition hover:border-lime-300/35 hover:text-lime-200"
          >
            Edit
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={editDraft}
            onChange={(event) => onEditDraftChange(event.target.value)}
            maxLength={COMMENT_TEXT_MAX}
            className="min-h-20 w-full rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-sm font-semibold text-white outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={savingEdit}
              className="inline-flex min-h-9 items-center rounded-lg border border-lime-300/50 bg-lime-400/10 px-3 text-[10px] font-black uppercase tracking-[0.1em] text-lime-200 disabled:opacity-60"
            >
              {savingEdit ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={savingEdit}
              className="inline-flex min-h-9 items-center rounded-lg border border-white/15 bg-black/45 px-3 text-[10px] font-black uppercase tracking-[0.1em] text-gray-300"
            >
              Cancel
            </button>
          </div>
          {editError ? <p className="text-xs font-semibold text-red-300">{editError}</p> : null}
        </div>
      ) : (
        <p className="mt-3 text-lg font-black leading-tight text-gray-100">{message.messageText}</p>
      )}
    </article>
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
