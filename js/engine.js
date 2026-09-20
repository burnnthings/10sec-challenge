// 템플릿 종류에 상관없이 동일한 상태 흐름을 담당한다: READY -> COUNTDOWN -> PLAYING -> RESULT
export const STATE = {
  READY: "READY",
  COUNTDOWN: "COUNTDOWN",
  PLAYING: "PLAYING",
  RESULT: "RESULT",
};

const COUNTDOWN_STEPS = [3, 2, 1];
const COUNTDOWN_STEP_MS = 700;

export class GameEngine {
  constructor({ container, config, template, onStateChange, onCountdownTick, onTimeTick, onResult }) {
    this.container = container;
    this.config = config;
    this.template = template;
    this.onStateChange = onStateChange ?? (() => {});
    this.onCountdownTick = onCountdownTick ?? (() => {});
    this.onTimeTick = onTimeTick ?? (() => {});
    this.onResult = onResult ?? (() => {});

    this.state = STATE.READY;
    this.rafId = null;
    this.lastFrameTime = 0;
    this.playStartTime = 0;

    this.template.init(this.container, this.config);
    this._setState(STATE.READY);
  }

  _setState(state) {
    this.state = state;
    this.onStateChange(state);
  }

  start() {
    if (this.state === STATE.PLAYING) return;
    this._runCountdown();
  }

  _runCountdown() {
    this._setState(STATE.COUNTDOWN);
    let stepIndex = 0;
    this.onCountdownTick(COUNTDOWN_STEPS[stepIndex]);

    const timer = setInterval(() => {
      stepIndex += 1;
      if (stepIndex >= COUNTDOWN_STEPS.length) {
        clearInterval(timer);
        this._runPlaying();
        return;
      }
      this.onCountdownTick(COUNTDOWN_STEPS[stepIndex]);
    }, COUNTDOWN_STEP_MS);
  }

  _runPlaying() {
    this._setState(STATE.PLAYING);
    this.template.start();
    this.playStartTime = performance.now();
    this.lastFrameTime = this.playStartTime;
    this.rafId = requestAnimationFrame((t) => this._loop(t));
  }

  _loop(now) {
    const dtMs = now - this.lastFrameTime;
    this.lastFrameTime = now;
    const elapsedMs = now - this.playStartTime;
    const remainingSec = Math.max(0, this.config.durationSec - elapsedMs / 1000);

    this.template.update(dtMs);
    this.onTimeTick(remainingSec);

    if (elapsedMs >= this.config.durationSec * 1000) {
      this._finish(elapsedMs);
      return;
    }
    this.rafId = requestAnimationFrame((t) => this._loop(t));
  }

  _finish(durationMs) {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;

    const score = this.template.getScore();
    const cleared = score >= this.config.goal.value;
    this._setState(STATE.RESULT);
    this.onResult({ score, cleared, durationMs: Math.round(durationMs) });
  }

  retry() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.template.destroy();
    this.template.init(this.container, this.config);
    this._runCountdown();
  }

  destroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.template.destroy();
  }
}
