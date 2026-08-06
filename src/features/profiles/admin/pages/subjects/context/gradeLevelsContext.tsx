import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchGradeLevels } from "../../classes/services/classes.service";
import type { GradeLevel } from "../types";

interface GradeLevelsContextValue {
  gradeLevels: GradeLevel[];
  loading: boolean;
}

const GradeLevelsContext = createContext<GradeLevelsContextValue | undefined>(undefined);

export function GradeLevelsProvider({ children }: { children: ReactNode }) {
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchGradeLevels()
      .then((rows) => {
        const sorted = [...rows].sort((a, b) => a.id - b.id);
        setGradeLevels(sorted.map((r) => r.grade_level as GradeLevel));
      })
      .catch((err) => console.error("Failed to load grade levels:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <GradeLevelsContext.Provider value={{ gradeLevels, loading }}>
      {children}
    </GradeLevelsContext.Provider>
  );
}

export function useGradeLevels() {
  const ctx = useContext(GradeLevelsContext);
  if (!ctx) throw new Error("useGradeLevels must be used within a GradeLevelsProvider");
  return ctx;
}