import type { Term, PeriodicRatingRow, TermAverageEntry } from "../types/types";

const TERM_ORDER: Term[] = ["T1", "T2", "T3"];

export interface BackendTerm {
  key: string;
  label: string;
  termNumber: number; // 1, 2, 3 — the only safe way to map to Term, since
                       // the backend omits unsubmitted terms entirely
  released: boolean;
  average?: number;
  subjects: { subject: string; grade: number }[];
}

function getRatingLabel(avg: number | null): string | null {
  if (avg === null) return null;
  if (avg >= 90) return "Outstanding";
  if (avg >= 85) return "Very Satisfactory";
  if (avg >= 80) return "Satisfactory";
  if (avg >= 75) return "Fairly Satisfactory";
  return "Did Not Meet Expectations";
}

/** termNumber (1/2/3) -> Term ("T1"/"T2"/"T3"), guarding against bad values */
function termFromNumber(termNumber: number): Term | undefined {
  return TERM_ORDER[termNumber - 1];
}

export function toPeriodicRatingRows(backendTerms: BackendTerm[]): PeriodicRatingRow[] {
  const subjectNames = Array.from(
    new Set(backendTerms.flatMap((t) => t.subjects.map((s) => s.subject)))
  ).sort();

  return subjectNames.map((subject) => {
    const scores: Partial<Record<Term, number>> = {};

    backendTerms.forEach((t) => {
      if (!t.released) return;
      const term = termFromNumber(t.termNumber);
      if (!term) return; // unexpected termNumber — skip rather than mislabel

      const found = t.subjects.find((s) => s.subject === subject);
      if (found && found.grade > 0) scores[term] = found.grade;
    });

    const values = Object.values(scores).filter((v): v is number => typeof v === "number");

    // Only compute + show the final rating once all 3 terms (T1, T2, T3)
    // have a grade for this subject. If any term is still missing/
    // unreleased, leave finalRating blank so the report doesn't imply
    // a final grade before the school year is actually complete.
    const isComplete = TERM_ORDER.every((term) => typeof scores[term] === "number");
    const finalAvg = isComplete
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
      : null;

    return {
      learningArea: subject,
      scores,
      finalRating: finalAvg !== null ? finalAvg.toFixed(1) : "",
    };
  });
}

/**
 * Always returns exactly 3 entries (T1, T2, T3), even if the backend only
 * sent 1 or 2 terms. Missing/unsubmitted terms come back with
 * released: false and null values, so the UI can render "not yet
 * released" instead of accidentally showing stale or misaligned data.
 */
export function toTermAverages(backendTerms: BackendTerm[]): TermAverageEntry[] {
  const byTermNumber = new Map(backendTerms.map((t) => [t.termNumber, t]));

  return TERM_ORDER.map((term, idx) => {
    const termNumber = idx + 1;
    const backendTerm = byTermNumber.get(termNumber);

    if (!backendTerm || !backendTerm.released) {
      return { term, average: null, ratingLabel: null, released: false };
    }

    const avg = backendTerm.average ?? null;
    return {
      term,
      average: avg,
      ratingLabel: getRatingLabel(avg),
      released: true,
    };
  });
}