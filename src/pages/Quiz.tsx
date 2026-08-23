import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { AppState, Route, Word } from "../types";
import { WORDS, wordsByUnit } from "../data";
import { explainMeaning } from "../lib/explain";
import { clozeParts, phraseParts, pickChoices, pickSession } from "../lib/quiz";
import { dealSession, SESSION_SIZE } from "../lib/session";
import { speak } from "../lib/speech";
import { haptic, playSfx } from "../lib/feedback";
import { wait } from "../lib/motion";
import { Burst } from "../components/Burst";
import { CountUp } from "../components/CountUp";
import { IconBack } from "../components/Icons";
import { ProgressBar } from "../components/ProgressBar";

type Props = {
  state: AppState;
  unit?: number;
  onQuiz: (word: Word, ok: boolean) => void;
  go: (route: Route) => void;
};

type Mode = "en-ja" | "ja-en" | "cloze";

export function Quiz({ state, unit, onQuiz, go }: Props) {
  const source = unit ? wordsByUnit(unit) : WORDS;
  const [queue, setQueue] = useState(() => dealSession(state, source));
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("en-ja");
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Word[]>([]);
  const [finished, setFinished] = useState(false);
  const [shake, setShake] = useState(false);
  const [drag, setDrag] = useState(0);
  const [flight, setFlight] = useState<"left" | "right" | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const busy = useRef(false);
  const dragRef = useRef(0);

  const word = queue[index];
  const choices = useMemo(() => (word ? pickChoices(word, source, 4) : []), [word, source]);

  useEffect(() => {
    if (!word || finished || mode !== "en-ja") return;
    speak(word.phrase);
  }, [word, mode, finished]);
  const pickedWord = picked === null ? undefined : choices.find((choice) => choice.id === picked);
  const isCorrect = picked !== null && picked === word?.id;
  const meaning = word && picked !== null ? explainMeaning(word) : null;

  function start(nextQueue: Word[]) {
    setQueue(nextQueue);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setMissed([]);
    setFinished(false);
    setDrag(0);
    setFlight(null);
  }

  function choose(choice: Word) {
    if (!word || picked !== null) return;
    setPicked(choice.id);
    const ok = choice.id === word.id;
    playSfx(ok ? "correct" : "wrong", state.settings.sound);
    haptic(ok ? [8, 20, 12] : [30, 20, 30], state.settings.haptics);
    if (ok) setScore((n) => n + 1);
    else {
      setMissed((list) => (list.some((item) => item.id === word.id) ? list : [...list, word]));
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
    }
    onQuiz(word, ok);
  }

  function next() {
    if (busy.current || picked === null) return;
    busy.current = true;
    playSfx("tap", state.settings.sound);
    advance();
    busy.current = false;
  }

  function advance() {
    dragRef.current = 0;
    setDrag(0);
    setFlight(null);
    if (index + 1 >= queue.length) {
      setFinished(true);
      playSfx("done", state.settings.sound);
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  }

  async function swipeNext(direction: "left" | "right") {
    if (picked === null || busy.current) return;
    busy.current = true;
    playSfx("tap", state.settings.sound);
    haptic(10, state.settings.haptics);
    setFlight(direction);
    await wait(280);
    advance();
    busy.current = false;
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (picked === null || busy.current) return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
    dragging.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!swipeStart.current || picked === null || busy.current) return;
    const dx = event.clientX - swipeStart.current.x;
    const dy = event.clientY - swipeStart.current.y;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      dragging.current = true;
      dragRef.current = dx;
      setDrag(dx);
    }
  }

  function onPointerUp() {
    if (busy.current) return;
    const dx = dragRef.current;
    swipeStart.current = null;
    if (picked !== null && dragging.current && Math.abs(dx) > 72) {
      void swipeNext(dx > 0 ? "right" : "left");
      return;
    }
    dragging.current = false;
    dragRef.current = 0;
    setDrag(0);
  }

  function choiceLead(choice: Word) {
    if (mode === "en-ja") return choice.meaning;
    return choice.word;
  }

  function choiceRest(choice: Word) {
    if (mode === "en-ja") return choice.phraseJa;
    if (mode === "ja-en") return choice.phrase;
    return "";
  }

  function promptHead() {
    if (!word) return "";
    if (picked === null && mode === "ja-en") return word.meaning;
    if (picked === null && mode === "cloze") return "______";
    return word.word;
  }

  if (finished) {
    return (
      <div className="page result">
        <Burst />
        <p className="tiny gold">クイズ結果</p>
        <h2>
          <CountUp value={score} />
          <small>/{queue.length}</small>
        </h2>
        <p className="muted" style={{ margin: "8px 0 22px" }}>
          {missed.length === 0 ? "このセットは満点です。" : `まちがい ${missed.length} 語`}
        </p>
        {missed.length > 0 ? (
          <button className="cta" onClick={() => start(missed)}>
            間違えた語だけ再テスト
          </button>
        ) : null}
        <div className="row" style={{ marginTop: missed.length > 0 ? 10 : 0 }}>
          <button className="cta ghost" onClick={() => go({ name: "study", unit, mode: unit ? "unit" : "due" })}>
            カードへ
          </button>
          <button className="cta ghost" onClick={() => go({ name: "home" })}>
            ホーム
          </button>
        </div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="page empty">
        <p>今、期限の語はありません。</p>
        <button className="cta" style={{ marginTop: 16 }} onClick={() => start(pickSession(source, SESSION_SIZE))}>
          10語ランダム
        </button>
      </div>
    );
  }

  return (
    <div
      className={`page page-quiz${shake ? " shake" : ""}${picked !== null ? " is-answered" : ""}${drag ? " is-dragging" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <header className="quiz-head">
        <div className="quiz-head-row">
          <button className="back-link" onClick={() => go({ name: "home" })}>
            <IconBack /> ホーム
          </button>
          <span className="tiny">
            {unit ? `UNIT ${unit}` : "期限＋新規"} · {index + 1}/{queue.length}
          </span>
        </div>
        <ProgressBar value={index + (picked !== null ? 0.5 : 0)} max={queue.length} />
        <div className="quiz-modes">
          <button className={`chip${mode === "en-ja" ? " on" : ""}`} disabled={picked !== null} onClick={() => setMode("en-ja")}>
            英 → 和
          </button>
          <button className={`chip${mode === "ja-en" ? " on" : ""}`} disabled={picked !== null} onClick={() => setMode("ja-en")}>
            和 → 英
          </button>
          <button className={`chip${mode === "cloze" ? " on" : ""}`} disabled={picked !== null} onClick={() => setMode("cloze")}>
            空所
          </button>
          <button
            className="chip"
            disabled={picked === null && mode !== "en-ja"}
            onClick={() => speak(mode === "en-ja" ? word.phrase : word.word)}
          >
            発音
          </button>
        </div>
      </header>

      <div
        className={`quiz-slide${drag && !flight ? " is-dragging" : ""}${flight ? ` fly-${flight}` : ""}`}
        style={flight ? undefined : drag ? { transform: `translateX(${drag}px)` } : undefined}
      >
      <div className="quiz-stage" key={`${word.id}-${mode}`}>
        <div className="quiz-word">
          <p>
            {promptHead()}
            <small>{word.pos}</small>
          </p>
        </div>
        {mode === "ja-en" ? (
          <p className="quiz-prompt quiz-prompt-ja">{word.phraseJa}</p>
        ) : mode === "cloze" ? (
          <div className="quiz-prompt-stack">
            <p className="quiz-prompt quiz-prompt-ja">{word.phraseJa}</p>
            <p className="quiz-prompt quiz-prompt-en">
              {picked === null
                ? clozeParts(word).map((part, i) =>
                    part.blank ? <mark key={`${part.text}-${i}`}>{part.text}</mark> : <span key={`${part.text}-${i}`}>{part.text}</span>,
                  )
                : phraseParts(word).map((part, i) =>
                    part.hit ? <mark key={`${part.text}-${i}`}>{part.text}</mark> : <span key={`${part.text}-${i}`}>{part.text}</span>,
                  )}
            </p>
          </div>
        ) : (
          <p className="quiz-prompt quiz-prompt-en">
            {phraseParts(word).map((part, i) =>
              part.hit ? <mark key={`${part.text}-${i}`}>{part.text}</mark> : <span key={`${part.text}-${i}`}>{part.text}</span>,
            )}
          </p>
        )}
      </div>

      <div className="quiz-body">
        {choices.map((choice, i) => {
          const selected = picked === choice.id;
          const correct = picked !== null && choice.id === word.id;
          const wrong = selected && choice.id !== word.id;
          return (
            <button
              key={choice.id}
              className={`choice rise${correct ? " correct" : ""}${wrong ? " wrong" : ""}`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => choose(choice)}
            >
              <mark>{choiceLead(choice)}</mark>
              {choiceRest(choice) ? <span className="choice-rest">{choiceRest(choice)}</span> : null}
            </button>
          );
        })}

        {picked !== null && meaning && pickedWord && (
          <section className={`explain slide-up${isCorrect ? " ok" : " ng"}`} aria-live="polite">
            <p className="explain-result">{isCorrect ? "正解" : "不正解"}</p>
            {!isCorrect && (
              <p className="explain-compare">
                あなたの答え {pickedWord.word}「{pickedWord.meaning}」 / 正解 {word.word}「{word.meaning}」
              </p>
            )}
            {meaning.lines.map((line) => (
              <p key={line} className="explain-body">
                {line}
              </p>
            ))}
          </section>
        )}
      </div>
      </div>

      {picked !== null && (
        <div className="quiz-dock">
          <p className="quiz-swipe-hint">{index + 1 >= queue.length ? "スワイプでも結果へ" : "スワイプでも次へ"}</p>
          <button className="cta" onClick={next}>
            {index + 1 >= queue.length ? "結果を見る" : "次へ"}
          </button>
        </div>
      )}
    </div>
  );
}
