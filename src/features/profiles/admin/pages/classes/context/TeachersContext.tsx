import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Teacher } from "../types/Teacher";
import { fetchTeachers } from "../../subjects/services/teacher.service";

interface TeachersContextValue {
  teachers: Teacher[];
  getTeacher: (id: string) => Teacher | undefined;
  getTeacherByUserId: (userId: string) => Teacher | undefined;
  deleteTeacher: (id: string) => void;
}


const TeachersContext = createContext<TeachersContextValue | undefined>(undefined);

export function TeachersProvider({ children }: { children: ReactNode }) {
const [teachers, setTeachers] = useState<Teacher[]>([]);
useEffect(() => {
  async function loadTeachers() {
    try {
      const rows = await fetchTeachers();

      setTeachers(
        rows.map((row) => ({
          id: String(row.id),
          userId: String(row.user_id),
          firstName: row.first_name,
          lastName: row.last_name,
          middleName: row.middle_name,
          email: row.email_address,
          contactNumber: row.contact_number,
        }))
      );
    } catch (error) {
      console.error(error);
    }
  }

  loadTeachers();
}, []);

  const value = useMemo<TeachersContextValue>(
    () => ({
      teachers,
      getTeacher: (id) => teachers.find((t) => t.id === id),
      getTeacherByUserId: (userId) => teachers.find((t) => t.userId === userId),
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