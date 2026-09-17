import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { GRADE_LEVEL_IDS } from "../types/types";
import type { GradeLevel } from "../types/types";
import {
  fetchSubjectsByGrade,
  getAssessmentTypes,
  createAssessmentType,
  updateAssessmentType,
  deleteAssessmentType,
  type ElemSubjectRow,
  type NewAssessmentType
} from "../services/subject.service";

interface SubjectsCatalogContextValue {
  loading: boolean;
  getSubjectNamesForGrade: (grade: GradeLevel) => string[];
  loadSubjectsForGrade: (grade: GradeLevel) => Promise<void>;
  assessmentTypes: NewAssessmentType[];
  loadAssessmentTypes: () => Promise<void>;
  addAssessmentType: (assessmentName: string) => Promise<NewAssessmentType>;
  editAssessmentType: (id: number, assessmentName: string) => Promise<NewAssessmentType>;
  removeAssessmentType: (id: number) => Promise<void>;
}

const SubjectsCatalogContext = createContext<SubjectsCatalogContextValue | undefined>(undefined);

export function SubjectsCatalogProvider({ children }: { children: ReactNode }) {
  const [subjectsByGrade, setSubjectsByGrade] = useState<Record<string, ElemSubjectRow[]>>({});
  const [assessmentTypes, setAssessmentTypes] = useState<NewAssessmentType[]>([]);
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

  const loadAssessmentTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAssessmentTypes();
      setAssessmentTypes(res.data ?? []);
    } catch (err) {
      console.error("Failed to load assessment types:", err);
      setAssessmentTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // hindi natin ni-loloading dito para hindi mag-flicker yung buong list
  // habang nag-a-add/update/delete lang ng isang item
  const addAssessmentType = useCallback(async (assessmentName: string) => {
    const newType = await createAssessmentType({ assessmentName });
    setAssessmentTypes((prev) => [newType, ...prev]);
    return newType;
  }, []);

  const editAssessmentType = useCallback(async (id: number, assessmentName: string) => {
    const updated = await updateAssessmentType(id, { assessmentName });
    setAssessmentTypes((prev) =>
      prev.map((item) => (item.id === id ? updated : item))
    );
    return updated;
  }, []);

  const removeAssessmentType = useCallback(async (id: number) => {
    await deleteAssessmentType(id);
    setAssessmentTypes((prev) => prev.filter((item) => item.id !== id));
  }, []);

  function getSubjectNamesForGrade(grade: GradeLevel): string[] {
    return (subjectsByGrade[grade] ?? []).map((s) => s.subject_name);
  }

  return (
    <SubjectsCatalogContext.Provider
      value={{
        loading,
        getSubjectNamesForGrade,
        loadSubjectsForGrade,
        assessmentTypes,
        loadAssessmentTypes,
        addAssessmentType,
        editAssessmentType,
        removeAssessmentType
      }}
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