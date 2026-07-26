import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentSchoolYear, type Language, type SettingsState } from "../types/Settings";

interface SettingsContextValue extends SettingsState {
  toggleDarkMode: () => void;
  setSchoolYear: (year: string) => void;
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
  const [schoolYear, setSchoolYear] = useState(persisted.schoolYear ?? getCurrentSchoolYear());
  const [schoolAcronym, setSchoolAcronym] = useState(persisted.schoolAcronym ?? "QED");
  const [schoolName, setSchoolName] = useState(persisted.schoolName ?? "Quality Education");
  const [language, setLanguage] = useState<Language>(persisted.language ?? "English");
  const [emailNotifications, setEmailNotifications] = useState(persisted.emailNotifications ?? true);
  const [pushNotifications, setPushNotifications] = useState(persisted.pushNotifications ?? true);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ darkMode, schoolYear, schoolAcronym, schoolName })
      );
    } catch {
    }
  }, [darkMode, schoolYear, schoolAcronym, schoolName]);

  const value: SettingsContextValue = {
    darkMode,
    toggleDarkMode: () => setDarkMode((v) => !v),
    schoolYear,
    setSchoolYear,
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