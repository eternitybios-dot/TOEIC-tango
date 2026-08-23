import { useMemo } from "react";
import type { AppState, Route, Settings } from "../types";
import { catalog } from "../lib/catalog";
import { dashboard } from "../lib/stats";
import { todayKey } from "../lib/storage";
import { CountUp } from "../components/CountUp";
import { ProgressBar } from "../components/ProgressBar";
import { Ring } from "../components/Ring";
import { SettingsFields } from "../components/SettingsFields";

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

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function Stats({ state, go, onReset, onSettings, onGoal }: Props) {
  const cat = catalog(state.deck);
  const dash = useMemo(() => dashboard(state, cat.words), [state, cat.words]);
  const all = dash.all;
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
          記録
          <span>学習の記録</span>
        </div>
        <p className="streak">連続 {state.streak} 日</p>
      </header>

      <section className="hero hero-glow">
        <div className="hero-top">
          <Ring value={all.mastered} max={cat.words.length} size={100} stroke={8}>
            <b>
              <CountUp value={Math.round((all.mastered / cat.words.length) * 100)} />
            </b>
            <small>%</small>
          </Ring>
          <div className="hero-copy">
            <h2>全体の習得</h2>
            <p className="muted">
              {all.mastered} / {cat.words.length} 語
            </p>
            <p className="muted">期限 {all.due} 語 · 今日 {state.todayCount}/{state.goal}</p>
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
      <div className="heat-week" aria-hidden>
        {days.slice(0, 7).map((day) => {
          const [year, month, date] = day.split("-").map(Number);
          return <span key={day}>{WEEKDAYS[new Date(year, month - 1, date).getDay()]}</span>;
        })}
      </div>
      <div className="heat" aria-label="学習カレンダー">
        {days.map((day) => (
          <i key={day} className={studied.has(day) ? "lit" : ""} title={day} />
        ))}
      </div>
      <p className="tiny muted" style={{ margin: "8px 0 16px" }}>
        色がついた日に学習しています
      </p>

      {cat.parts.map((part) => {
        const stats = dash.parts[part.id];
        const total = cat.wordsByPart(part.id).length;
        const pct = Math.round((stats.mastered / total) * 100);
        return (
          <div key={part.id} className="unit-card" style={{ marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <span className="tiny">
                {part.label} · {part.score}
              </span>
              <strong>
                {stats.mastered}/{total}
              </strong>
              <ProgressBar value={pct} />
            </div>
          </div>
        );
      })}

      <p className="section-title">設定</p>
      <SettingsFields state={state} onSettings={onSettings} onGoal={onGoal} />

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
