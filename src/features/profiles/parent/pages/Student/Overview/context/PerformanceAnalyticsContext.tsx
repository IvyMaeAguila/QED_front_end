import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchStudentTermPerformance } from "../service/studentTermPerformance.service";
import type { Term, SubjectGrade } from "../service/studentTermPerformance.service";

export type { SubjectGrade, Term };

export interface TermPoint {
  /** "Term 1" | "Term 2" | "Term 3" */
  term: string;
  /** Overall average for that term (percentage) */
  average: number;
  /** Per-subject grades for that term — shown on hover */
  subjects: SubjectGrade[];
}

interface TermPerformanceContextValue {
  terms: Term[];
  termPoints: TermPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const TermPerformanceContext = createContext<TermPerformanceContextValue | undefined>(
  undefined
);

function toTermPoints(terms: Term[]): TermPoint[] {
  return terms
    .filter((t) => t.released && t.average !== undefined)
    .map((t, i) => ({
      term: `Term ${i + 1}`,
      average: t.average as number,
      subjects: t.subjects,
    }));
}

export function TermPerformanceProvider({
  studentId,
  children,
}: {
  studentId: string;
  children: ReactNode;
}) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
  let cancelled = false;
  setLoading(true);
  setError(null);

  fetchStudentTermPerformance(studentId, { force: refetchTick > 0 })
    .then((data) => {
      if (!cancelled) setTerms(data);
    })
    .catch((err) => {
      console.error("Failed to load student term performance:", err);
      if (!cancelled) setError("Failed to load term performance.");
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

  return () => {
    cancelled = true;
  };
}, [studentId, refetchTick]);

  const termPoints = useMemo(() => toTermPoints(terms), [terms]);

  const refetch = () => setRefetchTick((n) => n + 1);

  const value: TermPerformanceContextValue = {
    terms,
    termPoints,
    loading,
    error,
    refetch,
  };

  return (
    <TermPerformanceContext.Provider value={value}>
      {children}
    </TermPerformanceContext.Provider>
  );
}

export function useTermPerformance() {
  const ctx = useContext(TermPerformanceContext);
  if (!ctx) {
    throw new Error(
      "useTermPerformance must be used within a TermPerformanceProvider"
    );
  }
  return ctx;
}