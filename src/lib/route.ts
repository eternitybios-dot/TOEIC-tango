import type { Route } from "../types";

export function routeToHash(route: Route): string {
  if (route.name === "home") return "#/";
  if (route.name === "study") {
    if (route.unit) return `#/study/${route.unit}`;
    if (route.part) return `#/study/part/${route.part}`;
    return "#/study";
  }
  if (route.name === "quiz") {
    if (route.unit) return `#/quiz/${route.unit}`;
    if (route.part) return `#/quiz/part/${route.part}`;
    return "#/quiz";
  }
  if (route.name === "list") {
    return route.unit ? `#/list/${route.unit}` : "#/list";
  }
  return "#/stats";
}

export function hashToRoute(hash: string): Route {
  const raw = hash.replace(/^#\/?/, "").replace(/\/$/, "");
  if (!raw) return { name: "home" };
  const [name, id, extra] = raw.split("/");
  const parsed = id ? Number(id) : undefined;
  const unit = parsed && Number.isFinite(parsed) ? parsed : undefined;

  if (name === "study") {
    if (id === "part") {
      const part = Number(extra);
      if (part === 1 || part === 2 || part === 3) return { name: "study", part, mode: "due" };
    }
    return { name: "study", mode: unit ? "unit" : "due", unit };
  }
  if (name === "quiz") {
    if (id === "part") {
      const part = Number(extra);
      if (part === 1 || part === 2 || part === 3) return { name: "quiz", part };
    }
    return { name: "quiz", unit };
  }
  if (name === "list") return { name: "list", unit };
  if (name === "stats") return { name: "stats" };
  return { name: "home" };
}

export function routesEqual(a: Route, b: Route): boolean {
  return routeToHash(a) === routeToHash(b);
}
