import type { Student } from "../data/types";

export function fullName(s: Student): string {
  return `${s.lastName}, ${s.firstName} ${s.middleInitial}`;
}

export function sortByLastName(a: Student, b: Student): number {
  return a.lastName.localeCompare(b.lastName);
}

export function computeAverage(grades: Record<string, number>, subjects: string[]): number {
  const values = subjects.map((subj) => grades[subj]).filter((v): v is number => typeof v === "number");
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

export function averageColorVar(avg: number): string {
  if (avg >= 90) return "var(--color-green)";
  if (avg >= 80) return "var(--color-maroon)";
  if (avg >= 75) return "var(--color-gold)";
  return "var(--color-red)";
}
