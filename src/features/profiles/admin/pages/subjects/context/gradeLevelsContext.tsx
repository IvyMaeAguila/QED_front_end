import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { fetchGradeLevels } from "../../classes/services/classes.service";
import type { GradeLevel } from "../types/types";

interface GradeLevelsContextValue {
  gradeLevels: GradeLevel[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const GradeLevelsContext = createContext<GradeLevelsContextValue | undefined>(undefined);

export function GradeLevelsProvider({ children }: { children: ReactNode }) {
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);

  const refetch = useCallback(async () => {
    const current = ++request.current;
    setLoading(true); setError(null);
    try {
      const rows = await fetchGradeLevels();
      if (request.current !== current) return;
      const sorted = [...rows].sort((a, b) => a.id - b.id);
      setGradeLevels(sorted.map((r) => r.grade_level as GradeLevel));
    } catch (err) {
      if (request.current === current) setError(err instanceof Error ? err.message : "Failed to load grade levels.");
    } finally {
      if (request.current === current) setLoading(false);
    }
  }, []);
  useEffect(() => { void refetch(); return () => { request.current++; }; }, [refetch]);

  return (
    <GradeLevelsContext.Provider value={{ gradeLevels, loading, error, refetch }}>
      {children}
    </GradeLevelsContext.Provider>
  );
}

export function useGradeLevels() {
  const ctx = useContext(GradeLevelsContext);
  if (!ctx) throw new Error("useGradeLevels must be used within a GradeLevelsProvider");
  return ctx;
}
