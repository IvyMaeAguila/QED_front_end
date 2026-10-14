import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { GRADE_LEVEL_IDS, type Subject, type GradeLevel } from "../types/types";
import { fetchSubjectSectionsByGrade } from "../services/subject.service";
import {mapSubjectRow} from "../types/serverRowMappers";

export interface SubjectSectionsContextValue {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  getSubjectsForGrade: (grade: GradeLevel) => Subject[];
  loadSubjectsForGrade: (grade: GradeLevel) => Promise<void>;
  addLocalSubject: (subject: Subject) => void;
  updateLocalSubject: (id: string, updates: Partial<Subject>) => void;
}

const SubjectSectionsContext = createContext<SubjectSectionsContextValue | undefined>(undefined);

export function SubjectSectionsProvider({ children,value:external }: { children: ReactNode;value?:SubjectSectionsContextValue }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requests = useRef(0);

  const loadSubjectsForGrade = useCallback(async (grade: GradeLevel) => {
    requests.current += 1;
    setLoading(true); setError(null);
    try {
      const gradeId = GRADE_LEVEL_IDS[grade];
      const rows = await fetchSubjectSectionsByGrade(String(gradeId));
      const mapped = rows.map(mapSubjectRow);
      // palitan lang yung subjects ng grade na ito, huwag galawin yung ibang grade
      setSubjects((prev) => [...prev.filter((s) => s.gradeLevel !== grade), ...mapped]);
    } catch (err) {
      console.error("Failed to load subjects for grade:", err);
      setError(err instanceof Error ? err.message : "Failed to load subjects.");
    } finally {
      requests.current -= 1;
      setLoading(requests.current > 0);
    }
  }, []);

  function getSubjectsForGrade(grade: GradeLevel) {
    return subjects.filter((s) => s.gradeLevel === grade);
  }

  function addLocalSubject(subject: Subject) {
    setSubjects((prev) => [...prev, subject]);
  }

  function updateLocalSubject(id: string, updates: Partial<Subject>) {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  return (
    <SubjectSectionsContext.Provider
      value={external??{ subjects, loading, error, getSubjectsForGrade, loadSubjectsForGrade, addLocalSubject, updateLocalSubject }}
    >
      {children}
    </SubjectSectionsContext.Provider>
  );
}



export function useSubjectSections() {
  const ctx = useContext(SubjectSectionsContext);
  if (!ctx) throw new Error("useSubjectSections must be used within a SubjectSectionsProvider");
  return ctx;
}
