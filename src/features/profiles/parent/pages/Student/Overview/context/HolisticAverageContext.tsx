// src/features/holistic/context/HolisticAverageContext.tsx

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { StudentNarrativeSnapshot } from "../types/holisticAverageType";
import type { StudentDomainKey } from "../types/holisticAverageType";
import {
  fetchStudentHolisticTermAverages,
  type HolisticTermAverage,
  type HolisticDomainAverages,
} from "../service/holisticTermPerformance.service";

interface StudentNarrativeSnapshotContextValue {
  snapshot: StudentNarrativeSnapshot | null;
  loading: boolean;
  error: string | null;
}

const StudentNarrativeSnapshotContext =
  createContext<StudentNarrativeSnapshotContextValue | undefined>(undefined);

interface StudentNarrativeSnapshotProviderProps {
  studentId: string;
  children: ReactNode;
}

const NARRATIVE_DOMAINS: StudentDomainKey[] = ["cognitive", "emotional", "behavioral", "social"];

/**
 * Averages all 4 holistic axes (cognitive/emotional/behavioral/social) that
 * the backend tracks. Returns null if every domain is null (nothing to
 * average yet).
 */
function computeComposite(domainAverages: HolisticDomainAverages): number | null {
  const values = [
    domainAverages.cognitive,
    domainAverages.emotional,
    domainAverages.behavioral,
    domainAverages.social,
  ].filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100;
}

/**
 * Maps one student's full list of per-term holistic averages down to the
 * single-term StudentNarrativeSnapshot shape this UI expects.
 *
 * KNOWN GAPS vs the original mock shape (flagging rather than guessing):
 * - `reportCardStatus` distinguishes visible scores from future terms. The
 *   active term is visible live; completed terms remain visible after end.
 * - `domainScores` includes all 4 backend axes (cognitive/emotional/
 *   behavioral/social).
 * - `studentName` isn't returned by this endpoint at all, so it's left as
 *   an empty string — callers that need a display name should keep sourcing
 *   it from their own student record (e.g. `DetailStudent.firstName`), same
 *   as HolisticAverage.tsx already does.
 * - `releasedAt` isn't returned by this endpoint, so it remains null.
 */
function toStudentNarrativeSnapshot(
  studentId: string,
  allTerms: HolisticTermAverage[]
): StudentNarrativeSnapshot | null {
  const current = allTerms.find((t) => t.isActive) ??
    allTerms.reduce<HolisticTermAverage | undefined>(
      (latest, term) => (!latest || term.termNumber > latest.termNumber ? term : latest),
      undefined,
    );
  if (!current) return null;

  const previous = allTerms.find((t) => t.termNumber === current.termNumber - 1);

  const domainScores = NARRATIVE_DOMAINS.map((domain) => ({
    domain,
    score: current.released ? current.domainAverages[domain] : null,
  }));

  return {
    studentId,
    studentName: "",
    termNumber: current.termNumber,
    termLabel: current.termLabel,
    reportCardStatus: current.released ? "released" : "not_released",
    releasedAt: null,
    domainScores,
    compositeScore: current.released ? computeComposite(current.domainAverages) : null,
    previousCompositeScore:
      previous?.released ? computeComposite(previous.domainAverages) : null,
  };
}

export function StudentNarrativeSnapshotProvider({
  studentId,
  children,
}: StudentNarrativeSnapshotProviderProps) {
  const [snapshot, setSnapshot] = useState<StudentNarrativeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(force = false) {
      if (!force) setLoading(true);
      try {
        const allTerms = await fetchStudentHolisticTermAverages(studentId, { force });

        if (cancelled) return;

        const data = toStudentNarrativeSnapshot(studentId, allTerms);
        if (data) {
          setSnapshot(data);
          setError(null);
        } else {
          setSnapshot(null);
          setError("No snapshot found for this student/term.");
        }
      } catch (err) {
        if (!cancelled) {
          if (!force) setSnapshot(null);
          setError(err instanceof Error ? err.message : "Failed to load narrative snapshot.");
        }
      } finally {
        if (!cancelled && !force) setLoading(false);
      }
    }

    load();

    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 30_000);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [studentId]);

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
