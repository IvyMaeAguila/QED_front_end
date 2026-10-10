import { createContext, useContext, useMemo, useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import type { ReactNode } from "react";
import type { Teacher } from "../types/Teacher";
import { fetchTeachers } from "../../subjects/services/teacher.service";

interface TeachersContextValue {
  teachers: Teacher[];
  loading: boolean;
  error: string | null;
  refetchTeachers: () => void;
  getTeacher: (id: string) => Teacher | undefined;
  getTeacherByUserId: (userId: string) => Teacher | undefined;
  deleteTeacher: (id: string) => void;
}


const TeachersContext = createContext<TeachersContextValue | undefined>(undefined);

export function TeachersProvider({ children }: { children: ReactNode }) {
const [teachers, setTeachers] = useState<Teacher[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [attempt, setAttempt] = useState(0);
useEffect(() => {
  let active = true;
  async function loadTeachers() {
    setLoading(true); setError(null);
    try {
      const rows = await fetchTeachers();
      if (!active) return;
      setTeachers(
        rows.map((row) => ({
          id: String(row.id),
          userId: String(row.user_id),
          firstName: row.first_name,
          lastName: row.last_name,
          middleName: row.middle_name,
          email: row.email_address,
          contactNumber: row.contact_number,
          gender: row.gender ?? undefined,
          avatarKey: row.avatar_key ?? undefined,
        }))
      );
    } catch (error) {
      console.error(error);
      if (active) setError(error instanceof Error ? error.message : "Failed to load teachers.");
    } finally {
      if (active) setLoading(false);
    }
  }

  loadTeachers();
  return () => { active = false; };
}, [attempt]);

  const value = useMemo<TeachersContextValue>(
    () => ({
      teachers,
      loading,
      error,
      refetchTeachers: () => setAttempt(value => value + 1),
      getTeacher: (id) => teachers.find((t) => t.id === id),
      getTeacherByUserId: (userId) => teachers.find((t) => t.userId === userId),
      deleteTeacher: (id) => {
        setTeachers((prev) => prev.filter((t) => t.id !== id));
      },
    }),
    [teachers, loading, error]
  );

  return <TeachersContext.Provider value={value}>{children}</TeachersContext.Provider>;
}

export function useTeachers() {
  const ctx = useContext(TeachersContext);
  if (!ctx) throw new Error("useTeachers must be used within a TeachersProvider");
  return ctx;
}
