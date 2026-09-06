// context/StudentProfileContext.tsx
// Location: Student/StudentProfile/context/StudentProfileContext.tsx

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { StudentProfileData } from "../types/types";
import {
  fetchStudentProfile,
  updateStudentProfile,
  type UpdateStudentProfilePayload,
} from "../service/StudentProfile.service";

interface StudentProfileContextValue {
  profile: StudentProfileData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  saveProfile: (updates: UpdateStudentProfilePayload) => Promise<void>;
}

const StudentProfileContext = createContext<StudentProfileContextValue | undefined>(undefined);

interface StudentProfileProviderProps {
  studentId: string;
  /** Optimistic seed (e.g. from mapDetailStudentToProfile) shown while the real fetch resolves. */
  initialProfile?: StudentProfileData;
  children: ReactNode;
}

export function StudentProfileProvider({ studentId, initialProfile, children }: StudentProfileProviderProps) {
  const [profile, setProfile] = useState<StudentProfileData | null>(initialProfile ?? null);
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStudentProfile(studentId);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load student profile");
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const saveProfile = useCallback(
    async (updates: UpdateStudentProfilePayload) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await updateStudentProfile(studentId, updates);
        setProfile(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save student profile");
        throw err; // let the form stay open on failure instead of silently exiting edit mode
      } finally {
        setIsSaving(false);
      }
    },
    [studentId]
  );

  const value = useMemo<StudentProfileContextValue>(
    () => ({ profile, isLoading, isSaving, error, refetch: loadProfile, saveProfile }),
    [profile, isLoading, isSaving, error, loadProfile, saveProfile]
  );

  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}

export function useStudentProfile(): StudentProfileContextValue {
  const ctx = useContext(StudentProfileContext);
  if (!ctx) {
    throw new Error("useStudentProfile must be used within a StudentProfileProvider");
  }
  return ctx;
}