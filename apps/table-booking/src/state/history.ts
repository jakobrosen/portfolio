import type { AppState } from "../types";
import { reducer, type Action } from "./reducer";

// Undo steps kept.
const LIMIT = 100;

export type History = {
  past: AppState[];
  present: AppState;
  future: AppState[];
  // The coalesce key of the last change, see HistoryAction.
  lastKey?: string;
};

// Changes with the same `coalesce` key in a row are undone as one step, so
// dragging a slider or typing a name doesn't leave a step per value.
export type HistoryAction =
  (Action & { coalesce?: string }) | { type: "undo" } | { type: "redo" };

export function startHistory(present: AppState): History {
  return { past: [], present, future: [] };
}

export function historyReducer(
  history: History,
  action: HistoryAction,
): History {
  const { past, present, future } = history;

  if (action.type === "undo") {
    const previous = past.at(-1);
    if (!previous) return history;
    return {
      past: past.slice(0, -1),
      present: previous,
      future: [present, ...future],
    };
  }

  if (action.type === "redo") {
    const [next, ...rest] = future;
    if (!next) return history;
    return { past: [...past, present], present: next, future: rest };
  }

  const merge =
    action.coalesce !== undefined && action.coalesce === history.lastKey;
  return {
    past: merge ? past : [...past, present].slice(-LIMIT),
    present: reducer(present, action),
    future: [],
    lastKey: action.coalesce,
  };
}
