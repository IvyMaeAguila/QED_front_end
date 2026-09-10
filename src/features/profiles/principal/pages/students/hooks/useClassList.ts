import { useEffect, useState } from "react";
import type { ClassList } from "../data/types";
import {
  getClassList,
  getSchoolYear,
  getCachedClassList,
  getUnassignedClassList,
  getCachedUnassignedClassList,
} from "../services/students.service";

export type ClassListTarget =
  | { type: "class"; id: number }
  | { type: "grade"; id: number };

interface UseClassListResult {
  classList: ClassList | null;
  schoolYear: string;
  loading: boolean;
  error: Error | null;
  notFound: boolean;
}

function peekCache(target: ClassListTarget | undefined): ClassList | null | undefined {
  if (!target) return null;
  return target.type === "class"
    ? getCachedClassList(target.id)
    : getCachedUnassignedClassList(target.id);
}

function fetchTarget(target: ClassListTarget): Promise<ClassList | null> {
  return target.type === "class" ? getClassList(target.id) : getUnassignedClassList(target.id);
}

export function useClassList(target: ClassListTarget | undefined): UseClassListResult {
  const [classList, setClassList] = useState<ClassList | null>(() => peekCache(target) ?? null);
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(() => peekCache(target) === undefined && !!target);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!target) {
      setLoading(false);
      setClassList(null);
      return;
    }

    const cached = peekCache(target);

    if (cached !== undefined) {
      setClassList(cached);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
      setClassList(null);
    }

    Promise.all([fetchTarget(target), getSchoolYear()])
      .then(([classListResult, schoolYearResult]) => {
        if (cancelled) return;
        setClassList(classListResult);
        setSchoolYear(schoolYearResult);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load class list"));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [target?.type, target?.id]);

  return { classList, schoolYear, loading, error, notFound: !loading && !error && !classList };
}