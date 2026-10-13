import type { AppState } from "../types";
import { createDemoState } from "./demo";

const STORAGE_KEY = "table-booking:v1";

function isAppState(value: unknown): value is AppState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Partial<AppState>;
  return (
    state.version === 1 &&
    Array.isArray(state.tables) &&
    Array.isArray(state.bookings)
  );
}

// Saved state first, otherwise the demo so there's something to look at.
export function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isAppState(parsed)) return parsed;
    }
  } catch {
    // Storage can be unavailable or hold broken JSON, fall back to the demo.
  }
  return createDemoState();
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore, changes just won't survive a reload.
  }
}
