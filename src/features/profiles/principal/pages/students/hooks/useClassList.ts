import { useEffect, useState } from "react";
import type { ClassList } from "../data/types";
import { getClassList, getSchoolYear } from "../services/studentsService";

interface UseClassListResult {
  classList: ClassList | null;
  schoolYear: string;
  loading: boolean;
  error: Error | null;
  // true once loading has finished and no section record was found —
  // distinct from `error`, since a missing/stale grade in the URL is an
  // expected outcome, not a failed request.
  notFound: boolean;
}

export function useClassList(grade: string | undefined): UseClassListResult {
  const [classList, setClassList] = useState<ClassList | null>(null);
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setClassList(null);

    if (!grade) {
      setLoading(false);
      return;
    }

    Promise.all([getClassList(grade), getSchoolYear()])
      .then(([classListResult, schoolYearResult]) => {
        if (cancelled) return;
        setClassList(classListResult);
        setSchoolYear(schoolYearResult);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load class list"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [grade]);

  return { classList, schoolYear, loading, error, notFound: !loading && !error && !classList };
}
