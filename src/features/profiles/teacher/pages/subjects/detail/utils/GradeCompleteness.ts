import type { GradeItem, ScoreMap } from "../types/Grading";
import type { RosterStudent } from "../data";

export type ExamType = "ST1" | "ST2" | "TE";
const REQUIRED_EXAM_TYPES: ExamType[] = ["ST1", "ST2", "TE"];

export interface GradeCompletenessResult {
  isComplete: boolean;
  missingExamTypes: ExamType[];
  itemsMissingScores: { itemId: string; label: string; missingCount: number }[];
  totalMissingScores: number;
}

export function computeGradeCompleteness(
  items: GradeItem[],
  scores: ScoreMap,
  roster: RosterStudent[],
  gradingPeriodId?: string
): GradeCompletenessResult {
  const examItems = items.filter(
    (item) => item.tab === "exams" && (!gradingPeriodId || item.gradingPeriodId === gradingPeriodId)
  );

  const presentExamTypes = new Set(
    examItems.map((i) => i.examType).filter((t): t is ExamType => !!t)
  );
  const missingExamTypes = REQUIRED_EXAM_TYPES.filter((t) => !presentExamTypes.has(t));

  const itemsMissingScores: GradeCompletenessResult["itemsMissingScores"] = [];
  let totalMissingScores = 0;

  for (const item of examItems) {
    let missingCount = 0;
    for (const student of roster) {
      const value = scores[student.id]?.[item.id];
      if (value === null || value === undefined) missingCount++;
    }
    if (missingCount > 0) {
      itemsMissingScores.push({
        itemId: item.id,
        label: item.examType ?? item.activityName ?? item.topic,
        missingCount,
      });
      totalMissingScores += missingCount;
    }
  }

  return {
    isComplete: examItems.length > 0 && missingExamTypes.length === 0 && itemsMissingScores.length === 0,
    missingExamTypes,
    itemsMissingScores,
    totalMissingScores,
  };
}