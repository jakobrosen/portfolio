import type { ComponentType } from "react";
import ui from "../i18n/ui";
import useLanguage from "../i18n/useLanguage";
import type { Language } from "../types";

function SwedishFlag() {
  return (
    <svg viewBox="0 0 16 10" className="aspect-16/10 h-4" aria-hidden="true">
      <rect width="16" height="10" fill="#006aa7" />
      <rect x="5" width="2" height="10" fill="#fecc02" />
      <rect y="4" width="16" height="2" fill="#fecc02" />
    </svg>
  );
}

function BritishFlag() {
  return (
    <svg viewBox="0 0 60 30" className="aspect-2/1 h-4" aria-hidden="true">
      <clipPath id="uk-flag-diagonals">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath="url(#uk-flag-diagonals)"
        stroke="#c8102e"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}

const options: {
  language: Language;
  label: string;
  Flag: ComponentType;
}[] = [
  { language: "sv", label: "Svenska", Flag: SwedishFlag },
  { language: "en", label: "English", Flag: BritishFlag },
];

function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t(ui.language)}
      className="flex justify-end gap-3">
      {options.map(({ language: option, label, Flag }) => (
        <button
          key={option}
          type="button"
          lang={option}
          title={label}
          aria-label={label}
          aria-pressed={language === option}
          onClick={() => setLanguage(option)}
          className="cursor-pointer overflow-hidden rounded-sm opacity-40 transition-opacity hover:opacity-80 focus-visible:opacity-80 aria-pressed:opacity-100">
          <Flag />
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
