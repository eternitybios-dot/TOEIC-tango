import { useEffect, useMemo, useState } from "react";
import type { AppState, Route, Word } from "../types";
import { UNIT_META, WORDS, wordsByUnit } from "../data";
import { dueThenNew } from "../lib/stats";
import { speak } from "../lib/speech";
import { pickSession } from "../lib/quiz";

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

  function restart() {
    setQueue(pickSession(pool, SESSION));
    setIndex(0);
    setRevealed(false);
    setScore({ good: 0, again: 0 });
    setFinished(false);
  }

  const word = queue[index];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!word || finished) return;
      if (event.code === "Space") {
        event.preventDefault();
        setRevealed(true);
      }
      if (!revealed) return;
      if (event.key === "1") answer("again");
      if (event.key === "2") answer("good");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function answer(result: "again" | "good") {
    if (!word || finished) return;
    onReview(word, result);
    setScore((prev) => ({ ...prev, [result]: prev[result] + 1 }));
    if (index + 1 >= queue.length) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setRevealed(false);
  }

  if (queue.length === 0) {
    return (
      <div className="empty">
        <p>出題できる単語がありません。</p>
        <button className="cta" style={{ marginTop: 16 }} onClick={() => go({ name: "home" })}>
          ホームへ
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="result">
        <p className="tiny">SESSION CLEAR</p>
        <h2>
          {score.good}/{queue.length}
        </h2>
        <p className="muted" style={{ margin: "8px 0 22px" }}>
          覚えた {score.good} · もう一度 {score.again}
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

  return (
    <>
      <button className="back-link" onClick={() => go({ name: "home" })}>
        ← ホーム
      </button>
      <div className="progress-label">
        <span>{unit ? `UNIT ${unit} ${UNIT_META[unit].title}` : "復習＋新規"}</span>
        <span>
          {index + 1} / {queue.length}
        </span>
      </div>
      <div className="bar">
        <i style={{ width: `${((index + (revealed ? 0.5 : 0)) / queue.length) * 100}%` }} />
      </div>

      <div className="card-stage" onClick={() => setRevealed(true)}>
        <div className={`flip${revealed ? " revealed" : ""}`}>
          <div className="face">
            <span className="pos">{word.pos}</span>
            <div className="word">{word.word}</div>
            <div className="ipa">/{word.ipa}/</div>
            <p className="hint">タップして意味を表示</p>
          </div>
          <div className="face back">
            <span className="pos">{word.pos}</span>
            <div className="meaning">{word.meaning}</div>
            <p className="example">
              {word.example}
              <em>{word.exampleJa}</em>
            </p>
          </div>
        </div>
      </div>

      <div className="row actions">
        <button
          type="button"
          className="btn speak"
          onClick={(event) => {
            event.stopPropagation();
            speak(word.word);
          }}
          aria-label="発音"
        >
          ♪
        </button>
        <button
          type="button"
          className="btn again"
          onClick={(event) => {
            event.stopPropagation();
            answer("again");
          }}
        >
          もう一度
        </button>
        <button
          type="button"
          className="btn good"
          onClick={(event) => {
            event.stopPropagation();
            answer("good");
          }}
        >
          覚えた
        </button>
      </div>
    </>
  );
}
