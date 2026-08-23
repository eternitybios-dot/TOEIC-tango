import type { SavedSession, Word } from "../types";
import type { Catalog } from "./catalog";

export function hydrateQueue(ids: number[], catalog: Catalog): Word[] {
  return ids.map((id) => catalog.getWord(id)).filter((word): word is Word => Boolean(word));
}

export type ResumeMap = { study: SavedSession | null; quiz: SavedSession | null };

export function sessionOf(resume: ResumeMap | SavedSession | null | undefined, kind: SavedSession["kind"]): SavedSession | null {
  if (!resume) return null;
  if ("study" in resume || "quiz" in resume) return (resume as ResumeMap)[kind];
  const single = resume as SavedSession;
  return single.kind === kind ? single : null;
}

export function sessionRemaining(resume: ResumeMap | SavedSession | null | undefined, kind: SavedSession["kind"], deck: SavedSession["deck"]): number {
  const session = sessionOf(resume, kind);
  if (!session || session.deck !== deck) return 0;
  return Math.max(0, session.queue.length - session.index);
}

export function canResume(resume: ResumeMap | SavedSession | null | undefined, kind: SavedSession["kind"], deck: SavedSession["deck"]): boolean {
  return sessionRemaining(resume, kind, deck) > 0;
}
