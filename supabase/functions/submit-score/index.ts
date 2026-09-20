// 점수는 반드시 이 함수를 통해서만 기록된다 (서비스 롤 키로 실행되며, scores/challenge_bests/players에는
// 클라이언트용 insert/update 정책이 없다). 클라이언트가 보낸 점수를 그대로 믿지 않고,
// 챌린지 설정값으로부터 "이론상 최대 점수"를 서버에서 다시 계산해 검증한다.
// 클리어하면 같은 요청 안에서 XP/코인 지급, 레벨 재계산, 뱃지 해금까지 함께 처리한다.
//
// 주의: maxPossibleScore()는 각 js/templates/*.js의 동명 함수와 로직이 같아야 한다.
// 새 템플릿을 client에 추가하면 이 함수에도 대응하는 분기를 추가해야 한다.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_SPAWN_INTERVAL_MS = 600; // collect 템플릿
const DODGE_MAX_TAPS_PER_SEC = 4; // dodge 템플릿
const DURATION_TOLERANCE_MS = 1500;

const XP_PER_PLAY = 10;
const XP_CLEAR_BONUS = 40;
const COINS_PER_PLAY = 5;
const COINS_CLEAR_BONUS = 20;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function maxPossibleScore(config: any): number {
  if (config.template === "collect") {
    const interval = BASE_SPAWN_INTERVAL_MS / config.difficulty.spawnRate;
    const initialCount = Math.min(config.params.maxOnScreen, 2);
    const spawnsDuringPlay = Math.floor((config.durationSec * 1000) / interval);
    return initialCount + spawnsDuringPlay;
  }
  if (config.template === "dodge") {
    return Math.floor(config.durationSec * DODGE_MAX_TAPS_PER_SEC);
  }
  throw new Error(`Unsupported template for score validation: ${config.template}`);
}

// 레벨업에 필요한 누적 경험치: 레벨이 오를수록 더 많이 필요해지는 완만한 2차 곡선.
// level 1→0xp, 2→100xp, 3→300xp, 4→600xp, 5→1000xp ...
function totalXpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

function levelForXp(xp: number): number {
  let level = 1;
  while (totalXpForLevel(level + 1) <= xp) level += 1;
  return level;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { shortCode, playerId, score, durationMs } = await req.json();

    if (
      typeof shortCode !== "string" ||
      typeof playerId !== "string" ||
      !Number.isInteger(score) ||
      score < 0 ||
      !Number.isInteger(durationMs)
    ) {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }

    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("id, config, play_count")
      .eq("short_code", shortCode)
      .eq("status", "active")
      .single();

    if (challengeError || !challenge) {
      return jsonResponse({ error: "Challenge not found" }, 404);
    }

    const config = challenge.config;

    // 같은 챌린지에 봇/스크립트가 연속으로 점수를 쏟아붓는 걸 막는 최소한의 방어.
    // 사람은 결과 화면을 보고 "다시 도전"을 누르는 데 최소 몇 초는 걸린다.
    const { data: lastScore } = await supabase
      .from("scores")
      .select("created_at")
      .eq("challenge_id", challenge.id)
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastScore) {
      const sinceLastMs = Date.now() - new Date(lastScore.created_at).getTime();
      const minIntervalMs = config.durationSec * 1000; // 최소한 이전 판을 다 치를 시간은 지나야 한다
      if (sinceLastMs < minIntervalMs) {
        return jsonResponse({ error: "Submitting too fast" }, 429);
      }
    }

    const maxScore = maxPossibleScore(config);
    const expectedDurationMs = config.durationSec * 1000;
    const durationOk = Math.abs(durationMs - expectedDurationMs) <= DURATION_TOLERANCE_MS;

    // 절대적으로 불가능한 점수(여유를 20% 두어도 넘는 값)는 아예 거절한다.
    if (score > maxScore * 1.2) {
      return jsonResponse({ error: "Score exceeds what this challenge allows" }, 400);
    }

    // 이론상 최대치를 살짝 넘거나 플레이 시간이 이상한 경우는 기록하되 flagged로 표시해
    // 나중에 랭킹에서 걸러낼 수 있게 한다. flagged된 플레이는 최고기록도, 보상도 반영하지 않는다.
    const flagged = score > maxScore || !durationOk;
    const cleared = score >= config.goal.value;

    const { error: insertError } = await supabase.from("scores").insert({
      challenge_id: challenge.id,
      player_id: playerId,
      score,
      cleared,
      duration_ms: durationMs,
      flagged,
    });
    if (insertError) throw insertError;

    const { data: existingBest } = await supabase
      .from("challenge_bests")
      .select("best_score")
      .eq("challenge_id", challenge.id)
      .eq("player_id", playerId)
      .maybeSingle();

    let bestScore = existingBest?.best_score ?? 0;

    if (!flagged) {
      if (!existingBest) {
        const { error } = await supabase.from("challenge_bests").insert({
          challenge_id: challenge.id,
          player_id: playerId,
          best_score: score,
          cleared_at: cleared ? new Date().toISOString() : null,
        });
        if (error) throw error;
        bestScore = score;
      } else if (score > existingBest.best_score) {
        const { error } = await supabase
          .from("challenge_bests")
          .update({
            best_score: score,
            cleared_at: cleared ? new Date().toISOString() : undefined,
          })
          .eq("challenge_id", challenge.id)
          .eq("player_id", playerId);
        if (error) throw error;
        bestScore = score;
      }
    }

    await supabase
      .from("challenges")
      .update({ play_count: challenge.play_count + 1 })
      .eq("id", challenge.id);

    // --- 보상: flagged된 플레이는 XP/코인/뱃지를 주지 않는다 ---
    let xpGained = 0;
    let coinsGained = 0;
    let leveledUp = false;
    let newLevel: number | null = null;
    const newBadges: { code: string; name: string; icon: string }[] = [];

    if (!flagged) {
      xpGained = XP_PER_PLAY + (cleared ? XP_CLEAR_BONUS : 0);
      coinsGained = COINS_PER_PLAY + (cleared ? COINS_CLEAR_BONUS : 0);

      const { data: player } = await supabase
        .from("players")
        .select("xp, coins, level")
        .eq("id", playerId)
        .single();

      if (player) {
        const newXp = player.xp + xpGained;
        const newCoins = player.coins + coinsGained;
        newLevel = levelForXp(newXp);
        leveledUp = newLevel > player.level;

        await supabase
          .from("players")
          .update({ xp: newXp, coins: newCoins, level: newLevel })
          .eq("id", playerId);
      }

      if (cleared) {
        const { count: clearCount } = await supabase
          .from("scores")
          .select("id", { count: "exact", head: true })
          .eq("player_id", playerId)
          .eq("cleared", true);

        const { data: candidateBadges } = await supabase
          .from("badges")
          .select("id, code, name, icon, unlock_rule");

        const { data: earnedBadges } = await supabase
          .from("player_badges")
          .select("badge_id")
          .eq("player_id", playerId);
        const earnedIds = new Set((earnedBadges ?? []).map((b) => b.badge_id));

        for (const badge of candidateBadges ?? []) {
          const rule = badge.unlock_rule;
          if (rule?.type !== "clear_count") continue;
          if (earnedIds.has(badge.id)) continue;
          if ((clearCount ?? 0) < rule.value) continue;

          await supabase.from("player_badges").insert({ player_id: playerId, badge_id: badge.id });
          newBadges.push({ code: badge.code, name: badge.name, icon: badge.icon });
        }
      }
    }

    return jsonResponse({
      ok: true,
      score,
      cleared,
      bestScore,
      flagged,
      xpGained,
      coinsGained,
      leveledUp,
      newLevel,
      newBadges,
    });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
