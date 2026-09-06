import type { HolisticAssessmentEntry, Term } from "../types/types";
import type { BackendHolisticDomainAverages, BackendHolisticTermAverage } from "../service/HolisticPerformance.service";

/** Order matters here — HolisticDevelopmentCard's AXIS_ANGLES assumes
 * [cognitive, emotional, social, behavioral] in that exact order. */
const DOMAIN_ORDER: Array<keyof BackendHolisticDomainAverages> = [
  "cognitive",
  "emotional",
  "social",
  "behavioral",
];

const DOMAIN_LABELS: Record<keyof BackendHolisticDomainAverages, string> = {
  cognitive: "Cognitive",
  emotional: "Emotional",
  social: "Social",
  behavioral: "Behavioral",
};

const DOMAIN_SUBTITLES: Record<keyof BackendHolisticDomainAverages, string> = {
  cognitive: "Understanding of lessons and problem-solving",
  emotional: "Motivation, confidence, and engagement",
  social: "Collaboration and peer relationships",
  behavioral: "Focus, discipline, and classroom conduct",
};

const MAX_SCORE = 5.0;

function termNumberToTerm(termNumber: number): Term {
  return `T${termNumber}` as Term;
}

/**
 * Converts the backend's per-term domain-average rows into the
 * HolisticAssessmentEntry[] shape ProgressReportContext/HolisticDevelopmentCard
 * expect.
 *
 * A term with zero evaluations gets an empty `domains` array (rather than
 * four zeroed-out domains) so HolisticDevelopmentCard falls through to its
 * "No holistic assessment data for this term" message instead of drawing a
 * misleading empty-at-center radar chart. A term with *some* ratings but a
 * gap in one axis still shows all four domains, with the missing axis
 * scored 0 — that's a real "no data yet for this domain" signal worth
 * surfacing on the chart, not worth hiding the whole term for.
 */
export function toHolisticAssessments(
  backendTerms: BackendHolisticTermAverage[],
): HolisticAssessmentEntry[] {
  return backendTerms.map((entry) => {
    const domains =
      entry.evaluationCount === 0
        ? []
        : DOMAIN_ORDER.map((key) => ({
            key,
            label: DOMAIN_LABELS[key],
            score: entry.domainAverages[key] ?? 0,
            maxScore: MAX_SCORE,
            subtitle: DOMAIN_SUBTITLES[key],
          }));

    return {
      term: termNumberToTerm(entry.termNumber),
      domains,
    };
  });
}