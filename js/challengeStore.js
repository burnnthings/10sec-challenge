// 챌린지 CRUD. 화면 쪽(screens/*)은 이 파일의 함수 이름만 알면 되고, 실제로 Supabase를 쓴다는 사실은 몰라도 된다.
import { validateConfig } from "./config.js";
import { supabase } from "./api/supabaseClient.js";

const DEMO_CODE = "demo";
const CODE_CHARS = "abcdefghijkmnpqrstuvwxyz23456789"; // 혼동되는 0/o, 1/l 제외
const CODE_LENGTH = 6;

function randomCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function toRecord(row) {
  return { id: row.id, shortCode: row.short_code, config: row.config, createdAt: row.created_at };
}

export async function getChallenge(shortCode) {
  const { data, error } = await supabase
    .from("challenges")
    .select("id, short_code, config, created_at")
    .eq("short_code", shortCode)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data ? toRecord(data) : null;
}

export async function createChallenge(config) {
  const { valid, errors } = validateConfig(config);
  if (!valid) return { ok: false, errors };

  const { data, error } = await supabase
    .from("challenges")
    .insert({ short_code: randomCode(), config, config_version: config.version })
    .select("id, short_code, config, created_at")
    .single();

  if (error) return { ok: false, errors: [error.message] };
  return { ok: true, record: toRecord(data) };
}

export async function ensureDemoChallenge(defaultConfig) {
  const existing = await getChallenge(DEMO_CODE);
  if (existing) return DEMO_CODE;

  const { error } = await supabase.from("challenges").insert({
    short_code: DEMO_CODE,
    config: defaultConfig,
    config_version: defaultConfig.version,
  });
  // 데모는 누가 먼저 만들든 상관없다 — 동시에 두 브라우저가 처음 방문해서 동시에 만들려 하면
  // short_code UNIQUE 제약 때문에 하나만 성공하고 나머지는 여기서 에러가 나는데, 그건 정상이라 무시한다.
  if (error && !error.message.includes("duplicate key")) throw error;

  return DEMO_CODE;
}
