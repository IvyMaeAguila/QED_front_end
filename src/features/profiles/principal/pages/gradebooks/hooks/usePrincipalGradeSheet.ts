import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import {
  fetchPrincipalGradebook,
  fetchSchoolYear,
  type PrincipalGradebookParams,
} from "../services/gradebooks.service";
import type { Student } from "../data/types";

interface UsePrincipalGradeSheetResult {
  students: Student[];
  subjects: string[];
  schoolYear: string;
  sectionName: string | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  ready: boolean;
  retry: () => void;
}

export function usePrincipalGradeSheet(
  params: PrincipalGradebookParams,
  enabled = true,
): UsePrincipalGradeSheetResult {
  const { gradeLevelId, gradingPeriodId, sectionId } = params;

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [sectionName, setSectionName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);

    Promise.all([
      fetchPrincipalGradebook({ gradeLevelId, gradingPeriodId, sectionId }, controller.signal),
      fetchSchoolYear(controller.signal),
    ])
      .then(([gradebook, year]) => {
        if (controller.signal.aborted) return;
        if (gradebook === null) {
          setNotFound(true);
          setStudents([]);
          setSubjects([]);
          setSectionName(null);
          return;
        }
        setStudents(gradebook.students);
        setSubjects(gradebook.subjects);
        setSectionName(gradebook.sectionName);
        setSchoolYear(year);
        setReady(true);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load grade sheet.");
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [gradeLevelId, gradingPeriodId, sectionId, enabled, attempt]);

  return { students, subjects, schoolYear, sectionName, loading, error, notFound, ready, retry: () => setAttempt(value => value + 1) };
}
