// src/features/holistic/types/holisticAverageType.ts

/**
 * Domains that roll up into a student's holistic composite score.
 * Averages only cognitive, emotional, and behavioral — no "social" domain
 * at the per-student level (unlike the class-wide trends page).
 */
export type StudentDomainKey = "cognitive" | "emotional" | "behavioral";

/**
 * Whether the report card for this term has been released to the
 * parent/student. The narrative snapshot only renders when this is
 * "released" — otherwise a locked/processing state is shown.
 */
export type ReportCardStatus = "not_released" | "processing" | "released";

export interface StudentDomainScore {
  domain: StudentDomainKey;
  /** 1.0 - 5.0 rating, null if no data yet for this domain */
  score: number | null;
}

export interface StudentNarrativeSnapshot {
  studentId: string;
  studentName: string;
  termNumber: number;
  termLabel: string;

  reportCardStatus: ReportCardStatus;
  /** ISO date string of when the report card was released, null if not yet */
  releasedAt: string | null;

  domainScores: StudentDomainScore[];
  /** Average of domainScores, null if no scores available */
  compositeScore: number | null;

  /** Composite score from the previous term, for a delta indicator */
  previousCompositeScore: number | null;
}