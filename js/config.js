// 챌린지 설정값. 2단계부터는 이 형태의 JSON이 DB(challenges.config)에 저장된다.
export const DEFAULT_CONFIG = {
  version: 1,
  template: "collect",
  title: "10초 동안 물고기 20마리 먹기",
  durationSec: 10,
  goal: { type: "score_at_least", value: 20 },
  difficulty: { speed: 1.0, spawnRate: 1.0, targetSize: 1.0 },
  theme: { background: "ocean", character: "fish" },
  params: { maxOnScreen: 3 },
};

const TEMPLATES = ["collect", "dodge", "reaction"];
const BACKGROUNDS = ["ocean", "space", "forest", "night"];
const CHARACTERS = ["fish", "star", "leaf", "coin"];

function inRange(value, min, max) {
  return typeof value === "number" && value >= min && value <= max;
}

// 챌린지 제작기(2단계)에서 사용자가 만든 설정값을 저장하기 전에 반드시 통과해야 한다.
// 제목을 뺀 모든 필드는 정해진 목록/범위 안의 값만 허용한다 (자유 입력 콘텐츠를 만들지 않기 위함).
export function validateConfig(config) {
  const errors = [];

  if (config?.version !== 1) errors.push("version must be 1");
  if (!TEMPLATES.includes(config?.template)) errors.push(`template must be one of ${TEMPLATES.join(", ")}`);
  if (typeof config?.title !== "string" || config.title.length < 1 || config.title.length > 60) {
    errors.push("title must be 1-60 characters");
  }
  if (!inRange(config?.durationSec, 5, 30)) errors.push("durationSec must be 5-30");

  if (config?.goal?.type !== "score_at_least" || !inRange(config?.goal?.value, 1, 999)) {
    errors.push("goal must be { type: 'score_at_least', value: 1-999 }");
  }

  const d = config?.difficulty;
  if (!d || !inRange(d.speed, 0.5, 2.0) || !inRange(d.spawnRate, 0.5, 2.0) || !inRange(d.targetSize, 0.5, 2.0)) {
    errors.push("difficulty.speed/spawnRate/targetSize must each be 0.5-2.0");
  }

  if (!BACKGROUNDS.includes(config?.theme?.background)) errors.push(`theme.background must be one of ${BACKGROUNDS.join(", ")}`);
  if (!CHARACTERS.includes(config?.theme?.character)) errors.push(`theme.character must be one of ${CHARACTERS.join(", ")}`);

  if (!inRange(config?.params?.maxOnScreen, 1, 8)) errors.push("params.maxOnScreen must be 1-8");

  return { valid: errors.length === 0, errors };
}
