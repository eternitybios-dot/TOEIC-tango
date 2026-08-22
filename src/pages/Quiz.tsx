import { useMemo, useState } from "react";
import type { AppState, Route, Word } from "../types";
import { UNIT_META, WORDS, wordsByUnit } from "../data";
import { explainMeaning } from "../lib/explain";
import { pickChoices, pickSession } from "../lib/quiz";
import { speak } from "../lib/speech";
import { haptic, playSfx } from "../lib/feedback";
import { Burst } from "../components/Burst";
import { CountUp } from "../components/CountUp";
import { IconBack } from "../components/Icons";
import { ProgressBar } from "../components/ProgressBar";

type Props = {
  state: AppState;
  unit?: number;
  onReview: (word: Word, result: "again" | "good") => void;
  go: (route: Route) => void;
};

const SESSION = 10;

export function Quiz({ state, unit, onReview, go }: Props) {
  const pool = unit ? wordsByUnit(unit) : WORDS;
  const [queue] = useState(() => pickSession(pool, SESSION));
  const [index, setIndex] = useState(0);
  const [jaToEn, setJaToEn] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [shake, setShake] = useState(false);

  const word = queue[index];
  const choices = useMemo(() => (word ? pickChoices(word, pool, 4) : []), [word, pool]);
  const isCorrect = picked !== null && picked === word?.id;
  const meaning = word && picked !== null ? explainMeaning(word) : null;

  function choose(choice: Word) {
    if (!word || picked !== null) return;
    setPicked(choice.id);
    const ok = choice.id === word.id;
    playSfx(ok ? "correct" : "wrong", state.settings.sound);
    haptic(ok ? [8, 20, 12] : [30, 20, 30], state.settings.haptics);
    if (ok) setScore((n) => n + 1);
    else {
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
    }
    onReview(word, ok ? "good" : "again");
  }

  function next() {
    playSfx("tap", state.settings.sound);
    if (index + 1 >= queue.length) {
      setFinished(true);
      playSfx("done", state.settings.sound);
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  }

  if (finished) {
    return (
      <div className="page result">
        <Burst />
        <p className="tiny gold">QUIZ</p>
        <h2>
          <CountUp value={score} />
          <small>/{queue.length}</small>
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
    return <div className="page empty">出題できる単語がありません。</div>;
  }

  return (
    <div className={`page${shake ? " shake" : ""}`}>
      <button className="back-link" onClick={() => go({ name: "home" })}>
        <IconBack /> ホーム
      </button>
      <div className="progress-label">
        <span>{unit ? `UNIT ${unit} ${UNIT_META[unit].title}` : "全範囲"}</span>
        <span>
          {index + 1} / {queue.length}
        </span>
      </div>
      <ProgressBar value={index + (picked !== null ? 0.5 : 0)} max={queue.length} />

      <div className="row" style={{ marginBottom: 8 }}>
        <button className={`chip${jaToEn ? "" : " on"}`} disabled={picked !== null} onClick={() => setJaToEn(false)}>
          英 → 和
        </button>
        <button className={`chip${jaToEn ? " on" : ""}`} disabled={picked !== null} onClick={() => setJaToEn(true)}>
          和 → 英
        </button>
        <button className="chip" onClick={() => speak(word.phrase)}>
          発音
        </button>
      </div>

      <div className="quiz-stage" key={word.id}>
        {jaToEn ? (
          <>
            <p className="quiz-prompt quiz-prompt-ja">{word.phraseJa}</p>
            <p className="quiz-sub">{word.pos} · 英語のフレーズを選ぶ</p>
          </>
        ) : (
          <>
            <p className="quiz-prompt quiz-prompt-en">{word.phrase}</p>
            <p className="quiz-sub">{word.pos} · 日本語のフレーズを選ぶ</p>
          </>
        )}
      </div>

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
            {jaToEn ? choice.phrase : choice.phraseJa}
          </button>
        );
      })}

      {picked !== null && meaning && (
        <section className={`explain slide-up${isCorrect ? " ok" : " ng"}`}>
          <p className="explain-result">{isCorrect ? "正解" : "不正解"}</p>
          <p className="explain-word">
            {word.word}
            <small>{word.pos}</small>
          </p>
          <p className="explain-gloss">{meaning.gloss}</p>
          {meaning.sections.map((section) => (
            <div key={section.title} className="explain-block">
              <p className="explain-label">{section.title}</p>
              <p className="explain-body">{section.body}</p>
            </div>
          ))}
          <button className="cta" style={{ marginTop: 14 }} onClick={next}>
            {index + 1 >= queue.length ? "結果を見る" : "次へ"}
          </button>
        </section>
      )}
    </div>
  );
}
