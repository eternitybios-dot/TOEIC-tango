import { useEffect, useMemo, useState } from "react";
import type { AppState, Route, Word } from "../types";
import { UNIT_META, WORDS, wordsByUnit } from "../data";
import { dueThenNew } from "../lib/stats";
import { speak } from "../lib/speech";
import { afterAgain, afterGood, pickSession } from "../lib/quiz";

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
  const remaining = queue.length;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!word || finished) return;
      if (event.code === "Space") {
        event.preventDefault();
        setRevealed((open) => !open);
      }
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "1") answer("again");
      if (event.key === "2") answer("good");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function goPrev() {
    if (index === 0 || finished) return;
    setIndex((current) => current - 1);
    setRevealed(false);
  }

  function answer(result: "again" | "good") {
    if (!word || finished) return;
    onReview(word, result);
    setScore((prev) => ({ ...prev, [result]: prev[result] + 1 }));
    const next = result === "good" ? afterGood(queue, index) : afterAgain(queue, index);
    setQueue(next.queue);
    setIndex(next.index);
    setRevealed(false);
    setFinished(next.finished);
  }

  if (queue.length === 0 && !finished) {
    return (
      <div className="empty">
        <p>出題できる単語がありません。</p>
        <button className="cta" style={{ marginTop: 16 }} onClick={() => go({ name: "home" })}>
          ホームへ
        </button>
      </div>
    );
  }

  if (finished || !word) {
    return (
      <div className="result">
        <p className="tiny">SESSION CLEAR</p>
        <h2>
          {score.good}
          <small style={{ fontSize: 18, color: "var(--muted)" }}> 覚えた</small>
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

  return (
    <>
      <button className="back-link" onClick={() => go({ name: "home" })}>
        ← ホーム
      </button>
      <div className="progress-label">
        <span>{unit ? `UNIT ${unit} ${UNIT_META[unit].title}` : "復習＋新規"}</span>
        <span>残り {remaining}</span>
      </div>
      <div className="bar">
        <i style={{ width: `${((SESSION - remaining + (revealed ? 0.3 : 0)) / SESSION) * 100}%` }} />
      </div>

      <div
        className="card-stage"
        onClick={() => setRevealed((open) => !open)}
        role="button"
        tabIndex={0}
      >
        <div className="face static-face">
          {revealed ? (
            <>
              <span className="pos">{word.pos}</span>
              <div className="meaning">{word.meaning}</div>
              <p className="phrase">
                {word.phrase}
                <span className="phrase-ja">{word.phraseJa}</span>
              </p>
              <p className="hint">タップで単語に戻る</p>
            </>
          ) : (
            <>
              <span className="pos">{word.pos}</span>
              <div className="word">{word.word}</div>
              {word.ipa ? <div className="ipa">/{word.ipa}/</div> : null}
              <p className="hint">タップしてフレーズを表示</p>
            </>
          )}
        </div>
      </div>

      <div className="row actions" style={{ marginBottom: 10 }}>
        <button
          type="button"
          className="btn again"
          disabled={index === 0}
          onClick={(event) => {
            event.stopPropagation();
            goPrev();
          }}
        >
          前のカード
        </button>
        <button
          type="button"
          className="btn ghost-wide"
          onClick={(event) => {
            event.stopPropagation();
            setRevealed((open) => !open);
          }}
        >
          {revealed ? "単語に戻す" : "フレーズを見る"}
        </button>
        <button
          type="button"
          className="btn speak"
          onClick={(event) => {
            event.stopPropagation();
            speak(revealed ? word.phrase : word.word);
          }}
          aria-label="発音"
        >
          ♪
        </button>
      </div>

      <div className="row actions">
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
      <p className="muted" style={{ marginTop: 10, textAlign: "center" }}>
        もう一度はこのセットのあとで再出題。覚えたら外します。
      </p>
    </>
  );
}
