// VELVET MIDNIGHT — WebAudio sound effects, oscillators only, no audio files.
// The context is created lazily on the first user gesture (browser policy).

let ctx = null;
let alarmOsc = null;
let alarmGain = null;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, slideTo) {
  const c = ensureAudio();
  if (!c) return;
  const t0 = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(vol || 0.12, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function playPickup() { tone(880, 0.12, 'sine', 0.14); setTimeout(() => tone(1320, 0.18, 'sine', 0.14), 90); }
export function playClick() { tone(520, 0.06, 'square', 0.06); }
export function playLockTick() { tone(1200, 0.04, 'square', 0.05); }
export function playThrow() { tone(300, 0.2, 'sine', 0.1, 140); }
export function playCaught() { tone(220, 0.5, 'sawtooth', 0.16, 55); }
export function playWin() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.13), i * 110)); }
export function playAlarmBlip() { tone(980, 0.1, 'square', 0.07, 700); }

// Continuous alarm drone while the alarm meter is high; call every frame
// with the current alarm level (0..100) and it fades itself in/out.
export function setAlarmDrone(level) {
  const c = ensureAudio();
  if (!c) return;
  if (level < 55) {
    if (alarmOsc) { try { alarmOsc.stop(); } catch (e) {} alarmOsc = null; alarmGain = null; }
    return;
  }
  if (!alarmOsc) {
    alarmOsc = c.createOscillator();
    alarmGain = c.createGain();
    alarmOsc.type = 'sawtooth';
    alarmOsc.frequency.value = 110;
    alarmGain.gain.value = 0;
    alarmOsc.connect(alarmGain);
    alarmGain.connect(c.destination);
    alarmOsc.start();
  }
  alarmGain.gain.setTargetAtTime(0.015 + (level / 100) * 0.035, c.currentTime, 0.2);
  alarmOsc.frequency.setTargetAtTime(110 + level * 1.2, c.currentTime, 0.2);
}
