import { createContext, type Dispatch } from "react";
import type { AppState } from "../types";
import type { HistoryAction } from "./history";

type AppStateContextValue = {
  state: AppState;
  dispatch: Dispatch<HistoryAction>;
  canUndo: boolean;
  canRedo: boolean;
};

export const AppStateContext = createContext<AppStateContextValue | null>(null);
