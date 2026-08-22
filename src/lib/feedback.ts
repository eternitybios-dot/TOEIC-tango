import { prefersReducedMotion } from "./motion";

let audioCtx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx ??= new Ctor();
  return audioCtx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.05, delay = 0) {
  const ac = context();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = ac.currentTime + delay;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration);
}

export type Sfx = "tap" | "flip" | "good" | "again" | "correct" | "wrong" | "done" | "goal";

export function playSfx(kind: Sfx, enabled: boolean): void {
  if (!enabled) return;
  switch (kind) {
    case "tap":
      tone(520, 0.05, "triangle", 0.03);
      break;
    case "flip":
      tone(380, 0.07, "sine", 0.035);
      break;
    case "good":
      tone(523, 0.08, "triangle", 0.045);
      tone(784, 0.12, "triangle", 0.04, 0.06);
      break;
    case "again":
      tone(220, 0.12, "sine", 0.04);
      break;
    case "correct":
      tone(587, 0.07, "triangle", 0.045);
      tone(880, 0.14, "triangle", 0.04, 0.07);
      break;
    case "wrong":
      tone(196, 0.16, "square", 0.025);
      break;
    case "done":
      tone(523, 0.08, "triangle", 0.04);
      tone(659, 0.08, "triangle", 0.04, 0.08);
      tone(784, 0.1, "triangle", 0.04, 0.16);
      tone(1046, 0.22, "triangle", 0.035, 0.26);
      break;
    case "goal":
      tone(659, 0.1, "triangle", 0.04);
      tone(988, 0.2, "triangle", 0.04, 0.1);
      break;
  }
}

export function haptic(pattern: number | number[], enabled: boolean): void {
  if (!enabled || prefersReducedMotion()) return;
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}
