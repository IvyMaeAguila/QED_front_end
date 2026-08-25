export type HolisticAxisKey = "cognitive" | "emotional" | "social" | "behavioral";

export interface RatingLevel {
  value: number; // 1-5
  label: string;
  color: string;
  bg: string;
}

export const RATING_LEVELS: RatingLevel[] = [
  { value: 1, label: "Critical", color: "#EF4444", bg: "#FEF2F2" },
  { value: 2, label: "Needs Improvement", color: "#FB923C", bg: "#FFF7ED" },
  { value: 3, label: "Fair", color: "#F59E0B", bg: "#FFFBEB" },
  { value: 4, label: "Good", color: "#34D399", bg: "#ECFDF5" },
  { value: 5, label: "Excellent", color: "#22C55E", bg: "#F0FDF4" },
];

export function getRatingLevel(value: number | null): RatingLevel | null {
  if (value === null) return null;
  return RATING_LEVELS.find((r) => r.value === value) ?? null;
}

export const HOLISTIC_AXES: { key: HolisticAxisKey; label: string; description: string }[] = [
  { key: "cognitive", label: "Cognitive", description: "Performance, Comprehension" },
  { key: "emotional", label: "Emotional", description: "Motivation, Engagement" },
  { key: "social", label: "Social", description: "Participation, Teamwork" },
  { key: "behavioral", label: "Behavioral", description: "Attendance, Discipline" },
];

export type Term = 1 | 2 | 3;
export const TERMS: Term[] = [1, 2, 3];

export interface HolisticAssessment {
  studentId: string;
  term: Term;
  scores: Record<HolisticAxisKey, number | null>;
  notes: Record<HolisticAxisKey, string>;
  assessedByTeacherId: string;
  updatedAt: string; 
}

export function emptyScores(): Record<HolisticAxisKey, number | null> {
  return { cognitive: null, emotional: null, social: null, behavioral: null };
}

export function emptyNotes(): Record<HolisticAxisKey, string> {
  return { cognitive: "", emotional: "", social: "", behavioral: "" };
}

export function assessmentKey(studentId: string, term: Term): string {
  return `${studentId}:${term}`;
}