import type { ComponentColumnGroup } from '../AssessmentRecordsPage';
import { computeStudentGrade } from './assessmentGradeCalculation';
import { computeTransmutedGrade } from './GradeWeights';
import type { EffectiveWeights } from '../../services/subjectGradeTemplate.service';
import type { GradeItem, ScoreMap } from '../types/Grading';

export function transmutedTermGrade(studentId: string, periodId: string, items: GradeItem[], scores: ScoreMap, weights: EffectiveWeights | null | undefined): number | null {
  if (!weights?.templateStructure?.transmutationTable.length) return null;
  const components = weights.templateStructure.components;
  if (components?.length) {
    const forTerm = items.filter(i => i.gradingPeriodId === periodId);
    if (forTerm.some(i => !components.some(c => i.templateDomainId === c.id || i.templateDomainId?.startsWith(c.id + '__')))) return null;
    const grades = components.map(c => transmutedTermGrade(studentId, periodId, forTerm.filter(i => i.templateDomainId === c.id || i.templateDomainId?.startsWith(c.id + '__')), scores, {...weights,ww:c.ww.weightPercent,pt:c.pt.weightPercent,exam:c.examWeightPercent,examinations:c.examinations,examSubWeights:c.examSubWeights,templateStructure:{...weights.templateStructure!,...c,components:undefined}}));
    return grades.every(g => g !== null) ? Math.round((grades as number[]).reduce((s,g)=>s+g,0)/grades.length) : null;
  }
  const examinations = weights.examinations ?? weights.templateStructure.examinations;
  if (weights.exam > 0 && !examinations) return null;
  const groups: ComponentColumnGroup[] = [];
  for (const key of ['writtenWorks', 'performanceTask', 'exams'] as const) {
    const weight = key === 'writtenWorks' ? weights.ww : key === 'performanceTask' ? weights.pt : weights.exam;
    if (weight <= 0 || (key === 'exams' && !examinations?.enabled)) continue;
    const groupItems = items.filter(item => item.gradingPeriodId === periodId && item.tab === key);
    // Do not let nonnumeric/nonfinite scores become an apparently complete grade.
    if (groupItems.some(item => !Number.isFinite(item.maxItems) || item.maxItems <= 0
      || !Number.isFinite(scores[studentId]?.[item.id]))) return null;
    groups.push({ key, label: '', weightLabel: '', weight, items: groupItems, columns: [],
      domains: key === 'writtenWorks' ? weights.templateStructure.ww.domains
        : key === 'performanceTask' ? weights.templateStructure.pt.domains : undefined });
  }
  if (!groups.length) return null;
  const { initialGrade } = computeStudentGrade({ id: studentId }, groups, scores, examinations);
  const grade = computeTransmutedGrade(initialGrade, weights.templateStructure.transmutationTable, weights.templateStructure.transmutationMode);
  return typeof grade === 'number' && Number.isFinite(grade) ? grade : null;
}

export function finalGrade(grades: (number | null | undefined)[]): number | null {
  if (grades.length !== 3 || !grades.every(grade => typeof grade === 'number' && Number.isFinite(grade))) return null;
  const average = (grades as number[]).reduce((sum, grade) => sum + grade, 0) / 3;
  // Excel ROUND rounds ties away from zero.
  return Math.sign(average) * Math.round(Math.abs(average));
}

export function finalDescriptor(grade: number | null, weights: EffectiveWeights | null | undefined): string {
  if (grade === null || weights?.source !== 'template') return '';
  // Both supported lookup families agree on an exact HELPER table key.
  // The API does not expose approximate-lookup semantics, so never approximate.
  const matches = weights.templateStructure?.descriptorTable.filter(row => row.numericalGrade === grade) ?? [];
  return matches.length === 1 ? matches[0].descriptor : '';
}

export function groupLearners<T extends { gender?: 'M' | 'F' }>(roster: T[]) {
  return [{ label: 'Male', students: roster.filter(student => student.gender !== 'F') },
    { label: 'Female', students: roster.filter(student => student.gender === 'F') }];
}
