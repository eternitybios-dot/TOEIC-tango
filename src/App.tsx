import { useEffect, useState } from "react";
import type { AppState, Route, Settings, Word } from "./types";
import { defaultState, getProgress, loadState, saveState, withStudyTick } from "./lib/storage";
import { recordQuiz, review } from "./lib/srs";
import { playSfx } from "./lib/feedback";
import { hashToRoute, routeToHash, routesEqual } from "./lib/route";
import { Home } from "./pages/Home";
import { Study } from "./pages/Study";
import { Quiz } from "./pages/Quiz";
import { WordList } from "./pages/List";
import { Stats } from "./pages/Stats";
import { NavBar } from "./components/NavBar";
import { Onboarding } from "./components/Onboarding";

function navRoute(name: Route["name"]): Route {
  if (name === "study") return { name: "study", mode: "due" };
  if (name === "quiz") return { name: "quiz" };
  return { name };
}

export default function App() {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined" ? { name: "home" } : hashToRoute(window.location.hash),
  );
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const onHash = () => {
      const next = hashToRoute(window.location.hash);
      setRoute((current) => (routesEqual(current, next) ? current : next));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function go(next: Route) {
    playSfx("tap", state.settings.sound);
    if (next.name === "study" && next.unit) {
      setState((prev) => ({ ...prev, lastUnit: next.unit ?? prev.lastUnit }));
    }
    const hash = routeToHash(next);
    if (window.location.hash !== hash) window.location.hash = hash;
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

  function onQuiz(word: Word, ok: boolean) {
    setState((prev) => {
      const current = getProgress(prev, word.id);
      const ticked = withStudyTick(prev);
      return {
        ...ticked,
        lastUnit: word.unit,
        progress: {
          ...ticked.progress,
          [word.id]: recordQuiz(current, ok),
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
        ? `quiz-${route.unit ?? route.part ?? "all"}`
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
        {route.name === "quiz" && <Quiz state={state} unit={route.unit} part={route.part} onQuiz={onQuiz} go={go} />}
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
      <NavBar current={route.name} onGo={(name) => go(navRoute(name))} />
    </div>
  );
}
