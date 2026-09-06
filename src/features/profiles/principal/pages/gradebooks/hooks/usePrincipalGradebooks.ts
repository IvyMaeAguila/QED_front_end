import { useEffect, useState } from "react";
import { fetchGradeLevels, fetchSchoolYear } from "../services/gradebooksService";
import type { GradeLevelSummary } from "../data/types";

interface UsePrincipalGradebooksResult {
  gradeLevels: GradeLevelSummary[];
  schoolYear: string;
  loading: boolean;
  error: string | null;
}

export function usePrincipalGradebooks(): UsePrincipalGradebooksResult {
  const [gradeLevels, setGradeLevels] = useState<GradeLevelSummary[]>([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchGradeLevels(), fetchSchoolYear()])
      .then(([levels, year]) => {
        if (cancelled) return;
        setGradeLevels(levels);
        setSchoolYear(year);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load gradebooks.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { gradeLevels, schoolYear, loading, error };
}
