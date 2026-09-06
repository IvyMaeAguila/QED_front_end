import { useEffect, useState } from "react";
import type { Term, ViewMode, HeatmapRow } from "../data/types";
import { getTermOptions, getViewOptions, getHolisticRows } from "../services/analyticsService";

interface UseHolisticAnalyticsResult {
  term: Term;
  setTerm: (term: Term) => void;
  termOptions: Term[];
  view: ViewMode;
  setView: (view: ViewMode) => void;
  viewOptions: ViewMode[];
  rows: HeatmapRow[];
  loading: boolean;
  error: Error | null;
}

export function useHolisticAnalytics(): UseHolisticAnalyticsResult {
  const [term, setTerm] = useState<Term>("Term 1");
  const [view, setView] = useState<ViewMode>("By Grade Level");
  const [termOptions, setTermOptions] = useState<Term[]>([]);
  const [viewOptions, setViewOptions] = useState<ViewMode[]>([]);
  const [rows, setRows] = useState<HeatmapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTermOptions(), getViewOptions()]).then(([terms, views]) => {
      if (cancelled) return;
      setTermOptions(terms);
      setViewOptions(views);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getHolisticRows(term, view)
      .then((result) => {
        if (cancelled) return;
        setRows(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load holistic analytics"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [term, view]);

  return { term, setTerm, termOptions, view, setView, viewOptions, rows, loading, error };
}
