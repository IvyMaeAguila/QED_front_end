import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Teacher } from "../types/Teacher";
import { seedTeachers, getNextTeacherId } from "../data/teacherData";

interface TeachersContextValue {
  teachers: Teacher[];
  getTeacher: (id: string) => Teacher | undefined;
  getTeacherByUserId: (userId: string) => Teacher | undefined;
  addTeacher: (teacher: Omit<Teacher, "id">) => Teacher;
  updateTeacher: (id: string, updates: Omit<Teacher, "id">) => void;
  deleteTeacher: (id: string) => void;
}

const TeachersContext = createContext<TeachersContextValue | undefined>(undefined);

export function TeachersProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>(seedTeachers);

  const value = useMemo<TeachersContextValue>(
    () => ({
      teachers,
      getTeacher: (id) => teachers.find((t) => t.id === id),
      getTeacherByUserId: (userId) => teachers.find((t) => t.userId === userId),
      addTeacher: (teacher) => {
        const created: Teacher = { ...teacher, id: getNextTeacherId(teachers) };
        setTeachers((prev) => [...prev, created]);
        return created;
      },
      updateTeacher: (id, updates) => {
        setTeachers((prev) => prev.map((t) => (t.id === id ? { ...updates, id } : t)));
      },
      deleteTeacher: (id) => {
        setTeachers((prev) => prev.filter((t) => t.id !== id));
      },
    }),
    [teachers]
  );

  return <TeachersContext.Provider value={value}>{children}</TeachersContext.Provider>;
}

export function useTeachers() {
  const ctx = useContext(TeachersContext);
  if (!ctx) throw new Error("useTeachers must be used within a TeachersProvider");
  return ctx;
}