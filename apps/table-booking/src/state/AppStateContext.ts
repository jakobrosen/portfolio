import { createContext, type Dispatch } from "react";
import type { AppState } from "../types";
import type { Action } from "./reducer";

type AppStateContextValue = {
  state: AppState;
  dispatch: Dispatch<Action>;
};

export const AppStateContext = createContext<AppStateContextValue | null>(null);
