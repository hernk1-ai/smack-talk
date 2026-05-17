import { ACTIVE_GAME_ID, getGameById } from "@/lib/supabase/games";
import { getMyReactionsForTakes } from "@/lib/supabase/reactions";
import { createClient } from "@/lib/supabase/client";
import { getMyModerationFilters } from "@/lib/supabase/moderation";
import {
  getSeededProfileById,
  getSeededTakeById,
  getSeededTakesByGame,
  isSeededId,
  type SeededTake,
} from "@/data/seededCrowd";
import { SHOW_SEEDED_TAKES } from "@/lib/productConfig";
import type { Game, Profile, ProfileCard, Take, TakeReaction } from "@/lib/supabase/types";

export type ArenaTake = Take & {
  author: ProfileCard | null;
  isSeeded?: boolean;
};

export type ArenaReactionMap = Record<string, TakeReaction["reaction"]>;

export function profileToCard(profile?: Profile | null): ProfileCard | null {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    username: profile.username,
    avatar_url: profile.avatar_url,
    reputation_score: profile.reputation_score,
    created_takes_count: profile.created_takes_count,
  };
}

export function attachAuthorToTake(take: Take, profile?: Profile | null): ArenaTake {
  return {
    ...take,
    author: profileToCard(profile),
  };
}

export function seededTakeToArenaTake(take: SeededTake): ArenaTake {
  const author = getSeededProfileById(take.userId);

  return {
    id: take.id,
    user_id: take.userId,
    game_id: take.gameId,
    take_text: take.takeText,
    status: take.status,
    result: take.result,
    ride_count: take.ride_count,
    fade_count: take.fade_count,
    reply_count: take.reply_count,
    heat: take.heat,
    is_hidden: false,
    moderation_status: "clear",
    created_at: take.created_at,
    updated_at: take.created_at,
    settled_at: null,
    author: author
      ? {
          id: author.id,
          username: author.username,
          avatar_url: null,
          reputation_score: author.reputation_score,
          created_takes_count: author.created_takes_count,
        }
      : null,
    isSeeded: true,
  };
}

export function getSeededArenaTakeById(takeId: string) {
  const take = getSeededTakeById(takeId);
  return take ? seededTakeToArenaTake(take) : null;
}

export function mergeArenaFeedWithSeeded(realTakes: ArenaTake[], gameId = ACTIVE_GAME_ID, minimumCount = 6) {
  if (!SHOW_SEEDED_TAKES) {
    return realTakes;
  }

  if (realTakes.length >= minimumCount) {
    return realTakes;
  }

  const realIds = new Set(realTakes.map((take) => take.id));
  const seededFill = getSeededTakesByGame(gameId)
    .map(seededTakeToArenaTake)
    .filter((take) => !realIds.has(take.id))
    .slice(0, minimumCount - realTakes.length);

  return [...realTakes, ...seededFill];
}

export function isSeededTakeId(takeId: string) {
  return SHOW_SEEDED_TAKES && isSeededId(takeId);
}

export function getFeaturedTakeFromList(takes: ArenaTake[]) {
  return [...takes].sort((left, right) => {
    if (right.heat !== left.heat) {
      return right.heat - left.heat;
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  })[0] ?? null;
}

export function getTrendingTakesFromList(takes: ArenaTake[], limit = 4) {
  return [...takes]
    .sort((left, right) => {
      if (right.heat !== left.heat) {
        return right.heat - left.heat;
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    })
    .slice(0, limit);
}

export function formatTakeForUI(take: ArenaTake) {
  const username = take.author?.username || "LockedTalker";
  const handle = username.startsWith("@") ? username : `@${username}`;

  return {
    handle,
    initials: getInitialsForName(username),
    avatarUrl: take.author?.avatar_url ?? null,
  };
}

export async function getArenaFeed(gameId = ACTIVE_GAME_ID) {
  const supabase = createClient();

  if (!supabase) {
    return { takes: [] as ArenaTake[], error: new Error("Supabase is not configured.") };
  }

  const { mutedUserIds, blockedUserIds } = await getMyModerationFilters();
  const excludedUserIds = new Set([...mutedUserIds, ...blockedUserIds]);

  const { data: takes, error } = await supabase
    .from("takes")
    .select("*")
    .eq("game_id", gameId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error || !takes?.length) {
    return { takes: [] as ArenaTake[], error };
  }

  const visibleTakes = takes.filter((take) => !excludedUserIds.has(take.user_id));

  if (!visibleTakes.length) {
    return { takes: [] as ArenaTake[], error: null };
  }

  const userIds = [...new Set(visibleTakes.map((take) => take.user_id))];
  const { data: profileCards } = await supabase.from("profile_cards").select("*").in("id", userIds);
  const profileMap = new Map((profileCards ?? []).map((profileCard) => [profileCard.id, profileCard]));

  return {
    takes: visibleTakes.map((take) => ({
      ...take,
      author: profileMap.get(take.user_id) ?? null,
    })),
    error: null,
  };
}

export async function getTakeById(takeId: string) {
  if (SHOW_SEEDED_TAKES && isSeededTakeId(takeId)) {
    return { take: getSeededArenaTakeById(takeId), error: null };
  }

  const supabase = createClient();

  if (!supabase) {
    return { take: null as ArenaTake | null, error: new Error("Supabase is not configured.") };
  }

  const { mutedUserIds, blockedUserIds } = await getMyModerationFilters();
  const excludedUserIds = new Set([...mutedUserIds, ...blockedUserIds]);

  const { data: take, error } = await supabase.from("takes").select("*").eq("id", takeId).eq("is_hidden", false).maybeSingle();

  if (error || !take) {
    return { take: null, error };
  }

  if (excludedUserIds.has(take.user_id)) {
    return { take: null, error: new Error("This take is muted or blocked.") };
  }

  const { data: profileCard } = await supabase
    .from("profile_cards")
    .select("*")
    .eq("id", take.user_id)
    .maybeSingle();

  return {
    take: {
      ...take,
      author: profileCard ?? null,
    },
    error: null,
  };
}

export async function getFeaturedTake(gameId = ACTIVE_GAME_ID) {
  const { takes, error } = await getArenaFeed(gameId);

  return { take: getFeaturedTakeFromList(takes), error };
}

export async function getTrendingTakes(gameId = ACTIVE_GAME_ID) {
  const { takes, error } = await getArenaFeed(gameId);

  return { takes: getTrendingTakesFromList(takes), error };
}

export async function getCurrentUserReactionMap(takeIds: string[]) {
  const { reactions, error } = await getMyReactionsForTakes(takeIds);

  return {
    reactionMap: Object.fromEntries(reactions.map((reaction) => [reaction.take_id, reaction.reaction])) as ArenaReactionMap,
    error,
  };
}

export async function refreshArenaData(gameId = ACTIVE_GAME_ID) {
  const [{ game }, { takes }] = await Promise.all([getGameById(gameId), getArenaFeed(gameId)]);
  const { reactionMap } = await getCurrentUserReactionMap(takes.map((take) => take.id));

  return {
    game: game as Game | null,
    feed: takes,
    featuredTake: getFeaturedTakeFromList(takes),
    trendingTakes: getTrendingTakesFromList(takes),
    reactionMap,
  };
}

function getInitialsForName(username: string) {
  const cleanUsername = username.replace(/^@/, "").trim();
  const capitalLetters = cleanUsername.match(/[A-Z]/g);

  if (capitalLetters && capitalLetters.length > 1) {
    return capitalLetters.slice(0, 2).join("");
  }

  return cleanUsername.slice(0, 2).toUpperCase() || "ST";
}
