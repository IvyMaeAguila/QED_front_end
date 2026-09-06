import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ScheduleItem } from "../types/types";
import { fetchClassSchedule } from "../service/classSchedule.service";

interface ClassScheduleContextValue {
  items: ScheduleItem[];
  loading: boolean;
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
  }, [studentId]);

  return (
    <ClassScheduleContext.Provider value={{ items, loading, error }}>
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