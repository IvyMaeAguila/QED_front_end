import { useEffect, useMemo, useState } from "react";
import type { Term, RankedSubject } from "../data/types";
import { getTermOptions, getGradeOptions, getSubjectRanking } from "../services/analyticsService";
import { aggregateWholeElementary, filterAndRankByGrade, getLowestPerforming } from "../utils/ranking";

interface UseSubjectAnalyticsResult {
  term: Term;
  setTerm: (term: Term) => void;
  termOptions: Term[];
  gradeFilter: string;
  setGradeFilter: (grade: string) => void;
  gradeOptions: string[];
  wholeElementaryRanking: ReturnType<typeof aggregateWholeElementary>;
  filteredRanking: ReturnType<typeof filterAndRankByGrade>;
  lowestPerforming: ReturnType<typeof getLowestPerforming>;
  loading: boolean;
  error: Error | null;
}

export function useSubjectAnalytics(): UseSubjectAnalyticsResult {
  const [term, setTerm] = useState<Term>("Term 1");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [termOptions, setTermOptions] = useState<Term[]>([]);
  const [gradeOptions, setGradeOptions] = useState<string[]>([]);
  const [rawRanking, setRawRanking] = useState<RankedSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Filter options load once.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getTermOptions(), getGradeOptions()]).then(([terms, grades]) => {
      if (cancelled) return;
      setTermOptions(terms);
      setGradeOptions(grades);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ranking data refetches whenever the term changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getSubjectRanking(term)
      .then((result) => {
        if (cancelled) return;
        setRawRanking(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load subject ranking"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [term]);

  const wholeElementaryRanking = useMemo(() => aggregateWholeElementary(rawRanking), [rawRanking]);
  const filteredRanking = useMemo(() => filterAndRankByGrade(rawRanking, gradeFilter), [rawRanking, gradeFilter]);
  const lowestPerforming = useMemo(() => getLowestPerforming(wholeElementaryRanking, 3), [wholeElementaryRanking]);

  return {
    term,
    setTerm,
    termOptions,
    gradeFilter,
    setGradeFilter,
    gradeOptions,
    wholeElementaryRanking,
    filteredRanking,
    lowestPerforming,
    loading,
    error,
  };
}
