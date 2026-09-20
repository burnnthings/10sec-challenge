// 모든 템플릿이 따라야 하는 공통 인터페이스의 구현체 (수집형).
// engine.js는 템플릿 종류를 모른 채 init/start/update/getScore/destroy만 호출한다.
import { playHitSound, vibrate } from "../feedback.js";

const BASE_SPAWN_INTERVAL_MS = 600; // spawnRate = 1.0 기준 한 마리 등장 간격
const BASE_TARGET_PX = 56;
const CHARACTER_EMOJI = { fish: "🐟", star: "⭐", leaf: "🍃", coin: "🪙" };

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function createCollectTemplate() {
  let container = null;
  let config = null;
  let score = 0;
  let targets = [];
  let spawnTimerMs = 0;
  let nextTargetId = 0;

  function spawnInterval() {
    return BASE_SPAWN_INTERVAL_MS / config.difficulty.spawnRate;
  }

  function spawnTarget() {
    const rect = container.getBoundingClientRect();
    const size = BASE_TARGET_PX * config.difficulty.targetSize;
    const x = randomRange(0, Math.max(0, rect.width - size));
    const y = randomRange(0, Math.max(0, rect.height - size));

    const el = document.createElement("button");
    el.className = "target";
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.setAttribute("aria-label", "target");
    el.textContent = CHARACTER_EMOJI[config.theme.character] ?? CHARACTER_EMOJI.fish;

    const target = {
      id: nextTargetId++,
      el,
      x,
      y,
      size,
      vx: randomRange(-1, 1) * 40 * config.difficulty.speed,
      vy: randomRange(-1, 1) * 40 * config.difficulty.speed,
    };

    el.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      collectTarget(target);
    });

    container.appendChild(el);
    targets.push(target);
  }

  function collectTarget(target) {
    const index = targets.indexOf(target);
    if (index === -1) return; // 중복 클릭 방어
    targets.splice(index, 1);
    target.el.remove();
    score += 1;
    playHitSound();
    vibrate();
  }

  return {
    id: "collect",

    init(hostContainer, hostConfig) {
      container = hostContainer;
      config = hostConfig;
      container.classList.add(`theme-${config.theme.background}`);
    },

    start() {
      score = 0;
      targets = [];
      spawnTimerMs = 0;
      container.innerHTML = "";
      const initialCount = Math.min(config.params.maxOnScreen, 2);
      for (let i = 0; i < initialCount; i += 1) spawnTarget();
    },

    update(dtMs) {
      const rect = container.getBoundingClientRect();

      for (const target of targets) {
        target.x += (target.vx * dtMs) / 1000;
        target.y += (target.vy * dtMs) / 1000;

        if (target.x < 0 || target.x + target.size > rect.width) {
          target.vx *= -1;
          target.x = Math.min(Math.max(target.x, 0), Math.max(0, rect.width - target.size));
        }
        if (target.y < 0 || target.y + target.size > rect.height) {
          target.vy *= -1;
          target.y = Math.min(Math.max(target.y, 0), Math.max(0, rect.height - target.size));
        }

        target.el.style.transform = `translate(${target.x}px, ${target.y}px)`;
      }

      spawnTimerMs += dtMs;
      if (spawnTimerMs >= spawnInterval() && targets.length < config.params.maxOnScreen) {
        spawnTimerMs = 0;
        spawnTarget();
      }
    },

    getScore() {
      return score;
    },

    destroy() {
      container.innerHTML = "";
      container.classList.remove(`theme-${config.theme.background}`);
      targets = [];
    },

    // 서버측 점수 검증(3단계)의 기준값. 실제로는 사람의 최소 반응시간도 고려해야 하므로
    // 이 값은 "이보다 크면 확실히 비정상"이라는 상한선으로만 사용한다.
    maxPossibleScore(cfg) {
      const interval = BASE_SPAWN_INTERVAL_MS / cfg.difficulty.spawnRate;
      const initialCount = Math.min(cfg.params.maxOnScreen, 2);
      const spawnsDuringPlay = Math.floor((cfg.durationSec * 1000) / interval);
      return initialCount + spawnsDuringPlay;
    },
  };
}

export default createCollectTemplate;
