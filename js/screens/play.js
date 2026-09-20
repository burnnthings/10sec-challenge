import { GameEngine, STATE } from "../engine.js";
import { createTemplate } from "../templates/index.js";
import { createUI } from "../ui.js";
import { getMyBest, submitScore } from "../api/supabaseClient.js";
import { navigate } from "../router.js";
import { t } from "../i18n.js";

// screen-ready/countdown/playing/result의 DOM은 페이지 전환에도 사라지지 않고 재사용된다.
// 그래서 이벤트 리스너(ui, 아래 home-btn/share-btn)는 앱 시작 시 딱 한 번만 붙이고,
// 챌린지를 바꿀 때는 engine만 새로 만든다 — 매번 리스너를 다시 붙이면 중복 등록된다.
export function initPlayScreen() {
  let currentEngine = null;
  let currentConfig = null;
  let currentShortCode = null;

  const ui = createUI({
    onStart: () => currentEngine?.start(),
    onRetry: () => currentEngine?.retry(),
  });

  document.getElementById("home-btn").addEventListener("click", () => navigate("/"));

  const shareBtn = document.getElementById("share-btn");
  shareBtn.textContent = t("share_btn");
  shareBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const original = t("share_btn");
      shareBtn.textContent = t("share_copied");
      setTimeout(() => {
        shareBtn.textContent = original;
      }, 1200);
    } catch {
      // 클립보드 권한이 없으면 조용히 무시한다 (주소창에서 직접 복사할 수 있다)
    }
  });

  async function renderPlay(config, shortCode, challengeDbId) {
    currentEngine?.destroy();
    currentConfig = config;
    currentShortCode = shortCode;

    currentEngine = new GameEngine({
      container: ui.gameArea,
      config,
      template: createTemplate(config.template),
      onStateChange(state) {
        if (state === STATE.PLAYING) ui.showPlaying();
      },
      onCountdownTick(number) {
        ui.showCountdown(number);
      },
      onTimeTick(remainingSec) {
        ui.updateTime(remainingSec);
        ui.updateScore(currentEngine.template.getScore(), currentConfig.goal.value);
      },
      async onResult({ score, durationMs }) {
        try {
          const result = await submitScore({ shortCode: currentShortCode, score, durationMs });
          ui.showResult({ score: result.score, cleared: result.cleared }, result.bestScore);
        } catch {
          // 서버 기록 제출이 실패해도(네트워크 등) 방금 낸 점수는 보여준다
          ui.showResult({ score, cleared: score >= currentConfig.goal.value }, score);
        }
      },
    });

    const bestScore = await getMyBest(challengeDbId).catch(() => null);
    ui.showReady(config, bestScore);
  }

  return { renderPlay };
}
