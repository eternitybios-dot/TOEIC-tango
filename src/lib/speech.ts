function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-US" && /Google|Samantha|Jenny|Aria|Siri|Natural/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en-US")) ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

function makeUtterance(text: string): SpeechSynthesisUtterance {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.92;
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  return utter;
}

export function stopSpeak(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function speak(...texts: string[]): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const parts = texts.map((text) => text.trim()).filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.some((item) => item.toLowerCase() === part.toLowerCase())) unique.push(part);
  }
  if (unique.length === 0) return;

  let index = 0;
  const play = () => {
    if (index >= unique.length) return;
    const utter = makeUtterance(unique[index++]);
    utter.onend = play;
    window.speechSynthesis.speak(utter);
  };
  play();
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.addEventListener("voiceschanged", () => pickVoice());
}
