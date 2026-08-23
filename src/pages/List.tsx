import { useMemo, useState } from "react";
import type { AppState, Route } from "../types";
import { catalog } from "../lib/catalog";
import { getProgress } from "../lib/storage";
import { masteryOf } from "../lib/srs";
import { speak } from "../lib/speech";
import { playSfx } from "../lib/feedback";
import { IconClose } from "../components/Icons";

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

const PAGE = 40;

export function WordList({ state, unit: initialUnit, go }: Props) {
  const [unit, setUnit] = useState<number | "all">(initialUnit ?? "all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const cat = catalog(state.deck);
  const words = useMemo(() => {
    const source = unit === "all" ? cat.words : cat.wordsByUnit(unit);
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaning.includes(q) ||
        w.phrase.toLowerCase().includes(q) ||
        w.phraseJa.includes(q),
    );
  }, [unit, query, state.deck]);

  const shown = words.slice(0, limit);
  const open = words.find((w) => w.id === openId);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          単語
          <span>単語一覧</span>
        </div>
        <div className="muted">{words.length} 語</div>
      </header>

      <input
        className="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setLimit(PAGE);
        }}
        placeholder="英単語・フレーズ・日本語で検索"
      />

      <div className="filters">
        <button
          className={`chip${unit === "all" ? " on" : ""}`}
          onClick={() => {
            setUnit("all");
            setLimit(PAGE);
          }}
        >
          すべて
        </button>
        {cat.units.map((u) => (
          <button
            key={u}
            className={`chip${unit === u ? " on" : ""}`}
            onClick={() => {
              setUnit(u);
              setLimit(PAGE);
            }}
          >
            U{u}
          </button>
        ))}
      </div>

      {unit !== "all" && (
        <p className="muted" style={{ marginBottom: 8 }}>
          UNIT {unit} {cat.unitMeta[unit].title} · {cat.parts.find((item) => item.id === cat.unitMeta[unit].part)?.label ?? ""}
        </p>
      )}

      {shown.map((word, i) => {
        const mastery = masteryOf(getProgress(state, word.id));
        return (
          <button
            key={word.id}
            className="word-row rise"
            style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
            onClick={() => {
              playSfx("tap", state.settings.sound);
              setOpenId(word.id);
            }}
          >
            <div>
              <b>{word.word}</b>
              <div className="muted">
                {word.pos} · {word.phraseJa}
              </div>
            </div>
            <span className={`badge badge-${mastery}`}>{LABELS[mastery]}</span>
          </button>
        );
      })}

      {shown.length < words.length ? (
        <button className="cta ghost" style={{ marginTop: 14 }} onClick={() => setLimit((n) => n + PAGE)}>
          さらに表示（残り {words.length - shown.length}）
        </button>
      ) : null}

      {open ? (
        <div className="sheet-root" onClick={() => setOpenId(null)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="progress-label">
              <span className="tiny">
                UNIT {open.unit} · {open.pos}
              </span>
              <button className="icon-btn" aria-label="閉じる" onClick={() => setOpenId(null)}>
                <IconClose size={18} />
              </button>
            </div>
            <div className="word" style={{ fontSize: 34, margin: "8px 0 4px" }}>
              {open.word}
            </div>
            {open.ipa ? <p className="ipa">/{open.ipa}/</p> : null}
            <p style={{ margin: "12px 0 4px", fontSize: 18 }}>{open.meaning}</p>
            <p className="phrase" style={{ marginTop: 8 }}>
              {open.phrase}
              <span className="phrase-ja">{open.phraseJa}</span>
            </p>
            <div className="row" style={{ marginTop: 16 }}>
              <button className="cta ghost" onClick={() => speak(open.phrase)}>
                発音
              </button>
              <button className="cta" onClick={() => go({ name: "study", unit: open.unit, mode: "unit" })}>
                この UNIT
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
