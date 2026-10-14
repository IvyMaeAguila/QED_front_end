import {GRADE_LEVEL_BY_ID,type Section,type Subject,type GradeLevel} from './types';
import {canonicalAssessmentTypeName} from './assessmentTypes';
import type {SectionRow} from '../services/section.service';
import type {SubjectSectionByGradeRow} from '../services/subject.service';

export function mapSectionRow(row: SectionRow): Section {
  return {
    id: String(row.id),
    gradeLevel: GRADE_LEVEL_BY_ID[Number(row.grade_level_id)] ?? (row.grade_level_id as unknown as GradeLevel),
    name: row.section_name,
  };
}

export function mapSubjectRow(row: SubjectSectionByGradeRow): Subject {
  return {
    id: String(row.id),
    subjectId: String(row.subject_id),
    name: row.subject_name,
    gradeLevel: GRADE_LEVEL_BY_ID[Number(row.grade_level_id)],
    section: row.section_name,
    isGraded: Boolean(row.is_graded),
    teacherId: row.teacher_id != null ? String(row.teacher_id) : null,
    schoolYear: row.school_year,
    status: row.status,
    weightDistribution: (row.weightDistribution ?? [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((w) => ({
        id: String(w.id),
        // Keep the API alias in sync with the backend (`assessmentName`).
        // Empty fallback also protects the edit form if an assessment type
        // was removed and the LEFT JOIN therefore returned null.
        assessmentType: canonicalAssessmentTypeName(w.assessmentName),
        weight: Number(w.weight_percent),
      })),
  };
}
