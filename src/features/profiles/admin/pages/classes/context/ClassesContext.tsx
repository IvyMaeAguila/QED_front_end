import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { SchoolClass } from "../types/Class";
import { fetchClasses, deleteClassApi, type ClassRecord } from "../services/classes.service";

interface ClassesContextValue {
  classes: SchoolClass[];
  loading: boolean;
  error: string | null;
  getClass: (id: string) => SchoolClass | undefined;
  deleteClass: (id: string) => Promise<void>;
  refreshClasses: () => void;
}

const ClassesContext = createContext<ClassesContextValue | undefined>(undefined);

// day_of_week (full) -> short code na gamit ng frontend types
const DAY_SHORT_MAP: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
};

function mapRecordToSchoolClass(c: ClassRecord): SchoolClass & { studentCount: number } {
  return {
    id: String(c.id),
    gradeLevelId: c.gradeLevelId,
    gradeLevel: c.gradeLevel,
    sectionId: c.sectionId, 
    section: c.section,
    adviserId: String(c.adviserId),
    adviserName: c.adviserName,
    adviserEmail: c.adviserEmail,
    adviserContact: c.adviserContact,
    studentCount: c.studentCount,
    schedule: c.schedule.map((p) => ({
      id: String(p.id),
      subject: p.subject,
      teacherId: String(p.teacherId),
      teacherName: p.teacherName,
      startTime: p.startTime,
      endTime: p.endTime,
      days: p.days.map((d) => (DAY_SHORT_MAP[d] || d) as any),
    })),
  };
}

export function ClassesProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchClasses()
      .then((data) => {
        if (active) setClasses(data.map(mapRecordToSchoolClass));
      })
      .catch((err) => {
        console.error(err);
        if (active) setError("Failed to load classes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadFlag]);

  const value = useMemo<ClassesContextValue>(
    () => ({
      classes,
      loading,
      error,
      getClass: (id) => classes.find((c) => c.id === id),
      deleteClass: async (id) => {
        await deleteClassApi(id);
        setClasses((prev) => prev.filter((c) => c.id !== id));
      },
      refreshClasses: () => setReloadFlag((f) => f + 1),
    }),
    [classes, loading, error]
  );

  return <ClassesContext.Provider value={value}>{children}</ClassesContext.Provider>;
}

export function useClasses() {
  const ctx = useContext(ClassesContext);
  if (!ctx) throw new Error("useClasses must be used within a ClassesProvider");
  return ctx;
}