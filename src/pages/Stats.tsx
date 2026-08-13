import type { AppState, Route } from "../types";
import { PARTS } from "../types";
import { WORDS, wordsByPart } from "../data";
import { summarize } from "../lib/stats";

type Props = {
  state: AppState;
  go: (route: Route) => void;
  onReset: () => void;
};

export function Stats({ state, go, onReset }: Props) {
  const all = summarize(state, WORDS);
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
    <>
      <header className="topbar">
        <div className="brand">
          PROGRESS
          <span>学習記録</span>
        </div>
        <div className="muted">連続 {state.streak} 日</div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="tiny">習得</span>
          <div className="num">{all.mastered}</div>
        </div>
        <div className="stat-card">
          <span className="tiny">正答率</span>
          <div className="num">{accuracy}%</div>
        </div>
        <div className="stat-card">
          <span className="tiny">学習中</span>
          <div className="num">{all.learning + all.reviewing}</div>
        </div>
        <div className="stat-card">
          <span className="tiny">未学習</span>
          <div className="num">{all.new}</div>
        </div>
      </div>

      {PARTS.map((part) => {
        const words = wordsByPart(part.id);
        const stats = summarize(state, words);
        const pct = Math.round((stats.mastered / words.length) * 100);
        return (
          <div key={part.id} className="unit-card" style={{ marginBottom: 8 }}>
            <div>
              <span className="tiny">{part.label} · {part.score}</span>
              <strong>
                {stats.mastered}/{words.length}
              </strong>
              <div className="bar" style={{ margin: "8px 0 0", width: 180 }}>
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}

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
    </>
  );
}
