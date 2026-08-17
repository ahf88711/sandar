import { createInitialState } from "./initial";
import { SAVE_VERSION, type GameState } from "./types";
import { assertFinite, boundedState, clamp, clone } from "./util";

export const SAVE_KEY = "sandar-save-v1";
export const META_KEY = "sandar-meta-v1";

export interface SaveMeta {
  year: number;
  leaderName: string;
  savedAt: number;
  countryName: string;
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function validateState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as GameState;
  if (typeof s.version !== "number" || s.version > SAVE_VERSION) return null;
  if (typeof s.year !== "number" || typeof s.gdp !== "number") return null;
  if (!s.budget || !s.industries || !s.defense || !Array.isArray(s.nations)) return null;
  if (!Array.isArray(s.history) || !Array.isArray(s.activeProjects)) return null;
  const fallback = createInitialState({
    leaderName: typeof s.leaderName === "string" ? s.leaderName : "القائد",
    seed: typeof s.seed === "number" ? s.seed : 1,
  });
  const next = boundedState({
    ...fallback,
    ...s,
    version: SAVE_VERSION,
    pendingDecisions: Array.isArray(s.pendingDecisions) ? s.pendingDecisions : [],
    delayedEffects: Array.isArray(s.delayedEffects) ? s.delayedEffects : [],
    completedProjects: Array.isArray(s.completedProjects) ? s.completedProjects : [],
    log: Array.isArray(s.log) ? s.log : [],
    nations: s.nations,
    flags: { ...fallback.flags, ...(s.flags ?? {}) },
  });
  if (assertFinite(next).length) return null;
  next.year = clamp(next.year, 2026, 2200);
  return next;
}

export function saveState(state: GameState): boolean {
  try {
    localStorage.setItem(SAVE_KEY, serialize(state));
    const meta: SaveMeta = {
      year: state.year,
      leaderName: state.leaderName,
      savedAt: Date.now(),
      countryName: state.countryName,
    };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return validateState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function loadMeta(): SaveMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveMeta;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(META_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSave(): boolean {
  return loadMeta() !== null && loadState() !== null;
}

export function cloneState(s: GameState): GameState {
  return clone(s);
}
