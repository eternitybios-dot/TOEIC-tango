import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { AppState, Route, Word } from "../types";
import { UNIT_META, WORDS, wordsByUnit } from "../data";
import { dueThenNew } from "../lib/stats";
import { speak } from "../lib/speech";
import { afterAgain, afterGood, pickSession } from "../lib/quiz";
import { haptic, playSfx } from "../lib/feedback";
import { wait } from "../lib/motion";
import { Burst } from "../components/Burst";
import { CountUp } from "../components/CountUp";
import { IconBack, IconSpeak } from "../components/Icons";
import { ProgressBar } from "../components/ProgressBar";

type Props = {
  state: AppState;
  unit?: number;
  mode?: "due" | "unit";
  onReview: (word: Word, result: "again" | "good") => void;
  go: (route: Route) => void;
};

const SESSION = 10;

export function Study({ state, unit, mode = "due", onReview, go }: Props) {
  const pool = useMemo(() => {
    const source = unit ? wordsByUnit(unit) : WORDS;
    if (mode === "unit" && unit) return source;
    const ordered = dueThenNew(state, source);
    return ordered.length > 0 ? ordered : source;
  }, [state, unit, mode]);

  const [queue, setQueue] = useState<Word[]>(() => pickSession(pool, SESSION));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ good: 0, again: 0 });
  const [finished, setFinished] = useState(false);
  const [drag, setDrag] = useState(0);
  const [flight, setFlight] = useState<"good" | "again" | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const busy = useRef(false);

  function restart() {
    playSfx("tap", state.settings.sound);
    setQueue(pickSession(pool, SESSION));
    setIndex(0);
    setRevealed(false);
    setScore({ good: 0, again: 0 });
    setFinished(false);
    setFlight(null);
    setDrag(0);
  }

  const word = queue[index];
  const remaining = queue.length;
  const done = SESSION - remaining;

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

  function flip() {
    playSfx("flip", state.settings.sound);
    haptic(8, state.settings.haptics);
    setRevealed((open) => !open);
  }

  function goPrev() {
    if (index === 0 || finished || busy.current) return;
    playSfx("tap", state.settings.sound);
    setIndex((current) => current - 1);
    setRevealed(false);
  }

  async function answer(result: "again" | "good") {
    if (!word || finished || busy.current) return;
    busy.current = true;
    playSfx(result, state.settings.sound);
    haptic(result === "good" ? [10, 30, 16] : 24, state.settings.haptics);
    setFlight(result);
    await wait(320);
    onReview(word, result);
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
    if (Math.abs(dx) > 86) {
      void answer(dx > 0 ? "good" : "again");
      return;
    }
    setDrag(0);
    if (!dragging.current) flip();
  }

  if (queue.length === 0 && !finished) {
    return (
      <div className="page empty">
        <p>出題できる単語がありません。</p>
        <button className="cta" style={{ marginTop: 16 }} onClick={() => go({ name: "home" })}>
          ホームへ
        </button>
      </div>
    );
  }

  if (finished || !word) {
    return (
      <div className="page result">
        <Burst />
        <p className="tiny gold">SESSION CLEAR</p>
        <h2>
          <CountUp value={score.good} />
          <small> 覚えた</small>
        </h2>
        <p className="muted" style={{ margin: "8px 0 22px" }}>
          もう一度 {score.again} 回
        </p>
        <div className="row">
          <button className="cta ghost" onClick={() => go({ name: "quiz", unit })}>
            クイズへ
          </button>
          <button className="cta" onClick={restart}>
            もう1セット
          </button>
        </div>
      </div>
    );
  }

  const tilt = Math.max(-18, Math.min(18, drag / 14));
  const flightClass = flight === "good" ? " fly-right" : flight === "again" ? " fly-left" : "";

  return (
    <div className="page">
      <button className="back-link" onClick={() => go({ name: "home" })}>
        <IconBack /> ホーム
      </button>
      <div className="progress-label">
        <span>{unit ? `UNIT ${unit} ${UNIT_META[unit].title}` : "復習＋新規"}</span>
        <span>残り {remaining}</span>
      </div>
      <ProgressBar value={done + (revealed ? 0.35 : 0)} max={SESSION} />

      <div className="swipe-hint">
        <span className={drag < -24 ? "hot again-hot" : ""}>もう一度</span>
        <span className={drag > 24 ? "hot good-hot" : ""}>覚えた</span>
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
            <p className="hint">タップでフレーズ · スワイプで判定</p>
          </article>
          <article className="flip-face flip-back">
            <span className="pos">{word.pos}</span>
            <div className="meaning">{word.meaning}</div>
            <p className="phrase">
              {word.phrase}
              <span className="phrase-ja">{word.phraseJa}</span>
            </p>
            <p className="hint">タップで単語に戻る</p>
          </article>
        </div>
      </div>

      <div className="row actions" style={{ marginBottom: 10 }}>
        <button type="button" className="btn again" disabled={index === 0} onClick={goPrev}>
          前のカード
        </button>
        <button type="button" className="btn ghost-wide" onClick={flip}>
          {revealed ? "単語に戻す" : "フレーズを見る"}
        </button>
        <button
          type="button"
          className="btn speak"
          onClick={() => speak(revealed ? word.phrase : word.word)}
          aria-label="発音"
        >
          <IconSpeak size={20} />
        </button>
      </div>

      <div className="row actions">
        <button type="button" className="btn again" onClick={() => void answer("again")}>
          もう一度
        </button>
        <button type="button" className="btn good" onClick={() => void answer("good")}>
          覚えた
        </button>
      </div>
      <p className="muted center-hint">スペースで裏面 · 1 もう一度 · 2 覚えた</p>
    </div>
  );
}
