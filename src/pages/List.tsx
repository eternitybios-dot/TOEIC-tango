import { useMemo, useState } from "react";
import type { AppState, Route } from "../types";
import { PARTS } from "../types";
import { UNITS, UNIT_META, WORDS, wordsByUnit } from "../data";
import { getProgress } from "../lib/storage";
import { masteryOf } from "../lib/srs";
import { speak } from "../lib/speech";

type Props = {
  state: AppState;
  unit?: number;
  go: (route: Route) => void;
};

const LABELS = {
  new: "未学習",
  learning: "学習中",
  reviewing: "復習",
  mastered: "習得",
};

export function WordList({ state, unit: initialUnit, go }: Props) {
  const [unit, setUnit] = useState<number | "all">(initialUnit ?? "all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const words = useMemo(() => {
    const source = unit === "all" ? WORDS : wordsByUnit(unit);
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (w) => w.word.toLowerCase().includes(q) || w.meaning.includes(q),
    );
  }, [unit, query]);

  const open = words.find((w) => w.id === openId);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          WORD LIST
          <span>単語一覧</span>
        </div>
        <div className="muted">{words.length} 語</div>
      </header>

      <input
        className="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="英単語・日本語で検索"
      />

      <div className="filters">
        <button className={`chip${unit === "all" ? " on" : ""}`} onClick={() => setUnit("all")}>
          すべて
        </button>
        {UNITS.map((u) => (
          <button key={u} className={`chip${unit === u ? " on" : ""}`} onClick={() => setUnit(u)}>
            U{u}
          </button>
        ))}
      </div>

      {unit !== "all" && (
        <p className="muted" style={{ marginBottom: 8 }}>
          UNIT {unit} {UNIT_META[unit].title} · {PARTS[UNIT_META[unit].part - 1].label}
        </p>
      )}

      {words.map((word) => {
        const mastery = masteryOf(getProgress(state, word.id));
        return (
          <button key={word.id} className="word-row" onClick={() => setOpenId(word.id)}>
            <div>
              <b>{word.word}</b>
              <div className="muted">
                {word.pos} · {word.meaning}
              </div>
            </div>
            <span className="badge">{LABELS[mastery]}</span>
          </button>
        );
      })}

      {open && (
        <div className="hero" style={{ marginTop: 16 }}>
          <div className="progress-label">
            <span className="tiny">
              UNIT {open.unit} · {open.pos}
            </span>
            <button className="chip on" onClick={() => speak(open.word)}>
              発音
            </button>
          </div>
          <div className="word" style={{ fontSize: 32, margin: "10px 0 4px" }}>
            {open.word}
          </div>
          <div className="muted">/{open.ipa}/</div>
          <p style={{ margin: "12px 0", fontSize: 20 }}>{open.meaning}</p>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            {open.example}
            <br />
            {open.exampleJa}
          </p>
          <button
            className="cta"
            style={{ marginTop: 14 }}
            onClick={() => go({ name: "study", unit: open.unit, mode: "unit" })}
          >
            この UNIT を学習
          </button>
        </div>
      )}
    </>
  );
}
