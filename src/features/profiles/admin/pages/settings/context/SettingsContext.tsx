import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { type Language, type SettingsState } from "../types/Settings";

interface SettingsContextValue extends SettingsState {
  toggleDarkMode: () => void;
  setSchoolAcronym: (acronym: string) => void;
  setSchoolName: (name: string) => void;
  setLanguage: (lang: Language) => void;
  setEmailNotifications: (value: boolean) => void;
  setPushNotifications: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const STORAGE_KEY = "qed.settings";

function loadPersisted(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersisted();

  const [darkMode, setDarkMode] = useState(persisted.darkMode ?? false);
  const [schoolAcronym, setSchoolAcronym] = useState(persisted.schoolAcronym ?? "QED");
  const [schoolName, setSchoolName] = useState(persisted.schoolName ?? "Quality Education");
  const [language, setLanguage] = useState<Language>(persisted.language ?? "English");
  const [emailNotifications, setEmailNotifications] = useState(persisted.emailNotifications ?? true);
  const [pushNotifications, setPushNotifications] = useState(persisted.pushNotifications ?? true);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.dataset.qedTheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ darkMode, schoolAcronym, schoolName, language, emailNotifications, pushNotifications })
      );
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  }, [darkMode, schoolAcronym, schoolName, language, emailNotifications, pushNotifications]);

  // Keep the shared theme in sync across role changes and other open tabs.
  useEffect(() => {
    function syncSharedTheme(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      try {
        const next = event.newValue ? JSON.parse(event.newValue) : {};
        setDarkMode(Boolean(next.darkMode));
      } catch {
        setDarkMode(false);
      }
    }
    window.addEventListener("storage", syncSharedTheme);
    return () => window.removeEventListener("storage", syncSharedTheme);
  }, []);

  const value: SettingsContextValue = {
    darkMode,
    toggleDarkMode: () => setDarkMode((v) => !v),
    schoolAcronym,
    setSchoolAcronym,
    schoolName,
    setSchoolName,
    language,
    setLanguage,
    emailNotifications,
    setEmailNotifications,
    pushNotifications,
    setPushNotifications,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
