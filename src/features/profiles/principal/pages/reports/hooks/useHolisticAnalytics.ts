import { useState } from "react";
import type { Term, ViewMode } from "../data/types";
import { getViewOptions, getHolisticRows } from "../services/reports.service";
import { useAnalyticsReads } from "./useAnalyticsReads";

export function useHolisticAnalytics() {
  const [term, setTerm] = useState<Term>("Term 1");
  const [view, setView] = useState<ViewMode>("By Grade Level");
  const reads = useAnalyticsReads("holistic", [term, view], options => getHolisticRows(term, view, options), "views", getViewOptions);
  return {
    term, setTerm, termOptions: reads.terms ?? [], view, setView, viewOptions: reads.filters ?? [],
    rows: reads.data ?? [], loading: reads.loading, error: reads.error, retry: reads.retry,
    cachedOffline: reads.cachedOffline, dataScope: reads.dataScope,
  };
}
