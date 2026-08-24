import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { QueueStrategy, TextToSpeech } from "@capacitor-community/text-to-speech";

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function initNative(): Promise<void> {
  if (!isNative()) return;
  document.documentElement.classList.add("native");
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#0b0907" });
  } catch {
    /* WebView-only preview */
  }
  try {
    await SplashScreen.hide();
  } catch {
    /* optional plugin */
  }
}

export function listenBackButton(onBack: () => boolean): () => void {
  if (!isNative()) return () => undefined;
  const pending = App.addListener("backButton", () => {
    if (!onBack()) void App.exitApp();
  });
  return () => {
    void pending.then((handle) => handle.remove());
  };
}

export function nativeHaptic(pattern: number | number[]): void {
  if (!isNative()) return;
  const values = Array.isArray(pattern) ? pattern : [pattern];
  const max = Math.max(...values);
  if (values.length >= 3 && max <= 16) {
    void Haptics.notification({ type: NotificationType.Success });
    return;
  }
  if (values.length >= 3 && max >= 24) {
    void Haptics.notification({ type: NotificationType.Error });
    return;
  }
  void Haptics.impact({
    style: max >= 20 ? ImpactStyle.Medium : ImpactStyle.Light,
  });
}

let englishVoice: number | undefined;
let voiceReady: Promise<void> | null = null;

function ensureVoice(): Promise<void> {
  voiceReady ??= TextToSpeech.getSupportedVoices()
    .then(({ voices }) => {
      let index = voices.findIndex((voice) => voice.lang === "en-US");
      if (index < 0) index = voices.findIndex((voice) => voice.lang.startsWith("en"));
      englishVoice = index >= 0 ? index : undefined;
    })
    .catch(() => undefined);
  return voiceReady;
}

export function nativeStopSpeak(): void {
  if (!isNative()) return;
  void TextToSpeech.stop();
}

export function nativeSpeak(texts: string[]): void {
  if (!isNative() || texts.length === 0) return;
  void (async () => {
    await ensureVoice();
    await TextToSpeech.stop();
    for (const [index, text] of texts.entries()) {
      await TextToSpeech.speak({
        text,
        lang: "en-US",
        rate: 0.92,
        pitch: 1,
        volume: 1,
        category: "playback",
        queueStrategy: index === 0 ? QueueStrategy.Flush : QueueStrategy.Add,
        ...(englishVoice != null ? { voice: englishVoice } : {}),
      });
    }
  })();
}
