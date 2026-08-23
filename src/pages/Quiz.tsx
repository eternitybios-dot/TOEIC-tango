import { useMemo, useState } from "react";
import type { AppState, Route, Word } from "../types";
import { UNIT_META, WORDS, wordsByUnit } from "../data";
import { explainMeaning } from "../lib/explain";
import { clozePhrase, phraseParts, pickChoices, pickSession } from "../lib/quiz";
import { dealSession, SESSION_SIZE } from "../lib/session";
import { speak } from "../lib/speech";
import { haptic, playSfx } from "../lib/feedback";
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

  const word = queue[index];
  const choices = useMemo(() => (word ? pickChoices(word, source, 4) : []), [word, source]);
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
    playSfx("tap", state.settings.sound);
    if (index + 1 >= queue.length) {
      setFinished(true);
      playSfx("done", state.settings.sound);
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  }

  function label(choice: Word) {
    if (mode === "cloze") return `${choice.word}  ${choice.meaning}`;
    if (mode === "ja-en") return `${choice.word}  ${choice.phrase}`;
    return `${choice.meaning}  ${choice.phraseJa}`;
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
    <div className={`page${shake ? " shake" : ""}`}>
      <button className="back-link" onClick={() => go({ name: "home" })}>
        <IconBack /> ホーム
      </button>
      <div className="progress-label">
        <span>{unit ? `UNIT ${unit} ${UNIT_META[unit].title}` : "期限＋新規"}</span>
        <span>
          {index + 1} / {queue.length}
        </span>
      </div>
      <ProgressBar value={index + (picked !== null ? 0.5 : 0)} max={queue.length} />

      <div className="row" style={{ marginBottom: 8 }}>
        <button className={`chip${mode === "en-ja" ? " on" : ""}`} disabled={picked !== null} onClick={() => setMode("en-ja")}>
          英 → 和
        </button>
        <button className={`chip${mode === "ja-en" ? " on" : ""}`} disabled={picked !== null} onClick={() => setMode("ja-en")}>
          和 → 英
        </button>
        <button className={`chip${mode === "cloze" ? " on" : ""}`} disabled={picked !== null} onClick={() => setMode("cloze")}>
          空所
        </button>
        <button className="chip" onClick={() => speak(mode === "cloze" && picked === null ? word.phrase : word.word)}>
          発音
        </button>
      </div>

      <div className="quiz-stage" key={`${word.id}-${mode}`}>
        <div className="quiz-word">
          <p>
            {mode === "cloze" && picked === null ? "______" : word.word}
            <small>{word.pos}</small>
          </p>
        </div>
        {mode === "ja-en" ? (
          <p className="quiz-prompt quiz-prompt-ja">{word.phraseJa}</p>
        ) : mode === "cloze" ? (
          <p className="quiz-prompt quiz-prompt-en">{clozePhrase(word)}</p>
        ) : (
          <p className="quiz-prompt quiz-prompt-en">
            {phraseParts(word).map((part, i) =>
              part.hit ? <mark key={`${part.text}-${i}`}>{part.text}</mark> : <span key={`${part.text}-${i}`}>{part.text}</span>,
            )}
          </p>
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
            {label(choice)}
          </button>
        );
      })}

      {picked !== null && meaning && pickedWord && (
        <section className={`explain slide-up${isCorrect ? " ok" : " ng"}`} aria-live="polite">
          <p className="explain-result">{isCorrect ? "正解" : "不正解"}</p>
          {!isCorrect && (
            <p className="explain-compare">
              あなたの答え {pickedWord.word}「{pickedWord.meaning}」
              <br />
              正解 {word.word}「{word.meaning}」
            </p>
          )}
          <p className="explain-word">
            {word.word}
            <small>{word.pos}</small>
          </p>
          <p className="explain-gloss">{meaning.gloss}</p>
          {meaning.lines.map((line) => (
            <p key={line} className="explain-body">
              {line}
            </p>
          ))}
          <button className="cta" style={{ marginTop: 14 }} onClick={next}>
            {index + 1 >= queue.length ? "結果を見る" : "次へ"}
          </button>
        </section>
      )}
    </div>
  );
}
