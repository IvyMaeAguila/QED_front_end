// features/profiles/shared/grading/gradeTemplate.types.ts
//
// Shared between admin (parses/uploads the DepEd .xlsx template) and
// teacher (consumes the resolved structure to render AssessmentRecordsSection
// and compute grades). Neither side should redeclare these — importing
// two differently-shaped ExamSubWeights from two files is exactly the kind
// of bug this file exists to prevent.

export interface ExamSubWeights {
  st1: number;
  st2: number;
  te: number;
}

export interface TemplateDomain {
  id: string;            // stable slug, used as GradeItem.domainId
  label: string;         // "" for a flat (non-domain-split) group — no sub-header rendered
  weightPercent: number; // this domain's own final contribution (0-100); domains in a group sum to the group's weightPercent
  scoreColumns?: number[]; // uploaded workbook item columns, one-based
}

export interface TemplateGroup {
  key: "writtenWorks" | "performanceTask";
  weightPercent: number;
  domains: TemplateDomain[]; // length 1 = flat group; length 2+ = domain-split group
}

export interface TransmutationRow {
  igMin: number;
  igMax: number;
  transmuted: number;
}

export interface DescriptorRow {
  numericalGrade: number;
  descriptor: string;
}

// The full resolved structure for one subject's grade template — this is
// what admin's parser produces client-side, what the backend should
// persist/return authoritatively, and what teacher's AssessmentRecordsSection
// and GradeWeights math consume. One shape, one source of truth for all
// three.
export interface GradeTemplateStructure {
  ww: TemplateGroup;
  pt: TemplateGroup;
  examWeightPercent: number;
  examSubWeights: ExamSubWeights;
  transmutationTable: TransmutationRow[];
  descriptorTable: DescriptorRow[];
  layout?: {
    scoreHeaderRow: number;
    highestPossibleRow: number;
    nameColumn: number;
    studentRows: { row: number; gender: "M" | "F" }[];
    finalColumns: { initialGrade: number; termGrade: number; descriptor: number };
    examScoreColumns: { ST1: number; ST2: number; TE: number };
    examWeightedScoreColumns?: { ST1: number; ST2: number; TE: number };
    examPsColumn?: number;
    examWeightedScoreColumn?: number;
  };
}
