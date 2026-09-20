// 빌드 도구 없이 쓰기 위해 CDN(esm.sh)에서 바로 supabase-js를 불러온다.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://rpvjsjcclryxfxsghvln.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdmpzamNjbHJ5eGZ4c2dodmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTc1MzgsImV4cCI6MjEwNTQ5MzUzOH0.ApktNBggnZXn0KzR3msDibiG4iseibfQfHp7_NqYU3o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PLAYER_ID_KEY = "10sec_player_id";

// 정식 로그인 없이도 점수를 기록할 수 있도록, 브라우저마다 하나의 익명 플레이어 id를 만들어 재사용한다.
export async function getOrCreatePlayerId() {
  const existing = localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;

  const { data, error } = await supabase.from("players").insert({}).select("id").single();
  if (error) throw error;

  localStorage.setItem(PLAYER_ID_KEY, data.id);
  return data.id;
}

export async function getMyBest(challengeDbId) {
  if (!challengeDbId) return null;
  const playerId = await getOrCreatePlayerId();
  const { data, error } = await supabase
    .from("challenge_bests")
    .select("best_score")
    .eq("challenge_id", challengeDbId)
    .eq("player_id", playerId)
    .maybeSingle();
  if (error) throw error;
  return data ? data.best_score : null;
}

export async function submitScore({ shortCode, score, durationMs }) {
  const playerId = await getOrCreatePlayerId();
  const { data, error } = await supabase.functions.invoke("submit-score", {
    body: { shortCode, playerId, score, durationMs },
  });
  if (error) throw error;
  return data; // { ok, score, cleared, bestScore, flagged, xpGained, coinsGained, leveledUp, newLevel, newBadges }
}

export async function updateNickname(nickname) {
  const playerId = await getOrCreatePlayerId();
  const { data, error } = await supabase.functions.invoke("update-profile", {
    body: { playerId, nickname },
  });
  if (error) throw error;
  return data; // { ok, player: { id, nickname, avatar_base } }
}

// 공개 프로필. 본인 것이든 남의 것이든 같은 함수로 조회한다 — 읽기는 전부 공개니까.
export async function getPublicProfile(playerId) {
  const { data: player, error } = await supabase
    .from("players")
    .select("id, nickname, level, xp, coins, avatar_base, country, created_at")
    .eq("id", playerId)
    .single();
  if (error) throw error;

  const { count: clearCount } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .eq("player_id", playerId)
    .eq("cleared", true);

  const { count: higherXpCount } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .gt("xp", player.xp);

  const { data: badgeRows } = await supabase
    .from("player_badges")
    .select("badge_id, earned_at, badges(code, name, icon, rarity)")
    .eq("player_id", playerId)
    .order("earned_at", { ascending: false });

  return {
    ...player,
    clearCount: clearCount ?? 0,
    worldRank: (higherXpCount ?? 0) + 1,
    badges: (badgeRows ?? []).map((row) => ({
      code: row.badges.code,
      name: row.badges.name,
      icon: row.badges.icon,
      rarity: row.badges.rarity,
      earnedAt: row.earned_at,
    })),
  };
}

// 뱃지 도감: 전체 카탈로그 + (playerId가 있으면) 내가 딴 것 표시.
export async function getBadgeCatalog(playerId) {
  const { data: allBadges, error } = await supabase
    .from("badges")
    .select("id, code, name, description, icon, rarity, unlock_rule")
    .order("created_at", { ascending: true });
  if (error) throw error;

  let earnedMap = {};
  if (playerId) {
    const { data: earned } = await supabase
      .from("player_badges")
      .select("badge_id, earned_at")
      .eq("player_id", playerId);
    earnedMap = Object.fromEntries((earned ?? []).map((row) => [row.badge_id, row.earned_at]));
  }

  return (allBadges ?? []).map((badge) => ({ ...badge, earnedAt: earnedMap[badge.id] ?? null }));
}
