import { useEffect, useState } from "react";
import type { AppState, DeckId, Route, SavedSession, Settings, Word } from "./types";
import { defaultState, getProgress, loadState, saveState, withStudyTick, writeProgress } from "./lib/storage";
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
import { listenBackButton } from "./lib/native";

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
    return listenBackButton(() => {
      if (!state.onboarded || route.name === "home") return false;
      go({ name: "home" });
      return true;
    });
  }, [route.name, state.onboarded, state.settings]);

  useEffect(() => {
    const onHash = () => {
      const next = hashToRoute(window.location.hash);
      setRoute((current) => (routesEqual(current, next) ? current : next));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function go(next: Route) {
    playSfx("tap", state.settings);
    if (next.name === "study" && next.unit) {
      setState((prev) => ({
        ...prev,
        lastUnit: next.unit ?? prev.lastUnit,
        lastUnitByDeck: { ...prev.lastUnitByDeck, [prev.deck]: next.unit ?? prev.lastUnitByDeck[prev.deck] },
      }));
    }
    const hash = routeToHash(next);
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(null, "", url);
    setRoute(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onReview(word: Word, result: "again" | "good") {
    setState((prev) => {
      const current = getProgress(prev, word.id);
      const ticked = withStudyTick(prev);
      const written = writeProgress(ticked, word.id, review(current, result));
      return {
        ...written,
        lastUnit: word.unit,
        lastUnitByDeck: { ...written.lastUnitByDeck, [written.deck]: word.unit },
      };
    });
  }

  function onQuiz(word: Word, ok: boolean) {
    setState((prev) => {
      const current = getProgress(prev, word.id);
      const ticked = withStudyTick(prev);
      const written = writeProgress(ticked, word.id, recordQuiz(current, ok));
      return {
        ...written,
        lastUnit: word.unit,
        lastUnitByDeck: { ...written.lastUnitByDeck, [written.deck]: word.unit },
      };
    });
  }

  function onSettings(partial: Partial<Settings>) {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...partial } }));
  }

  function onGoal(goal: number) {
    setState((prev) => ({ ...prev, goal }));
  }

  function onDeck(deck: DeckId) {
    setState((prev) => ({
      ...prev,
      deck,
      progress: prev.progressByDeck[deck] ?? {},
      lastUnit: prev.lastUnitByDeck[deck] ?? null,
    }));
  }

  function onResume(session: SavedSession | null, kind: SavedSession["kind"]) {
    setState((prev) => ({
      ...prev,
      resume: { ...prev.resume, [kind]: session },
    }));
  }

  if (!state.onboarded) {
    return (
      <div className="app">
        <Onboarding
          settings={state.settings}
          onDone={() => setState((prev) => ({ ...prev, onboarded: true }))}
        />
      </div>
    );
  }

  const pageKey =
    route.name === "study"
      ? `study-${state.deck}-${route.unit ?? route.part ?? "all"}-${route.mode ?? "due"}`
      : route.name === "quiz"
        ? `quiz-${state.deck}-${route.unit ?? route.part ?? "all"}`
        : route.name === "list"
          ? `list-${state.deck}-${route.unit ?? "all"}`
          : `${route.name}-${state.deck}`;

  return (
    <div className="app">
      <div key={pageKey} className="page-shell">
        {route.name === "home" && (
          <Home state={state} go={go} onSettings={onSettings} onGoal={onGoal} onDeck={onDeck} />
        )}
        {route.name === "study" && (
          <Study
            state={state}
            unit={route.unit}
            part={route.part}
            mode={route.mode}
            onReview={onReview}
            onResume={onResume}
            go={go}
          />
        )}
        {route.name === "quiz" && (
          <Quiz state={state} unit={route.unit} part={route.part} onQuiz={onQuiz} onResume={onResume} go={go} />
        )}
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
              next.deck = state.deck;
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
