"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { postGuestJoin } from "@/lib/arena/arenaApi";
import { setChatDisplayName } from "@/lib/gameRoom/chatApi";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import type { Profile } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

type PendingAction = () => void | Promise<void>;

export function useGuestParticipation(loginNext?: string) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const pendingActionRef = useRef<PendingAction | null>(null);

  const refreshSession = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      setProfile(null);
      return;
    }

    const {
      data: { user: nextUser },
    } = await supabase.auth.getUser();

    if (!nextUser) {
      setUser(null);
      setProfile(null);
      return;
    }

    const { profile: nextProfile } = await getCurrentProfile(supabase);
    setUser(nextUser);
    setProfile(nextProfile);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      if (!supabase) {
        if (!mounted) {
          return;
        }
        setUser(null);
        setProfile(null);
        return;
      }

      const {
        data: { user: nextUser },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!nextUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      const { profile: nextProfile } = await getCurrentProfile(supabase);
      if (!mounted) {
        return;
      }

      setUser(nextUser);
      setProfile(nextProfile);
    }

    void loadInitialSession().catch(() => undefined);

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshSession().catch(() => undefined);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshSession, supabase]);

  const hasSession = Boolean(user);
  const isGuest = Boolean(profile?.is_guest && !profile?.profile_claimed);
  const guestLabel = profile?.display_name?.trim() || profile?.username?.trim() || null;

  const requireParticipation = useCallback(
    async (action: PendingAction) => {
      if (hasSession) {
        await action();
        return;
      }

      pendingActionRef.current = action;
      setJoinError(null);
      setModalOpen(true);
    },
    [hasSession],
  );

  const closeModal = useCallback(() => {
    if (joinLoading) {
      return;
    }

    setModalOpen(false);
    setJoinError(null);
    pendingActionRef.current = null;
  }, [joinLoading]);

  const joinAsGuest = useCallback(
    async (displayName: string) => {
      setJoinLoading(true);
      setJoinError(null);

      const { data, error } = await postGuestJoin(displayName);

      setJoinLoading(false);

      if (error) {
        setJoinError(error);
        return;
      }

      await refreshSession();

      if (!data) {
        setJoinError("Unable to join the Game Room right now.");
        return;
      }

      setChatDisplayName(displayName.trim());
      setModalOpen(false);

      const pending = pendingActionRef.current;
      pendingActionRef.current = null;

      if (pending) {
        await pending();
      }
    },
    [refreshSession],
  );

  const loginHref = loginNext ? `/login?next=${encodeURIComponent(loginNext)}` : "/login";
  const claimHref = loginNext ? `/signup?next=${encodeURIComponent(loginNext)}&claim=1` : "/signup?claim=1";

  return {
    user,
    profile,
    hasSession,
    isGuest,
    guestLabel,
    modalOpen,
    joinLoading,
    joinError,
    loginHref,
    claimHref,
    requireParticipation,
    closeModal,
    joinAsGuest,
    refreshSession,
  };
}
