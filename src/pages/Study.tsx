import { useEffect, useRef, useState, type PointerEvent } from "react";
import { type AppState, type Route, type SavedSession, type Word } from "../types";
import { catalog, type Catalog } from "../lib/catalog";
import { canResume, hydrateQueue, sessionOf } from "../lib/resume";
import { speak } from "../lib/speech";
import { explainMeaning } from "../lib/explain";
import { afterAgain, afterGood } from "../lib/quiz";
import { haptic, playSfx } from "../lib/feedback";
import { wait } from "../lib/motion";
import { dealQuiz, listMissed, mixLabel, mixNote, SESSION_SIZE, SHORT_SESSION, type QuizMix } from "../lib/session";
import { Burst } from "../components/Burst";
import { CountUp } from "../components/CountUp";
import { IconBack, IconSpeak } from "../components/Icons";
import { ProgressBar } from "../components/ProgressBar";

type Props = {
  state: AppState;
  unit?: number;
  part?: 1 | 2 | 3;
  mode?: "due" | "unit" | "missed";
  onReview: (word: Word, result: "again" | "good") => void;
  onResume: (session: SavedSession | null, kind: SavedSession["kind"]) => void;
  go: (route: Route) => void;
};

type Scope = { type: "all" } | { type: "part"; part: 1 | 2 | 3 } | { type: "unit"; unit: number };

function initialScope(
  unit?: number,
  part?: 1 | 2 | 3,
  lastUnit?: number | null,
  mode?: "due" | "unit" | "missed",
): Scope {
  if (unit) return { type: "unit", unit };
  if (part) return { type: "part", part };
  if (mode === "missed") return { type: "all" };
  return { type: "unit", unit: lastUnit ?? 1 };
}

function poolOf(scope: Scope, cat: Catalog): Word[] {
  if (scope.type === "unit") return cat.wordsByUnit(scope.unit);
  if (scope.type === "part") return cat.wordsByPart(scope.part);
  return cat.words;
}

function scopeLabel(scope: Scope, mix: QuizMix, cat: Catalog): string {
  const place =
    scope.type === "unit"
      ? `UNIT ${scope.unit}`
      : scope.type === "part"
        ? cat.parts.find((item) => item.id === scope.part)?.label ?? "このレベル"
        : "全体";
  return `${place} · ${mixLabel(mix)}`;
}

export function Study({ state, unit, part, mode: _mode = "due", onReview, onResume, go }: Props) {
  const cat = catalog(state.deck);
  const boot = (() => {
    if (!canResume(state.resume, "study", state.deck)) return null;
    const session = sessionOf(state.resume, "study")!;
    const nextQueue = hydrateQueue(session.queue, cat);
    if (nextQueue.length === 0) return null;
    return { session, queue: nextQueue, seen: hydrateQueue(session.seen, cat) };
  })();
  const [scope, setScope] = useState<Scope>(() => boot?.session.scope ?? initialScope(unit, part, state.lastUnit, _mode));
  const [mix, setMix] = useState<QuizMix>(() => boot?.session.mix ?? (_mode === "missed" ? "missed" : "due"));
  const [size, setSize] = useState(() => boot?.session.size ?? SESSION_SIZE);
  const [started, setStarted] = useState(() => Boolean(boot));
  const [sessionLen, setSessionLen] = useState(() => boot?.session.sessionLen ?? 0);
  const source = poolOf(scope, cat);
  const missedPool = listMissed(state, source);
  const poolCount = mix === "missed" ? missedPool.length : source.length;
  const [queue, setQueue] = useState<Word[]>(() => boot?.queue ?? []);
  const [index, setIndex] = useState(() => boot?.session.index ?? 0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(() =>
    boot ? { good: boot.session.good, again: boot.session.again } : { good: 0, again: 0 },
  );
  const [finished, setFinished] = useState(false);
  const [drag, setDrag] = useState(0);
  const [flight, setFlight] = useState<"good" | "again" | null>(null);
  const [seen, setSeen] = useState<Word[]>(() => boot?.seen ?? []);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const busy = useRef(false);
  const onResumeRef = useRef<(session: SavedSession | null) => void>((session) => onResume(session, "study"));
  const lastSaved = useRef("");
  onResumeRef.current = (session) => onResume(session, "study");

  const word = queue[index];
  const note = word ? explainMeaning(word, cat.words) : null;
  const remaining = queue.length;
  const done = Math.max(0, (queue.length > 0 ? sessionLen : score.good + score.again) - remaining);

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
    setSessionLen(nextQueue.length);
    setStarted(true);
  }

  function begin(nextMix = mix, nextScope = scope) {
    playSfx("tap", state.settings.sound);
    restart(dealQuiz(state, poolOf(nextScope, cat), nextMix, Date.now(), size));
  }

  function restoreSaved() {
    const session = sessionOf(state.resume, "study");
    if (!canResume(state.resume, "study", state.deck) || !session) return;
    playSfx("tap", state.settings.sound);
    setScope(session.scope);
    setMix(session.mix);
    setSize(session.size);
    setQueue(hydrateQueue(session.queue, cat));
    setIndex(session.index);
    setSeen(hydrateQueue(session.seen, cat));
    setScore({ good: session.good, again: session.again });
    setSessionLen(session.sessionLen);
    setRevealed(false);
    setFinished(false);
    setStarted(true);
  }

  useEffect(() => {
    if (!started || finished || queue.length === 0) return;
    const payload = {
      kind: "study" as const,
      deck: state.deck,
      mix,
      size,
      scope,
      queue: queue.map((item) => item.id),
      index,
      seen: seen.map((item) => item.id),
      good: score.good,
      again: score.again,
      score: 0,
      missed: [],
      quizMode: "en-ja" as const,
      sessionLen,
    };
    const raw = JSON.stringify(payload);
    if (raw === lastSaved.current) return;
    lastSaved.current = raw;
    onResumeRef.current(payload);
  }, [started, finished, queue, index, seen, score, mix, size, scope, sessionLen, state.deck]);

  useEffect(() => {
    if (!finished) return;
    lastSaved.current = "";
    onResumeRef.current(null);
  }, [finished]);

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
        {missedPool.length > 0 ? (
          <button
            className="cta"
            onClick={() => {
              setMix("missed");
              begin("missed");
            }}
          >
            まちがいを集中
          </button>
        ) : null}
        <button className={`cta${missedPool.length > 0 ? " ghost" : ""}`} style={{ marginTop: missedPool.length > 0 ? 10 : 0 }} onClick={() => begin()}>
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
        <h2 className="quiz-setup-title">100問ずつ覚える</h2>
        <p className="section-title">セット</p>
        <div className="filters">
          <button className={`chip${size === SESSION_SIZE ? " on" : ""}`} onClick={() => setSize(SESSION_SIZE)}>
            100問
          </button>
          <button className={`chip${size === SHORT_SESSION ? " on" : ""}`} onClick={() => setSize(SHORT_SESSION)}>
            10問
          </button>
        </div>
        <p className="section-title">UNIT</p>
        <div className="filters">
          {cat.units.map((item) => (
            <button
              key={item}
              className={`chip${scope.type === "unit" && scope.unit === item ? " on" : ""}`}
              onClick={() => setScope({ type: "unit", unit: item })}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="section-title">レベル</p>
        <div className="filters">
          <button className={`chip${scope.type === "all" ? " on" : ""}`} onClick={() => setScope({ type: "all" })}>
            すべて
          </button>
          {cat.parts.map((item) => (
            <button
              key={item.id}
              className={`chip${scope.type === "part" && scope.part === item.id ? " on" : ""}`}
              onClick={() => setScope({ type: "part", part: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="section-title">出題</p>
        <div className="filters">
          <button className={`chip${mix === "due" ? " on" : ""}`} onClick={() => setMix("due")}>
            覚える
          </button>
          <button className={`chip${mix === "random" ? " on" : ""}`} onClick={() => setMix("random")}>
            ランダム
          </button>
          <button className={`chip${mix === "missed" ? " on" : ""}`} onClick={() => setMix("missed")}>
            集中
          </button>
        </div>
        <p className="muted" style={{ margin: "8px 0 18px" }}>
          {poolCount}語から {Math.min(size, poolCount)}枚 · {mixNote(mix, missedPool.length)}
        </p>
        {canResume(state.resume, "study", state.deck) ? (
          <button className="cta" onClick={restoreSaved}>
            続きから
          </button>
        ) : null}
        <button
          className={`cta${canResume(state.resume, "study", state.deck) ? " ghost" : ""}`}
          style={{ marginTop: canResume(state.resume, "study", state.deck) ? 10 : 0 }}
          onClick={() => begin()}
          disabled={mix === "missed" && missedPool.length === 0}
        >
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
        <span>{scopeLabel(scope, mix, cat)}</span>
        <span>残り {remaining}</span>
      </div>
      <ProgressBar value={done + (revealed ? 0.35 : 0)} max={Math.max(1, sessionLen)} />

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
