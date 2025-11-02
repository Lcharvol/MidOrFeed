"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type Locale = "fr" | "en";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Import messages
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

const messages = {
  fr: frMessages,
  en: enMessages,
};

// Helper function to get nested translation
const getNestedTranslation = (obj: any, key: string): string => {
  const keys = key.split(".");
  let result = obj;
  for (const k of keys) {
    if (result === undefined || result === null) {
      return key;
    }
    result = result[k];
  }
  return result || key;
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "fr";
    const stored = localStorage.getItem("locale");
    return (stored as Locale) || "fr";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getNestedTranslation(messages[locale], key);
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
