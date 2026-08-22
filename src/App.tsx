import { useEffect, useState } from "react";
import type { AppState, Route, Settings, Word } from "./types";
import { defaultState, getProgress, loadState, saveState, withStudyTick } from "./lib/storage";
import { review } from "./lib/srs";
import { playSfx } from "./lib/feedback";
import { Home } from "./pages/Home";
import { Study } from "./pages/Study";
import { Quiz } from "./pages/Quiz";
import { WordList } from "./pages/List";
import { Stats } from "./pages/Stats";
import { NavBar } from "./components/NavBar";
import { Onboarding } from "./components/Onboarding";

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  function go(next: Route) {
    playSfx("tap", state.settings.sound);
    if (next.name === "study" && next.unit) {
      setState((prev) => ({ ...prev, lastUnit: next.unit ?? prev.lastUnit }));
    }
    setRoute(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onReview(word: Word, result: "again" | "good") {
    setState((prev) => {
      const current = getProgress(prev, word.id);
      const ticked = withStudyTick(prev);
      return {
        ...ticked,
        lastUnit: word.unit,
        progress: {
          ...ticked.progress,
          [word.id]: review(current, result),
        },
      };
    });
  }

  function onSettings(partial: Partial<Settings>) {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...partial } }));
  }

  function onGoal(goal: number) {
    setState((prev) => ({ ...prev, goal }));
  }

  if (!state.onboarded) {
    return (
      <div className="app">
        <Onboarding
          sound={state.settings.sound}
          onDone={() => setState((prev) => ({ ...prev, onboarded: true }))}
        />
      </div>
    );
  }

  const pageKey =
    route.name === "study"
      ? `study-${route.unit ?? "all"}-${route.mode ?? "due"}`
      : route.name === "quiz"
        ? `quiz-${route.unit ?? "all"}`
        : route.name === "list"
          ? `list-${route.unit ?? "all"}`
          : route.name;

  return (
    <div className="app">
      <div key={pageKey} className="page-shell">
        {route.name === "home" && <Home state={state} go={go} onSettings={onSettings} onGoal={onGoal} />}
        {route.name === "study" && (
          <Study state={state} unit={route.unit} mode={route.mode} onReview={onReview} go={go} />
        )}
        {route.name === "quiz" && <Quiz state={state} unit={route.unit} onReview={onReview} go={go} />}
        {route.name === "list" && <WordList state={state} unit={route.unit} go={go} />}
        {route.name === "stats" && (
          <Stats
            state={state}
            go={go}
            onSettings={onSettings}
            onGoal={onGoal}
            onReset={() => {
              const next = defaultState();
              next.onboarded = true;
              saveState(next);
              setState(next);
            }}
          />
        )}
      </div>
      <NavBar current={route.name} onGo={(name) => go({ name })} />
    </div>
  );
}
