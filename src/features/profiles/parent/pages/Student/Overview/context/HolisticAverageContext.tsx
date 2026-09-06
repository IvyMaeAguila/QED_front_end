// src/features/holistic/context/HolisticAverageContext.tsx

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { StudentNarrativeSnapshot } from "../types/holisticAverageType";
import { MOCK_STUDENT_SNAPSHOTS, getMockSnapshot } from "../data/holisticAverageMock";

interface StudentNarrativeSnapshotContextValue {
  snapshot: StudentNarrativeSnapshot | null;
  loading: boolean;
  error: string | null;
}

const StudentNarrativeSnapshotContext =
  createContext<StudentNarrativeSnapshotContextValue | undefined>(undefined);

interface StudentNarrativeSnapshotProviderProps {
  studentId: string;
  termNumber: number;
  children: ReactNode;
}

// MOCKUP ONLY: swap the body of this effect for a real fetch call
// (e.g. fetchStudentNarrativeSnapshot(studentId, termNumber)) once the
// report-card release endpoint is ready.
export function StudentNarrativeSnapshotProvider({
  studentId,
  termNumber,
  children,
}: StudentNarrativeSnapshotProviderProps) {
  const [snapshot, setSnapshot] = useState<StudentNarrativeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      // TEMP: real student IDs from DetailStudent won't match the mock
      // "STU-100X" IDs yet, so fall back to any mock record for the same
      // term. Remove this fallback once the mock data (or the real API)
      // is keyed by actual student IDs.
      const data =
        getMockSnapshot(studentId, termNumber) ??
        MOCK_STUDENT_SNAPSHOTS.find((s) => s.termNumber === termNumber) ??
        MOCK_STUDENT_SNAPSHOTS[0];

      if (data) {
        setSnapshot(data);
      } else {
        setSnapshot(null);
        setError("No snapshot found for this student/term.");
      }
      setLoading(false);
    }, 300); // simulated latency

    return () => clearTimeout(timeout);
  }, [studentId, termNumber]);

  const value = useMemo(
    () => ({ snapshot, loading, error }),
    [snapshot, loading, error]
  );

  return (
    <StudentNarrativeSnapshotContext.Provider value={value}>
      {children}
    </StudentNarrativeSnapshotContext.Provider>
  );
}

export function useStudentNarrativeSnapshot() {
  const ctx = useContext(StudentNarrativeSnapshotContext);
  if (!ctx) {
    throw new Error(
      "useStudentNarrativeSnapshot must be used within a StudentNarrativeSnapshotProvider"
    );
  }
  return ctx;
}