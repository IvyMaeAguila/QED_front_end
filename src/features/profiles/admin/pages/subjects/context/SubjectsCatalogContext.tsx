import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { GRADE_LEVEL_IDS } from "../types";
import type { GradeLevel } from "../types";
import { fetchSubjectsByGrade, type ElemSubjectRow } from "../services/subject.service";

interface SubjectsCatalogContextValue {
  loading: boolean;
  getSubjectNamesForGrade: (grade: GradeLevel) => string[];
  loadSubjectsForGrade: (grade: GradeLevel) => Promise<void>;
}

const SubjectsCatalogContext = createContext<SubjectsCatalogContextValue | undefined>(undefined);

export function SubjectsCatalogProvider({ children }: { children: ReactNode }) {
  const [subjectsByGrade, setSubjectsByGrade] = useState<Record<string, ElemSubjectRow[]>>({});
  const [loading, setLoading] = useState(false);

  const loadSubjectsForGrade = useCallback(async (grade: GradeLevel) => {
    setLoading(true);
    try {
      const gradeId = GRADE_LEVEL_IDS[grade];
      const rows = await fetchSubjectsByGrade(String(gradeId));
      setSubjectsByGrade((prev) => ({ ...prev, [grade]: rows }));
    } catch (err) {
      console.error("Failed to load subjects:", err);
      setSubjectsByGrade((prev) => ({ ...prev, [grade]: [] }));
    } finally {
      setLoading(false);
    }
  }, []);

  function getSubjectNamesForGrade(grade: GradeLevel): string[] {
    return (subjectsByGrade[grade] ?? []).map((s) => s.subject_name);
  }

  return (
    <SubjectsCatalogContext.Provider
      value={{ loading, getSubjectNamesForGrade, loadSubjectsForGrade }}
    >
      {children}
    </SubjectsCatalogContext.Provider>
  );
}

export function useSubjectsCatalog() {
  const ctx = useContext(SubjectsCatalogContext);
  if (!ctx) throw new Error("useSubjectsCatalog must be used within a SubjectsCatalogProvider");
  return ctx;
}