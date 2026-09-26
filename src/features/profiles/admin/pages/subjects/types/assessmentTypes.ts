export const DEFAULT_ASSESSMENT_TYPES = [
  {
    name: "WRITTEN / ORAL WORKS (WWs)",
    aliases: ["writtenoralworkswws", "writtenoralworksww", "writtenworks", "writtenoralworks"],
  },
  {
    name: "PRODUCT / PERFORMANCE TASKS (PTs)",
    aliases: ["productperformancetaskspts", "productperformancetaskspt", "performancetasks", "performancetask"],
  },
  {
    name: "EXAMINATIONS (EXs)",
    aliases: ["examinationsexs", "examinationsex", "examinations", "exams", "quarterlyexam"],
  },
] as const;

function assessmentTypeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function canonicalAssessmentTypeName(value: string | null | undefined): string {
  const key = assessmentTypeKey(value ?? "");
  const match = DEFAULT_ASSESSMENT_TYPES.find(
    (type) => (type.aliases as readonly string[]).includes(key),
  );
  return match?.name ?? value ?? "";
}

export function isDefaultAssessmentType(value: string | null | undefined): boolean {
  return DEFAULT_ASSESSMENT_TYPES.some(
    (type) => type.name === canonicalAssessmentTypeName(value),
  );
}
