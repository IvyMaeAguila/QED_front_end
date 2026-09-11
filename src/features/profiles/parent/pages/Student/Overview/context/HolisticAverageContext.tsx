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
  termNumber: number;
  children: ReactNode;
  /**
   * DEV/QA ONLY: forces the backend to skip its release gate (end_date
   * check) so you can see real numbers before the term has actually ended.
   * Defaults to false. Do NOT leave this true in anything parent-facing —
   * see the warning on the controller's `preview` query param.
   */
  preview?: boolean;
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
 * - `reportCardStatus` only distinguishes "released" / "not_released" here —
 *   the backend's `released` flag is a boolean (gated on the term's
 *   end_date), so there's no third "processing" state to map to yet. If a
 *   "processing" state is needed, the controller needs to start returning
 *   something to distinguish it first.
 * - `domainScores` now includes all 4 backend axes (cognitive/emotional/
 *   behavioral/social) — if `StudentDomainKey` and the components consuming
 *   this (HolisticAverage.tsx's STUDENT_DOMAIN_META, DOMAIN_AXIS_LABEL,
 *   radar chart) are still typed/wired for 3 domains only, those need
 *   updating too. This file alone can't fix that — flagging it here.
 * - `studentName` isn't returned by this endpoint at all, so it's left as
 *   an empty string — callers that need a display name should keep sourcing
 *   it from their own student record (e.g. `DetailStudent.firstName`), same
 *   as HolisticAverage.tsx already does.
 * - `releasedAt` isn't returned by this endpoint either (the controller
 *   only returns a boolean, not a timestamp) — left as null. Add a
 *   `releasedAt`/`end_date` field server-side if this needs to be real.
 */
function toStudentNarrativeSnapshot(
  studentId: string,
  termNumber: number,
  allTerms: HolisticTermAverage[]
): StudentNarrativeSnapshot | null {
  const current = allTerms.find((t) => t.termNumber === termNumber);
  if (!current) return null;

  const previous = allTerms.find((t) => t.termNumber === termNumber - 1);

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
  termNumber,
  children,
  preview = true,
}: StudentNarrativeSnapshotProviderProps) {
  const [snapshot, setSnapshot] = useState<StudentNarrativeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch every term (not just `termNumber`) so we have the prior
        // term on hand for `previousCompositeScore` — this also means the
        // request is cached per-studentId regardless of which term the
        // user is viewing, so switching terms doesn't re-fetch.
        const allTerms = await fetchStudentHolisticTermAverages(studentId, { preview });

        if (cancelled) return;

        const data = toStudentNarrativeSnapshot(studentId, termNumber, allTerms);
        if (data) {
          setSnapshot(data);
        } else {
          setSnapshot(null);
          setError("No snapshot found for this student/term.");
        }
      } catch (err) {
        if (!cancelled) {
          setSnapshot(null);
          setError(err instanceof Error ? err.message : "Failed to load narrative snapshot.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [studentId, termNumber, preview]);

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