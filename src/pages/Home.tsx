import { useMemo, useState } from "react";
import type { AppState, Route, Settings } from "../types";
import { PARTS } from "../types";
import { UNITS, UNIT_META, WORDS, wordsByPart, wordsByUnit } from "../data";
import { summarize } from "../lib/stats";
import { playSfx } from "../lib/feedback";
import { IconClose, IconFlame, IconGear } from "../components/Icons";
import { ProgressBar } from "../components/ProgressBar";
import { Ring } from "../components/Ring";
import { CountUp } from "../components/CountUp";
import { speak } from "../lib/speech";

type Props = {
  state: AppState;
  go: (route: Route) => void;
  onSettings: (settings: Partial<Settings>) => void;
  onGoal: (goal: number) => void;
};

export function Home({ state, go, onSettings, onGoal }: Props) {
  const all = summarize(state, WORDS);
  const remaining = Math.max(0, state.goal - state.todayCount);
  const [sheetUnit, setSheetUnit] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const daily = useMemo(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    return WORDS[day % WORDS.length];
  }, []);
  const sheet = sheetUnit ? UNIT_META[sheetUnit] : null;
  const sheetWords = sheetUnit ? wordsByUnit(sheetUnit) : [];
  const sheetStats = sheetUnit ? summarize(state, sheetWords) : null;

  function tap(route: Route) {
    go(route);
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          TARGET 1900
          <span>フレーズ単語帳</span>
        </div>
        <button className="icon-btn" aria-label="設定" onClick={() => setSettingsOpen(true)}>
          <IconGear />
        </button>
      </header>

      <section className="hero hero-glow">
        <div className="hero-top">
          <Ring value={state.todayCount} max={state.goal} size={88} stroke={7}>
            <b>
              <CountUp value={state.todayCount} />
            </b>
            <small>/{state.goal}</small>
          </Ring>
          <div className="hero-copy">
            <h2>今日のノルマ</h2>
            <p className="streak">
              <IconFlame size={16} /> 連続 {state.streak} 日
            </p>
            <p className="muted">
              {remaining === 0 ? "今日の目標は達成済み" : `あと ${remaining} 枚で目標`}
            </p>
          </div>
        </div>
        <ProgressBar value={state.todayCount} max={state.goal} />
        <button className="cta pulse-cta" onClick={() => tap({ name: "study", mode: "due" })}>
          {remaining === 0 ? "復習を続ける" : `今日の学習（残り ${remaining}）`}
        </button>
        {state.lastUnit ? (
          <button
            className="cta ghost"
            style={{ marginTop: 8 }}
            onClick={() => tap({ name: "study", unit: state.lastUnit!, mode: "unit" })}
          >
            UNIT {state.lastUnit} の続き
          </button>
        ) : null}
      </section>

      <section className="daily-card" onClick={() => speak(daily.phrase)} role="button" tabIndex={0}>
        <div className="progress-label">
          <span className="tiny gold">TODAY’S PHRASE</span>
          <span className="tiny">タップで発音</span>
        </div>
        <p className="phrase">{daily.phrase}</p>
        <p className="phrase-ja">{daily.phraseJa}</p>
        <p className="muted">
          {daily.word} · {daily.meaning}
        </p>
      </section>

      <p className="section-title">レベル</p>
      <div className="grid-3">
        {PARTS.map((part, i) => {
          const words = wordsByPart(part.id);
          const stats = summarize(state, words);
          const pct = Math.round((stats.mastered / Math.max(1, words.length)) * 100);
          return (
            <button
              key={part.id}
              className="part-card rise"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => tap({ name: "list", unit: words[0]?.unit })}
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
        {UNITS.map((unit, i) => {
          const words = wordsByUnit(unit);
          const stats = summarize(state, words);
          const meta = UNIT_META[unit];
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
                  UNIT {unit} · {PARTS[meta.part - 1].label}
                </span>
                <strong>{meta.title}</strong>
                <span className="muted">
                  習得 {stats.mastered}/{words.length} · 復習 {stats.due}
                </span>
              </div>
              <div className="unit-pct">{pct}%</div>
            </button>
          );
        })}
      </div>

      <p className="fineprint">
        見出し語は英単語ターゲット1900に出るタイプの受験頻出語です。短いフレーズと日本語はオリジナルです。
        全体 {all.mastered} 語習得 / 未学習 {all.new}
      </p>

      {sheet && sheetStats && sheetUnit ? (
        <div className="sheet-root" onClick={() => setSheetUnit(null)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="progress-label">
              <span className="tiny">
                UNIT {sheetUnit} · {PARTS[sheet.part - 1].label}
              </span>
              <button className="icon-btn" aria-label="閉じる" onClick={() => setSheetUnit(null)}>
                <IconClose size={18} />
              </button>
            </div>
            <h3>{sheet.title}</h3>
            <p className="muted">
              習得 {sheetStats.mastered}/{sheetWords.length} · 復習 {sheetStats.due} · 未学習 {sheetStats.new}
            </p>
            <ProgressBar value={sheetStats.mastered} max={sheetWords.length} />
            <div className="row" style={{ marginTop: 16 }}>
              <button className="cta" onClick={() => tap({ name: "study", unit: sheetUnit, mode: "unit" })}>
                カード
              </button>
              <button className="cta ghost" onClick={() => tap({ name: "quiz", unit: sheetUnit })}>
                クイズ
              </button>
            </div>
            <button className="text-btn" onClick={() => tap({ name: "list", unit: sheetUnit })}>
              単語一覧を見る
            </button>
          </div>
        </div>
      ) : null}

      {settingsOpen ? (
        <div className="sheet-root" onClick={() => setSettingsOpen(false)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="progress-label">
              <span className="tiny">SETTINGS</span>
              <button className="icon-btn" aria-label="閉じる" onClick={() => setSettingsOpen(false)}>
                <IconClose size={18} />
              </button>
            </div>
            <h3>学習設定</h3>
            <label className="setting">
              <span>1日の目標</span>
              <span className="stepper">
                <button onClick={() => onGoal(Math.max(5, state.goal - 5))}>−</button>
                <b>{state.goal}</b>
                <button onClick={() => onGoal(Math.min(80, state.goal + 5))}>＋</button>
              </span>
            </label>
            <label className="setting">
              <span>効果音</span>
              <button
                className={`switch${state.settings.sound ? " on" : ""}`}
                onClick={() => onSettings({ sound: !state.settings.sound })}
                aria-pressed={state.settings.sound}
              />
            </label>
            <label className="setting">
              <span>触覚フィードバック</span>
              <button
                className={`switch${state.settings.haptics ? " on" : ""}`}
                onClick={() => onSettings({ haptics: !state.settings.haptics })}
                aria-pressed={state.settings.haptics}
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
