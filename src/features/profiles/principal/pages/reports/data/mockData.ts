// TODO: replace with real API data. Consumed only by analyticsService.ts.
import type { Term, RankedSubject, HeatmapRow, ViewMode } from "./types";

export const TERM_OPTIONS: Term[] = ["Term 1", "Term 2", "Term 3"];
export const GRADE_OPTIONS = ["All Grades", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
export const VIEW_OPTIONS: ViewMode[] = ["By Grade Level", "By Subject"];

// TODO: replace with real API data — every grade+subject combination, per term
export const RANKING_BY_TERM: Record<Term, RankedSubject[]> = {
  "Term 1": [
    { subject: "Mathematics", grade: "Grade 1", score: 94, trend: "up" },
    { subject: "English", grade: "Grade 4", score: 92, trend: "up" },
    { subject: "Science", grade: "Grade 6", score: 90, trend: "flat" },
    { subject: "Araling Panlipunan", grade: "Grade 2", score: 89, trend: "up" },
    { subject: "Filipino", grade: "Grade 1", score: 87, trend: "down" },
    { subject: "Mathematics", grade: "Grade 6", score: 86, trend: "flat" },
    { subject: "Science", grade: "Grade 3", score: 84, trend: "up" },
    { subject: "English", grade: "Grade 2", score: 83, trend: "down" },
    { subject: "Araling Panlipunan", grade: "Grade 5", score: 81, trend: "flat" },
    { subject: "Filipino", grade: "Grade 3", score: 79, trend: "down" },
    { subject: "Mathematics", grade: "Grade 5", score: 76, trend: "down" },
    { subject: "Science", grade: "Grade 4", score: 74, trend: "flat" },
    { subject: "English", grade: "Grade 5", score: 71, trend: "down" },
    { subject: "Mathematics", grade: "Grade 3", score: 68, trend: "down" },
  ],
  "Term 2": [
    { subject: "Filipino", grade: "Grade 2", score: 91, trend: "up" },
    { subject: "Mathematics", grade: "Grade 6", score: 90, trend: "flat" },
    { subject: "Science", grade: "Grade 3", score: 86, trend: "up" },
    { subject: "English", grade: "Grade 4", score: 85, trend: "down" },
    { subject: "Araling Panlipunan", grade: "Grade 5", score: 82, trend: "flat" },
    { subject: "Mathematics", grade: "Grade 1", score: 80, trend: "down" },
    { subject: "Science", grade: "Grade 6", score: 78, trend: "flat" },
    { subject: "English", grade: "Grade 2", score: 75, trend: "down" },
    { subject: "Mathematics", grade: "Grade 5", score: 70, trend: "down" },
    { subject: "Science", grade: "Grade 4", score: 66, trend: "down" },
  ],
  "Term 3": [
    { subject: "Mathematics", grade: "Grade 1", score: 96, trend: "up" },
    { subject: "Science", grade: "Grade 6", score: 93, trend: "up" },
    { subject: "English", grade: "Grade 4", score: 91, trend: "up" },
    { subject: "Filipino", grade: "Grade 2", score: 89, trend: "flat" },
    { subject: "Araling Panlipunan", grade: "Grade 5", score: 87, trend: "up" },
    { subject: "Mathematics", grade: "Grade 6", score: 85, trend: "up" },
    { subject: "Science", grade: "Grade 3", score: 82, trend: "up" },
    { subject: "Mathematics", grade: "Grade 5", score: 74, trend: "up" },
    { subject: "Science", grade: "Grade 4", score: 71, trend: "up" },
  ],
};

// TODO: prototype-only mock data — replace with real API data once the
// heatmap shape (grades vs. subjects, per-term granularity) is finalized.
export const GRADE_ROWS: Record<Term, HeatmapRow[]> = {
  "Term 1": [
    { label: "Grade 1", scores: { cognitive: 4.2, emotional: 4.5, behavioral: 4.0, social: 3.8 } },
    { label: "Grade 2", scores: { cognitive: 3.9, emotional: 3.6, behavioral: 3.4, social: 3.9 } },
    { label: "Grade 3", scores: { cognitive: 3.1, emotional: 3.3, behavioral: 2.8, social: 3.0 } },
    { label: "Grade 4", scores: { cognitive: 2.6, emotional: 3.0, behavioral: 2.4, social: 2.9 } },
    { label: "Grade 5", scores: { cognitive: 2.2, emotional: 2.6, behavioral: 2.1, social: 2.5 } },
    { label: "Grade 6", scores: { cognitive: 3.8, emotional: 3.5, behavioral: 3.9, social: 4.1 } },
  ],
  "Term 2": [
    { label: "Grade 1", scores: { cognitive: 4.0, emotional: 4.3, behavioral: 3.9, social: 3.7 } },
    { label: "Grade 2", scores: { cognitive: 4.1, emotional: 3.8, behavioral: 3.6, social: 4.0 } },
    { label: "Grade 3", scores: { cognitive: 3.4, emotional: 3.5, behavioral: 3.0, social: 3.2 } },
    { label: "Grade 4", scores: { cognitive: 2.9, emotional: 3.1, behavioral: 2.7, social: 3.0 } },
    { label: "Grade 5", scores: { cognitive: 2.5, emotional: 2.8, behavioral: 2.3, social: 2.6 } },
    { label: "Grade 6", scores: { cognitive: null, emotional: null, behavioral: null, social: null } },
  ],
  "Term 3": [
    { label: "Grade 1", scores: { cognitive: 4.4, emotional: 4.6, behavioral: 4.2, social: 4.0 } },
    { label: "Grade 2", scores: { cognitive: 4.2, emotional: 4.0, behavioral: 3.8, social: 4.1 } },
    { label: "Grade 3", scores: { cognitive: 3.6, emotional: 3.7, behavioral: 3.2, social: 3.4 } },
    { label: "Grade 4", scores: { cognitive: 3.0, emotional: 3.3, behavioral: 2.9, social: 3.1 } },
    { label: "Grade 5", scores: { cognitive: 2.7, emotional: 3.0, behavioral: 2.5, social: 2.8 } },
    { label: "Grade 6", scores: { cognitive: 4.0, emotional: 3.8, behavioral: 4.1, social: 4.3 } },
  ],
};

export const SUBJECT_ROWS: Record<Term, HeatmapRow[]> = {
  "Term 1": [
    { label: "Mathematics", scores: { cognitive: 3.4, emotional: 3.0, behavioral: 3.6, social: 3.2 } },
    { label: "English", scores: { cognitive: 3.8, emotional: 3.7, behavioral: 3.5, social: 3.9 } },
    { label: "Science", scores: { cognitive: 3.1, emotional: 3.2, behavioral: 3.0, social: 3.1 } },
    { label: "Filipino", scores: { cognitive: 3.6, emotional: 3.9, behavioral: 3.8, social: 4.0 } },
    { label: "Araling Panlipunan", scores: { cognitive: 3.3, emotional: 3.4, behavioral: 3.2, social: 3.5 } },
  ],
  "Term 2": [
    { label: "Mathematics", scores: { cognitive: 3.6, emotional: 3.1, behavioral: 3.7, social: 3.3 } },
    { label: "English", scores: { cognitive: 3.9, emotional: 3.8, behavioral: 3.6, social: 4.0 } },
    { label: "Science", scores: { cognitive: 3.3, emotional: 3.3, behavioral: 3.1, social: 3.2 } },
    { label: "Filipino", scores: { cognitive: 3.7, emotional: 4.0, behavioral: 3.9, social: 4.1 } },
    { label: "Araling Panlipunan", scores: { cognitive: 3.4, emotional: 3.5, behavioral: 3.3, social: 3.6 } },
  ],
  "Term 3": [
    { label: "Mathematics", scores: { cognitive: 3.9, emotional: 3.4, behavioral: 4.0, social: 3.6 } },
    { label: "English", scores: { cognitive: 4.1, emotional: 4.0, behavioral: 3.9, social: 4.2 } },
    { label: "Science", scores: { cognitive: 3.6, emotional: 3.6, behavioral: 3.4, social: 3.5 } },
    { label: "Filipino", scores: { cognitive: 4.0, emotional: 4.2, behavioral: 4.1, social: 4.3 } },
    { label: "Araling Panlipunan", scores: { cognitive: 3.7, emotional: 3.8, behavioral: 3.6, social: 3.9 } },
  ],
};
