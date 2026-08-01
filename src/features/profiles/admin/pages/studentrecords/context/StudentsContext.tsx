import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Student } from "../types/Students";
// import { seedStudents } from "../data/studentData";
import { studentService } from "../services/student-record.service";

interface StudentsContextValue {
  students: Student[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getStudent: (id: string) => Student | undefined;
  addStudent: (student: Student) => Student;
  addStudents: (students: Student[]) => void;
  updateStudent: (dbId: number, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (dbId: number) => Promise<void>;
}

const StudentsContext = createContext<StudentsContextValue | undefined>(
  undefined,
);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStudents() {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getAllStudents();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  function sortStudents(list: Student[]): Student[] {
    return [...list].sort((a, b) => { 
      if (a.gradeLevelId !== b.gradeLevelId) {
        return a.gradeLevelId - b.gradeLevelId;
      }
      return a.section.localeCompare(b.section);
    });
  }

  const value = useMemo<StudentsContextValue>(
    () => ({
      students,
      loading,
      error,
      refetch: fetchStudents,
      getStudent: (id) => students.find((s) => s.id === id),
      addStudent: (student) => {
        setStudents((prev) => sortStudents([...prev, student]));
        return student;
      },
      addStudents: (newStudents) => {
        setStudents((prev) => sortStudents([...prev, ...newStudents]));
      },

      updateStudent: async (dbId: number, updates: Partial<Student>) => {
        await studentService.updateStudent(dbId, updates);
        await fetchStudents();
      },
      deleteStudent: async (dbId: number) => {
        await studentService.softDeleteStudent(dbId);
        await fetchStudents();
      },
    }),
    [students],
  );

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx)
    throw new Error("useStudents must be used within a StudentsProvider");
  return ctx;
}