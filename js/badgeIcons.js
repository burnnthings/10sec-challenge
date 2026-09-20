// 뱃지 하나당 모양(shape) 하나만 쓸 수 있다. 새 뱃지를 추가할 때 기존 모양을 재사용하면
// 아래 assertUniqueShapes()가 모듈 로드 시점에 바로 에러를 던져서 알려준다 — "중복 이미지 금지"를
// 코드 수준에서 강제하기 위함이다.
// epic(금)이 --accent(#ffcb47)와, common(동)이 epic과 겹쳐 보이지 않도록 채도/명도를 벌려뒀다.
// rare(은)도 --muted(#9fc4dd)와 헷갈리지 않게 더 무채색 쪽으로 뺐다.
const RING_COLORS = {
  common: { from: "#a86f3f", to: "#6b4423" }, // 구릿빛 동
  rare: { from: "#dfe6ee", to: "#7a8699" }, // 무채색에 가까운 은
  epic: { from: "#f0b93d", to: "#c98a12" }, // accent보다 진하고 채도 높은 금
  legendary: { from: "#ff8ad1", to: "#7b6bff" }, // 무지개 계열
};

// code -> { shape, rarity } — 첫 클리어는 실제 게임 행위(물고기 잡기)를 그대로 보여주고,
// 그 다음부터는 누적 성취를 상징하는 모양(체크포인트, 속도, 트로피, 왕관)으로 넘어간다.
const BADGE_ICONS = {
  first_clear: { shape: "fish", rarity: "common" },
  clear_10: { shape: "flag", rarity: "common" },
  clear_50: { shape: "stopwatch", rarity: "rare" },
  clear_200: { shape: "trophy", rarity: "epic" },
  clear_1000: { shape: "crown", rarity: "legendary" },
};

function assertUniqueShapes(registry) {
  const seen = new Set();
  for (const [code, def] of Object.entries(registry)) {
    if (seen.has(def.shape)) {
      throw new Error(`badgeIcons: shape "${def.shape}" is already used by another badge (dup at "${code}")`);
    }
    seen.add(def.shape);
  }
}
assertUniqueShapes(BADGE_ICONS);

function shapeMarkup(shape) {
  switch (shape) {
    case "flag":
      return `<line x1="24" y1="12" x2="24" y2="48" stroke="white" stroke-width="5" stroke-linecap="round"/>
              <polygon points="24,13 48,20 24,30" fill="white"/>`;
    case "fish":
      return `<ellipse cx="28" cy="32" rx="15" ry="10" fill="white"/>
              <polygon points="42,32 54,22 54,42" fill="white"/>`;
    case "stopwatch":
      return `<rect x="27" y="8" width="10" height="5" rx="1.5" fill="white"/>
              <circle cx="32" cy="34" r="16" fill="none" stroke="white" stroke-width="4"/>
              <line x1="32" y1="34" x2="32" y2="23" stroke="white" stroke-width="3" stroke-linecap="round"/>
              <line x1="32" y1="34" x2="40" y2="34" stroke="white" stroke-width="3" stroke-linecap="round"/>`;
    case "trophy":
      return `<path d="M22 14h20v12a10 10 0 0 1-20 0z" fill="white"/>
              <path d="M22 16h-6a8 8 0 0 0 8 10" fill="none" stroke="white" stroke-width="3"/>
              <path d="M42 16h6a8 8 0 0 1-8 10" fill="none" stroke="white" stroke-width="3"/>
              <rect x="29" y="36" width="6" height="8" fill="white"/>
              <rect x="22" y="44" width="20" height="5" rx="1.5" fill="white"/>`;
    case "crown":
      return `<polygon points="16,40 20,20 30,30 32,16 34,30 44,20 48,40" fill="white"/>
              <rect x="16" y="40" width="32" height="7" rx="1.5" fill="white"/>
              <circle cx="20" cy="20" r="2.2" fill="white"/>
              <circle cx="32" cy="16" r="2.2" fill="white"/>
              <circle cx="44" cy="20" r="2.2" fill="white"/>`;
    default:
      return `<circle cx="32" cy="32" r="14" fill="none" stroke="white" stroke-width="4"/>`;
  }
}

// locked=true면 잠긴 형태(회색, 자물쇠 오버레이)로 그린다.
export function renderBadgeSVG(code, { locked = false, size = 64 } = {}) {
  const def = BADGE_ICONS[code] ?? { shape: "unknown", rarity: "common" };
  const ring = RING_COLORS[def.rarity];
  const gradientId = `badge-grad-${code}`;

  const ringFill = locked
    ? `#4a5568`
    : `url(#${gradientId})`;

  return `
    <svg viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${ring.from}"/>
          <stop offset="100%" stop-color="${ring.to}"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="${ringFill}" opacity="${locked ? 0.55 : 1}"/>
      <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
      <g opacity="${locked ? 0.35 : 1}">${shapeMarkup(def.shape)}</g>
      ${locked ? lockOverlay() : ""}
    </svg>
  `;
}

function lockOverlay() {
  return `<g transform="translate(32,32)">
    <rect x="-7" y="-2" width="14" height="12" rx="2" fill="#1a1f2b" stroke="white" stroke-width="1.5"/>
    <path d="M-4,-2 v-4 a4,4 0 0 1 8,0 v4" fill="none" stroke="white" stroke-width="1.5"/>
  </g>`;
}

export function getBadgeRarity(code) {
  return (BADGE_ICONS[code] ?? { rarity: "common" }).rarity;
}
