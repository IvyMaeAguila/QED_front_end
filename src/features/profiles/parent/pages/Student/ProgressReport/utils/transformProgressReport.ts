import type { Term, PeriodicRatingRow, TermAverageEntry } from "../types/types";

const TERM_ORDER: Term[] = ["T1", "T2", "T3"];

export interface BackendTerm {
  key: string;
  label: string;
  termNumber: number; // 1, 2, 3 — the only safe way to map to Term, since
                       // the backend omits unsubmitted terms entirely
  released: boolean;
  average?: number;
  subjects: { subject: string; grade: number | null; components?: { id: string; subject: string; grade: number | null }[] }[];
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

  function ratingRow(learningArea: string, grades: {termNumber:number; grade:number|null}[], parentLearningArea?:string): PeriodicRatingRow {
    const scores: Partial<Record<Term, number>> = {};
    for (const entry of grades) {
      const term = termFromNumber(entry.termNumber);
      if (term && typeof entry.grade === "number" && entry.grade > 0) scores[term] = entry.grade;
    }
    const complete = TERM_ORDER.every(term => typeof scores[term] === "number");
    const average = complete ? TERM_ORDER.reduce((sum,term) => sum + scores[term]!,0) / TERM_ORDER.length : null;
    return {learningArea, scores, finalRating: average === null ? "" : (Math.round(average * 100) / 100).toFixed(1), ...(parentLearningArea ? {parentLearningArea} : {})};
  }
  return subjectNames.flatMap(subject => {
    const entries = backendTerms.filter(term => term.released).map(term => ({termNumber:term.termNumber, value:term.subjects.find(row => row.subject === subject)}));
    const parent = ratingRow(subject, entries.map(entry => ({termNumber:entry.termNumber, grade:entry.value?.grade ?? null})));
    const components = new Map<string,string>();
    for (const entry of entries) for (const component of entry.value?.components ?? []) components.set(component.id, component.subject);
    return [parent, ...Array.from(components, ([id,label]) => ratingRow(label, entries.map(entry => ({termNumber:entry.termNumber,grade:entry.value?.components?.find(component => component.id === id)?.grade ?? null})),subject))];
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