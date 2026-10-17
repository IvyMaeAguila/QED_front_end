import type { ComponentColumnGroup } from '../AssessmentRecordsPage';
import type { GradeItem, ScoreMap } from '../types/Grading';
import type { TemplateExaminations } from '../../../../../shared/grading/gradeTemplate.types';
import { computePS, computeWS } from './GradeWeights';

interface StudentGroupTotals {
  total: number;
  highestPossible: number;
  scoredCount: number;
  totalItems: number;
  isComplete: boolean;
}

export function studentTotals(items: GradeItem[], studentId: string, scores: ScoreMap): StudentGroupTotals {
  const highestPossible = items.reduce((sum, item) => sum + item.maxItems, 0);

  let total = 0;
  let scoredCount = 0;
  for (const item of items) {
    const value = scores[studentId]?.[item.id];
    if (typeof value === "number") {
      total += value;
      scoredCount += 1;
    }
  }

  return {
    total,
    highestPossible,
    scoredCount,
    totalItems: items.length,
    isComplete: items.length > 0 && scoredCount === items.length,
  };
}

interface GroupResult {
  total: number;       // raw sum across the group's items — display only
  ps: number | null;
  ws: number | null;
  hasAnyItems: boolean;
  isComplete: boolean;
}

// Use the normalized pinned examination schema. ALL is retained for the
// legacy manually configured pooled-exam case.
export function computeGroupResult(
  group: ComponentColumnGroup,
  studentId: string,
  scores: ScoreMap,
  examinations: TemplateExaminations | undefined,
): GroupResult {
  const pooled = studentTotals(group.items, studentId, scores);

  if (group.key !== "exams" && group.domains && group.domains.length > 1) {
    let weightedScore = 0;
    const validDomainIds = new Set(group.domains.map((domain) => domain.id));
    let complete = !group.items.some((item) => item.templateDomainId && !validDomainIds.has(item.templateDomainId));
    let hasItems = false;
    for (const domain of group.domains) {
      const totals = studentTotals(group.items.filter((item) => item.templateDomainId === domain.id), studentId, scores);
      hasItems ||= totals.totalItems > 0;
      if (!totals.totalItems || !totals.isComplete || !totals.highestPossible) {
        complete = false;
        continue;
      }
      weightedScore += ((totals.total / totals.highestPossible) * 100 * domain.weightPercent) / 100;
    }
    const ws = complete && hasItems ? weightedScore : null;
    return {
      total: pooled.total,
      ps: ws === null || !group.weight ? null : (ws / group.weight) * 100,
      ws,
      hasAnyItems: pooled.totalItems > 0,
      isComplete: complete && hasItems,
    };
  }

  if (group.key !== "exams" || !examinations?.enabled) {
    const ps = computePS(pooled.total, pooled.highestPossible);
    const ws = computeWS(ps, group.weight);
    return {
      total: pooled.total,
      ps,
      ws,
      hasAnyItems: pooled.totalItems > 0,
      isComplete: pooled.totalItems > 0 && pooled.isComplete,
    };
  }
  let ps = 0;
  let complete = true;
  let hasAnyItems = false;
  for (const component of examinations.components) {
    const componentItems = component.key.toUpperCase() === "ALL"
      ? group.items
      : group.items.filter((item) => String(item.examType || "").toUpperCase() === component.key.toUpperCase());
    const totals = studentTotals(componentItems, studentId, scores);
    hasAnyItems ||= totals.totalItems > 0;
    if (!totals.totalItems || !totals.isComplete || !totals.highestPossible) {
      complete = false;
      continue;
    }
    ps += ((totals.total / totals.highestPossible) * 100 * component.weightPercent) / 100;
  }
  complete &&= hasAnyItems;
  return { total: pooled.total, ps: complete ? ps : null, ws: complete ? computeWS(ps, group.weight) : null, hasAnyItems, isComplete: complete };
}

export function computeStudentGrade(
  student: { id: string },
  groups: ComponentColumnGroup[],
  scores: ScoreMap,
  examinations: TemplateExaminations | undefined,
): { initialGrade: number | null; anyGroupIncomplete: boolean; isComplete: boolean } {
  const weightedScores: number[] = [];
  let anyGroupIncomplete = false;
  let isComplete = true;

  groups.forEach((group) => {
    const result = computeGroupResult(group, student.id, scores, examinations);
    if (!result.isComplete) { anyGroupIncomplete = true; isComplete = false; }
    if (result.ws !== null) weightedScores.push(result.ws);
  });

  const initialGrade = isComplete && weightedScores.length === groups.length
    ? weightedScores.reduce((sum, value) => sum + value, 0)
    : null;

  return { initialGrade, anyGroupIncomplete, isComplete };
}

