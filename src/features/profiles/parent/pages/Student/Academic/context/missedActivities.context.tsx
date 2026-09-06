import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MissedActivity } from "../types/types";
import MissedActivitiesService from "../service/missedActivities.service";

interface MissedActivitiesContextValue {
  activities: MissedActivity[];
  loading: boolean;
  error: string | null;
}

const MissedActivitiesContext = createContext<MissedActivitiesContextValue | undefined>(
  undefined
);

interface MissedActivitiesProviderProps {
  studentId: number | string;
  children: ReactNode;
}

export function MissedActivitiesProvider({ studentId, children }: MissedActivitiesProviderProps) {
  const [activities, setActivities] = useState<MissedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchMissedActivities() {
      setLoading(true);
      setError(null);
      try {
        const data = await MissedActivitiesService.getMissedActivities(studentId);
        if (isMounted) setActivities(data);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMissedActivities();

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  return (
    <MissedActivitiesContext.Provider value={{ activities, loading, error }}>
      {children}
    </MissedActivitiesContext.Provider>
  );
}

export function useMissedActivities() {
  const context = useContext(MissedActivitiesContext);
  if (!context) {
    throw new Error("useMissedActivities must be used within a MissedActivitiesProvider");
  }
  return context;
}