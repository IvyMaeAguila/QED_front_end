import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { GRADE_LEVEL_IDS, GRADE_LEVEL_BY_ID, type Subject, type GradeLevel } from "../types";
import { fetchSubjectSectionsByGrade, type SubjectSectionByGradeRow } from "../services/subject.service";

interface SubjectSectionsContextValue {
  subjects: Subject[];
  loading: boolean;
  getSubjectsForGrade: (grade: GradeLevel) => Subject[];
  loadSubjectsForGrade: (grade: GradeLevel) => Promise<void>;
  addLocalSubject: (subject: Subject) => void;
  updateLocalSubject: (id: string, updates: Partial<Subject>) => void;
}

const SubjectSectionsContext = createContext<SubjectSectionsContextValue | undefined>(undefined);

function mapRow(row: SubjectSectionByGradeRow): Subject {
  return {
    id: String(row.id),
    name: row.subject_name,
    gradeLevel: GRADE_LEVEL_BY_ID[Number(row.grade_level_id)],
    section: row.section_name,
    teacherId: row.teacher_id != null ? String(row.teacher_id) : null,
    schoolYear: row.school_year,
    status: row.status,
  };
}

export function SubjectSectionsProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSubjectsForGrade = useCallback(async (grade: GradeLevel) => {
    setLoading(true);
    try {
      const gradeId = GRADE_LEVEL_IDS[grade];
      const rows = await fetchSubjectSectionsByGrade(String(gradeId));
      const mapped = rows.map(mapRow);
      // palitan lang yung subjects ng grade na ito, huwag galawin yung ibang grade
      setSubjects((prev) => [...prev.filter((s) => s.gradeLevel !== grade), ...mapped]);
    } catch (err) {
      console.error("Failed to load subjects for grade:", err);
    } finally {
      setLoading(false);
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
      value={{ subjects, loading, getSubjectsForGrade, loadSubjectsForGrade, addLocalSubject, updateLocalSubject }}
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