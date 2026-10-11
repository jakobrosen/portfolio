import { useContext } from "react";
import type { Translatable } from "../types";
import { LanguageContext } from "./LanguageContext";

function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }

  const t = (text: Translatable) =>
    typeof text === "string" ? text : text[context.language];

  return { ...context, t };
}

export default useLanguage;
