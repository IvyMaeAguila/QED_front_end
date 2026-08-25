export type SubjectCategory =
  | "Language"
  | "ReadingLiteracy"
  | "Makabansa"
  | "GMRC"
  | "Mathematics"
  | "English"
  | "AralingPanlipunan"
  | "Science"
  | "MAPEH"
  | "EPP"
  | "Other";

export interface ComponentWeights {
  ww: number;
  pt: number;
  exam: number;
}

const GRADES_1_3: Partial<Record<SubjectCategory, ComponentWeights>> = {
  Language: { ww: 30, pt: 50, exam: 20 },
  ReadingLiteracy: { ww: 30, pt: 50, exam: 20 },
  Makabansa: { ww: 30, pt: 50, exam: 20 },
  GMRC: { ww: 30, pt: 50, exam: 20 },
  Mathematics: { ww: 40, pt: 40, exam: 20 },
};

const GRADES_4_6: Partial<Record<SubjectCategory, ComponentWeights>> = {
  English: { ww: 30, pt: 50, exam: 20 },
  AralingPanlipunan: { ww: 30, pt: 50, exam: 20 },
  GMRC: { ww: 30, pt: 50, exam: 20 },
  Mathematics: { ww: 40, pt: 40, exam: 20 },
  Science: { ww: 40, pt: 40, exam: 20 },
  MAPEH: { ww: 20, pt: 60, exam: 20 },
  EPP: { ww: 20, pt: 60, exam: 20 },
};

const DEFAULT_WEIGHTS: ComponentWeights = { ww: 30, pt: 50, exam: 20 };

export function gradeBandOf(gradeLevel: string | number): "1-3" | "4-6" {
  const n =
    typeof gradeLevel === "number"
      ? gradeLevel
      : parseInt(String(gradeLevel).replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n <= 3 ? "1-3" : "4-6";
}

export function inferSubjectCategory(subjectName: string): SubjectCategory {
  const s = subjectName.toLowerCase();
  if (s.includes("math")) return "Mathematics";
  if (s.includes("science")) return "Science";
  if (s.includes("english")) return "English";
  if (s.includes("filipino") || s.includes("wika")) return "Language";
  if (s.includes("reading")) return "ReadingLiteracy";
  if (s.includes("makabansa")) return "Makabansa";
  if (s.includes("gmrc") || s.includes("good manners")) return "GMRC";
  if (s.includes("araling panlipunan") || s === "ap" || s.includes(" ap ")) return "AralingPanlipunan";
  if (s.includes("mapeh") || s.includes("music") || s.includes("arts") || s.includes("pe") || s.includes("health"))
    return "MAPEH";
  if (s.includes("epp") || s.includes("tle")) return "EPP";
  return "Other";
}

export function getComponentWeights(
  gradeLevel: string | number,
  subjectCategory: SubjectCategory,
): ComponentWeights {
  const band = gradeBandOf(gradeLevel);
  const table = band === "1-3" ? GRADES_1_3 : GRADES_4_6;
  return table[subjectCategory] ?? DEFAULT_WEIGHTS;
}

export function computePS(totalScore: number, highestPossibleScore: number): number | null {
  if (!highestPossibleScore) return null;
  return (totalScore / highestPossibleScore) * 100;
}

export function computeWS(ps: number | null, weightPercent: number): number | null {
  if (ps === null) return null;
  return (ps / 100) * weightPercent;
}

export function computeInitialGrade(
  wsWW: number | null,
  wsPT: number | null,
  wsExam: number | null,
): number | null {
  const parts = [wsWW, wsPT, wsExam].filter((v): v is number => v !== null);
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0));
}

export function computeTermAverageBySubject(termGrades: number[]): number | null {
  if (termGrades.length === 0) return null;
  return termGrades.reduce((a, b) => a + b, 0) / termGrades.length;
}

export function computeGeneralAverage(subjectFinalGrades: number[]): number | null {
  if (subjectFinalGrades.length === 0) return null;
  return subjectFinalGrades.reduce((a, b) => a + b, 0) / subjectFinalGrades.length;
}

export function computeFinalAverage(termAverages: number[]): number | null {
  if (termAverages.length === 0) return null;
  return termAverages.reduce((a, b) => a + b, 0) / termAverages.length;
}