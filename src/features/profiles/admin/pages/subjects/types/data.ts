import { GRADE_LEVELS, type GradeLevel, type Subject } from "./types";

export const G1_3_SUBJECTS = ["Language", "Reading and Literacy", "Mathematics", "Makabansa", "GMRC"];

export const G4_6_SUBJECTS = [
  "English",
  "Filipino",
  "Mathematics",
  "Science",
  "Araling Panlipunan",
  "EPP",
  "MAPEH",
  "GMRC",
];


export function getSubjectNamesForGrade(grade: GradeLevel): string[] {
  const gIdx = GRADE_LEVELS.indexOf(grade);
  return gIdx < 3 ? G1_3_SUBJECTS : G4_6_SUBJECTS;
}

export function buildDefaultSubjects(schoolYear: string): Subject[] {
  const subjects: Subject[] = [];
  GRADE_LEVELS.forEach((grade, gIdx) => {
    const names = gIdx < 3 ? G1_3_SUBJECTS : G4_6_SUBJECTS;
    names.forEach((name) => {
      subjects.push({
        id: `${grade}-${name}`.replace(/\s+/g, "-").toLowerCase(),
        name,
        gradeLevel: grade,
        section: "",
        teacherId: null,
        schoolYear,
        status: "Active",
      });
    });
  });
  return subjects;
}