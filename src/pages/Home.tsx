import { useMemo, useState } from "react";
import type { AppState, DeckId, Route, Settings } from "../types";
import { catalog, DECK_LIST } from "../lib/catalog";
import { dashboard } from "../lib/stats";
import { listMissed } from "../lib/session";
import { canResume, sessionRemaining } from "../lib/resume";
import { playSfx } from "../lib/feedback";
import { IconClose, IconFlame, IconGear, IconSpeak } from "../components/Icons";
import { ProgressBar } from "../components/ProgressBar";
import { Ring } from "../components/Ring";
import { CountUp } from "../components/CountUp";
import { SettingsFields } from "../components/SettingsFields";
import { speak } from "../lib/speech";

type Props = {
  state: AppState;
  go: (route: Route) => void;
  onSettings: (settings: Partial<Settings>) => void;
  onGoal: (goal: number) => void;
  onDeck: (deck: DeckId) => void;
};

export function Home({ state, go, onSettings, onGoal, onDeck }: Props) {
  const cat = useMemo(() => catalog(state.deck), [state.deck]);
  const { words, units, unitMeta, parts, meta } = cat;
  const dash = useMemo(() => dashboard(state, words), [state, words]);
  const remaining = Math.max(0, state.goal - state.todayCount);
  const dueNow = dash.all.due;
  const missedNow = listMissed(state, words).length;
  const [sheetUnit, setSheetUnit] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const daily = useMemo(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    return words[day % words.length];
  }, [words]);
  const sheet = sheetUnit ? unitMeta[sheetUnit] : null;
  const sheetWords = sheetUnit ? cat.wordsByUnit(sheetUnit) : [];
  const sheetStats = sheetUnit ? dash.units[sheetUnit] : null;
  const resumeStudy = canResume(state.resume, "study", state.deck);
  const resumeQuiz = canResume(state.resume, "quiz", state.deck);
  const resumeLeft = resumeStudy
    ? sessionRemaining(state.resume, "study", state.deck)
    : sessionRemaining(state.resume, "quiz", state.deck);

  const cta = dueNow > 0
    ? `復習する（${Math.min(100, dueNow)}語）`
    : remaining === 0
      ? "復習を続ける"
      : "新しい語を学ぶ";

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          {meta.kicker}
          <span>{meta.title}</span>
        </div>
        <button className="icon-btn" aria-label="設定" onClick={() => setSettingsOpen(true)}>
          <IconGear />
        </button>
      </header>

      <div className="deck-switch" role="tablist" aria-label="単語セット">
        {DECK_LIST.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={state.deck === item.id}
            className={`deck-card${state.deck === item.id ? " on" : ""}`}
            onClick={() => onDeck(item.id)}
          >
            <span className="tiny">{item.kicker}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </div>

      <section className="hero hero-glow">
        <div className="hero-top">
          <Ring value={state.todayCount} max={state.goal} size={88} stroke={7}>
            <b>
              <CountUp value={state.todayCount} />
            </b>
            <small>/{state.goal}</small>
          </Ring>
          <div className="hero-copy">
            <h2>今やること</h2>
            <p className="streak">
              <IconFlame size={16} /> 連続 {state.streak} 日
            </p>
            <p className="muted">復習待ち {dueNow} 語 · 今日 {state.todayCount} / {state.goal}</p>
          </div>
        </div>
        <ProgressBar value={state.todayCount} max={state.goal} />
        {resumeStudy || resumeQuiz ? (
          <button
            className="cta"
            onClick={() => go({ name: resumeQuiz && !resumeStudy ? "quiz" : "study" })}
          >
            続きから（残り {resumeLeft}）
          </button>
        ) : (
          <button className="cta" onClick={() => go({ name: "study", mode: "due" })}>
            {cta}
          </button>
        )}
        {resumeStudy || resumeQuiz ? (
          <button className="cta ghost" style={{ marginTop: 8 }} onClick={() => go({ name: "study", mode: "due" })}>
            {cta}
          </button>
        ) : null}
        {missedNow > 0 ? (
          <button
            className="cta ghost"
            style={{ marginTop: 8 }}
            onClick={() => go({ name: "study", mode: "missed" })}
          >
            まちがい集中（{missedNow}語）
          </button>
        ) : null}
        {state.lastUnit ? (
          <button
            className="cta ghost"
            style={{ marginTop: 8 }}
            onClick={() => go({ name: "study", unit: state.lastUnit!, mode: "unit" })}
          >
            UNIT {state.lastUnit} を続ける
          </button>
        ) : null}
      </section>

      <section
        className="daily-card"
        onClick={() => speak(daily.phrase)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            speak(daily.phrase);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="progress-label">
          <span className="tiny gold">今日のフレーズ</span>
          <span className="tiny">
            <IconSpeak size={14} /> 発音
          </span>
        </div>
        <p className="phrase">{daily.phrase}</p>
        <p className="phrase-ja">{daily.phraseJa}</p>
        <p className="muted">
          {daily.word} · {daily.meaning}
        </p>
      </section>

      <p className="section-title">レベル</p>
      <div className="grid-3">
        {parts.map((part, i) => {
          const words = cat.wordsByPart(part.id);
          const stats = dash.parts[part.id];
          const pct = Math.round((stats.mastered / Math.max(1, words.length)) * 100);
          return (
            <button
              key={part.id}
              className={`part-card part-${part.id} rise`}
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => go({ name: "quiz", part: part.id })}
            >
              <span className="tiny">{part.score}</span>
              <strong>{part.label}</strong>
              <span className="muted">{pct}%</span>
              <ProgressBar value={pct} />
            </button>
          );
        })}
      </div>

      <p className="section-title">UNIT</p>
      <div className="unit-list">
        {units.map((unit, i) => {
          const words = cat.wordsByUnit(unit);
          const stats = dash.units[unit] ?? { mastered: 0, due: 0, new: 0 };
          const info = unitMeta[unit];
          const pct = Math.round((stats.mastered / words.length) * 100);
          return (
            <button
              key={unit}
              className="unit-card rise"
              style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
              onClick={() => {
                playSfx("tap", state.settings.sound);
                setSheetUnit(unit);
              }}
            >
              <div>
                <span className="tiny">
                  UNIT {unit} · {parts.find((item) => item.id === info.part)?.label ?? ""}
                </span>
                <strong>{info.title}</strong>
                <span className="muted">
                  習得 {stats.mastered}/{words.length} · 復習待ち {stats.due}
                </span>
              </div>
              <div className="unit-pct">{pct}%</div>
            </button>
          );
        })}
      </div>

      <p className="fineprint">
        書籍の転載ではありません。受験でよく出る語に、オリジナルの短いフレーズを付けています。
        全体 {dash.all.mastered} 語習得 / 未学習 {dash.all.new}
      </p>

      {sheet && sheetStats && sheetUnit ? (
        <div className="sheet-root" onClick={() => setSheetUnit(null)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unit-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="progress-label">
              <span className="tiny">
                UNIT {sheetUnit} · {parts.find((item) => item.id === sheet.part)?.label ?? ""}
              </span>
              <button className="icon-btn" aria-label="閉じる" onClick={() => setSheetUnit(null)}>
                <IconClose size={18} />
              </button>
            </div>
            <h3 id="unit-sheet-title">{sheet.title}</h3>
            <p className="muted">
              習得 {sheetStats.mastered}/{sheetWords.length} · 復習待ち {sheetStats.due} · 未学習 {sheetStats.new}
            </p>
            <ProgressBar value={sheetStats.mastered} max={sheetWords.length} />
            <div className="row" style={{ marginTop: 16 }}>
              <button className="cta" onClick={() => go({ name: "study", unit: sheetUnit, mode: "unit" })}>
                カード
              </button>
              <button className="cta ghost" onClick={() => go({ name: "quiz", unit: sheetUnit })}>
                クイズ
              </button>
            </div>
            <button className="text-btn" onClick={() => go({ name: "list", unit: sheetUnit })}>
              単語一覧を見る
            </button>
          </div>
        </div>
      ) : null}

      {settingsOpen ? (
        <div className="sheet-root" onClick={() => setSettingsOpen(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="progress-label">
              <span className="tiny">設定</span>
              <button className="icon-btn" aria-label="閉じる" onClick={() => setSettingsOpen(false)}>
                <IconClose size={18} />
              </button>
            </div>
            <h3 id="settings-title">学習設定</h3>
            <SettingsFields state={state} onSettings={onSettings} onGoal={onGoal} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
