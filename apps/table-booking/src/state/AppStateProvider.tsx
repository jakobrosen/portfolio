import { useEffect, useReducer, type ReactNode } from "react";
import { AppStateContext } from "./AppStateContext";
import { historyReducer, startHistory } from "./history";
import { loadState, saveState } from "./storage";

const SAVE_DELAY_MS = 300;

function AppStateProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(historyReducer, undefined, () =>
    startHistory(loadState()),
  );
  const state = history.present;

  // Debounced so resizing a table doesn't write on every pointer move. Leaving
  // the page saves right away, so a quick reload doesn't lose the last change.
  useEffect(() => {
    const timeout = setTimeout(() => saveState(state), SAVE_DELAY_MS);
    const saveNow = () => saveState(state);
    window.addEventListener("pagehide", saveNow);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("pagehide", saveNow);
    };
  }, [state]);

  return (
    <AppStateContext.Provider
      value={{
        state,
        dispatch,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
      }}>
      {children}
    </AppStateContext.Provider>
  );
}

export default AppStateProvider;
