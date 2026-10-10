import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import type { ScheduleItem } from "../types/types";
import { fetchClassSchedule } from "../service/classSchedule.service";

interface ClassScheduleContextValue {
  items: ScheduleItem[];
  loading: boolean;
  retry: () => void;
  error: string | null;
}

const ClassScheduleContext = createContext<ClassScheduleContextValue | undefined>(
  undefined
);

interface ClassScheduleProviderProps {
  studentId: string;
  children: ReactNode;
}

export function ClassScheduleProvider({ studentId, children }: ClassScheduleProviderProps) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let isMounted = true;

    async function loadSchedule() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClassSchedule(studentId);
        if (isMounted) setItems(data);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load class schedule.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [studentId, attempt]);

  return (
    <ClassScheduleContext.Provider value={{ items, loading, error, retry: () => setAttempt(n => n + 1) }}>
      {children}
    </ClassScheduleContext.Provider>
  );
}

export function useClassSchedule(): ClassScheduleContextValue {
  const context = useContext(ClassScheduleContext);
  if (!context) {
    throw new Error("useClassSchedule must be used within a ClassScheduleProvider");
  }
  return context;
}