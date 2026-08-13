import { useMemo, useState } from "react";
import type { Route, Word } from "../types";
import { UNIT_META, WORDS, wordsByUnit } from "../data";
import { pickChoices, pickSession } from "../lib/quiz";
import { speak } from "../lib/speech";

type Props = {
  unit?: number;
  onReview: (word: Word, result: "again" | "good") => void;
  go: (route: Route) => void;
};

const SESSION = 10;

export function Quiz({ unit, onReview, go }: Props) {
  const pool = unit ? wordsByUnit(unit) : WORDS;
  const [queue] = useState(() => pickSession(pool, SESSION));
  const [index, setIndex] = useState(0);
  const [jaToEn, setJaToEn] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const word = queue[index];
  const choices = useMemo(
    () => (word ? pickChoices(word, pool, 4) : []),
    [word, pool],
  );

  function choose(choice: Word) {
    if (!word || picked !== null) return;
    setPicked(choice.id);
    const ok = choice.id === word.id;
    if (ok) setScore((n) => n + 1);
    onReview(word, ok ? "good" : "again");
  }

  function next() {
    if (index + 1 >= queue.length) {
      setFinished(true);
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  }

  if (finished) {
    return (
      <div className="result">
        <p className="tiny">QUIZ</p>
        <h2>
          {score}/{queue.length}
        </h2>
        <p className="muted" style={{ margin: "8px 0 22px" }}>
          {score >= 8 ? "この調子で次の UNIT へ。" : "間違えた語は単語帳で復習を。"}
        </p>
        <div className="row">
          <button className="cta ghost" onClick={() => go({ name: "study", unit, mode: unit ? "unit" : "due" })}>
            カードへ
          </button>
          <button className="cta" onClick={() => go({ name: "home" })}>
            ホーム
          </button>
        </div>
      </div>
    );
  }

  if (!word) {
    return <div className="empty">出題できる単語がありません。</div>;
  }

  return (
    <>
      <button className="back-link" onClick={() => go({ name: "home" })}>
        ← ホーム
      </button>
      <div className="progress-label">
        <span>{unit ? `UNIT ${unit} ${UNIT_META[unit].title}` : "全範囲"}</span>
        <span>
          {index + 1} / {queue.length}
        </span>
      </div>
      <div className="bar">
        <i style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      <div className="row" style={{ marginBottom: 8 }}>
        <button className={`chip${jaToEn ? "" : " on"}`} onClick={() => setJaToEn(false)}>
          英 → 和
        </button>
        <button className={`chip${jaToEn ? " on" : ""}`} onClick={() => setJaToEn(true)}>
          和 → 英
        </button>
        <button className="chip" onClick={() => speak(word.word)}>
          発音
        </button>
      </div>

      {jaToEn ? (
        <>
          <p className="quiz-prompt" style={{ fontFamily: "var(--font)", fontSize: 28 }}>
            {word.meaning}
          </p>
          <p className="quiz-sub">{word.pos} · 英語を選ぶ</p>
        </>
      ) : (
        <>
          <p className="quiz-prompt">{word.word}</p>
          <p className="quiz-sub">/{word.ipa}/ · 意味を選ぶ</p>
        </>
      )}

      {choices.map((choice) => {
        const selected = picked === choice.id;
        const correct = picked !== null && choice.id === word.id;
        const wrong = selected && choice.id !== word.id;
        return (
          <button
            key={choice.id}
            className={`choice${correct ? " correct" : ""}${wrong ? " wrong" : ""}`}
            onClick={() => choose(choice)}
          >
            {jaToEn ? choice.word : choice.meaning}
          </button>
        );
      })}

      {picked !== null && (
        <button className="cta" style={{ marginTop: 10 }} onClick={next}>
          {index + 1 >= queue.length ? "結果を見る" : "次へ"}
        </button>
      )}
    </>
  );
}
