import { useEffect, useState, type ReactNode } from "react";
import type { Language } from "../types";
import { LanguageContext } from "./LanguageContext";

const STORAGE_KEY = "language";

const DEFAULT_LANGUAGE: Language = "sv";

// Saved choice first, otherwise the default language.
function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "sv") return saved;
  } catch {
    // Storage can be unavailable, e.g. in private browsing.
  }
  return DEFAULT_LANGUAGE;
}

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore, the choice just won't be remembered.
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;
