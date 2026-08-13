import { useEffect, useState } from "react";
import type { AppState, Route, Word } from "./types";
import { defaultState, getProgress, loadState, saveState, withStudyTick } from "./lib/storage";
import { review } from "./lib/srs";
import { Home } from "./pages/Home";
import { Study } from "./pages/Study";
import { Quiz } from "./pages/Quiz";
import { WordList } from "./pages/List";
import { Stats } from "./pages/Stats";

const NAV: { name: Route["name"]; label: string }[] = [
  { name: "home", label: "ホーム" },
  { name: "study", label: "カード" },
  { name: "quiz", label: "クイズ" },
  { name: "list", label: "単語" },
  { name: "stats", label: "記録" },
];

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  function go(next: Route) {
    setRoute(next);
    window.scrollTo(0, 0);
  }

  function onReview(word: Word, result: "again" | "good") {
    setState((prev) => {
      const current = getProgress(prev, word.id);
      const ticked = withStudyTick(prev);
      return {
        ...ticked,
        progress: {
          ...ticked.progress,
          [word.id]: review(current, result),
        },
      };
    });
  }

  return (
    <div className="app">
      {route.name === "home" && <Home state={state} go={go} />}
      {route.name === "study" && (
        <Study
          key={`${route.unit ?? "all"}-${route.mode ?? "due"}`}
          state={state}
          unit={route.unit}
          mode={route.mode}
          onReview={onReview}
          go={go}
        />
      )}
      {route.name === "quiz" && (
        <Quiz key={route.unit ?? "all"} unit={route.unit} onReview={onReview} go={go} />
      )}
      {route.name === "list" && <WordList state={state} unit={route.unit} go={go} />}
      {route.name === "stats" && (
        <Stats
          state={state}
          go={go}
          onReset={() => {
            const next = defaultState();
            saveState(next);
            setState(next);
          }}
        />
      )}

      <nav className="nav">
        {NAV.map((item) => (
          <button
            key={item.name}
            className={route.name === item.name ? "active" : ""}
            onClick={() => go({ name: item.name })}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
