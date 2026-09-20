// 닉네임/아바타 베이스처럼 "외형·표시용" 정보만 바꾸는 함수. 정식 인증이 없는 익명 식별자 구조라
// 완전한 소유권 검증은 불가능하지만, 이 값들은 바뀌어도 실질적 피해가 없는 항목이라 이 정도로 충분하다.
// xp/coins/level/뱃지처럼 "실력을 증명"하는 값은 절대 여기서 바꾸지 않는다 (submit-score 전용).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AVATAR_BASES = ["fish", "star", "leaf", "coin"];

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
    const { playerId, nickname, avatarBase } = await req.json();

    if (typeof playerId !== "string") {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }

    const patch: Record<string, unknown> = {};

    if (nickname !== undefined) {
      const trimmed = String(nickname).trim();
      if (trimmed.length < 2 || trimmed.length > 16) {
        return jsonResponse({ error: "Nickname must be 2-16 characters" }, 400);
      }
      patch.nickname = trimmed;
    }

    if (avatarBase !== undefined) {
      if (!AVATAR_BASES.includes(avatarBase)) {
        return jsonResponse({ error: `avatarBase must be one of ${AVATAR_BASES.join(", ")}` }, 400);
      }
      patch.avatar_base = avatarBase;
    }

    if (Object.keys(patch).length === 0) {
      return jsonResponse({ error: "Nothing to update" }, 400);
    }

    const { data, error } = await supabase
      .from("players")
      .update(patch)
      .eq("id", playerId)
      .select("id, nickname, avatar_base")
      .single();

    if (error) throw error;

    return jsonResponse({ ok: true, player: data });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
