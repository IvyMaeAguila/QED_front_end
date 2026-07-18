import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Student } from "../types/Students";
import { seedStudents, getNextStudentId } from "../data/studentData";

interface StudentsContextValue {
  students: Student[];
  getStudent: (id: string) => Student | undefined;
  addStudent: (student: Omit<Student, "id">) => Student;
  addStudents: (students: Student[]) => void;
  updateStudent: (id: string, updates: Omit<Student, "id">) => void;
  deleteStudent: (id: string) => void;
}

const StudentsContext = createContext<StudentsContextValue | undefined>(undefined);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(seedStudents);

  const value = useMemo<StudentsContextValue>(
    () => ({
      students,
      getStudent: (id) => students.find((s) => s.id === id),
      addStudent: (student) => {
        const newStudent: Student = { ...student, id: getNextStudentId(students) };
        setStudents((prev) => [...prev, newStudent]);
        return newStudent;
      },
      addStudents: (newStudents) => {
        setStudents((prev) => [...prev, ...newStudents]);
      },
      updateStudent: (id, updates) => {
        setStudents((prev) => prev.map((s) => (s.id === id ? { ...updates, id } : s)));
      },
      deleteStudent: (id) => {
        setStudents((prev) => prev.filter((s) => s.id !== id));
      },
    }),
    [students]
  );

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>;
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) throw new Error("useStudents must be used within a StudentsProvider");
  return ctx;
}