// 해시 기반 라우터. 정적 호스팅(파이썬 서버, GitHub Pages 등)에서 별도 서버 설정 없이 동작한다.
// 실제 배포(Vercel/Cloudflare Pages) 단계에서 경로 기반(/c/abc123)으로 바꾸려면 rewrite 설정을 추가하고
// 이 파일만 교체하면 된다.
const PLAY_PATTERN = /^#\/c\/([a-z0-9]+)$/i;
const CREATE_PATTERN = /^#\/create$/;
const BADGES_PATTERN = /^#\/badges$/;
const PROFILE_PATTERN = /^#\/p\/([0-9a-f-]+)$/i;

export function parseRoute() {
  const hash = window.location.hash || "";
  if (CREATE_PATTERN.test(hash)) return { name: "create" };
  if (BADGES_PATTERN.test(hash)) return { name: "badges" };

  const playMatch = hash.match(PLAY_PATTERN);
  if (playMatch) return { name: "play", code: playMatch[1] };

  const profileMatch = hash.match(PROFILE_PATTERN);
  if (profileMatch) return { name: "profile", playerId: profileMatch[1] };

  return { name: "home" };
}

export function navigate(path) {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
}

export function onRouteChange(callback) {
  window.addEventListener("hashchange", callback);
}
