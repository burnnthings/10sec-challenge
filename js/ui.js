import { t } from "./i18n.js";

const SCREEN_IDS = ["screen-ready", "screen-countdown", "screen-playing", "screen-result"];

export function createUI({ onStart, onRetry }) {
  const el = Object.fromEntries(
    [...SCREEN_IDS, "title", "start-btn", "best-line", "ready-hint", "countdown-number", "score-line", "timer-line",
      "game-area", "result-headline", "result-score", "result-best", "retry-btn"]
      .map((id) => [id, document.getElementById(id)])
  );

  el["ready-hint"].textContent = t("ready_hint");
  el["start-btn"].textContent = t("start");
  el["start-btn"].addEventListener("click", onStart);
  el["retry-btn"].textContent = t("retry");
  el["retry-btn"].addEventListener("click", onRetry);

  function showScreen(id) {
    for (const screenId of SCREEN_IDS) {
      el[screenId].classList.toggle("hidden", screenId !== id);
    }
  }

  return {
    gameArea: el["game-area"],

    showReady(config, bestScore) {
      el.title.textContent = config.title;
      el["best-line"].textContent = bestScore === null ? "" : `${t("best")}: ${bestScore}`;
      showScreen("screen-ready");
    },

    showCountdown(number) {
      el["countdown-number"].textContent = String(number);
      showScreen("screen-countdown");
    },

    showPlaying() {
      showScreen("screen-playing");
    },

    updateScore(score, goalValue) {
      el["score-line"].textContent = `${t("score")}: ${score} / ${goalValue}`;
    },

    updateTime(remainingSec) {
      el["timer-line"].textContent = `${t("time_left")}: ${remainingSec.toFixed(1)}s`;
    },

    showResult({ score, cleared }, bestScore) {
      el["result-headline"].textContent = cleared ? t("cleared") : t("not_cleared");
      el["result-headline"].classList.toggle("cleared", cleared);
      el["result-score"].textContent = `${t("score")}: ${score}`;
      el["result-best"].textContent = `${t("best")}: ${bestScore}`;
      showScreen("screen-result");
    },
  };
}
