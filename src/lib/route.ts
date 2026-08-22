import type { Route } from "../types";

export function routeToHash(route: Route): string {
  if (route.name === "home") return "#/";
  if (route.name === "study") {
    return route.unit ? `#/study/${route.unit}` : "#/study";
  }
  if (route.name === "quiz") {
    return route.unit ? `#/quiz/${route.unit}` : "#/quiz";
  }
  if (route.name === "list") {
    return route.unit ? `#/list/${route.unit}` : "#/list";
  }
  return "#/stats";
}

export function hashToRoute(hash: string): Route {
  const raw = hash.replace(/^#\/?/, "").replace(/\/$/, "");
  if (!raw) return { name: "home" };
  const [name, id] = raw.split("/");
  const parsed = id ? Number(id) : undefined;
  const unit = parsed && Number.isFinite(parsed) ? parsed : undefined;

  if (name === "study") return { name: "study", mode: unit ? "unit" : "due", unit };
  if (name === "quiz") return { name: "quiz", unit };
  if (name === "list") return { name: "list", unit };
  if (name === "stats") return { name: "stats" };
  return { name: "home" };
}

export function routesEqual(a: Route, b: Route): boolean {
  return routeToHash(a) === routeToHash(b);
}
