import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import type { GradeLevelSummary } from "../data/types";
import {
  fetchGradeLevelSummaries,
  fetchSchoolYear,
  getCachedGradeLevelSummaries,
} from "../services/gradebooks.service";

let lastSchoolYear = "";

export function usePrincipalGradebooks() {
  const [gradeLevels, setGradeLevels] = useState<GradeLevelSummary[]>(() => getCachedGradeLevelSummaries() ?? []);
  const [schoolYear, setSchoolYear] = useState(lastSchoolYear);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      fetchGradeLevelSummaries(controller.signal),
      fetchSchoolYear(controller.signal),
    ])
      .then(([levels, year]) => {
        if (controller.signal.aborted) return;
        setGradeLevels(levels);
        lastSchoolYear = year;
        setSchoolYear(year);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  return { gradeLevels, schoolYear, loading, error, retry: () => setAttempt(value => value + 1) };
}
