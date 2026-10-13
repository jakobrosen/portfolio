import { useContext } from "react";
import { AppStateContext } from "./AppStateContext";

function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside <AppStateProvider>");
  }
  return context;
}

export default useAppState;
