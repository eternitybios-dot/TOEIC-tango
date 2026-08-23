import { prefersReducedMotion } from "./motion";

let audioCtx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx ??= new Ctor();
  return audioCtx;
}

function resume(ac: AudioContext) {
  if (ac.state === "suspended") void ac.resume();
}

function noiseBuffer(ac: AudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ac.sampleRate * seconds));
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function env(ac: AudioContext, start: number, attack: number, hold: number, release: number, volume: number) {
  const gain = ac.createGain();
  const peak = Math.max(0.0008, volume);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  gain.gain.setValueAtTime(peak, start + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + hold + release);
  return gain;
}

function playOsc(
  ac: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  glideTo?: number,
) {
  const osc = ac.createOscillator();
  const gain = env(ac, start, 0.008, Math.max(0.01, duration * 0.35), duration * 0.65, volume);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playNoise(ac: AudioContext, dest: AudioNode, start: number, duration: number, volume: number, hp: number) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, duration + 0.02);
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const gain = env(ac, start, 0.004, 0.01, duration, volume);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(start);
  src.stop(start + duration + 0.02);
}

function bus(ac: AudioContext, color: "bright" | "dark" | "soft") {
  const filter = ac.createBiquadFilter();
  const out = ac.createGain();
  out.gain.value = 0.9;
  if (color === "bright") {
    filter.type = "highshelf";
    filter.frequency.value = 1800;
    filter.gain.value = 6;
  } else if (color === "dark") {
    filter.type = "lowpass";
    filter.frequency.value = 900;
  } else {
    filter.type = "lowpass";
    filter.frequency.value = 2200;
  }
  filter.connect(out);
  out.connect(ac.destination);
  return filter;
}

function crystal(ac: AudioContext, freqs: number[], step: number, volume: number, delay = 0) {
  const dest = bus(ac, "bright");
  const t0 = ac.currentTime + delay;
  playNoise(ac, dest, t0, 0.03, volume * 0.18, 1800);
  freqs.forEach((freq, i) => {
    const start = t0 + i * step;
    playOsc(ac, dest, freq, start, 0.14, "triangle", volume, freq * 1.01);
    playOsc(ac, dest, freq * 2, start, 0.1, "sine", volume * 0.32);
    playOsc(ac, dest, freq, start, 0.07, "square", volume * 0.16);
  });
}

function thud(ac: AudioContext, freqs: number[], step: number, volume: number) {
  const dest = bus(ac, "dark");
  const t0 = ac.currentTime;
  playNoise(ac, dest, t0, 0.06, volume * 0.28, 240);
  freqs.forEach((freq, i) => {
    const start = t0 + i * step;
    playOsc(ac, dest, freq, start, 0.18, "square", volume, freq * 0.86);
    playOsc(ac, dest, freq / 2, start, 0.2, "triangle", volume * 0.35);
  });
}

export type Sfx = "tap" | "flip" | "good" | "again" | "correct" | "wrong" | "done" | "goal";

export function playSfx(kind: Sfx, enabled: boolean): void {
  if (!enabled) return;
  const ac = context();
  if (!ac) return;
  resume(ac);

  switch (kind) {
    case "tap": {
      const dest = bus(ac, "soft");
      playOsc(ac, dest, 880, ac.currentTime, 0.045, "square", 0.035);
      playOsc(ac, dest, 1320, ac.currentTime, 0.03, "triangle", 0.02);
      break;
    }
    case "flip": {
      const dest = bus(ac, "soft");
      playOsc(ac, dest, 420, ac.currentTime, 0.08, "triangle", 0.04, 720);
      break;
    }
    case "good":
      crystal(ac, [659.25, 830.61, 987.77], 0.065, 0.08);
      break;
    case "again":
      thud(ac, [196, 147], 0.09, 0.055);
      break;
    case "correct":
      crystal(ac, [659.25, 830.61, 987.77, 1318.51], 0.07, 0.1);
      break;
    case "wrong":
      thud(ac, [233.08, 174.61, 130.81], 0.1, 0.075);
      break;
    case "done":
      crystal(ac, [587.33, 739.99, 880, 1174.66, 1479.98], 0.09, 0.085);
      break;
    case "goal":
      crystal(ac, [739.99, 987.77, 1479.98], 0.08, 0.08);
      break;
  }
}

export function haptic(pattern: number | number[], enabled: boolean): void {
  if (!enabled || prefersReducedMotion()) return;
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}
