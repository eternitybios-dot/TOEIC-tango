import { useMemo } from "react";
import type { AppState, Route, Settings } from "../types";
import { PARTS } from "../types";
import { WORDS, wordsByPart } from "../data";
import { summarize } from "../lib/stats";
import { todayKey } from "../lib/storage";
import { CountUp } from "../components/CountUp";
import { ProgressBar } from "../components/ProgressBar";
import { Ring } from "../components/Ring";

type Props = {
  state: AppState;
  go: (route: Route) => void;
  onReset: () => void;
  onSettings: (settings: Partial<Settings>) => void;
  onGoal: (goal: number) => void;
};

function lastDays(count: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(todayKey(d));
  }
  return days;
}

export function Stats({ state, go, onReset, onSettings, onGoal }: Props) {
  const all = summarize(state, WORDS);
  const days = useMemo(() => lastDays(35), []);
  const studied = new Set(state.studyDays);
  const accuracy = (() => {
    let correct = 0;
    let wrong = 0;
    for (const progress of Object.values(state.progress)) {
      correct += progress.correct;
      wrong += progress.wrong;
    }
    const total = correct + wrong;
    return total === 0 ? 0 : Math.round((correct / total) * 100);
  })();

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          PROGRESS
          <span>学習記録</span>
        </div>
        <div className="muted">連続 {state.streak} 日</div>
      </header>

      <section className="hero hero-glow">
        <div className="hero-top">
          <Ring value={all.mastered} max={WORDS.length} size={100} stroke={8}>
            <b>
              <CountUp value={Math.round((all.mastered / WORDS.length) * 100)} />
            </b>
            <small>%</small>
          </Ring>
          <div className="hero-copy">
            <h2>全体の習得</h2>
            <p className="muted">
              {all.mastered} / {WORDS.length} 語
            </p>
            <p className="muted">今日 {state.todayCount} 枚 · 目標 {state.goal}</p>
          </div>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card rise">
          <span className="tiny">習得</span>
          <div className="num">
            <CountUp value={all.mastered} />
          </div>
        </div>
        <div className="stat-card rise" style={{ animationDelay: "50ms" }}>
          <span className="tiny">正答率</span>
          <div className="num">
            <CountUp value={accuracy} />%
          </div>
        </div>
        <div className="stat-card rise" style={{ animationDelay: "90ms" }}>
          <span className="tiny">学習中</span>
          <div className="num">
            <CountUp value={all.learning + all.reviewing} />
          </div>
        </div>
        <div className="stat-card rise" style={{ animationDelay: "130ms" }}>
          <span className="tiny">未学習</span>
          <div className="num">
            <CountUp value={all.new} />
          </div>
        </div>
      </div>

      <p className="section-title">直近 5 週間</p>
      <div className="heat" aria-label="学習カレンダー">
        {days.map((day) => (
          <i key={day} className={studied.has(day) ? "lit" : ""} title={day} />
        ))}
      </div>
      <p className="tiny muted" style={{ margin: "8px 0 16px" }}>
        色がついた日に学習しています
      </p>

      {PARTS.map((part) => {
        const words = wordsByPart(part.id);
        const stats = summarize(state, words);
        const pct = Math.round((stats.mastered / words.length) * 100);
        return (
          <div key={part.id} className="unit-card" style={{ marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <span className="tiny">
                {part.label} · {part.score}
              </span>
              <strong>
                {stats.mastered}/{words.length}
              </strong>
              <ProgressBar value={pct} />
            </div>
          </div>
        );
      })}

      <p className="section-title">設定</p>
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
        />
      </label>
      <label className="setting">
        <span>触覚フィードバック</span>
        <button
          className={`switch${state.settings.haptics ? " on" : ""}`}
          onClick={() => onSettings({ haptics: !state.settings.haptics })}
        />
      </label>

      <button className="cta" style={{ marginTop: 16 }} onClick={() => go({ name: "study", mode: "due" })}>
        復習する
      </button>
      <button
        className="cta ghost"
        style={{ marginTop: 10 }}
        onClick={() => {
          if (window.confirm("この端末の学習記録をすべて消しますか？")) onReset();
        }}
      >
        記録をリセット
      </button>
    </div>
  );
}
