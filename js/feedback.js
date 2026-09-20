// 오디오 파일 없이 오실레이터로 짧은 "톡" 효과음을 만든다 (에셋 자유 업로드를 막기로 한 원칙과도 맞음).
let audioCtx = null;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function playHitSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  } catch {
    // AudioContext 미지원이거나 아직 사용자 제스처 전이면 조용히 무시
  }
}

export function vibrate(durationMs = 30) {
  try {
    navigator.vibrate?.(durationMs);
  } catch {
    // 진동 API 미지원 기기는 무시 (iOS Safari 등)
  }
}
