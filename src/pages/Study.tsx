import { useEffect, useRef, useState, type PointerEvent } from "react";
import { PARTS, type AppState, type Route, type Word } from "../types";
import { WORDS, wordsByPart, wordsByUnit } from "../data";
import { speak } from "../lib/speech";
import { explainMeaning } from "../lib/explain";
import { afterAgain, afterGood } from "../lib/quiz";
import { haptic, playSfx } from "../lib/feedback";
import { wait } from "../lib/motion";
import { dealQuiz, SESSION_SIZE, type QuizMix } from "../lib/session";
import { Burst } from "../components/Burst";
import { CountUp } from "../components/CountUp";
import { IconBack, IconSpeak } from "../components/Icons";
import { ProgressBar } from "../components/ProgressBar";

type Props = {
  state: AppState;
  unit?: number;
  part?: 1 | 2 | 3;
  mode?: "due" | "unit";
  onReview: (word: Word, result: "again" | "good") => void;
  go: (route: Route) => void;
};

type Scope = { type: "all" } | { type: "part"; part: 1 | 2 | 3 } | { type: "unit"; unit: number };

function initialScope(unit?: number, part?: 1 | 2 | 3): Scope {
  if (unit) return { type: "unit", unit };
  if (part) return { type: "part", part };
  return { type: "all" };
}

function poolOf(scope: Scope): Word[] {
  if (scope.type === "unit") return wordsByUnit(scope.unit);
  if (scope.type === "part") return wordsByPart(scope.part);
  return WORDS;
}

function scopeLabel(scope: Scope, mix: QuizMix): string {
  const place =
    scope.type === "unit" ? `UNIT ${scope.unit}` : scope.type === "part" ? PARTS[scope.part - 1].label : "全体";
  return `${place} · ${mix === "random" ? "ランダム" : "期限"}`;
}

export function Study({ state, unit, part, mode = "due", onReview, go }: Props) {
  const [scope, setScope] = useState<Scope>(() => initialScope(unit, part));
  const [mix, setMix] = useState<QuizMix>(() => (mode === "unit" ? "random" : "due"));
  const [started, setStarted] = useState(false);
  const source = poolOf(scope);
  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ good: 0, again: 0 });
  const [finished, setFinished] = useState(false);
  const [drag, setDrag] = useState(0);
  const [flight, setFlight] = useState<"good" | "again" | null>(null);
  const [seen, setSeen] = useState<Word[]>([]);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const busy = useRef(false);

  const word = queue[index];
  const note = word ? explainMeaning(word) : null;
  const remaining = queue.length;
  const done = Math.max(0, (queue.length > 0 ? SESSION_SIZE : score.good + score.again) - remaining);

  useEffect(() => {
    if (!word || finished || !state.settings.autoSpeak) return;
    speak(revealed ? word.phrase : word.word);
  }, [word, revealed, finished, state.settings.autoSpeak]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!word || finished || busy.current) return;
      if (event.code === "Space") {
        event.preventDefault();
        flip();
      }
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "1") void answer("again");
      if (event.key === "2") void answer("good");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function restart(nextQueue: Word[]) {
    setQueue(nextQueue);
    setIndex(0);
    setRevealed(false);
    setScore({ good: 0, again: 0 });
    setFinished(false);
    setFlight(null);
    setDrag(0);
    setSeen([]);
    setStarted(true);
  }

  function begin(nextMix = mix, nextScope = scope) {
    playSfx("tap", state.settings.sound);
    restart(dealQuiz(state, poolOf(nextScope), nextMix));
  }

  function flip() {
    playSfx("flip", state.settings.sound);
    haptic(8, state.settings.haptics);
    setRevealed((open) => !open);
  }

  function goPrev() {
    if (seen.length === 0 || finished || busy.current) return;
    playSfx("tap", state.settings.sound);
    const prev = seen[seen.length - 1];
    setSeen((list) => list.slice(0, -1));
    setQueue((current) => [prev, ...current.filter((item) => item.id !== prev.id)]);
    setIndex(0);
    setRevealed(false);
    setDrag(0);
    setFlight(null);
  }

  async function answer(result: "again" | "good") {
    if (!word || finished || busy.current) return;
    busy.current = true;
    playSfx(result, state.settings.sound);
    haptic(result === "good" ? [10, 30, 16] : 24, state.settings.haptics);
    setFlight(result);
    await wait(320);
    onReview(word, result);
    setSeen((list) => [...list, word]);
    setScore((prev) => ({ ...prev, [result]: prev[result] + 1 }));
    const next = result === "good" ? afterGood(queue, index) : afterAgain(queue, index);
    setQueue(next.queue);
    setIndex(next.index);
    setRevealed(false);
    setFinished(next.finished);
    setFlight(null);
    setDrag(0);
    if (next.finished) playSfx("done", state.settings.sound);
    busy.current = false;
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (busy.current) return;
    start.current = { x: event.clientX, y: event.clientY };
    dragging.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!start.current || busy.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      dragging.current = true;
      setDrag(dx);
    }
  }

  function onPointerUp() {
    if (busy.current) return;
    const dx = drag;
    start.current = null;
    if (dragging.current && Math.abs(dx) > 86) {
      void answer(dx > 0 ? "again" : "good");
      return;
    }
    setDrag(0);
    if (!dragging.current) flip();
  }

  if (finished) {
    return (
      <div className="page result">
        <Burst />
        <p className="tiny gold">セット完了</p>
        <h2>
          <CountUp value={score.good} />
          <small> 覚えた</small>
        </h2>
        <p className="muted" style={{ margin: "8px 0 22px" }}>
          もう一度 {score.again} 回
        </p>
        <button className="cta" onClick={() => begin()}>
          同じ条件でもう一度
        </button>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="cta ghost" onClick={() => setStarted(false)}>
            出題を変える
          </button>
          <button className="cta ghost" onClick={() => go({ name: "quiz", unit, part: scope.type === "part" ? scope.part : part })}>
            クイズへ
          </button>
        </div>
      </div>
    );
  }

  if (!started || !word) {
    return (
      <div className="page quiz-setup">
        <button className="back-link" onClick={() => go({ name: "home" })}>
          <IconBack /> ホーム
        </button>
        <p className="tiny gold">カード</p>
        <h2 className="quiz-setup-title">出題を選ぶ</h2>
        <p className="section-title">レベル</p>
        <div className="filters">
          <button className={`chip${scope.type === "all" ? " on" : ""}`} onClick={() => setScope({ type: "all" })}>
            すべて
          </button>
          {PARTS.map((item) => (
            <button
              key={item.id}
              className={`chip${scope.type === "part" && scope.part === item.id ? " on" : ""}`}
              onClick={() => setScope({ type: "part", part: item.id })}
            >
              {item.label}
            </button>
          ))}
          {unit ? (
            <button
              className={`chip${scope.type === "unit" && scope.unit === unit ? " on" : ""}`}
              onClick={() => setScope({ type: "unit", unit })}
            >
              UNIT {unit}
            </button>
          ) : null}
        </div>
        <p className="section-title">出題</p>
        <div className="filters">
          <button className={`chip${mix === "random" ? " on" : ""}`} onClick={() => setMix("random")}>
            ランダム
          </button>
          <button className={`chip${mix === "due" ? " on" : ""}`} onClick={() => setMix("due")}>
            期限の復習
          </button>
        </div>
        <p className="muted" style={{ margin: "8px 0 18px" }}>
          {source.length}語から {Math.min(SESSION_SIZE, source.length)}枚 · {mix === "random" ? "毎回ちがう語" : "期限と未学習から"}
        </p>
        <button className="cta" onClick={() => begin()}>
          スタート
        </button>
      </div>
    );
  }

  const tilt = Math.max(-18, Math.min(18, drag / 14));
  const flightClass = flight === "good" ? " fly-left" : flight === "again" ? " fly-right" : "";

  return (
    <div className="page">
      <button className="back-link" onClick={() => setStarted(false)}>
        <IconBack /> 出題
      </button>
      <div className="progress-label">
        <span>{scopeLabel(scope, mix)}</span>
        <span>残り {remaining}</span>
      </div>
      <ProgressBar value={done + (revealed ? 0.35 : 0)} max={SESSION_SIZE} />

      <div className="swipe-hint">
        <span className={drag < -24 ? "hot good-hot" : ""}>覚えた</span>
        <span className={drag > 24 ? "hot again-hot" : ""}>もう一度</span>
      </div>

      <div
        className="flip-scene"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null;
          setDrag(0);
        }}
      >
        <div
          className={`flip-card${drag ? " is-dragging" : ""}${flightClass}`}
          style={
            flight
              ? undefined
              : { transform: `translateX(${drag}px) rotate(${tilt}deg) rotateY(${revealed ? 180 : 0}deg)` }
          }
        >
          <article className="flip-face flip-front">
            <span className="pos">{word.pos}</span>
            <div className="word">{word.word}</div>
            {word.ipa ? <div className="ipa">/{word.ipa}/</div> : null}
            <p className="hint">タップで意味 · 左へ覚えた · 右へもう一度</p>
          </article>
          <article className="flip-face flip-back">
            <span className="pos">{word.pos}</span>
            <p className="phrase">
              {word.phrase}
              <span className="phrase-ja">{word.phraseJa}</span>
            </p>
            <div className="meaning">{word.meaning}</div>
            {note ? <p className="card-explain">{note.lines.join(" ")}</p> : null}
            <p className="hint">左へ覚えた · 右へもう一度</p>
          </article>
        </div>
      </div>

      <div className="row actions" style={{ marginBottom: 10 }}>
        <button type="button" className="btn ghost-wide with-icon" onClick={() => speak(word.word, word.phrase)}>
          <IconSpeak size={20} />
          発音
        </button>
        <button type="button" className="btn ghost-wide with-icon" disabled={seen.length === 0} onClick={goPrev}>
          <IconBack size={18} />
          前のカード
        </button>
      </div>

      <div className="row actions">
        <button type="button" className="btn good" onClick={() => void answer("good")}>
          覚えた
        </button>
        <button type="button" className="btn again" onClick={() => void answer("again")}>
          もう一度
        </button>
      </div>
      <p className="muted center-hint">表のまま判定できます。タップで意味を見ます</p>
    </div>
  );
}
