import { useEffect, useState } from "react";
import { fetchSchoolYear, fetchStudentsByGrade, fetchSubjects } from "../services/gradebooksService";
import type { Student } from "../data/types";

interface UsePrincipalGradeSheetResult {
  students: Student[];
  subjects: string[];
  schoolYear: string;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function usePrincipalGradeSheet(grade: string): UsePrincipalGradeSheetResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    Promise.all([fetchStudentsByGrade(grade), fetchSubjects(), fetchSchoolYear()])
      .then(([result, subj, year]) => {
        if (cancelled) return;
        if (result === null) {
          setNotFound(true);
          setStudents([]);
          return;
        }
        setStudents(result);
        setSubjects(subj);
        setSchoolYear(year);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load grade sheet.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [grade]);

  return { students, subjects, schoolYear, loading, error, notFound };
}
