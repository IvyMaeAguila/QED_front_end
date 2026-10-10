import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import type { Term, ViewMode, HeatmapRow } from "../data/types";
import { getTermOptions, getViewOptions, getHolisticRows } from "../services/reports.service";

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
  retry: () => void;
}

export function useHolisticAnalytics(): UseHolisticAnalyticsResult {
  const [term, setTerm] = useState<Term>("Term 1");
  const [view, setView] = useState<ViewMode>("By Grade Level");
  const [termOptions, setTermOptions] = useState<Term[]>([]);
  const [viewOptions, setViewOptions] = useState<ViewMode[]>([]);
  const [rows, setRows] = useState<HeatmapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<Error | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOptionsLoading(true); setOptionsError(null);
    Promise.all([getTermOptions(), getViewOptions()]).then(([terms, views]) => {
      if (cancelled) return;
      setTermOptions(terms);
      setViewOptions(views);
    }).catch((error: unknown) => { if (!cancelled) setOptionsError(error instanceof Error ? error : new Error("Failed to load report filters")); }).finally(() => { if (!cancelled) setOptionsLoading(false); });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

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
  }, [term, view, attempt]);

  return { term, setTerm, termOptions, view, setView, viewOptions, rows, loading: loading || optionsLoading, error: error || optionsError, retry: () => setAttempt(value => value + 1) };
}
