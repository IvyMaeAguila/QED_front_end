// Owns the fetch lifecycle (loading/error/data) for the principal
// dashboard so PrincipalDashboardHome.tsx stays a pure layout shell.
// Also owns rankingTerm — the one piece of page-level interactive state
// (the subject-ranking term dropdown) — since it lives above the section
// component that renders the dropdown.
import { useEffect, useState, useCallback } from "react";
import type { PrincipalDashboardData, Term } from "../data/types";
import { getPrincipalDashboardData } from "../services/principalDashboardService";

interface UsePrincipalDashboardDataResult {
  data: PrincipalDashboardData | null;
  loading: boolean;
  error: Error | null;
  rankingTerm: Term;
  setRankingTerm: (term: Term) => void;
  refetch: () => void;
}

export function usePrincipalDashboardData(): UsePrincipalDashboardDataResult {
  const [data, setData] = useState<PrincipalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Defaults to Term 1 until the fetch resolves and tells us the real
  // current term; synced once on load (see effect below), then left to
  // the user to control via the dropdown.
  const [rankingTerm, setRankingTerm] = useState<Term>("Term 1");
  const [refetchIndex, setRefetchIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getPrincipalDashboardData()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setRankingTerm(result.currentTerm);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load dashboard data"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refetchIndex]);

  const refetch = useCallback(() => setRefetchIndex((i) => i + 1), []);

  return { data, loading, error, rankingTerm, setRankingTerm, refetch };
}
