import type { AppState, Route } from "../types";
import { PARTS } from "../types";
import { UNITS, UNIT_META, WORDS, wordsByPart, wordsByUnit } from "../data";
import { summarize } from "../lib/stats";

type Props = {
  state: AppState;
  go: (route: Route) => void;
};

export function Home({ state, go }: Props) {
  const all = summarize(state, WORDS);
  const remaining = Math.max(0, state.goal - state.todayCount);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          TARGET TOEIC
          <span>単語帳</span>
        </div>
        <div className="muted">全 {WORDS.length} 語</div>
      </header>

      <section className="hero">
        <h2>今日のノルマ</h2>
        <div className="goal-row">
          <div className="goal-num">
            {state.todayCount}
            <small>/ {state.goal}</small>
          </div>
          <div className="streak">連続 {state.streak} 日</div>
        </div>
        <div className="bar">
          <i style={{ width: `${Math.min(100, (state.todayCount / state.goal) * 100)}%` }} />
        </div>
        <button className="cta" onClick={() => go({ name: "study", mode: "due" })}>
          {remaining === 0 ? "復習を続ける" : `今日の学習（残り ${remaining}）`}
        </button>
      </section>

      <p className="section-title">レベル</p>
      <div className="grid-2">
        {PARTS.map((part) => {
          const stats = summarize(state, wordsByPart(part.id));
          const pct = Math.round((stats.mastered / Math.max(1, wordsByPart(part.id).length)) * 100);
          return (
            <button
              key={part.id}
              className="part-card"
              onClick={() => go({ name: "list", unit: wordsByPart(part.id)[0]?.unit })}
            >
              <span className="tiny">TOEIC {part.score}</span>
              <strong>{part.label}</strong>
              <span className="muted">{part.subtitle}</span>
              <div className="bar" style={{ marginBottom: 0, marginTop: 10 }}>
                <i style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      <p className="section-title">UNIT</p>
      <div className="unit-list">
        {UNITS.map((unit) => {
          const words = wordsByUnit(unit);
          const stats = summarize(state, words);
          const meta = UNIT_META[unit];
          return (
            <button key={unit} className="unit-card" onClick={() => go({ name: "study", unit, mode: "unit" })}>
              <div>
                <span className="tiny">UNIT {unit} · {PARTS[meta.part - 1].label}</span>
                <strong>{meta.title}</strong>
                <span className="muted">
                  {stats.mastered}/{words.length} 習得 · 復習 {stats.due}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="muted" style={{ marginTop: 18, lineHeight: 1.7 }}>
        見出し語は英単語ターゲット系の高頻度語と TOEIC ビジネス語をベースにしています。定義・例文はオリジナルです。
      </p>
      <p className="muted" style={{ marginTop: 8 }}>
        全体 {all.mastered} 語習得 / 未学習 {all.new}
      </p>
    </>
  );
}
