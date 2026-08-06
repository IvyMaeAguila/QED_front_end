import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentSchoolYear, type Language, type SettingsState } from "../types/Settings";
import {
  fetchActiveSchoolYear,
  fetchAllSchoolYears,
  createSchoolYear,
  activateSchoolYear,
} from "../services/schoolYear.service";

interface SettingsContextValue extends SettingsState {
  toggleDarkMode: () => void;
  setSchoolYear: (year: string) => Promise<void>;
  schoolYearLoading: boolean;
  schoolYearError: string | null;
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
  // schoolYear now comes from the DB — this is just a fallback while it loads
  const [schoolYear, setSchoolYearState] = useState(getCurrentSchoolYear());
  const [schoolYearLoading, setSchoolYearLoading] = useState(true);
  const [schoolYearError, setSchoolYearError] = useState<string | null>(null);
  const [schoolAcronym, setSchoolAcronym] = useState(persisted.schoolAcronym ?? "QED");
  const [schoolName, setSchoolName] = useState(persisted.schoolName ?? "Quality Education");
  const [language, setLanguage] = useState<Language>(persisted.language ?? "English");
  const [emailNotifications, setEmailNotifications] = useState(persisted.emailNotifications ?? true);
  const [pushNotifications, setPushNotifications] = useState(persisted.pushNotifications ?? true);

  // Load the active school year from the backend on mount
  useEffect(() => {
    let cancelled = false;

    async function loadActiveSchoolYear() {
      setSchoolYearLoading(true);
      setSchoolYearError(null);
      try {
        const active = await fetchActiveSchoolYear();
        if (!cancelled && active) {
          setSchoolYearState(active.school_year);
        }
      } catch (err) {
        if (!cancelled) {
          setSchoolYearError(err instanceof Error ? err.message : "Failed to load school year.");
        }
      } finally {
        if (!cancelled) setSchoolYearLoading(false);
      }
    }

    loadActiveSchoolYear();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist the non-school-year settings only; school year lives in the DB now
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

  // Called when the user picks/confirms a school year in Settings (the check button).
  // If the year already exists in the DB, activate it (backend deactivates the rest).
  // If it's a brand-new custom year, create it as active.
  async function setSchoolYear(year: string) {
    setSchoolYearError(null);
    const previous = schoolYear;
    setSchoolYearState(year); // optimistic update so the UI reacts immediately

    try {
      const existing = await fetchAllSchoolYears();
      const match = existing.find((row) => row.school_year === year);

      if (match) {
        await activateSchoolYear(String(match.id));
      } else {
        await createSchoolYear({ school_year: year, is_active: true });
      }
    } catch (err) {
      setSchoolYearState(previous); // rollback on failure
      setSchoolYearError(err instanceof Error ? err.message : "Failed to update school year.");
      throw err;
    }
  }

  const value: SettingsContextValue = {
    darkMode,
    toggleDarkMode: () => setDarkMode((v) => !v),
    schoolYear,
    setSchoolYear,
    schoolYearLoading,
    schoolYearError,
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