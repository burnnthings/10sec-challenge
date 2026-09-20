// 수집형과 반대로, 화면에서 위험 구역(hazard)을 피해 안전한 빈 곳을 탭할수록 점수가 오른다.
// collect.js와 달리 타겟 하나하나가 아니라 게임 영역 전체에 pointerdown 리스너를 하나만 달고,
// 탭 좌표가 위험 구역 원 안에 들어가는지 계산해서 판정한다.
import { playHitSound, vibrate } from "../feedback.js";

const BASE_HAZARD_PX = 70;
const BASE_SPAWN_INTERVAL_MS = 900;
const MAX_TAPS_PER_SEC = 4; // 서버 검증(3단계)에서 쓸, 사람이 낼 수 있는 최대 탭 속도 상한

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function createDodgeTemplate() {
  let container = null;
  let config = null;
  let score = 0;
  let hazards = [];
  let spawnTimerMs = 0;
  let nextHazardId = 0;

  function spawnInterval() {
    return BASE_SPAWN_INTERVAL_MS / config.difficulty.spawnRate;
  }

  function spawnHazard() {
    const rect = container.getBoundingClientRect();
    const size = BASE_HAZARD_PX * config.difficulty.targetSize;
    const x = randomRange(0, Math.max(0, rect.width - size));
    const y = randomRange(0, Math.max(0, rect.height - size));

    const el = document.createElement("div");
    el.className = "hazard";
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.textContent = "⚠️";

    const hazard = {
      id: nextHazardId++,
      el,
      x,
      y,
      size,
      vx: randomRange(-1, 1) * 50 * config.difficulty.speed,
      vy: randomRange(-1, 1) * 50 * config.difficulty.speed,
    };

    container.appendChild(el);
    hazards.push(hazard);
  }

  function isInsideHazard(px, py) {
    return hazards.some((hazard) => {
      const cx = hazard.x + hazard.size / 2;
      const cy = hazard.y + hazard.size / 2;
      const dx = px - cx;
      const dy = py - cy;
      return Math.sqrt(dx * dx + dy * dy) <= hazard.size / 2;
    });
  }

  function handlePointerDown(event) {
    const rect = container.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;

    if (isInsideHazard(px, py)) return; // 위험 구역을 탭하면 점수 없음

    score += 1;
    playHitSound();
    vibrate();
  }

  return {
    id: "dodge",

    init(hostContainer, hostConfig) {
      container = hostContainer;
      config = hostConfig;
      container.classList.add(`theme-${config.theme.background}`);
      container.addEventListener("pointerdown", handlePointerDown);
    },

    start() {
      score = 0;
      hazards = [];
      spawnTimerMs = 0;
      container.querySelectorAll(".hazard").forEach((el) => el.remove());
      const initialCount = Math.min(config.params.maxOnScreen, 2);
      for (let i = 0; i < initialCount; i += 1) spawnHazard();
    },

    update(dtMs) {
      const rect = container.getBoundingClientRect();

      for (const hazard of hazards) {
        hazard.x += (hazard.vx * dtMs) / 1000;
        hazard.y += (hazard.vy * dtMs) / 1000;

        if (hazard.x < 0 || hazard.x + hazard.size > rect.width) {
          hazard.vx *= -1;
          hazard.x = Math.min(Math.max(hazard.x, 0), Math.max(0, rect.width - hazard.size));
        }
        if (hazard.y < 0 || hazard.y + hazard.size > rect.height) {
          hazard.vy *= -1;
          hazard.y = Math.min(Math.max(hazard.y, 0), Math.max(0, rect.height - hazard.size));
        }

        hazard.el.style.transform = `translate(${hazard.x}px, ${hazard.y}px)`;
      }

      spawnTimerMs += dtMs;
      if (spawnTimerMs >= spawnInterval() && hazards.length < config.params.maxOnScreen) {
        spawnTimerMs = 0;
        spawnHazard();
      }
    },

    getScore() {
      return score;
    },

    destroy() {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.querySelectorAll(".hazard").forEach((el) => el.remove());
      container.classList.remove(`theme-${config.theme.background}`);
      hazards = [];
    },

    // 스폰 속도가 아니라 사람이 낼 수 있는 탭 속도가 상한을 결정한다는 점이 collect와 다르다.
    maxPossibleScore(cfg) {
      return Math.floor(cfg.durationSec * MAX_TAPS_PER_SEC);
    },
  };
}

export default createDodgeTemplate;
